import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const modelPool = [
  "gemini-3.1-flash-lite-preview", 
  "gemini-2.0-flash", 
  "gemini-1.5-flash"
  ];
  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת היסטוריית האתר הספציפי מהטבלה החדשה
    // המוח מנסה להבין אם יש מכולה פעילה לפי הודעות קודמות או חיפוש ב-DB
    const { data: activeContainers } = await supabase
      .from('container_management')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // 2. ניהול זיכרון שיחה
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הזמנה חדשה" || cleanMsg === "מכולה") history = "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 3. בניית ה-Prompt המפקח
    const prompt = `
      זהות: מפקח מכולות חכם של סבן חומרי בניין. 
      משימה: לנהל הזמנות מכולות (הצבה 🟢, החלפה ♻️, הוצאה 🔴).
      
      נתוני שטח נוכחיים (מכולות פעילות):
      ${JSON.stringify(activeContainers)}

      חוקי פיקוח:
      1. אם משתמש מבקש "הצבה" בכתובת שכבר יש בה מכולה פעילה - התרע: "בוס, יש שם כבר מכולה. לבצע החלפה או להוסיף עוד אחת?"
      2. חישוב ימים: מכולה מעל 9 ימים דורשת פינוי/החלפה.
      3. מחסנים מותרים בלבד: שארק 30, כראדי 32, שי שרון 40.

      סדר שאלות: לקוח -> כתובת -> פעולה (הצבה/החלפה/הוצאה) -> מחסן.

      בסיום, ענה "בוצע בהצלחה 🚀" והוסף JSON:
      DATA_START{
        "complete": true,
        "client": "שם",
        "address": "כתובת",
        "action": "PLACEMENT/EXCHANGE/REMOVAL",
        "contractor": "שם המחסן",
        "date": "YYYY-MM-DD"
      }DATA_END
    `;

    // 4. קריאה ל-Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    let replyText = data.candidates[0].content.parts[0].text.trim();

    let isComplete = false;

    // 5. הזרקה חכמה לטבלת הניהול
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          // אם הפעולה היא הוצאה (REMOVAL), אנחנו מעדכנים את המכולה הקודמת ללא פעילה
          if (d.action === 'REMOVAL') {
            await supabase
              .from('container_management')
              .update({ is_active: false })
              .eq('delivery_address', d.address)
              .eq('is_active', true);
          }

          // הזרקת הפעולה החדשה
          const { error: insertError } = await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            action_type: d.action,
            contractor_name: d.contractor,
            start_date: d.date || new Date().toISOString().split('T')[0],
            is_active: d.action !== 'REMOVAL'
          }]);

          if (!insertError) isComplete = true;
        }
      } catch (e) { console.error("JSON Error", e); }
    }

    // 6. עדכון זיכרון
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח בטעינה. נסה שוב." });
  }
}
