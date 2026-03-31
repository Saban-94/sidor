import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// שימוש ב-Service Role Key עוקף חסימות RLS לגישה מלאה
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // --- הגנות בסיס ---
  if (!query) return res.status(200).json({ answer: "בוס, לא כתבת שאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  // Model Pool מעודכן לשמות המודלים של Google
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // שליפה מרוכזת מכל הטבלאות
    const [orders, containers, transfers] = await Promise.all([
      supabase.from('orders').select('*').neq('status', 'deleted'),
      supabase.from('container_management').select('*').neq('status', 'deleted'),
      supabase.from('transfers').select('*').neq('status', 'deleted')
    ]);

    const context = `
      נתוני מערכת Saban OS (מעודכן ל- ${today}):
      - הזמנות חומרים: ${JSON.stringify(orders.data || [])}
      - ניהול מכולות: ${JSON.stringify(containers.data || [])}
      - העברות סניפים: ${JSON.stringify(transfers.data || [])}
    `;

const prompt = `
  זהות: Saban OS Core - מנוע חילוץ וניתוח נתונים קשיח.
  משימה: עיבוד הודעות משתמש להזרקה (JSON) או מענה אנליטי (Query).
  
  פרוטוקול מענה קשיח:
  1. אפס "סמול-טוק": איסור מוחלט על מילות נימוס, הסברים על המערכת או הצעות עזרה.
  2. חוק המינימום: ענה אך ורק על מה שנשאל. שאלת "כמה?" - השב במספר. שאלת "סטטוס?" - השב בשורה.
  3. הזרקה מוצלחת: אם הנתונים חולצו ל-JSON, השב רק: "בוס, בוצע [#מספר הזמנה]. 🚀".
  4. איסור כפילות: אל תחזור על פרטי הקלט של המשתמש בתשובה שלך.
  5. סיווג מחלקות: 
     - ORDER (חומרים: חכמת/עלי)
     - CONTAINER (מכולות: שארק 30/כראדי 32/שי שרון 40 | הצבה-ירוק, החלפה-כתום, הוצאה-אדום)
     - TRANSFER (העברות: החרש/התלמיד)

  נתוני מערכת (לשאילתות): ${context}
  
  פלט נדרש:
  - אם זו פקודת הזרקה: DATA_START{...JSON...}DATA_END + תגובה של עד 5 מילים.
  - אם זו שאילתה: תגובה תמציתית בבולטים בלבד, ללא מידע שלא התבקש.
`;
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text.trim();
          break;
        }
      } catch (e) { continue; }
    }

    return res.status(200).json({ answer: replyText || "בוס, ה-AI לא החזיר תשובה. נסה שוב." });

  } catch (e) {
    console.error("Analyst Error:", e);
    return res.status(200).json({ answer: "בוס, יש חסימת תקשורת מול ה-Database." });
  }
}
