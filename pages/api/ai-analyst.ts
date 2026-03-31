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

const contextData = `
      נתוני מערכת Saban OS (${today}):
      - חומרים: ${JSON.stringify(orders.data || [])}
      - מכולות: ${JSON.stringify(containers.data || [])}
      - העברות: ${JSON.stringify(transfers.data || [])}
    `;

    const prompt = `
      זהות: מערכת שליטה ובקרה Saban OS Core.
      משימה: הפקת דוח ביצועים וניתוח נתונים קשיח.
      
      חוקי עיצוב דוח (חובה):
      1. כותרת: התחל ב-📊 **סיכום תפעולי | [נושא השאלה]**
      2. מבנה שורה: • [אימוג'י סוג] | לקוח: **[שם]** | סטטוס: [אימוג'י סטטוס] [מצב],
      3. הפרדה: כל משימה מסתיימת בפסיק (,) וירד שורה.
      4. חתימה: בסוף כל תשובה, הוסף: ![Saban Logo](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)

      מקרא אימוג'ים וסטטוס:
      - 📥 **הצבה** | 🔄 **החלפה** | 📤 **הוצאה** | 📦 **חומרים**
      - 🟢 **מאושר** | 🟡 **ממתין** | 🔴 **נדחתה**

      טיפול ב"חיפוש לפי שם לקוח":
      אם זו בקשת המשתמש, הצג רשימת בועות (Bold) עם אימוג'י מתאים ופסיקים מודגשים בלבד:
      לדוגמה: 🏗️ **גבריאל מזרחי** , 🚛 **מודי יבוא** , 🏗️ **גבי מזרחי** , ...

      חוקי מענה קשיחים:
      1. ענה רק על מה שנשאל. שאלת "כמה" - השב במספר.
      2. איסור מוחלט על "הבנתי", "ממתין" או מילות נימוס.
      3. אם אין נתונים תואמים - ענה: "אין מידע להיום."

      הנתונים:
      ${contextData}

      שאלה: "${query}"
    `;;

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
