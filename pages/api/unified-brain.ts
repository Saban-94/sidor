import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'admin';

  // 1. ניהול זיכרון
  let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
  let history = memory?.accumulated_knowledge || "";
  
  // איפוס במידת הצורך
  if (cleanMsg === "הזמנה חדשה" || cleanMsg === "מכולה חדשה") history = "";
  const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

  // 2. ה-Prompt המאוחד (שני המוחות באחד)
  const prompt = `
    זהות: מפקח העל של סבן חומרי בניין.
    משימה: לזהות אם המשתמש רוצה "הזמנת הובלה" או "ניהול מכולה" ולבצע צ'ק-אין בשיטת פינג-פונג.

    מסלול א' - הובלת חומרי בניין:
    עץ שאלות: לקוח -> כתובת -> מחסן (החרש/התלמיד) -> תאריך ושעה -> נהג (חכמת/עלי).
    סיום: DATA_START{"type": "ORDER", "client": "שם", "address": "כתובת", "driver": "שם", "time": "HH:mm", "date": "YYYY-MM-DD"}DATA_END

    מסלול ב' - ניהול מכולות:
    עץ שאלות: לקוח -> כתובת -> פעולה (הצבה/החלפה/הוצאה) -> מחסן (שארק/כראדי/שי שרון) -> תאריך ושעה.
    סיום: DATA_START{"type": "CONTAINER", "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "שם", "date": "YYYY-MM-DD", "time": "HH:mm"}DATA_END

    חוקים:
    - שאל רק שאלה אחת בכל פעם.
    - אם המשתמש אמר "הזמנה" או "נהג", לך למסלול א'.
    - אם המשתמש אמר "מכולה", לך למסלול ב'.
    - היסטוריה נוכחית: ${localUpdatedHistory}
  `;

  // 3. קריאה ל-Gemini (רוטציית מודלים)
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  const replyText = data.candidates[0].content.parts[0].text.trim();

  // 4. לוגיקת הזרקה מפוצלת
  let isComplete = false;
  if (replyText.includes('DATA_START')) {
    const d = JSON.parse(replyText.match(/\{.*\}/s)![0]);
    
    if (d.type === "ORDER") {
      // הזרקה ללוח הובלות (חכמת/עלי)
      await supabase.from('orders').insert([{
        client_info: d.client, location: d.address, driver_name: d.driver, order_time: d.time, delivery_date: d.date
      }]);
    } else {
      // הזרקה ללוח מכולות (שארק/כראדי)
      await supabase.from('container_management').insert([{
        client_name: d.client, delivery_address: d.address, action_type: d.action, contractor_name: d.contractor, start_date: d.date, order_time: d.time, is_active: d.action !== 'REMOVAL'
      }]);
    }
    isComplete = true;
  }

  // 5. עדכון זיכרון והחזרת תשובה
  await supabase.from('customer_memory').update({ accumulated_knowledge: isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}` }).eq('clientId', phone);
  return res.status(200).json({ reply: replyText });
}
