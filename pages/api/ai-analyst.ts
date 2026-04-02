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
  const cleanMsg = (query || "").trim();

  // בדיקות תקינות למניעת קריסה
  if (!cleanMsg) return res.status(200).json({ answer: "בוס, לא כתבת שאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  const today = new Date().toISOString().split('T')[0];
   const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
    "gemini-1.5-flash"
  ];

  try {
    // --- נתיב עקיפה מהיר: דוח UI/UX מקובץ ---
    if (cleanMsg.includes("דוח") || cleanMsg.includes("כמה סופקו")) {
      const { data: rawOrders } = await supabase
        .from('orders')
        .select('client_info')
        .eq('delivery_date', today)
        .neq('status', 'deleted');

      if (!rawOrders || rawOrders.length === 0) {
        return res.status(200).json({ answer: "בוס, אין הזמנות רשומות להיום." });
      }

      // לוגיקת קיבוץ לפי שם לקוח
      const grouped = rawOrders.reduce((acc: any, curr: any) => {
        const name = curr.client_info.split('|')[0].trim().replace('📦', '');
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      let report = `📦 *סיכום אספקות יומי* | ${today}\n`;
      report += `──────────────────\n`;

      Object.entries(grouped).forEach(([name, count]) => {
        report += `👤 *${name}*\n└  ✅ ${count} הזמנות אושרו\n\n`;
      });

      report += `──────────────────\n`;
      report += `📊 *סה"כ כללי:* ${rawOrders.length} משימות בביצוע\n`;
      report += `🚀 *Saban OS - Live Update*`;

      return res.status(200).json({ answer: report });
    }

    // --- נתיב AI: שאלות כלליות ותחקיר נתונים ---
    const [orders, containers, transfers] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('start_date', today).neq('status', 'deleted'),
      supabase.from('transfers').select('*').eq('transfer_date', today)
    ]);

    const contextData = `
      נתוני מערכת Saban OS (${today}):
      - חומרים והובלות: ${JSON.stringify(orders.data || [])}
      - מכולות: ${JSON.stringify(containers.data || [])}
      - העברות: ${JSON.stringify(transfers.data || [])}
    `;

    const prompt = `
      זהות:עוזר לספק מענה לסידור ח.סבן חומרי בניין.
      משימה: ענה למשתמש על בסיס הנתונים בלבד.
      ענה שירותי ומכובד תבטיח שתעזור במה שאתה יודע במידה ואין מענה תבקש רשות לבדוק מול ראמי .
      
      חוקי עיצוב:
      1. ענה קצר ותמציתי בלי הקדמות.
      2. עיצוב UI/UX נקי עם אימוג'ים.
      3. אם אין מידע - "אין מידע להיום."
      4. חתימה בסוף:הצג תמונה לא רק לינק ![סבן-AI](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)

      הנתונים: ${contextData}
      שאלה: "${cleanMsg}"
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
        console.error(`Error with model ${modelName}`);
      }
    }

    return res.status(200).json({ answer: aiText || "בוס, המודלים לא זמינים כרגע." });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(200).json({ answer: "בוס, יש תקלה בגישה לנתונים." });
  }
}
