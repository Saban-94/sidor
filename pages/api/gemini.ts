import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const firebaseConfig = { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון קיים מ-Supabase
    const { data: memoryRes } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge')
      .eq('clientId', phone)
      .maybeSingle();

    let history = memoryRes?.accumulated_knowledge || "";
    
    // איפוס זיכרון אם מתחילים מחדש
    if (cleanMsg === "הוסף הזמנה") history = "";

    // 2. בניית ה-Prompt עם סדר קשיח (State Machine)
    const prompt = `
      זהות: העוזר של ראמי. קצר, חריף, מילה-שתיים.
      
      פרוטוקול עץ הזמנה (סדר חובה):
      1. שם לקוח?
      2. כתובת?
      3. מחסן? (התלמיד / החרש)
      4. נהג? (חכמת / עלי)

      היסטוריית תהליך נוכחית:
      ${history}

      הודעה אחרונה מראמי: "${cleanMsg}"

      הנחיות לביצוע:
      - אם ההודעה היא "הוסף הזמנה" -> ענה רק: "שם לקוח?"
      - אם יש שם ואין כתובת -> ענה רק: "כתובת?"
      - אם יש כתובת ואין מחסן -> ענה רק: "מחסן?"
      - אם יש מחסן ואין נהג -> ענה רק: "נהג?"
      - אם הכל הושלם -> ענה: "הוזרק ללוח."

      לוגיקה: חכמת=מנוף, עלי=ידני.
      תשובה (מילה-שתיים):
    `;

    // 3. הרצת המודל
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text.trim();
          break; 
        }
      } catch (err) { continue; }
    }

    // 4. עדכון הזיכרון ב-Supabase למניעת לופים
    const updatedHistory = history + `\nUser: ${cleanMsg}\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').upsert({
      clientId: phone,
      accumulated_knowledge: updatedHistory,
      last_update: new Date().toISOString()
    });

    return res.status(200).json({ reply: replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס. שוב?" });
  }
}
