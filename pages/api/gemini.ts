import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרות סביבה - Supabase & Firebase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

// נכסי מותג קבועים
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, name, state, senderPhone, manualInjection } = req.body;

  // הגנות בסיס
  if (!message && !manualInjection) {
    return res.status(200).json({ reply: "קיבלתי הודעה ריקה, אחי. איך אפשר לעזור?" });
  }
  if (!apiKey) {
    return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });
  }

  // עדכון בריכת המודלים לפי בקשתך
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-1.5-flash",
    "gemini-pro"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת דאטה משולב (זיכרון לקוח, חוקים ומבנה Flow)
    const [flowSnap, memoryRes, rulesRes] = await Promise.all([
      getDoc(doc(dbFS, 'system', 'bot_flow_config')),
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).single(),
      supabase.from('ai_rules').select('instruction').eq('is_active', true)
    ]);

    const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
    const dynamicNodes = flowData.nodes || [];
    const globalDNA = flowData.globalDNA || "אתה ראמי, המוח הלוגיסטי של ח. סבן. דבר קצר, יוקרתי ובשפת השטח.";
    const customerContext = memoryRes.data?.accumulated_knowledge || "אין מידע קודם על הלקוח.";
    const activeRules = rulesRes.data?.map(r => r.instruction).join('\n') || "";

    // 2. ניווט חכם (Guard Rails)
    let forcedState = state || 'MENU';
    const cleanMsg = (message || "").trim();
    if (['0', 'חזור', 'תפריט', 'איפוס'].includes(cleanMsg)) {
      forcedState = 'MENU';
    }

    // 3. בניית ה-Prompt המשולב
    const prompt = `
      ${globalDNA}
      -- חוקי מערכת קשיחים --
      ${activeRules}
      
      -- זיכרון היסטורי על הלקוח (${name}) --
      ${customerContext}

      -- ענפי השיחה מהסטודיו --
      ${dynamicNodes.map((n: any) => `מצב [${n.id}]: ${n.prompt}`).join('\n')}

      -- פרטי שיחה --
      מצב נוכחי: ${forcedState}
      הודעה: "${message}"

      -- פורמט חובה: JSON בלבד --
      {
        "reply": "התשובה שלך (מעוצבת יוקרתי עם אימוג'ים)",
        "newState": "המצב הבא",
        "updateMemory": "מידע חדש לשימור (אם הלקוח נתן נתון חדש) או null",
        "mediaUrl": "${forcedState === 'MENU' ? BRAND_LOGO : 'null'}"
      }
    `;

    // 4. הרצת המודלים ברוטציה (Fallback)
    let jsonResult: any = null;

    for (const modelName of modelPool) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { 
                temperature: 0.2, 
                responseMimeType: "application/json" 
              }
            })
          }
        );

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          const parsed = JSON.parse(rawText);
          // הבטחת קיום המשתנה לפני החזרה
          jsonResult = {
            ...parsed,
            mediaUrl: parsed.mediaUrl || (forcedState === 'MENU' ? BRAND_LOGO : null)
          };
          break; // הצלחנו, עוצרים את הלולאה
        }
      } catch (e) {
        console.error(`Fallback: ${modelName} failed. trying next...`);
        continue;
      }
    }

    if (!jsonResult) {
      return res.status(200).json({ reply: "⚠️ המוח עמוס כרגע, נסה שוב בעוד רגע." });
    }

    // 5. עדכון זיכרון אוטומטי ב-Supabase אם ה-AI זיהה מידע חדש
    if (jsonResult.updateMemory && phone !== 'unknown') {
      const updatedKnowledge = customerContext === "אין מידע קודם על הלקוח." 
        ? jsonResult.updateMemory 
        : `${customerContext} | ${jsonResult.updateMemory}`;

      await supabase.from('customer_memory').upsert({
        clientId: phone,
        accumulated_knowledge: updatedKnowledge,
        last_update: new Date().toISOString()
      });
    }

    return res.status(200).json(jsonResult);

  } catch (e: any) {
    console.error("Critical API Error:", e);
    return res.status(200).json({ reply: "תקלה בצינורות המוח, אני כבר מתקן." });
  }
}
