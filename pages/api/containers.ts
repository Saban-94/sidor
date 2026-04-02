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

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון + מצב שטח נוכחי (מכולות פעילות)
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. הפרומפט הטקטי - חוקי הפינג-פונג והשטח (ללא שינוי דינמיקה)
    const prompt = `
      זהות: מפקח מכולות חכם של סבן. סגנון: קצר, חד וממוקד עמודות.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      שטח נוכחי (מכולות אצל לקוחות): ${JSON.stringify(activeContainers)}
      היסטוריית שיחה: ${localUpdatedHistory}

      חוקי ה"פינג-פונג" (קריטי):
      1. שאל שאלה אחת בלבד בכל פעם לפי סדר העץ.
      2. אל תעבור לשאלה הבאה עד שהמשתמש סיפק תשובה ברורה לנתון הנוכחי.
      3. אם המשתמש נתן כמה פרטים במכה, חלץ אותם ושאל רק על מה שחסר.

      עץ שאלות לפי עמודות:
      1. מי הלקוח? (client_name)
      2. מה הכתובת המדויקת? (delivery_address)
      3. סוג פעולה: הצבה 🟢, החלפה ♻️ או הוצאה 🔴? (action_type)
      4. מחסן מבצע: שארק 30, כראדי 32 או שי שרון 40? (contractor_name)
      5. תאריך ושעה לביצוע? (date + time)

      חוקי פיקוח שטח:
      - במידה וצוינה כתובת שקיימת ב"שטח נוכחי", עצור ושאל: "בוס, יש שם מכולה כבר X ימים. לבצע החלפה או להוסיף עוד אחת?"
      - אם המכולה בשטח מעל 9 ימים, הצע אקטיבית לבצע "הוצאה" או "החלפה".

      סיום הזרקה: רק כשכל 5 השאלות נענו, ענה "בוצע 🚀" והוסף JSON מדויק:
      DATA_START{
        "complete": true,
        "client": "שם",
        "address": "כתובת",
        "action": "PLACEMENT/EXCHANGE/REMOVAL",
        "contractor": "שם הקבלן",
        "date": "YYYY-MM-DD",
        "time": "HH:mm"
      }DATA_END
    `;

    // 3. הרצה מול Gemini
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

    // 4. הזרקה חזקה - עדכון ה-Database ולוח ה-LIVE (Orders) בזמן אמת
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          // א. ניקוי מכולות קודמות במידת הצורך
          if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }

          // ב. הזרקה לניהול המכולות
          const { error: containerErr } = await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            action_type: d.action,
            contractor_name: d.contractor,
            start_date: d.date,
            order_time: d.time,
            status: 'approved',
            is_active: d.action !== 'REMOVAL'
          }]);

          // ג. הזרקה ללוח המשימות LIVE (טבלת orders) - כדי שיקפוץ בדשבורד מיד
          const { error: orderErr } = await supabase.from('orders').insert([{
            client_info: `מכולה: ${d.client} (${d.action === 'PLACEMENT' ? 'הצבה' : d.action === 'EXCHANGE' ? 'החלפה' : 'הוצאה'})`,
            location: d.address,
            order_time: d.time,
            delivery_date: d.date,
            driver_name: d.contractor,
            status: 'approved',
            warehouse: 'מכולות'
          }]);

          if (!containerErr && !orderErr) isComplete = true;
        }
      } catch (e) { console.error("Injection Error", e); }
    }

    // 5. עדכון זיכרון וסגירת מעגל
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    const finalReply = isComplete ? `בוס, המשימה הוזרקה בהצלחה לניהול ולדשבורד! 🚀` : replyText;

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
