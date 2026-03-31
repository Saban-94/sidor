import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// שימוש ב-Service Role Key עוקף חסימות RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // --- הגנות בסיס ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  // Model Pool מעודכן לשמות המודלים של Google
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // שליפה רחבה מכל הטבלאות ללא חסמים
    const [orders, containers, transfers] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('container_management').select('*'),
      supabase.from('transfers').select('*')
    ]);

    const context = `
      נתוני מערכת Saban OS (מעודכן להיום ${today}):
      - הזמנות חומרים: ${JSON.stringify(orders.data || [])}
      - ניהול מכולות: ${JSON.stringify(containers.data || [])}
      - העברות סניפים: ${JSON.stringify(transfers.data || [])}
    `;

    const prompt = `
      אתה המוח האנליטי של ראמי מסבן. תפקידך לשלוף מידע מדויק מהנתונים שסופקו.
      
      השאלה של הבוס: "${query}"
      
      הנתונים הגולמיים:
      ${context}

      הנחיות לתשובה:
      1. אם שאלו על לקוח (למשל "גל בן דוד"), חפש אותו בכל הטבלאות והצג את כל הפרטים (מספר הזמנה, כתובת, זמן, מבצע).
      2. אם שאלו על מספר הזמנה (למשל 6212303), שלוף את השורה המדויקת.
      3. אם שאלו על סטטיסטיקה ("כמה יש היום?"), סכם את הכמות להיום בלבד.
      4. ענה בעברית של "אח" - מקצועי, קצר, ולעניין.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "בוס, הנתונים ריקים או שה-API חסום.";

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(200).json({ answer: "בוס, יש חסימת תקשורת מול ה-Database." });
  }
}
