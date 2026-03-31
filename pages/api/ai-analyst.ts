import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!query) return res.status(200).json({ answer: "בוס, לא כתבת שאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

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
      נתוני מערכת Saban OS (${today}):
      - חומרים: ${JSON.stringify(orders.data || [])}
      - מכולות: ${JSON.stringify(containers.data || [])}
      - העברות: ${JSON.stringify(transfers.data || [])}
      אם המשתמש ביקש "חיפוש לפי שם לקוח", הצג את רשימת הלקוחות בפורמט הבא:
  1. הוסף אימוג'י מתאים לפני כל שם (🏗️ למכולה, 🚛 להובלה, 🛠️ לשיפוץ).
  2. הפרד בין השמות בפסיקים מודגשים.
  3. סדר אותם ב"בועות" טקסט (שימוש ב-Bold).
  
  רשימת הלקוחות הנוכחית: 
  גבריאל מזרחי, מודי יבוא, גבי מזרחי, וגשל דאו, גל בן דוד, לירן/ביל"ו, קדם גלעד/מזל דלי, אורניל/אבי לוי, ד.ניב/שיפוצים הוד הש, אלנבי על הים/האגדה.
    `;

    const prompt = `
      זהות: Saban OS Core - מנוע נתונים קשיח.
      משימה: מענה ישיר וקצר על שאילתות מתוך הנתונים בלבד.
      
      חוקי מענה:
      1. ענה אך ורק על מה שנשאל. שאלת "כמה" - ענה במספר.
      2. אל תכתוב "הבנתי", "ממתין לקלט" או כל הקדמה אחרת.
      3. אם אין נתונים תואמים להיום, ענה: "אין מידע להיום."
      4. הצג נתונים בבולטים קצרים (שורות בודדות).

      הנתונים:
      ${context}

      שאלה: "${query}"
    `;

    let replyText = "";
    
    // לולאת ה-Pool המתוקנת
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 250 }
          })
        });
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          replyText = text.trim();
          break; // יוצא מהלולאה ברגע שיש תשובה
        }
      } catch (e) {
        continue; // מנסה את המודל הבא ב-Pool
      }
    }

    return res.status(200).json({ answer: replyText || "אין מידע תואם להיום." });

  } catch (e) {
    console.error("Analyst Error:", e);
    return res.status(200).json({ answer: "בוס, יש תקלה בגישה לנתונים." });
  }
}
