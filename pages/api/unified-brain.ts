import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'admin';

  try {
    // 1. ניהול זיכרון
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הזמנה חדשה" || cleanMsg === "מכולה") history = "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. הפרומפט המאוחד - פינג פונג קשיח
    const prompt = `
      זהות: מפקח העל של סבן. שיטה: פינג-פונג.
      
      מסלול א' (הובלה): לקוח -> כתובת -> מחסן -> תאריך -> שעה -> נהג (חכמת/עלי).
      JSON סופי: {"type": "ORDER", "client": "שם", "address": "כתובת", "driver": "חכמת/עלי", "time": "HH:mm", "date": "YYYY-MM-DD"}

      מסלול ב' (מכולה): לקוח -> כתובת -> פעולה -> מחסן (שארק/כראדי) -> תאריך -> שעה.
      JSON סופי: {"type": "CONTAINER", "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "מחסן", "date": "YYYY-MM-DD", "time": "HH:mm"}

       מסלול ג' (העברה בין סניפים):
      זיהוי: מילים כמו "העברה", "מסניף לסניף", "מהחרש לתלמיד".
      עץ שאלות: מאיזה סניף? -> לאיזה סניף? -> איזה חומר/ציוד? -> תאריך ושעה -> נהג (עלי בלבד).
      
      חוק הזרקה למסלול ג':
      ב-JSON הסופי, שדה ה-client יהיה "העברה: [סניף מקבל]", וה-address יהיה שם הסניף.
      JSON: {"type": "ORDER", "client": "העברה: התלמיד", "address": "סניף התלמיד", "driver": "עלי", "time": "HH:mm", "date": "YYYY-MM-DD"}
      היסטוריה: ${localUpdatedHistory}
      חוק: רק בסיום ענה "בוצע 🚀" + JSON בתוך DATA_START ו-DATA_END.
    `;

    // 3. קריאה ל-Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
    });
    const data = await response.json();
    const replyText = data.candidates[0].content.parts[0].text.trim();

    let isComplete = false;
    if (replyText.includes('DATA_START')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        const d = JSON.parse(jsonMatch[0]);
        
        if (d.type === "ORDER") {
          // --- הזרקה ללוח הובלות (חומרי בניין) ---
          const { error } = await supabase.from('orders').insert([{
            client_info: d.client,
            location: d.address,
            driver_name: d.driver, // חכמת או עלי
            order_time: d.time,
            delivery_date: d.date,
            status: 'pending'
          }]);
          if (!error) isComplete = true;
        } else if (d.type === "CONTAINER") {
          // --- הזרקה ללוח מכולות ---
          const { error } = await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            action_type: d.action,
            contractor_name: d.contractor,
            start_date: d.date,
            order_time: d.time,
            is_active: d.action !== 'REMOVAL'
          }]);
          if (!error) isComplete = true;
        }
      }
    }

    // 4. עדכון זיכרון
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText });

  } catch (e) { return res.status(200).json({ reply: "בוס, תקלה בהזרקה." }); }
}
