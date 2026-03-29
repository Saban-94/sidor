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
    const [memoryRes] = await Promise.all([
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle()
    ]);

// בתוך פונקציית ה-handler, אחרי שליפת ה-customerMemory
let currentDNA = customerMemory;

// 1. הזרקת הנתון החדש לזיכרון הזמני כדי שהמוח ידע מה הוא הרגע קיבל
currentDNA += `\nUser said: ${cleanMsg}`;

const prompt = `
  חוק ברזל: אתה העוזר של ראמי. דבר קצר (מילה-שתיים).
  סדר עץ הזמנה (אל תסטה!):
  1. שם לקוח?
  2. כתובת?
  3. מחסן? (התלמיד/החרש)
  4. נהג? (חכמת/עלי)

  בדיקת מצב נוכחי בזיכרון:
  ${currentDNA}

  הנחיה לביצוע:
  - אם המשתמש אמר "הוסף הזמנה" -> שאל "שם לקוח?"
  - אם יש שם ("דרך עפר") ואין כתובת -> שאל "כתובת?"
  - אם יש כתובת ("ויצמן 4") ואין מחסן -> שאל "מחסן?"
  - אם יש מחסן ואין נהג -> שאל "נהג?"

  תשובה (מילה-שתיים בלבד):
`;

// 2. אחרי קבלת התשובה מהמודל (replyText), חובה לעדכן את Supabase!
await supabase.from('customer_memory').upsert({
  clientId: phone,
  accumulated_knowledge: currentDNA + `\nAssistant asked: ${replyText}`
});
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
          replyText = data.candidates[0].content.parts[0].text;
          break; 
        }
      } catch (err) { continue; }
    }

    return res.status(200).json({ reply: replyText.trim() });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, תקלה. שוב?" });
  }
}
