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

  const { query, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanMsg = (query || "").trim();

  // --- בדיקות תקינות למניעת קריסה ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API." });

  const today = new Date().toISOString().split('T')[0];

  // מאגר מודלים מעודכן (2026)
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
    "gemini-1.5-flash"
  ];

  try {
    // 1. בדיקת מסלול מהיר לדוח יומי (UI/UX מקובץ)
    if (cleanMsg.includes("דוח") || cleanMsg.includes("כמה סופקו")) {
      const { data: rawOrders } = await supabase
        .from('orders')
        .select('client_info')
        .eq('delivery_date', today)
        .neq('status', 'deleted');

      if (!rawOrders || rawOrders.length === 0) {
        return res.status(200).json({ reply: "בוס, אין הזמנות רשומות להיום." });
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
      report += `📊 *סה"כ כללי:* ${rawOrders.length} משימות בביצוע\n`;
      report += `🚀 *Saban OS - Live Update*`;

      return res.status(200).json({ reply: report });
    }

    // 2. שליפת נתונים רחבה ל-AI (עבור שאלות כלליות)
    const [orders, containers] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('is_active', true)
    ]);

    // בניית הקשר שיחה (Context) מההיסטוריה
    const chatContext = history.slice(-5).map((h: any) => `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n');

    const prompt = `
      זהות: Saban OS Core - מוח תפעולי ויזואלי.
      
      חוקי Markdown:
      - אל תשתמש ב-** להדגשה. השתמש ברשימות או כותרות.
      - הצג נתונים בטבלאות אם יש רשימה ארוכה.
      - תמיד סיים בחתימה: ![Saban-AI](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)

      היסטוריית שיחה:
      ${chatContext}

      נתונים להיום:
      הזמנות: ${JSON.stringify(orders.data || [])}
      מכולות: ${JSON.stringify(containers.data || [])}

      שאלה: "${cleanMsg}"
    `;

    let aiText = "";
    // לולאת Fallback על המודלים
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 }
          })
        });

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiText = data.candidates[0].content.parts[0].text;
          break; // מצאנו מענה, עוצרים
        }
      } catch (e) {
        console.error(`Model ${modelName} failed, trying next...`);
      }
    }

    // ניקוי אחרון של כוכביות אם המודל התעקש
    const finalAnswer = (aiText || "בוס, המערכת בעומס, נסה שוב.").replace(/\*\*/g, '');

    return res.status(200).json({ reply: finalAnswer });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(200).json({ reply: "בוס, יש תקלה בגישה לנתונים." });
  }
}
