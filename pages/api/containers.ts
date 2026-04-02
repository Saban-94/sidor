import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // הגדרת המשתנים שחסרו ב-Build
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, orderContext, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const orderId = orderContext?.id;
  const phone = senderPhone?.replace('@c.us', '') || 'admin';

  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאה: מפתח API לא מוגדר בשרת." });

  try {
    // --- בלוק 1: פקודות ניהול מהירות (ללא AI) ---
    
    // שנה שעת אספקה
    if (cleanMsg.includes("שנה") && (cleanMsg.includes("שעה") || cleanMsg.includes(":"))) {
      const newTime = cleanMsg.match(/\d{2}:\d{2}/)?.[0];
      if (newTime && orderId) {
        await supabase.from('orders').update({ order_time: newTime }).eq('id', orderId);
        return res.status(200).json({ reply: `✅ בוס, השעה עודכנה ל-${newTime} עבור הזמנה #${orderContext?.number}.` });
      }
    }

    // סימון כבוצע
    if (cleanMsg.includes("סמן כבוצע") || cleanMsg.includes("סיים")) {
      if (orderId) {
        await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
        return res.status(200).json({ reply: "✅ המשימה סומנה כבוצעה והוסרה מהלוח." });
      }
    }

    // חישוב ימי שכירות למכולה
    if (cleanMsg.includes("כמה ימים") || cleanMsg.includes("שכירות")) {
      const { data: container } = await supabase.from('container_management')
        .select('start_date, return_deadline')
        .eq('delivery_address', orderContext?.location)
        .eq('is_active', true)
        .maybeSingle();
      
      if (container) {
        const start = new Date(container.start_date);
        const today = new Date();
        const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return res.status(200).json({ reply: `📊 המכולה ב${orderContext?.location} נמצאת בשטח ${days} ימים. מועד פינוי יעד: ${container.return_deadline}.` });
      }
    }

    // --- בלוק 2: פנייה ל-AI (עבור פקודות מורכבות או הזמנות חדשות) ---
    
    const { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];
    const prompt = `
      זהות: מפקח מכולות חכם של סבן.
      הקשר: אתה עובד על הזמנה #${orderContext?.number || 'חדשה'} של ${orderContext?.client || 'לקוח לא מזוהה'}.
      היסטוריה: ${localUpdatedHistory}
      משימה: בצע עדכון מהיר או הזרקה חדשה. אם מדובר בעדכון, אשר "בוצע". 
      אם זו הזמנה חדשה, בצע פינג-פונג (לקוח-כתובת-פעולה-קבלן-זמן).
      תמיד חשב תאריך יעד לפי חוק 10 הימים.
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
        replyText = data.candidates[0].content.parts[0].text.trim();
        if (replyText) break;
      } catch (e) { continue; }
    }

    // עדכון זיכרון
    await supabase.from('customer_memory').upsert({ clientId: phone, accumulated_knowledge: localUpdatedHistory + `\nAI: ${replyText}` });

    return res.status(200).json({ reply: replyText });

  } catch (e) {
    console.error("Critical Error:", e);
    return res.status(200).json({ reply: "בוס, המוח נתקע לרגע. נסה שוב." });
  }
}
