import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // בדיקות תקינות
  if (!query) return res.status(200).json({ answer: "בוס, לא כתבת שאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  const today = new Date().toISOString().split('T')[0];
  const modelPool = ["gemini-1.5-flash", "gemini-1.5-pro"]; // מודלים יציבים ל-Production

  try {
    // משיכת נתונים מ-Supabase
    const [orders, containers, transfers] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('start_date', today).neq('status', 'deleted'),
      supabase.from('transfers').select('*').eq('transfer_date', today)
    ]);

    const contextData = `
      נתוני מערכת Saban OS (${today}):
      - חומרים: ${JSON.stringify(orders.data || [])}
      - מכולות: ${JSON.stringify(containers.data || [])}
      - העברות: ${JSON.stringify(transfers.data || [])}
    `;

    const prompt = `
      זהות: Saban OS Core - מוח תפעולי ויזואלי.
      משימה: הפקת דוח ישיר לבוס על בסיס הנתונים בלבד.
      
      חוקי עיצוב (קשיח):
      1. איסור על Markdown כפול (**). השתמש בכוכבית אחת (*) בלבד להדגשה.
      2. כותרת: 📊 *סיכום תפעולי | [נושא]*
      3. מבנה שורה:
         ![Icon]([Link])
         • לקוח: *[שם]* | סטטוס: *[מצב]*,
         
      4. לינקים לאייקונים (ירוק וואטסאפ):
         - הצבה: https://img.icons8.com/?size=48&id=12119&format=png&color=00a884
         - החלפה: https://img.icons8.com/?size=48&id=ifMVi1WVk8u2&format=png&color=00a884
         - הוצאה: https://img.icons8.com/?size=48&id=12122&format=png&color=00a884
         - חומרים: https://img.icons8.com/?size=48&id=823&format=png&color=00a884

      5. חתימה בסוף: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)

      הנתונים:
      ${contextData}

      שאלה: "${query}"
    `;

    let aiText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
          })
        });

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiText = data.candidates[0].content.parts[0].text;
          break;
        }
      } catch (e) {
        console.error(`Error with ${modelName}, trying next...`);
      }
    }

    const answer = aiText || "בוס, המודלים לא זמינים כרגע.";
    return res.status(200).json({ answer });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(200).json({ answer: "בוס, יש תקלה בגישה לנתונים." });
  }
}
