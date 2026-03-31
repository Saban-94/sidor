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
      זהות: Saban OS - מוח תפעולי נקי.
      משימה: הפקת דוח ישיר לבוס.
      
      חוקי עיצוב (קשיח):
      1. איסור מוחלט על שימוש בסימני Markdown כפולים (**). השתמש בכוכבית אחת בלבד (*) כדי להדגיש מילים בוואטסאפ.
      2. כותרת: 📊 *סיכום תפעולי | [נושא]*
      3. מבנה שורה: • [אימוג'י סוג] | לקוח: *[שם]* | סטטוס: [אימוג'י] *[מצב]*,
      4. סיום שורה: כל שורה מסתיימת בפסיק (,) וירדה שורה.
      5. חתימה: בסוף התשובה הוסף רק את הלוגו: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)

      מקרא אימוג'ים:
      📥 *הצבה* | 🔄 *החלפה* | 📤 *הוצאה* | 📦 *חומרים*
      🟢 *מאושר* | 🟡 *ממתין* | 🔴 *נדחתה*

      חיפוש לקוחות:
      אם ביקשו רשימת לקוחות, הצג ככה:
      🏗️ *גבריאל מזרחי* , 🚛 *מודי יבוא* , 🛠️ *גל בן דוד* ,

      הנתונים:
      ${contextData}

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
