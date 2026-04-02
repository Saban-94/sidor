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

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge, user_name').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name;

    // 2. חיפוש ידע מאומן (AI Training) - לוגיקה חכמה
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

    // 3. בניית ה-Prompt - הוראות שירותיות ללא "באגים" בטקסט
    const prompt = `
      זהות: שירות לקוחות סבן 1994.
      שם הלקוח: ${currentUserName || 'אורח'}.
      מידע פנימי מהמערכת: ${trainingAnswer || "השתמש בידע כללי שירותי בלבד"}.

      חוקים קשיחים:
      - לעולם אל תגיד את המשפט "לא נמצא מידע ספציפי בטבלה"! זה משפט פנימי.
      - אם יש "מידע פנימי מהמערכת", הוא המקור הבלעדי והמחייב שלך. תן אותו מיד.
      - אם אין מידע פנימי לגבי מייל או טלפון, ענה שאינך יודע ובקש מהלקוח להמתין למענה אנושי או לנסח שוב.
      - פנה ללקוח בשמו (${currentUserName || 'אורח'}).
      - היה אדיב, קצר ותכליתי. ללא המילה "בוס".
      
      שאלה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
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

    if (!replyText) throw new Error("No response");

    // 4. עדכון זיכרון
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "").slice(-1200) + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "שלום, חלה תקלה זמנית. נסה שוב בעוד רגע." });
  }
}
