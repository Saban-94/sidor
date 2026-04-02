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

    // --- בלוק 1: שליפת נתונים וזיכרון ---
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    // --- בלוק 2: בדיקת כפילות בכתובת (חוק חסימת הצבה כפולה) ---
    let addressConflictWarning = "";
    const addressMatch = cleanMsg.match(/(?:ב|בכתובת\s+)([א-ת\s\d]+)(?=\s|$)/)?.[1]?.trim();
    
    if (addressMatch) {
      const existingInAddress = activeContainers?.filter(c => c.delivery_address.includes(addressMatch));
      if (existingInAddress && existingInAddress.length > 0 && !cleanMsg.includes("נוספת")) {
        addressConflictWarning = `⚠️ אזהרה: בכתובת זו כבר קיימת מכולה פעילה של ${existingInAddress[0].contractor_name}.`;
      }
    }

    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // --- בלוק 3: הפרומפט הטקטי המעודכן ---
    const prompt = `
      זהות: חכם של מכולות פינוי פסולת בשרון.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      חוק חסימת הצבה כפולה:
      - אם מצאת במידע השטח שיש כבר מכולה בכתובת: ${addressConflictWarning}
      - חובה לעצור ולשאול: "בוס, יש שם כבר מכולה. להוסיף מכולה נוספת לאותה כתובת או לבצע החלפה?"
      - אל תבצע הזרקה (DATA_START) אלא אם המשתמש כתב במפורש "מכולה נוספת".

      חוקים נוספים:
      - איסור ערבוב קבלנים: רק מי שהציב יכול להחליף/להוציא.
      - 10 ימי שכירות: תמיד חשב return_date (תאריך ביצוע + 10 ימים).
      - ללא כוכביות (**). טקסט נקי ומעוצב.

      מידע שטח: ${JSON.stringify(activeContainers)}
      היסטוריה: ${localUpdatedHistory}

      DATA_START{"complete": true, "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "קבלן", "date": "YYYY-MM-DD", "time": "HH:mm", "return_date": "YYYY-MM-DD"}DATA_END
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

    let isComplete = false;

    // --- בלוק 5: הזרקה כפולה מותאמת ללוח חומרי בניין (Orders) ---
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);

          // א. ניקוי מכולות ישנות (רק אם זו לא הצבה נוספת)
          if ((d.action === 'REMOVAL' || d.action === 'EXCHANGE') && !cleanMsg.includes("נוספת")) {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }

          // ב. הזרקה לניהול מכולות
          await supabase.from('container_management').insert([{
            client_name: d.client, delivery_address: d.address, action_type: d.action,
            contractor_name: d.contractor, start_date: d.date, order_time: d.time,
            return_deadline: d.return_date, is_active: d.action !== 'REMOVAL', status: 'approved'
          }]);

          // ג. הזרקה מותאמת לטבלת ORDERS (להצגה בלוח חומרי בניין)
          const { error: orderError } = await supabase.from('orders').insert([{
            order_number: Math.floor(Math.random() * 9000) + 1000,
            delivery_date: d.date,
            order_time: d.time,
            // עיצוב התיאור שיוצג בכרטיס
            client_info: `📦 מכולה | ${d.client} | ${d.action} | יעד: ${d.return_date}`,
            location: d.address,
            driver_name: d.contractor,
            status: 'approved',
            warehouse: 'מכולות' // סיווג המקור
          }]);

          if (!orderError) isComplete = true;
        }
      } catch (e) { console.error("Error", e); }
    }

    // --- בלוק 6: עדכון זיכרון ---
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: isComplete ? `✅ בוס, המשימה בוצעה והוזרקה ללוח! יעד החזרה: ${JSON.parse(replyText.match(/\{.*\}/s)![0]).return_date} 🚀` : replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
