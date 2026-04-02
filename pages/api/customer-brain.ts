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

    // 1. שליפת זיכרון
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge, user_name').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name;

    // 2. חיפוש ידע מאומן (AI Training) - חיפוש משופר
    // אנחנו בודקים אם יש התאמה לאחד המילים המרכזיות בהודעה
    const searchTerms = cleanMsg.split(/\s+/).filter(w => w.length > 2);
    let trainingAnswer = "";

    if (searchTerms.length > 0) {
      // מחפשים בטבלה שורות שמכילות את המילים ששאל הלקוח
      const { data: matches } = await supabase
        .from('ai_training')
        .select('answer')
        .or(searchTerms.map(word => `question.ilike.%${word}%`).join(','));
      
      if (matches && matches.length > 0) {
        trainingAnswer = matches.map(m => m.answer).join("\n\n");
      }
    }

    // 3. בניית ה-Prompt - פקודות ברזל
    const prompt = `
      זהות: שירות לקוחות סבן 1994.
      לקוח: ${currentUserName || 'אורח'}.
      מידע מהמערכת (חובה להשתמש!): ${trainingAnswer || "לא נמצא מידע ספציפי בטבלה"}.

      חוקים:
      - אם יש "מידע מהמערכת", תן אותו מיד! אל תגיד שאין לך מידע.
      - לעולם אל תשתמש במילה "בוס".
      - היה קצר ותכליתי. בלי חפירות ובלי הקדמות מיותרות.
      - אם השם ידוע (${currentUserName}), פנה אליו בשמו.
      
      הודעה: ${cleanMsg}
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
      accumulated_knowledge: (memory?.accumulated_knowledge || "").slice(-1000) + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "שלום, חלה תקלה זמנית. נסה שוב בעוד רגע." });
  }
}
