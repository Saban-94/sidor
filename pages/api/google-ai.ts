import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, userName, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  try {
    const [orders, containers, memory] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today),
      supabase.from('container_management').select('*').eq('is_active', true),
      supabase.from('google_ai').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    const chatHistory = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    const prompt = `
      זהות: Saban OS Core. מוח תפעולי מקצועי. 
      משתמש נוכחי: בוס ${userName}. פנה אליו בשמו.
      
      חוקי הסטודיו:
      1. ענה קצר, חד, תמציתי. בלי הקדמות.
      2. בדוק זמינות נהגים בטבלה. אם חכמת/עלי תפוסים בשעה המבוקשת, הצע הפרש של שעתיים.
      3. הצג טבלאות Markdown אם יש יותר מ-3 פריטים.
      
      נתוני שטח:
      הזמנות: ${JSON.stringify(orders.data)}
      מכולות: ${JSON.stringify(containers.data)}
      זיכרון לימוד: ${JSON.stringify(memory.data)}
      
      היסטוריית שיחה:
      ${chatHistory}

      שאלה: ${query}
      חתימה בסוף: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const answer = data.candidates[0].content.parts[0].text;

    // תיעוד לטבלת הלימוד
    await supabase.from('google_ai').insert([{
      user_query: query,
      ai_response: answer,
      context_tag: userName,
      metadata: { date: today }
    }]);

    return res.status(200).json({ answer });
  } catch (e) { return res.status(500).json({ answer: 'שגיאה בחיבור למוח.' }); }
}
