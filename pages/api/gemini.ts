import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// 1. הגדרות סביבה - Supabase & Firebase
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
const BASE_URL = "https://sidor.vercel.app";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, name, state, senderPhone, manualInjection } = req.body;
  const cleanMsg = (message || "").trim();

  // הגנות בסיס
  if (!cleanMsg && !manualInjection) return res.status(200).json({ reply: "קיבלתי הודעה ריקה, אחי. איך אפשר לעזור?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });

  // בריכת המודלים ברוטציה (לפי סדר עדיפויות)
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-1.5-flash",
    "gemini-pro"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 2. שליפת דאטה משולב (סטודיו, זיכרון, חוקים ומלאי)
    // הסטודיו הוא "האלוהים" - מושכים את ה-Flow וה-DNA שלו
    const [flowSnap, memoryRes, rulesRes, inventoryRes] = await Promise.all([
      getDoc(doc(dbFS, 'system', 'bot_flow_config')),
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle(),
      supabase.from('ai_rules').select('instruction').eq('is_active', true),
      supabase.from('inventory').select('*').limit(10) // שליפת מוצרים לזיהוי
    ]);

    const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
    const dynamicNodes = flowData.nodes || [];
    const globalDNA = flowData.globalDNA || "אתה ראמי, המוח הלוגיסטי של ח. סבן. דבר קצר, יוקרתי ובשפת השטח.";
    const customerContext = memoryRes.data?.accumulated_knowledge || "אין מידע קודם על הלקוח.";
    const activeRules = rulesRes.data?.map(r => r.instruction).join('\n') || "";
    const inventoryContext = inventoryRes.data?.map(i => `[${i.product_name} | SKU: ${i.sku} | מחיר: ₪${i.price}]`).join(', ') || "";

    // 3. ניווט חכם לפי הסטודיו
    let forcedState = state || 'MENU';
    if (['0', 'חזור', 'תפריט', 'איפוס'].includes(cleanMsg)) forcedState = 'MENU';

    // 4. בניית ה-Prompt המשולב - הסטודיו שולט בשיחה
    const prompt = `
      ${globalDNA}
      -- חוקי מערכת קשיחים --
      ${activeRules}
      
      -- זיכרון לקוח (${name || 'לקוח'}) --
      ${customerContext}

      -- מלאי מוצרים זמין (שלוף מוצר אם הלקוח מחפש) --
      ${inventoryContext}

      -- ענפי השיחה מהסטודיו (הנחיות לביצוע לפי מצב) --
      ${dynamicNodes.map((n: any) => `ענף [${n.name}]: ${n.prompt}`).join('\n')}

      -- פרטי שיחה נוכחית --
      מצב (State): ${forcedState}
      הודעת לקוח: "${cleanMsg}"

      -- הנחיות עיצוב --
      - אם הלקוח שאל על מוצר קיים, החזר לינק בפורמט: ${BASE_URL}/product/SKU
      - השתמש בטקסט **מודגש** ובאימוג'ים מעוצבים (🏗️, 🚛).
      
      -- פורמט חובה: JSON בלבד --
      {
        "reply": "התשובה שלך",
        "newState": "המצב הבא (לפי שמות הענפים בסטודיו)",
        "updateMemory": "מידע חדש לשימור או null",
        "productLink": "לינק מוצר אם רלוונטי או null",
        "mediaUrl": "${forcedState === 'MENU' ? BRAND_LOGO : 'null'}"
      }
    `;

    // 5. הרצת מודלים ברוטציה (Fallback)
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
                temperature: 0.15, // דיוק גבוה להחלטות לוגיסטיות
                responseMimeType: "application/json" 
              }
            })
          }
        );

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          jsonResult = JSON.parse(rawText);
          break; // הצלחנו, עוצרים את הרוטציה
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
        continue;
      }
    }

    if (!jsonResult) throw new Error("All models failed");

    // 6. עדכון זיכרון אוטומטי ב-Supabase
    if (jsonResult.updateMemory && phone !== 'unknown') {
      const newKnowledge = customerContext === "אין מידע קודם על הלקוח." 
        ? jsonResult.updateMemory 
        : `${customerContext} | ${jsonResult.updateMemory}`;

      await supabase.from('customer_memory').upsert({
        clientId: phone,
        accumulated_knowledge: newKnowledge,
        last_update: new Date().toISOString()
      });
    }

    // החזרת המענה הסופי
    return res.status(200).json({
      ...jsonResult,
      mediaUrl: jsonResult.mediaUrl !== 'null' ? jsonResult.mediaUrl : null
    });

  } catch (e: any) {
    console.error("Critical API Error:", e);
    return res.status(200).json({ 
      reply: "אחי, המוח עמוס בגלל עומס לוגיסטי. תן לי דקה ואני חוזר אליך. 🛠️",
      mediaUrl: BRAND_LOGO 
    });
  }
}
