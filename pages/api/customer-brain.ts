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

  const modelPool = ["gemini-2.0-pro-exp-02-05", "gemini-2.0-flash", "gemini-3.1-flash-lite-preview"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון ושם לקוח
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge, user_name').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name;

    // 2. זיהוי שם אגרסיבי (אם ההודעה קצרה ואין סימני שאלה)
    if (!currentUserName && cleanMsg.length < 10 && !cleanMsg.includes("?")) {
      const name = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      if (name.length >= 2) {
        await supabase.from('customer_memory').update({ user_name: name }).eq('clientId', phone);
        currentUserName = name;
      }
    }

    // 3. חיפוש ידע מאומן (AI Training) - החלק הקריטי
    const searchTerms = cleanMsg.split(/\s+/).filter(w => w.length > 2);
    let trainingAnswer = "";

    if (searchTerms.length > 0) {
      const { data: matches } = await supabase
        .from('ai_training')
        .select('answer')
        .or(searchTerms.map(word => `question.ilike.%${word}%`).join(','));
      
      if (matches && matches.length > 0) {
        trainingAnswer = matches.map(m => m.answer).join("\n");
      }
    }

    // 4. בניית ה-Prompt - הוראות ברזל למניעת לופים
    const prompt = `
      זהות: שירות לקוחות סבן 1994.
      שם הלקוח: ${currentUserName || 'אורח'}.
      מידע מהמערכת: ${trainingAnswer || "אין"}.

      חוקים קשיחים (חובה לציית):
      1. אם מופיע "מידע מהמערכת" - תן אותו מיד! אל תבקש שם, אל תבקש טלפון ואל תברך לשלום בצורה מוגזמת.
      2. אם שם הלקוח ידוע (${currentUserName}), אל תגיד לו "שלום אורח" ואל תשאל לשמו.
      3. אם אין מידע מהמערכת, ורק אז, בקש פרטים בנימוס (אך לא בכל הודעה).
      4. היה תכליתי וקצר. אל תחפור.
      
      שאלה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
    `;

    // 5. שליחה ל-AI עם Fallback
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

    // 6. עדכון זיכרון
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "").slice(-1000) + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "מצטער, חלה תקלה. נסה שוב." });
  }
}
