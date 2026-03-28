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
  if (!cleanMsg && !manualInjection) return res.status(200).json({ reply: "בוס, קיבלתי הודעה ריקה. איך אני יכול לשרת אותך?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });

  // בריכת המודלים ברוטציה (ללא שימוש בשמות או סדר)
  const modelPool = [
    "gemini-3.1-flash-lite-preview", 
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 2. שליפת דאטה משולבת (סטודיו + זיכרון לקוח + DNA של ראמי)
    const [flowSnap, brainCoreSnap, memoryRes] = await Promise.all([
      getDoc(doc(dbFS, 'system', 'bot_flow_config')),
      getDoc(doc(dbFS, 'settings', 'brain-core')), // המוח המפוצל החדש
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle()
    ]);

    const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
    const dna = brainCoreSnap.exists() ? brainCoreSnap.data() : {};
    const nodes = flowData.nodes || [];
    const customerMemory = memoryRes.data?.accumulated_knowledge || "אין מידע קודם.";

    // 3. זיהוי ענף דינמי
    let activeNode = nodes.find((n: any, index: number) => {
      const nodeNumber = (index + 1).toString();
      return cleanMsg === nodeNumber || cleanMsg === n.name || cleanMsg.includes(n.name);
    });

    // 4. שליפת מוצרים (אם רלוונטי)
    let attachedProducts: any[] = [];
    if (activeNode?.name.includes("1") || cleanMsg.includes("מוצר") || cleanMsg.includes("מלאי") || cleanMsg.includes("כמה עולה")) {
      const { data } = await supabase.from('inventory').select('product_name, sku, price, image_url, youtube_url').limit(3);
      attachedProducts = data || [];
    }

    // 5. בניית ה-Prompt הקשיח - חוקי ראמי
    const prompt = `
      הנחיית יסוד קשיחה: אתה Saban OS, העוזר האישי והמשרת של ראמי מסארוה. אתה מקשיב רק לראמי ופועל לפי חוקיו.
      
      -- DNA וזהות (חוקי ראמי) --
      ${dna.coreIdentity || "אתה שותף עסקי חכם ומשרת נאמן של ראמי."}
      
      -- פרוטוקול ביצוע --
      ${dna.executionProtocol || "בצע פקודות בחדות. אין להמציא נתונים מדמיונך."}
      
      -- טון דיבור --
      ${dna.toneAndVoice || "דבר כשגיא חכם: חד, ענייני, חברי (בוס, אח)."}

      -- שילוב קונטקסט וזיכרון --
      שם המשתמש: ${name || 'חבר'}
      זיכרון מערכת: ${customerMemory}
      הנחיות מהאדמין: ${dna.contextIntegration || ""}

      -- מצב שיחה --
      ${activeNode ? `ענף פעיל: ${activeNode.name}. פקודה: ${activeNode.prompt}` : "שיחה כללית"}
      
      מידע מהמחסן: ${attachedProducts.length > 0 ? attachedProducts.map(p => `${p.product_name}: ₪${p.price}`).join(', ') : 'המלאי זמין.'}

      חוקים בל יעברו:
      1. אל תמציא נתונים (No Hallucinations). אם חסר מידע - שאל את ראמי.
      2. תמיד סיים בתשובה קצרה (2-3 משפטים) ובשורת TL;DR מודגשת בסוף.
      3. התייחס לראמי כאל הבוס והמנהל הבלעדי שלך.

      הודעה: "${cleanMsg}"
      תשובת המוח:
    `;

    // 6. הרצת רוטציית המודלים
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

    if (!replyText) throw new Error("כל המודלים נכשלו.");

    // 7. החזרת תשובה מסונכרנת
    return res.status(200).json({
      reply: replyText,
      products: attachedProducts,
      mediaUrl: activeNode ? null : BRAND_LOGO
    });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס לרגע. שלח הודעה שוב ואני מבצע. 🛠️" });
  }
}
