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

    // 2. שליפת דאטה משולבת (כולל DNA המוח והזיכרון)
    const [brainCoreSnap, memoryRes] = await Promise.all([
      getDoc(doc(dbFS, 'settings', 'brain-core')),
      supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle()
    ]);

    const dna = brainCoreSnap.exists() ? brainCoreSnap.data() : {};
    const customerMemory = memoryRes.data?.accumulated_knowledge || "";

    // --- לוגיקת דוח וואטסאפ (סוף יום) ---
    let reportContent = "";
    let whatsappLink = "";
    const isReportRequest = cleanMsg.includes("דוח") || cleanMsg.includes("סיכום");

    if (isReportRequest) {
      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase.from('orders').select('*').eq('created_at', today).order('order_time', { ascending: true });

      if (orders && orders.length > 0) {
        reportContent = "📋 *דוח הזמנות - ח.סבן*\n\n";
        ['חכמת', 'עלי'].forEach(driver => {
          const dOrders = orders.filter(o => o.driver_name === driver);
          if (dOrders.length > 0) {
            reportContent += `*${driver}:*\n` + dOrders.map(o => `⏰ ${o.order_time} | 👤 ${o.client_info} | 📍 ${o.location}`).join('\n') + '\n\n';
          }
        });
        whatsappLink = `https://wa.me/?text=${encodeURIComponent(reportContent)}`;
      }
    }

    // 3. בניית ה-Prompt המקצועי - DNA מנהל משרד התקפי
    const prompt = `
      הנחיית יסוד: אתה Saban OS, העוזר והמשרת האישי של ראמי. אתה לא צ'אטבוט - אתה מנהל משרד התקפי.
      
      -- DNA וזהות --
      ${dna.coreIdentity || "יד ימינו של ראמי, מנהל תפעול חריף של ח.סבן."}
      
      -- חוק הובלות ח.סבן (קשיח) --
      אם ראמי אומר "הוסף הזמנה" או נמצא בתוך תהליך איסוף נתונים, עבוד אך ורק לפי הסדר הבא. אל תשאל שאלות כלליות.
      1. חסר שם לקוח? שאל: "מוכן להתחיל, בוס. מה שם הלקוח?"
      2. חסרה כתובת? שאל: "רשמתי את הלקוח. מה כתובת האספקה?"
      3. חסר מחסן? שאל: "מאיזה מחסן יוצאת ההזמנה? (התלמיד / החרש)"
      4. חסר נהג? שאל: "מי הנהג המשויך? (חכמת / עלי)"
      
      -- לוגיקה אוטומטית --
      - חכמת = הובלת מנוף (10 מטר, 12 טון).
      - עלי = פריקה ידנית.
      
      -- טון ודיבור --
      דבר חופשי, חברי והתקפי. השתמש בביטויים: 'בוס', 'שותף', 'בוצע', 'סונכרן'.
      קונטקסט נוכחי: "${cleanMsg}"
      זיכרון תהליך: ${customerMemory}

      ${isReportRequest ? `הפק דוח וואטסאפ מהנתונים הבאים: ${reportContent}` : 'המשך בעץ השאלות או בצע פקודה.'}

      חוק מענה: ענה בחדות, סיים תמיד ב-TL;DR מודגש.
    `;

    // 4. הרצת רוטציית המודלים (Fallback Logic)
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

    // 5. החזרת תשובה
    return res.status(200).json({
      reply: replyText,
      reportLink: whatsappLink,
      status: "SYNC_OK"
    });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס. שלח שוב ואני מבצע. 🛠️" });
  }
}
