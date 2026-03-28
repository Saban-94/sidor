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

  // בריכת המודלים ברוטציה
  const modelPool = [
    "gemini-3.1-flash-lite-preview", 
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 2. שליפת דאטה משולבת (כולל DNA המוח החדש)
    const [flowSnap, brainCoreSnap, memoryRes] = await Promise.all([
      getDoc(doc(dbFS, 'system', 'bot_flow_config')),
      getDoc(doc(dbFS, 'settings', 'brain-core')),
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle()
    ]);

    const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
    const dna = brainCoreSnap.exists() ? brainCoreSnap.data() : {};
    const nodes = flowData.nodes || [];
    const customerMemory = memoryRes.data?.accumulated_knowledge || "אין מידע קודם.";

    // --- לוגיקת דוח בוקר (WhatsApp Report) ---
    let reportContent = "";
    let whatsappLink = "";
    const isReportRequest = cleanMsg.includes("דוח") || cleanMsg.includes("סיכום");

    if (isReportRequest) {
      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('created_at', today)
        .order('order_time', { ascending: true });

      if (orders && orders.length > 0) {
        reportContent = "📋 *דוח הזמנות נבחרות*\n\n";
        const drivers = [...new Set(orders.map(o => o.driver_name))];
        
        drivers.forEach(driver => {
          reportContent += `*${driver}*\n`;
          orders.filter(o => o.driver_name === driver).forEach(o => {
            reportContent += `⏰ ${o.order_time} | 👤 ${o.client_info} | 📍 ${o.location} | 🏠 ${o.source_branch}\n`;
          });
          reportContent += "\n";
        });
        
        whatsappLink = `https://wa.me/?text=${encodeURIComponent(reportContent)}`;
      }
    }

    // 3. זיהוי ענף דינמי
    let activeNode = nodes.find((n: any, index: number) => {
      const nodeNumber = (index + 1).toString();
      return cleanMsg === nodeNumber || cleanMsg === n.name || cleanMsg.includes(n.name);
    });

    // 4. שליפת מוצרים
    let attachedProducts: any[] = [];
    if (activeNode?.name.includes("1") || cleanMsg.includes("מוצר") || cleanMsg.includes("מלאי") || cleanMsg.includes("כמה עולה")) {
      const { data } = await supabase.from('inventory').select('product_name, sku, price, image_url, youtube_url').limit(3);
      attachedProducts = data || [];
    }

    // 5. בניית ה-Prompt הקשיח - חוקי ראמי
    const prompt = `
      הנחיית יסוד: אתה Saban OS, העוזר והמשרת האישי של ראמי מסארוה. אתה פועל רק לפי חוקיו.
      
      -- DNA וזהות --
      ${dna.coreIdentity || "משרת נאמן ושותף ביצועי של ראמי."}
      -- פרוטוקול ביצוע --
      ${dna.executionProtocol || "בצע פקודות בחדות."}
      ${isReportRequest ? `שים לב: ראמי ביקש דוח. הנה הנתונים שנשלפו: ${reportContent || 'אין הזמנות להיום'}` : ''}
      
      -- טון דיבור --
      ${dna.toneAndVoice || "חד, ענייני, חברי (בוס, אח)."}

      חוקים למענה:
      1. אם מדובר בדוח, הצג אותו במבנה המקצועי שביקש ראמי עם האימוג'ים.
      2. צרף תמיד את לינק השיתוף לוואטסאפ בסוף הדוח: ${whatsappLink}
      3. אל תמציא נתונים. סיים כל הודעה ב-TL;DR מודגש.

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

    // 7. החזרת תשובה
    return res.status(200).json({
      reply: replyText,
      products: attachedProducts,
      mediaUrl: activeNode ? null : BRAND_LOGO
    });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס. שלח שוב ואני מבצע. 🛠️" });
  }
}
