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

  // בדיקות בטיחות
  if (!cleanMsg) return res.status(200).json({ answer: "בוס, מה השאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח API חסר בשרת." });

  const today = new Date().toISOString().split('T')[0];
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash"];

  try {
    // 1. שליפת נתונים + "שיעורי הצלחה" מהעבר ללימוד עצמי
    const [orders, containers, bestLessons] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('is_active', true),
      supabase.from('google_ai').select('user_query, ai_response').eq('learning_score', 1).limit(3)
    ]);

    // 2. בניית הקשר למידה (Self-Learning Context)
    const learningContext = bestLessons.data?.length 
      ? bestLessons.data.map(l => `שאלה: ${l.user_query} -> מענה מוצלח: ${l.ai_response}`).join('\n')
      : "טרם נאספו שיעורי הצלחה.";

    // 3. לוגיקת סדרן חכם (חכמת/עלי)
    let schedulerAlert = "";
    if (cleanMsg.includes("חכמת") || cleanMsg.includes("עלי")) {
      const driver = cleanMsg.includes("חכמת") ? "חכמת" : "עלי";
      const isBusy = orders.data?.some(o => o.driver_name?.includes(driver));
      if (isBusy) schedulerAlert = `שים לב: ${driver} כבר מופיע בסידור להיום. אם תפוס, הצע מרווח של שעתיים או בדוק נהג חלופי.`;
    }

    const chatHistory = history.slice(-4).map((h: any) => `${h.role}: ${h.content}`).join('\n');

    const prompt = `
      זהות: Saban AI Core. מוח תפעולי לומד.
      משתמש: בוס ${userName || 'ראמי'}.
      
      חוקי הסטודיו ללמידה עצמית:
      - למד מהתשובות הטובות ביותר שלך בעבר:
      ${learningContext}
      
      חוקי מענה קשיחים:
      1. ענה קצר, חד, תמציתי. בלי "שלום" ובלי "אשמח לעזור".
      2. איסור על כוכביות (**). טקסט נקי בלבד.
      3. הצעות סדרן: ${schedulerAlert}
      4. הצג טבלאות Markdown אם יש רשימה מעל 2 פריטים.
      
      נתוני שטח (SQL):
      הזמנות: ${JSON.stringify(orders.data)}
      מכולות: ${JSON.stringify(containers.data)}
      
      היסטוריית שיחה:
      ${chatHistory}

      שאלה: "${cleanMsg}"
      חתימה: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)
    `;

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

    // ניקוי כוכביות אחרון
    const finalAnswer = (aiText || "בוס, המוח בטעינה. נסה שוב.").replace(/\*\*/g, '');

    // 4. תיעוד לטבלת הלימוד (המוח רושם לעצמו מה ענה)
    await supabase.from('google_ai').insert([{
      user_query: cleanMsg,
      ai_response: finalAnswer,
      context_tag: userName || 'admin',
      metadata: { model: "gemini-3.1-flash", scheduler_check: schedulerAlert !== "" }
    }]);

    return res.status(200).json({ answer: finalAnswer });

  } catch (error) {
    return res.status(200).json({ answer: "⚠️ תקלה טכנית בחיבור לטבלאות הלימוד." });
  }
}
