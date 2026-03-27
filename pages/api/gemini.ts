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

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, name, senderPhone, manualInjection, context: frontendContext } = req.body;
  const cleanMsg = (message || "").trim();

  // הגנות בסיס
  if (!cleanMsg && !manualInjection) return res.status(200).json({ reply: "קיבלתי הודעה ריקה, אחי. איך אפשר לעזור?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });

  // בריכת המודלים ברוטציה (לפי סדר עדיפויות)
  const modelPool = [
    "gemini-3.1-flash-lite-preview", // המודל הכי מהיר וחדש
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 2. שליפת דאטה משולבת (סטודיו + זיכרון לקוח)
    const [flowSnap, memoryRes] = await Promise.all([
      getDoc(doc(dbFS, 'system', 'bot_flow_config')),
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle()
    ]);

    const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
    const nodes = flowData.nodes || [];
    const globalDNA = flowData.globalDNA || "אתה ראמי, המוח של ח. סבן.";
    const customerMemory = memoryRes.data?.accumulated_knowledge || "אין מידע קודם.";

    // 3. זיהוי ענף דינמי (Mapping) - תומך בענף 8 וכל מספר אחר
    let activeNode = nodes.find((n: any, index: number) => {
      const nodeNumber = (index + 1).toString();
      return cleanMsg === nodeNumber || cleanMsg === n.name || cleanMsg.includes(n.name);
    });

    // 4. שליפת מוצרים לממשק הפרימיום (אם מדובר בבירור מלאי)
    let attachedProducts: any[] = [];
    if (activeNode?.name.includes("1") || cleanMsg.includes("מוצר") || cleanMsg.includes("מלאי") || cleanMsg.includes("כמה עולה")) {
      const { data } = await supabase
        .from('inventory')
        .select('product_name, sku, price, image_url, youtube_url')
        .limit(3);
      attachedProducts = data || [];
    }

    // 5. בניית ה-Prompt ל-AI (נקי ללא כפילויות)
    const prompt = `
      ${globalDNA}
      
      -- הקשר לקוח --
      שם הלקוח: ${name || 'חבר'}
      זיכרון מערכת: ${customerMemory}
      הקשר מהממשק: ${frontendContext || 'לקוח כללי'}

      -- מצב שיחה נוכחי --
      ${activeNode ? `הלקוח בחר בענף: ${activeNode.name}. הנחיה לפעולה: ${activeNode.prompt}` : "שיחה כללית/פתיחה"}
      
      -- מידע זמין מהמחסן (להזרקה לתשובה במידת הצורך) --
      ${attachedProducts.length > 0 ? attachedProducts.map(p => `${p.product_name}: ₪${p.price}`).join(', ') : 'המלאי נטען...'}

      חוקים קשיחים למענה:
      1. תשובות קצרות וקולעות (2-3 משפטים).
      2. אם נבחר ענף או מספר, עבור ישר לנושא. **אל תציג שוב את כל התפריט (1-7)**.
      3. דבר בשפה של קבלנים: חברותי, מקצועי, עם אימוג'ים 🏗️🦾.
      4. אם צירפת מוצרים, ציין זאת בקצרה: "שלחתי לך כרטיסי מוצר כאן למטה".

      הודעת לקוח: "${cleanMsg}"
      תשובת ראמי:
    `;

    // 6. הרצת רוטציית המודלים (Fallback)
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
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
        continue;
      }
    }

    if (!replyText) throw new Error("כל המודלים נכשלו.");

    // 7. החזרת תשובה מסונכרנת לצאט פרימיום
    return res.status(200).json({
      reply: replyText,
      products: attachedProducts, // נשלח לממשק המעוצב
      mediaUrl: activeNode ? null : BRAND_LOGO // מציג לוגו רק בהודעה ראשונה
    });

  } catch (e) {
    console.error("Critical Error:", e);
    return res.status(200).json({ reply: "אחי, המוח עמוס לרגע. שלח הודעה שוב בבקשה? 🛠️" });
  }
}
