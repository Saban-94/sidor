import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// חיבור ל-Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  // הגדרת מאגר מודלים (Fallback)
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-2.0-pro-exp-02-05", 
    "gemini-2.0-flash"
  ];

  if (!cleanMsg) return res.status(200).json({ reply: "שלום, במה אוכל לעזור?" });

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון לקוח (שם והיסטוריה)
    let { data: memory } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge, user_name')
      .eq('clientId', phone)
      .maybeSingle();
    
    let currentUserName = memory?.user_name;

    // 2. זיהוי שם אוטומטי (אם הלקוח פשוט כתב את שמו)
    if (!currentUserName && cleanMsg.length < 12 && !cleanMsg.includes("?")) {
      const extractedName = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      if (extractedName.length >= 2) {
        await supabase.from('customer_memory').upsert({ 
          clientId: phone, 
          user_name: extractedName 
        }, { onConflict: 'clientId' });
        currentUserName = extractedName;
      }
    }

    // 3. חיפוש ידע מאומן (AI Training) - חיפוש מילים גמיש
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let trainingAnswer = "";

    if (searchWords.length > 0) {
      // מחפש ב-DB שורות שבהן השאלה מכילה לפחות אחת מהמילים של המשתמש
      const { data: matches } = await supabase
        .from('ai_training')
        .select('answer')
        .or(searchWords.map(word => `question.ilike.%${word}%`).join(','));
      
      if (matches && matches.length > 0) {
        trainingAnswer = matches.map(m => m.answer).join("\n\n---\n\n");
      }
    }

    // 4. בניית ה-Prompt (הנחיות קשיחות למודל)
    const prompt = `
      זהות: אתה שירות הלקוחות החכם של "ח. סבן 1994" (חומרי בניין ולוגיסטיקה).
      לקוח: ${currentUserName || 'אורח'}.
      מידע פנימי מהמערכת (עדיפות עליונה): 
      ${trainingAnswer || "אין מידע ספציפי בטבלה. השתמש בידע כללי שירותי בלבד."}

      חוקים קשיחים:
      1. אם יש "מידע פנימי" - תן אותו מיד! אל תבקש שם, אל תבקש טלפון ואל תגיד שאתה לא יודע.
      2. אם שם הלקוח ידוע (${currentUserName}), פנה אליו בשמו ואל תשאל "מה שמך?".
      3. אל תשתמש לעולם במילה "בוס".
      4. היה תמציתי, מקצועי וישיר. בלי חפירות והקדמות ארוכות.
      5. תמיכה ב-Markdown: אם יש לינקים לניווט במבנה [טקסט](לינק) או לינקים לתמונות, שמור עליהם בדיוק ככה בתשובה.
      
      הודעת הלקוח: ${cleanMsg}
      היסטוריה אחרונה: ${memory?.accumulated_knowledge || "שיחה חדשה"}
    `;

    // 5. הרצה מול ה-AI עם מנגנון Fallback
    let replyText = "";
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
        console.error(`Error with model ${modelName}:`, e);
      }
    }

    if (!replyText) throw new Error("All models failed");

    // 6. עדכון זיכרון השיחה (שומר 1200 תווים אחרונים למניעת עומס)
    const newKnowledge = ((memory?.accumulated_knowledge || "") + `\nלקוח: ${cleanMsg}\nבוט: ${replyText}`).slice(-1200);
    await supabase.from('customer_memory').upsert({ 
      clientId: phone, 
      accumulated_knowledge: newKnowledge 
    }, { onConflict: 'clientId' });

    // 7. החזרת תשובה נקייה (ללא כוכביות כפולות של Markdown אם לא צריך)
    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (error) {
    console.error("Brain Error:", error);
    return res.status(200).json({ reply: "מצטער, אני חווה עומס קל. תוכל לנסות שוב בעוד רגע?" });
  }
}
