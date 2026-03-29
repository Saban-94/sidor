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

    const customerMemory = memoryRes.data?.accumulated_knowledge || "";

    // --- ה-DNA הקצר והחריף ---
    const prompt = `
      זהות: העוזר של ראמי. 
      חוק: דבר קצר. מילה-שתיים מקסימום. בלי הסברים. בלי "מערכות דרוכות".
      
      פרוטוקול הוספת הזמנה:
      1. ראמי: "הוסף הזמנה" -> העוזר: "שם לקוח?"
      2. ראמי: "[שם]" -> העוזר: "כתובת?"
      3. ראמי: "[כתובת]" -> העוזר: "מחסן?"
      4. ראמי: "[מחסן]" -> העוזר: "נהג? (חכמת/עלי)"
      5. סיום -> העוזר: "הוזרק ללוח."

      לוגיקה: חכמת=מנוף, עלי=ידני.
      
      מצב נוכחי: "${cleanMsg}"
      זיכרון: ${customerMemory}

      תשובה (מילה-שתיים):
    `;

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
