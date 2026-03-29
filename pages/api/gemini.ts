import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// 1. הגדרות סביבה - Supabase & Firebase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const firebaseConfig = { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // בדיקת מפתחות API (תמיכה ברוטציה עתידית)
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, name, senderPhone, manualInjection, context: frontendContext } = req.body;
  const cleanMsg = (message || "").trim();

  // הגנות בסיס - חוקי ראמי
  if (!cleanMsg && !manualInjection) return res.status(200).json({ reply: "בוס, קיבלתי הודעה ריקה. איך אני יכול לשרת אותך?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });

  // 🔄 בריכת המודלים ברוטציה (לפי סדר עדיפויות ביצועי)
  const modelPool = [
    "gemini-3.1-flash-lite-preview", 
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 2. שליפת DNA מה-Admin ומהזיכרון
    const [brainCoreSnap, memoryRes] = await Promise.all([
      getDoc(doc(dbFS, 'settings', 'brain-core')),
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle()
    ]);

    const dna = brainCoreSnap.exists() ? brainCoreSnap.data() : {};
    const customerMemory = memoryRes.data?.accumulated_knowledge || "אין מידע קודם.";

    // 3. בניית ה-Prompt המקצועי
    const prompt = `
      הנחיית יסוד: אתה סדרן ח.סבן חומרי בנין , העוזר האישי של ראמי. 
      DNA: ${dna.coreIdentity || "עוזר לוגיסטי חריף."}
      טון: ${dna.toneAndVoice || "חד, ענייני, חברי (בוס, אח)."}
      
      פרוטוקול ביצוע: ${dna.executionProtocol || "בצע פקודות בחדות."}
      זיכרון לקוח: ${customerMemory}

      הודעת ראמי: "${cleanMsg}"
      תשובת המוח:
    `;

    // 4. הרצת רוטציית המודלים (Fallback Logic)
    let replyText = "";
    let usedModel = "";

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
          usedModel = modelName;
          break; 
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
        continue; 
      }
    }

    if (!replyText) throw new Error("כל המודלים ברוטציה נכשלו.");

    // 5. החזרת תשובה מסונכרנת
    return res.status(200).json({
      reply: replyText,
      model: usedModel,
      status: "SYNC_OK"
    });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס לרגע. שלח שוב ואני מבצע. 🛠️" });
  }
}
