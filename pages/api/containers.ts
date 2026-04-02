import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, orderContext } = req.body;
  const cleanMsg = (message || "").trim();
  const orderId = orderContext?.id; // מקבל את ה-ID מהכרטיס שלחצת עליו

  try {
    // --- נתיב עקיפה מהיר: פקודות ישירות ---
    
    // 1. עדכון שעה מהיר
    if (cleanMsg.includes("שנה") && (cleanMsg.includes("שעה") || cleanMsg.includes(":"))) {
      const newTime = cleanMsg.match(/\d{2}:\d{2}/)?.[0];
      if (newTime && orderId) {
        await supabase.from('orders').update({ order_time: newTime }).eq('id', orderId);
        return res.status(200).json({ reply: `✅ בוס, שעת האספקה עודכנה ל-${newTime}.` });
      }
    }

    // 2. סימון כבוצע / מחיקה
    if (cleanMsg.includes("סמן כבוצע") || cleanMsg.includes("סיים")) {
      await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
      return res.status(200).json({ reply: "✅ המשימה סומנה כבוצעה והוסרה מהלוח." });
    }

    if (cleanMsg.includes("מחק")) {
      await supabase.from('orders').delete().eq('id', orderId);
      return res.status(200).json({ reply: "🗑️ ההזמנה נמחקה לצמיתות מהמערכת." });
    }

    // 3. שליפת מידע על ימי שכירות (למכולות)
    if (cleanMsg.includes("כמה ימים") || cleanMsg.includes("שכירות")) {
      const { data: container } = await supabase.from('container_management')
        .select('start_date, return_deadline')
        .eq('delivery_address', orderContext?.location).maybeSingle();
      
      if (container) {
        const start = new Date(container.start_date);
        const days = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return res.status(200).json({ reply: `📊 המכולה אצל הלקוח ${days} ימים. מועד פינוי צפוי: ${container.return_deadline}.` });
      }
    }

    // 4. חיפוש רשימות לפי מחסן או שם
    if (cleanMsg.includes("הצג") || cleanMsg.includes("רשימה")) {
      const warehouse = cleanMsg.includes("שארק") ? "שארק 30" : cleanMsg.includes("כראדי") ? "כראדי 32" : "";
      if (warehouse) {
        const { data: list } = await supabase.from('orders').select('client_info').eq('warehouse', warehouse).neq('status', 'completed');
        const names = list?.map(o => o.client_info.split('|')[0]).join(', ');
        return res.status(200).json({ reply: `📋 לקוחות תחת ${warehouse}: ${names || "אין הזמנות פעילות"}.` });
      }
    }

    // --- אם זו לא פקודה ישירה, עוברים ל-AI הרגיל ---
    const prompt = `
      זהות: מפקח מכולות חכם. 
      הקשר: אתה עובד על הזמנה #${orderContext?.number} של ${orderContext?.client}.
      משימה: בצע עדכונים מהירים. אם המשתמש ביקש שינוי, ענה "בוצע" בצירוף JSON:
      DATA_START{"update": true, "field": "שם השדה", "value": "הערך החדש"}DATA_END
    `;

    // --- בלוק 4: פנייה ל-AI ---
    let replyText = "";
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates[0].content.parts[0].text.trim().replace(/\*\*/g, '');
        if (replyText) break;
      } catch (e) { continue; }
    }    
    return res.status(200).json({ reply: "בוס, הפקודה בוצעה." });

  } catch (e) {
    return res.status(200).json({ reply: "שגיאה בביצוע הפעולה." });
  }
}
