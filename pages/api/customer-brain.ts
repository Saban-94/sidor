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

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, מה השאלה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API חסר בשרת." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון
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

    // 2. זיהוי שם אגרסיבי (כדי למנוע לופים)
    let currentUserName = memory?.user_name;
    const nameKeywords = ["אני", "שמי", "זה", "קוראים לי"];
    
    // אם אין שם ויש הודעה קצרה, או הודעה שמכילה מילת זיהוי
    if (!currentUserName && (cleanMsg.length < 12 || nameKeywords.some(k => cleanMsg.includes(k)))) {
      const extracted = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      if (extracted.length >= 2) {
        await supabase.from('customer_memory').update({ user_name: extracted }).eq('clientId', phone);
        currentUserName = extracted; // עדכון מיידי למשתנה המקומי
      }
    }

    // 3. בניית ה-Prompt עם הוראה מפורשת
    const prompt = `
      זהות: המוח של סבן 1994. 
      משתמש נוכחי: ${currentUserName || 'לא ידוע'}.
      
      חוקים קשיחים:
      1. אם שם המשתמש הוא "${currentUserName || 'לא ידוע'}" וזה לא "לא ידוע", אסור לך בשום פנים ואופן לשאול מה שמו!
      2. אם השם הוא "לא ידוע", בקש אותו בנימוס פעם אחת בלבד.
      3. פנה תמיד בשם המשתמש אם הוא ידוע.
      4. אל תציג רשימות הזמנות/דאטה אלא אם נשאלת במפורש על סטטוס או לו"ז.
      5. סגנון: מקצועי, ענייני, וקצר.

      הודעת המשתמש: ${cleanMsg}
      היסטוריית שיחה: ${memory?.accumulated_knowledge || ""}
    `;

    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (replyText) break;
      } catch (e) { continue; }
    }

    // 4. שמירת היסטוריה
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח בטעינה. נסה שוב." });
  }
}
