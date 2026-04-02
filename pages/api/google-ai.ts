import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ answer: 'Method not allowed' });

  const { query, userName, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanMsg = (query || "").trim();

  // --- חוק 1: בדיקות בטיחות (האזנה להודעות ריקות ומפתח) ---
  if (!cleanMsg) return res.status(200).json({ answer: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח API חסר בשרת." });

  const today = new Date().toISOString().split('T')[0];
  
  // מאגר המודלים החדש שביקשת
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];

  try {
    // 1. שליפת נתוני שטח בזמן אמת (חומרי בניין ומכולות)
    const [orders, containers, memory] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('is_active', true),
      supabase.from('google_ai').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    // 2. בדיקת זמינות נהגים (חוק הסדרן)
    let schedulerContext = "";
    if (cleanMsg.includes("חכמת") || cleanMsg.includes("עלי")) {
      const driver = cleanMsg.includes("חכמת") ? "חכמת" : "עלי";
      const isBusy = orders.data?.some(o => o.driver_name?.includes(driver) || o.driver_name === driver);
      if (isBusy) {
        schedulerContext = `התראה: הנהג ${driver} כבר משובץ להיום בטבלה. אם השעה קרובה, הצע מרווח של שעתיים לפחות.`;
      }
    }

    const chatHistory = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    const prompt = `
      זהות: Saban AI Core. מוח תפעולי מקצועי. 
      משתמש נוכחי: בוס ${userName || 'ראמי'}. פנה אליו בשמו.
      
      חוקי סטודיו (קשיח):
      1. ענה קצר, חד, תמציתי. בלי הקדמות ובלי נימוסים מיותרים.
      2. מחיקת כוכביות: אל תשתמש ב-** להדגשה. טקסט נקי בלבד.
      3. הצעות סדרן: ${schedulerContext}
      4. הצג טבלאות Markdown אם יש רשימה של יותר מ-2 פריטים.
      
      נתוני שטח (SQL):
      הזמנות חומרים: ${JSON.stringify(orders.data)}
      מכולות פעילות: ${JSON.stringify(containers.data)}
      זיכרון לימוד (Google AI): ${JSON.stringify(memory.data)}
      
      היסטוריית שיחה:
      ${chatHistory}

      שאלה: "${cleanMsg}"
      חתימה חובה: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)
    `;

    let aiText = "";
    // לולאת Fallback על המודלים 3.1 החדשים
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
      } catch (e) { console.error(`Model ${model} failed, switching...`); }
    }

    const finalAnswer = (aiText || "בוס, המוח בטעינה. נסה שוב.").replace(/\*\*/g, '');

    // 3. תיעוד לטבלת הלימוד google_ai (זוכר הכל)
    await supabase.from('google_ai').insert([{
      user_query: cleanMsg,
      ai_response: finalAnswer,
      context_tag: userName || 'admin',
      metadata: { model_used: "gemini-3.1", driver_alert: schedulerContext !== "" }
    }]);

    return res.status(200).json({ answer: finalAnswer });

  } catch (e) {
    console.error(e);
    return res.status(200).json({ answer: 'שגיאה קריטית בחיבור לטבלאות.' });
  }
}
