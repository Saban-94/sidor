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
  const { message, name, state, senderPhone, manualInjection } = req.body;
  const cleanMsg = (message || "").trim();

  // הגנות בסיס
  if (!cleanMsg && !manualInjection) return res.status(200).json({ reply: "קיבלתי הודעה ריקה, אחי. איך אפשר לעזור?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });

  // בריכת המודלים ברוטציה (לפי סדר עדיפויות שביקשת)
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-1.5-flash",
    "gemini-pro"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 2. שליפת דאטה משולבת (הסטודיו הוא האלוהים)
    const [flowSnap, memoryRes, inventoryRes] = await Promise.all([
      getDoc(doc(dbFS, 'system', 'bot_flow_config')),
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle(),
      supabase.from('inventory').select('product_name, sku, price, stock_quantity').limit(15)
    ]);

    const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
    const nodes = flowData.nodes || [];
    const globalDNA = flowData.globalDNA || "אתה ראמי, המוח של ח. סבן. דבר קצר ומקצועי.";
    const customerContext = memoryRes.data?.accumulated_knowledge || "אין מידע קודם.";
    const inventoryContext = inventoryRes.data?.map(i => `${i.product_name} (₪${i.price})`).join(', ') || "המלאי בטעינה.";

    // 3. זיהוי ענף (Mapping) - מונע לולאת תפריט פתיחה
    let activeNode = nodes.find((n: any) => 
      cleanMsg === n.name || 
      (cleanMsg.length === 1 && nodes.indexOf(n) + 1 === parseInt(cleanMsg)) ||
      cleanMsg.includes(n.name)
    );

    // 4. בניית ה-Prompt ל-AI
    const prompt = `
      ${globalDNA}
      
      -- הקשר לקוח --
      שם: ${name || 'לקוח'}
      זיכרון: ${customerContext}
      
      -- נתוני מלאי מהמחסן --
      ${inventoryContext}

      -- מצב שיחה --
      ${activeNode ? `ענף נבחר: ${activeNode.name}. הנחיה: ${activeNode.prompt}` : "הודעת פתיחה/שיחה כללית"}
      
      חוקים קשיחים:
      - אם הלקוח בחר מספר או נושא, ענה לו ישירות על הנושא. **אל תציג שוב את כל התפריט (1-7)**.
      - אם מדובר בבירור מוצר, השתמש בנתוני המלאי שסופקו למעלה.
      - השתמש בטקסט **מודגש** ובאימוג'ים 🏗️.
      
      הודעת לקוח: "${cleanMsg}"
      תשובת ראמי:
    `;

    // 5. הרצת רוטציית המודלים (Fallback)
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
          break; // הצלחנו, עוצרים את הלולאה
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
        continue;
      }
    }

    if (!replyText) throw new Error("כל המודלים נכשלו במענה.");

    // החזרת תשובה לסטודיו/וואטסאפ
    return res.status(200).json({
      reply: replyText,
      mediaUrl: activeNode ? null : BRAND_LOGO // מציג לוגו רק בפתיחה
    });

  } catch (e) {
    console.error("Critical Error:", e);
    return res.status(200).json({ reply: "אחי, המוח עמוס לרגע. שלח הודעה שוב בבקשה? 🛠️" });
  }
}
