import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const app = getApps().length > 0 ? getApp() : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const dbFS = getFirestore(app);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { message, senderPhone, name, contextType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
    // הגנות בסיס
    if (!message && !manualInjection) return res.status(200).json({ reply: "קיבלתי הודעה ריקה, אחי. איך אפשר לעזור?" });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });

    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash", "gemini-pro"];
  try {
    // 1. שליפת הקשר (Context) - עבודה או פרטי
    const flowSnap = await getDoc(doc(dbFS, 'system', 'bot_flow_config'));
    const globalDNA = flowSnap.exists() ? flowSnap.data().globalDNA : "אתה ראמי, המוח הלוגיסטי והעוזר האישי של ח. סבן.";

    // 2. בניית ה-Prompt הרב-תחומי
    const prompt = `
      ${globalDNA}
      שם המשתמש: ${name || 'אחי'}
      סוג שיחה: ${contextType || 'כללי'}
      הודעה: "${message}"

      תפקידך: להיות שותף, אח, עוזר אישי ויועץ מקצועי.
      - אם הנושא מקצועי: תן פתרון פרקטי, מדויק וקצר.
      - אם הנושא אישי: תהיה קשוב, תומך ומייעץ בגובה העיניים.
      - בצע פעולות: אם המשתמש מבקש לעדכן מלאי או לשלוח הודעה, ציין זאת ב-JSON.

      החזר JSON בלבד:
      {
        "reply": "התשובה שלך",
        "action": "ACTION_NAME (אם נדרש)",
        "params": { "key": "value" }
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ reply: "אחי, המוח קצת עמוס, נסה שוב." });
  }
}
