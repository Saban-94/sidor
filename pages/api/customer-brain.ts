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

  if (!cleanMsg) return res.status(200).json({ reply: "שלום, במה אוכל לעזור?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מערכת: מפתח API חסר." });

  // עדכון Model Pool מורחב ליציבות וביצועים
  const modelPool = [
    "gemini-2.0-pro-exp-02-05", 
    "gemini-2.0-flash", 
    "gemini-3.1-flash-lite-preview"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון ושם לקוח
    let { data: memory } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge, user_name')
      .eq('clientId', phone)
      .maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase
        .from('customer_memory')
        .insert([{ clientId: phone, accumulated_knowledge: '', user_name: null }])
        .select().single();
      memory = newUser;
    }

    let currentUserName = memory?.user_name;

    // 2. זיהוי שם חכם (למניעת לופים)
    if (!currentUserName && cleanMsg.length < 12 && !cleanMsg.includes("?")) {
      const extracted = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      if (extracted.length >= 2) {
        await supabase.from('customer_memory').update({ user_name: extracted }).eq('clientId', phone);
        currentUserName = extracted;
      }
    }

    // 3. חיפוש ידע מאומן - חיפוש מילים גמיש (Keyword Match)
    const words = cleanMsg.split(/\s+/);
    let trainingAnswer = "";
    
    for (const word of words) {
      if (word.length < 3) continue;
      const { data: match } = await supabase
        .from('ai_training')
        .select('answer')
        .ilike('question', `%${word}%`)
        .limit(1)
        .maybeSingle();
      
      if (match) {
        trainingAnswer = match.answer;
        break; 
      }
    }

    // 4. בניית ה-Prompt (שפה שירותית, חדה וללא "בוס")
    const prompt = `
      זהות: שירות לקוחות חכם - סבן 1994.
      לקוח: ${currentUserName || 'לא ידוע'}.
      מידע מהמערכת: ${trainingAnswer || "אין מידע ספציפי בטבלה"}.

      חוקים קשיחים:
      - פנה ללקוח בשמו (${currentUserName || 'אורח'}). אם השם ידוע, אל תשאל אותו לעולם "מה שמך?".
      - לעולם אל תשתמש במילה "בוס".
      - אם קיים "מידע מהמערכת", ענה אך ורק לפיו! אל תמציא שעות או נתונים.
      - היה תכליתי. אל תכתוב הקדמות ארוכות כמו "אשמח מאוד לסייע לך". תן את התשובה מיד.
      - אם אין מידע במערכת ואין תשובה ברורה, בקש מהלקוח פרטים נוספים (כמו שם סניף או מספר הזמנה).

      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
    `;

    let replyText = "";
    let lastError: any = null;

    // 5. הרצה עם Fallback תקין
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (text) {
          replyText = text;
          break;
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!replyText) throw lastError || new Error("Connection failed");

    // 6. עדכון זיכרון (שומר רק את ה-1500 תווים האחרונים למניעת עומס)
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "").slice(-1500) + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "שלום, חלה תקלה זמנית בעיבוד הנתונים. אנא נסה שוב." });
  }
}
