import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, history = [], senderPhone = 'admin' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. "שליפת נתונים בזמן אמת" - המוח בודק מה קורה בשטח
    const [orders, containers, pastLessons] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today),
      supabase.from('container_management').select('*').eq('is_active', true),
      supabase.from('google_ai').select('*').limit(5).order('created_at', { ascending: false })
    ]);

    // 2. לוגיקת סדרן חכם (דוגמה לחכמת)
    let driverStatus = "";
    if (query.includes("חכמת") && query.includes("07:00")) {
      const isBusy = orders.data?.some(o => o.driver_name === 'חכמת' && o.order_time.startsWith('07'));
      if (isBusy) {
        driverStatus = "חכמת תפוס ב-07:00. לפי חישוב זמני העמסה ונסיעה (שעתיים), הוא יתפנה ב-09:00.";
      }
    }

    // 3. בניית הפרומפט - "האנציקלופדיה של ח.סבן"
    const prompt = `
      אתה Saban AI Core. תמציתי, מקצועי, בול בפוני.
      משימה: סדרן עבודה חכם.
      
      נתוני שטח: ${JSON.stringify(orders.data)}
      סטטוס ספציפי: ${driverStatus}
      שיעורי עבר מהטבלה: ${JSON.stringify(pastLessons.data)}

      חוקי מענה:
      - אל תפתח ב"שלום" או "הנה המידע". לך ישר לפתרון.
      - אם נהג תפוס, הצע שעה חלופית (+2 שעות) או נהג חלופי (עלי).
      - תמיד סיים בשאלת המשך אופרטיבית (למשל: "לשלוח התראה לראמי לבדיקת חלופה?").
      - חתימה בסוף: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)

      שאלה: ${query}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const answer = data.candidates[0].content.parts[0].text.replace(/\*\*/g, '');

    // 4. "לימוד וזיכרון" - שומר את השאלה והתשובה לטבלת google_ai
    await supabase.from('google_ai').insert([{
      user_query: query,
      ai_response: answer,
      context_tag: query.includes("חכמת") ? "הובלות" : "מכולות",
      metadata: { driver_check: driverStatus }
    }]);

    return res.status(200).json({ answer });

  } catch (e) {
    return res.status(200).json({ answer: "בוס, המוח בטעינה. נסה שוב." });
  }
}
