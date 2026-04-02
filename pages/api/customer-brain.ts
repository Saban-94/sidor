import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  // בדיקות תשתית
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, אני פה. מה השאלה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מערכת: מפתח API חסר." });

  // הגדרת המודלים כפי שביקשת
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון לקוח (שם והיסטוריה)
    let { data: memory } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge, user_name')
      .eq('clientId', phone)
      .maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase
        .from('customer_memory')
        .insert([{ clientId: phone, accumulated_knowledge: '', user_name: null }])
        .select()
        .single();
      memory = newUser;
    }

    // 2. זיהוי שם משתמש (מניעת לופים של "מה שמך?")
    let currentUserName = memory?.user_name;
    if (!currentUserName && cleanMsg.length < 15) {
      const nameKeywords = ["אני", "שמי", "זה", "קוראים לי", "נעים מאוד"];
      const extracted = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      
      if (extracted.length >= 2) {
        await supabase.from('customer_memory').update({ user_name: extracted }).eq('clientId', phone);
        currentUserName = extracted;
      }
    }

    // 3. שליפת ידע מאומן (AI Training) - למניעת הזיות (כמו שעות פעילות)
    const { data: trainingData } = await supabase
      .from('ai_training')
      .select('answer')
      .ilike('question', `%${cleanMsg}%`)
      .limit(1)
      .maybeSingle();

    const trainedContext = trainingData ? `מידע רלוונטי מהמערכת (עדיפות עליונה): ${trainingData.answer}` : "";

    // 4. חיפוש דינמי בסידור (עבור בדיקת סטטוס לקוח)
    let liveOrderContext = "";
    if (cleanMsg.length > 3 && !trainingData) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .or(`client_info.ilike.%${cleanMsg}%,location.ilike.%${cleanMsg}%`)
        .order('delivery_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (order) {
        liveOrderContext = `מצאתי נתון בסידור: לקוח ${order.client_info}, סטטוס ${order.status}, שעה ${order.order_time || 'לא צוינה'}, כתובת ${order.location}.`;
      }
    }

    // 5. בניית ה-Prompt הסופי
    const prompt = `
      זהות: המוח של סבן 1994 (העוזר של ראמי).
      משתמש נוכחי: ${currentUserName || 'לא ידוע'}.
      ${trainedContext}
      ${liveOrderContext}

      חוקים קשיחים:
      - אם שם המשתמש ידוע (${currentUserName}), אל תשאל אותו שוב לעולם!
      - תמיד תשתמש ב"מידע רלוונטי מהמערכת" כתשובה ראשונה.
      - אם יש "נתון בסידור", הצג אותו למשתמש בצורה ברורה.
      - סגנון: מקצועי, חד, ואישי. פנה בשם המשתמש.

      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
    `;

    let replyText = "";
    let lastError: any = null;

    // 6. הרצה עם Fallback בין המודלים ב-Pool
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        
        if (replyText) break; // הצלחה
      } catch (e) {
        lastError = e;
        continue; // עובר למודל הבא
      }
    }

    if (!replyText) throw lastError || new Error("Connection failed");

    // 7. שמירת היסטוריית השיחה
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "").slice(-2000) + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    console.error("Brain Failure:", e);
    return res.status(200).json({ reply: "בוס, המוח בריענון. נסה שוב בעוד רגע." });
  }
}
