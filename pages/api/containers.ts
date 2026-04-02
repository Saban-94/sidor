import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// --- בלוק 1: חיבור למסד הנתונים ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, ההודעה ריקה." });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר מפתח API." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // --- בלוק 2: שליפת זיכרון ונתוני שטח ---
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    // --- בלוק 3: תחקיר היסטוריה וזיהוי לקוח ---
    let lastActionInfo = "אין היסטוריה קודמת.";
    let foundClientName = "";
    const searchTerms = cleanMsg.replace(/הלקוח|של|זה|הוא/g, '').trim().split(' ').filter(w => w.length > 2);
    
    if (searchTerms.length > 0) {
      const { data: lastOrder } = await supabase
        .from('container_management')
        .select('client_name, action_type, delivery_address, contractor_name')
        .or(searchTerms.map(t => `client_name.ilike.%${t}%`).join(','))
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();

      if (lastOrder) {
        foundClientName = lastOrder.client_name;
        lastActionInfo = `נמצא לקוח: ${lastOrder.client_name}. כתובת אחרונה: ${lastOrder.delivery_address}.`;
      }
    }

    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // --- בלוק 4: הנחיות למפקח (כולל חוק 10 הימים) ---
    const prompt = `
      זהות: חכם של מכולות פינוי פסולת בשרון. סגנון: קצר וחד.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      חוק השכירות (חדש):
      - תקופת שכירות מקסימלית היא 10 ימים. 
      - בכל הצבה (PLACEMENT) או החלפה (EXCHANGE), עליך לחשב תאריך יעד לסיום (תאריך הביצוע + 10 ימים).
      - ציין למשתמש במעמד ההזמנה: "מועד סיום שכירות צפוי: [תאריך]".

      חוקי ה"פינג-פונג":
      1. שאל שאלה אחת בלבד בכל פעם.
      2. אם נמצא לקוח (${foundClientName}), הצע להמשיך איתו.
      3. איסור ערבוב: רק הקבלן שהציב יכול להחליף/להוציא.
      4. גודל מכולה: תמיד 8 קוב.

      עץ שאלות: 1. לקוח -> 2. כתובת -> 3. פעולה -> 4. קבלן -> 5. זמן.
      
      בסיום, הזרק JSON עם שדה "return_date" (התאריך של עוד 10 ימים):
      DATA_START{"complete": true, "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "קבלן", "date": "YYYY-MM-DD", "time": "HH:mm", "return_date": "YYYY-MM-DD"}DATA_END
    `;

    // --- בלוק 5: פנייה ל-AI ---
    let replyText = "";
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

    // --- בלוק 6: הזרקה כפולה מותאמת עמודות ---
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);

          // א. ניקוי מכולות ישנות
          if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }

          // ב. הזרקה לניהול מכולות (כולל עמודת מועד החזרה)
          await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            action_type: d.action,
            contractor_name: d.contractor,
            start_date: d.date,
            order_time: d.time,
            return_deadline: d.return_date, // הזרקה לעמודה החדשה
            is_active: d.action !== 'REMOVAL',
            status: 'approved'
          }]);

          // ג. הזרקה לטבלת ORDERS (התאמה לעמודות קיימות)
          await supabase.from('orders').insert([{
            order_number: Math.floor(Math.random() * 9000) + 1000,
            client_info: `📦 מכולה: ${d.client} | ${d.action} | סיום צפוי: ${d.return_date}`,
            location: d.address,
            order_time: d.time,
            delivery_date: d.date,
            driver_name: d.contractor,
            status: 'approved',
            warehouse: 'מכולות'
          }]);

          isComplete = true;
        }
      } catch (e) { console.error("Injection Error", e); }
    }

    // --- בלוק 7: עדכון זיכרון ---
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: isComplete ? `✅ המשימה הוזרקה! מועד החזרה צפוי: ${JSON.parse(replyText.match(/\{.*\}/s)![0]).return_date} 🚀` : replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
