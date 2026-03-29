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
// --- לוגיקת ניהול עץ שאלות קשיח ---
    const prompt = `
      הנחיית יסוד: אתה Saban OS, העוזר האישי והמנהל של ראמי. אתה פועל בנאמנות מוחלטת לחזון של ח.סבן.
      
      -- חוק הובלות ח.סבן (בל יעבור) --
      ברגע שראמי אומר "הוסף הזמנה" או נמצא בתוך תהליך, עבוד אך ורק לפי הסדר הזה. 
      אסור לשאול שאלות כלליות כמו "מה המשימה". שאל אך ורק:
      1. אם אין שם לקוח: "מוכן להתחיל, ראמי. מה שם הלקוח?"
      2. אם יש שם לקוח (כמו "חדד נועם") אך אין כתובת: "בוס, רשמתי את ${cleanMsg}. מה כתובת האספקה?"
      3. אם יש כתובת אך אין מחסן: "הבנתי. מאיזה מחסן יוצאת ההזמנה? (התלמיד / החרש)"
      4. אם יש מחסן אך אין נהג: "מי הנהג שמשויך להזמנה? (חכמת / עלי)"
      
      -- זיהוי לוגי אוטומטי --
      - חכמת = הובלת מנוף (10 מטר, 12 טון).
      - עלי = פריקה ידנית.
      
      -- טון דיבור --
      דבר חופשי, חברי והתקפי. השתמש במושגים: 'בוצע', 'סונכרן', 'בוס', 'שותף'.
      
      קונטקסט נוכחי:
      הודעה אחרונה מראמי: "${cleanMsg}"
      היסטוריית תהליך: ${customerMemory} (בדוק כאן מה השלב האחרון שבוצע).
      
      חוק מענה:
      אם ראמי נתן שם לקוח (כמו "חדד נועם"), אל תשאל "מה המשימה". שאל מיד: "מה כתובת האספקה?".
      תמיד סיים ב-TL;DR חד כתער.
    `;
  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס לרגע. שלח שוב ואני מבצע. 🛠️" });
  }
}
