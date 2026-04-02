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

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API." });

  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון ומצב שטח נוכחי
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    // 2. תחקיר היסטוריה (למציאת לקוח קיים)
    let lastActionInfo = "אין היסטוריה קודמת.";
    let foundClientName = "";
    const potentialNames = cleanMsg.replace(/[?!,.]/g, '').split(' ').filter(w => w.length > 2);
    
    if (potentialNames.length > 0) {
      const { data: lastOrder } = await supabase
        .from('container_management')
        .select('client_name, action_type, start_date, delivery_address, contractor_name')
        .or(potentialNames.map(name => `client_name.ilike.%${name}%`).join(','))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastOrder) {
        foundClientName = lastOrder.client_name;
        lastActionInfo = `נמצא לקוח: ${lastOrder.client_name}. פעולה אחרונה: ${lastOrder.action_type} בכתובת ${lastOrder.delivery_address} עם ${lastOrder.contractor_name}.`;
      }
    }

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 3. הפרומפט המעודכן - זהות, חוקים ו-UI/UX
    const prompt = `
      זהות: חכם של מכולות פינוי פסולת בשרון. סגנון: קצר, חד וממוקד עמודות.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      שטח נוכחי (מכולות פעילות): ${JSON.stringify(activeContainers)}
      היסטוריית לקוח שנמצאה: ${lastActionInfo}
      היסטוריית שיחה: ${localUpdatedHistory}

      חוקי ה"פינג-פונג" (קריטי):
      1. שאל שאלה אחת בלבד בכל פעם לפי סדר העץ.
      2. אם נמצא לקוח בהיסטוריה (${foundClientName}), שאל: "בוס, מצאתי את ${foundClientName}, לבצע עבורו את הפעולה?"
      3. אל תמציא כתובת! אם המשתמש לא סיפק כתובת ברורה בשיחה, שאל עליה.
      4. אל תבצע הזרקה (DATA_START) עד שכל 5 השאלות נענו בבירור.
      5. אל תשתמש בסימון כוכביות (**) בטקסט בכלל.
      6. עיצוב UI/UX: השתמש באימוג'ים מתאימים, שורות קצרות ורווחים נקיים.

      עץ שאלות:
      1. מי הלקוח?
      2. מה הכתובת המדויקת?
      3. סוג פעולה: הצבה 🟢, החלפה ♻️ או הוצאה 🔴?
      4. מחסן מבצע: שארק 30, כראדי 32 או שי שרון 40? (חוק: קבלן לא נוגע במכולה של קבלן אחר!)
      5. תאריך ושעה לביצוע?

      חוקים גלובליים:
      - גודל מכולה: כל המכולות הן 8 קוב. אל תשאל על גודל.
      - איסור ערבוב: אם בכתובת קיימת מכולה של קבלן מסוים, רק הוא יכול לבצע החלפה או הוצאה.

      סיום הזרקה (JSON):
      DATA_START{
        "complete": true,
        "client": "שם",
        "address": "כתובת",
        "action": "PLACEMENT/EXCHANGE/REMOVAL",
        "contractor": "קבלן",
        "date": "YYYY-MM-DD",
        "time": "HH:mm",
        "size": "8 קוב"
      }DATA_END
    `;

    // 4. הרצה מול Gemini
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates[0].content.parts[0].text.trim();
        if (replyText) break;
      } catch (e) { continue; }
    }

    let isComplete = false;

    // 5. הזרקה כפולה (ניהול + דשבורד LIVE)
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);

          // הגנה תוכנתית על בעלות קבלן
          const currentOwner = activeContainers?.find(c => c.delivery_address.includes(d.address))?.contractor_name;
          if ((d.action === 'EXCHANGE' || d.action === 'REMOVAL') && currentOwner && currentOwner !== d.contractor) {
             return res.status(200).json({ reply: `❌ שלילי בוס. המכולה בכתובת זו שייכת ל${currentOwner}. ${d.contractor} לא מורשה לגעת בה.` });
          }
          
          if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }

          const { error: containerErr } = await supabase.from('container_management').insert([{
            client_name: d.client, delivery_address: d.address, action_type: d.action,
            contractor_name: d.contractor, container_size: d.size, start_date: d.date,
            order_time: d.time, status: 'approved', is_active: d.action !== 'REMOVAL'
          }]);

          const { error: orderErr } = await supabase.from('orders').insert([{
            client_info: `מכולה: ${d.client} (${d.action})`, location: d.address,
            order_time: d.time, delivery_date: d.date, driver_name: d.contractor,
            status: 'approved', warehouse: 'מכולות'
          }]);

          if (!containerErr && !orderErr) isComplete = true;
        }
      } catch (e) { console.error("Injection Error", e); }
    }

    // 6. עדכון זיכרון
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    const finalReply = isComplete ? `✅ המשימה הוזרקה בהצלחה לניהול ולדשבורד ה-LIVE! 🚀` : replyText;
    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
