import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. הגדרות בסיס ומניעת קריסה
  if (req.method !== 'POST') return res.status(405).json({ answer: 'Method not allowed' });

  const { query, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanMsg = (query || "").trim();

  if (!cleanMsg) return res.status(200).json({ answer: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח API חסר בשרת." });

  const today = new Date().toISOString().split('T')[0];
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];

  try {
    // 2. לוגיקת דוח מהיר (UI/UX מקובץ) - אם המילה "דוח" או "סופקו" מופיעה
    if (cleanMsg.includes("דוח") || cleanMsg.includes("סופקו")) {
      const { data: rawOrders } = await supabase
        .from('orders')
        .select('client_info')
        .eq('delivery_date', today)
        .neq('status', 'deleted');

      if (!rawOrders || rawOrders.length === 0) {
        return res.status(200).json({ answer: "בוס, אין הזמנות רשומות להיום." });
      }

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
      report += `📊 *סה"כ כללי:* ${rawOrders.length} משימות\n`;
      report += `![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)`;

      return res.status(200).json({ answer: report });
    }

    // 3. שליפת נתונים כללית ל-AI
    const [orders, containers] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('is_active', true)
    ]);

    const chatContext = history.slice(-5).map((h: any) => `${h.role === 'user' ? 'משתמש' : 'AI'}: ${h.text}`).join('\n');

    const prompt = `
      זהות: Saban OS Core. מוח תפעולי.
      משימה: ענה לבוס קצר ולעניין.
      חוקים: בלי **, השתמש ב-Markdown נקי. חתימה בסוף חובה.
      
      הקשר שיחה:
      ${chatContext}

      נתונים להיום:
      הזמנות: ${JSON.stringify(orders.data || [])}
      מכולות: ${JSON.stringify(containers.data || [])}

      שאלה: "${cleanMsg}"
      
      חתימה: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)
    `;

    // 4. פנייה למודל עם Fallback
    let aiText = "";
    for (const model of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) break;
      } catch (e) { console.error(`Model ${model} failed`); }
    }

    const finalAnswer = (aiText || "בוס, המוח בשיפוצים. נסה שוב.").replace(/\*\*/g, '');
    
    // חשוב: מחזירים שדה בשם answer כי זה מה שה-Frontend שלך מחפש
    return res.status(200).json({ answer: finalAnswer });

  } catch (error) {
    console.error(error);
    return res.status(200).json({ answer: "בוס, יש תקלה טכנית בחיבור לנתונים." });
  }
}
