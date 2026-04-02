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

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון ומצב שטח
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    // 2. חילוץ שמות ומידע למניעת לופים
    const searchTerms = cleanMsg.replace(/הלקוח|של|זה|הוא|אני/g, '').trim();
    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // 3. הפרומפט המהודק - "חוק ההודעה המלאה"
    const prompt = `
      זהות: מפקח מכולות בשרון. סגנון: קצר, חד, ללא כוכביות.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴.
      
      חוקים קריטיים למניעת לופים:
      - חוק הודעה מלאה: אם המשתמש סיפק שם, כתובת וקבלן בהודעה אחת - בצע הזרקה (DATA_START) מיד! אל תשאל שאלות נוספות.
      - אם המשתמש אישר "כן" לשם הלקוח, עבור מיד לכתובת.
      - חוק 10 ימים: תאריך סיום = תאריך ביצוע + 10 ימים.
      - מכולות פעילות בשטח: ${JSON.stringify(activeContainers)}
      - היסטוריית שיחה: ${localUpdatedHistory}

      עץ שאלות (אם חסר מידע): 1. לקוח -> 2. כתובת -> 3. פעולה -> 4. קבלן -> 5. זמן.

      DATA_START{"complete": true, "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "קבלן", "date": "YYYY-MM-DD", "time": "HH:mm", "return_date": "YYYY-MM-DD"}DATA_END
    `;

    // 4. הרצה מול Gemini
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

    let isComplete = false;

    // 5. הזרקה כפולה מותאמת (Containers + Orders)
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);

          // א. הזרקה לניהול מכולות
          await supabase.from('container_management').insert([{
            client_name: d.client, delivery_address: d.address, action_type: d.action,
            contractor_name: d.contractor, start_date: d.date, order_time: d.time,
            return_deadline: d.return_date, is_active: d.action !== 'REMOVAL', status: 'approved'
          }]);

          // ב. הזרקה לטבלת Orders (מבנה ה-SQL שלך)
          const { error: orderError } = await supabase.from('orders').insert([{
            order_number: Math.floor(Math.random() * 9000) + 1000,
            delivery_date: d.date,
            order_time: d.time,
            client_info: `📦 מכולה: ${d.client} | ${d.action} | יעד החזרה: ${d.return_date}`,
            location: d.address,
            driver_name: d.contractor,
            status: 'approved',
            warehouse: 'מכולות בשרון'
          }]);

          if (!orderError) isComplete = true;
        }
      } catch (e) { console.error("Error", e); }
    }

    // 6. עדכון זיכרון
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: isComplete ? `✅ בוס, המשימה בוצעה! יעד החזרה: ${JSON.parse(replyText.match(/\{.*\}/s)![0]).return_date} 🚀` : replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
