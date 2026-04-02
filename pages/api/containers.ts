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

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API." });

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

    // --- בלוק 3: תחקיר היסטוריה (זיהוי לקוח קיים) ---
    let lastActionInfo = "אין היסטוריה קודמת.";
    let foundClientName = "";
    const searchTerms = cleanMsg.replace(/הלקוח|של|זה|הוא/g, '').trim().split(' ').filter(w => w.length > 2);
    
    if (searchTerms.length > 0) {
      const { data: lastOrder } = await supabase
        .from('container_management')
        .select('*')
        .or(searchTerms.map(t => `client_name.ilike.%${t}%`).join(','))
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();

      if (lastOrder) {
        foundClientName = lastOrder.client_name;
        lastActionInfo = `נמצא לקוח: ${lastOrder.client_name}. כתובת אחרונה: ${lastOrder.delivery_address}. מועד סיום שכירות אחרון: ${lastOrder.return_deadline || 'לא הוגדר'}.`;
      }
    }

    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // --- בלוק 4: הנחיות למפקח (כולל חוק 10 הימים והזרקה ל-Orders) ---
    const prompt = `
      זהות: חכם של מכולות פינוי פסולת בשרון. סגנון: קצר, מנומס וחד.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      חוקים:
      1. שאל שאלה אחת בכל פעם לפי הסדר.
      2. חוק 10 ימים: חשב תאריך יעד (היום + 10 ימים) וציין אותו למשתמש.
      3. איסור ערבוב: רק הקבלן המקורי רשאי להחליף/להוציא בכתובת קיימת.
      4. גודל מכולה: תמיד 8 קוב.
      5. אל תשתמש בכוכביות (**).

      מידע שטח: ${JSON.stringify(activeContainers)}
      היסטוריה: ${lastActionInfo}

      עץ שאלות: 1. לקוח -> 2. כתובת -> 3. פעולה -> 4. קבלן -> 5. זמן.
      
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

    // --- בלוק 6: הזרקה כפולה מותאמת לטבלאות ---
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);

          // בדיקת בעלות קבלן
          const currentOwner = activeContainers?.find(c => c.delivery_address.includes(d.address))?.contractor_name;
          if ((d.action === 'EXCHANGE' || d.action === 'REMOVAL') && currentOwner && currentOwner !== d.contractor) {
             return res.status(200).json({ reply: `❌ המכולה בכתובת זו שייכת ל${currentOwner}. ${d.contractor} לא מורשה לגעת בה.` });
          }

          // א. הזרקה לניהול מכולות (Container Management)
          if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }
          await supabase.from('container_management').insert([{
            client_name: d.client, delivery_address: d.address, action_type: d.action,
            contractor_name: d.contractor, container_size: "8 קוב", start_date: d.date,
            order_time: d.time, return_deadline: d.return_date, status: 'approved', is_active: d.action !== 'REMOVAL'
          }]);

          // ב. הזרקה לטבלת ORDERS (התאמה לעמודות ה-SQL שלך)
          const { error: orderError } = await supabase.from('orders').insert([{
            order_number: Math.floor(Math.random() * 9000) + 1000,
            delivery_date: d.date,
            order_time: d.time,
            client_info: `📦 מכולה: ${d.client} | ${d.action} | יעד החזרה: ${d.return_date}`,
            location: d.address,
            driver_name: d.contractor,
            status: 'approved',
            warehouse: 'מכולות'
          }]);

          if (!orderError) isComplete = true;
        }
      } catch (e) { console.error("Error", e); }
    }

    // --- בלוק 7: עדכון זיכרון ---
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: isComplete ? `✅ בוס, המשימה עודכנה בדשבורד! מועד החזרה: ${JSON.parse(replyText.match(/\{.*\}/s)![0]).return_date} 🚀` : replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
