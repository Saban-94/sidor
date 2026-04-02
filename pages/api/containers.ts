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
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ... (בדיקות API Key והודעה ריקה - ללא שינוי) ...

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון ומצב שטח נוכחי (ללא שינוי)
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);

    // --- חדש: בדיקת היסטוריית לקוח ופעולה אחרונה ---
    // ננסה לחלץ שם לקוח מההודעה הנוכחית או מהזיכרון כדי לבצע חיפוש
    const clientNameFromMsg = cleanMsg.match(/של\s+([^,]+)|לקוח\s+([^,]+)/)?.[1] || "";
    let lastActionInfo = "אין היסטוריה קודמת ללקוח זה.";
    
    if (clientNameFromMsg) {
      const { data: lastOrder } = await supabase
        .from('container_management')
        .select('action_type, start_date, delivery_address')
        .ilike('client_name', `%${clientNameFromMsg}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastOrder) {
        lastActionInfo = `היסטוריה: פעולה אחרונה של ${clientNameFromMsg} הייתה ${lastOrder.action_type} בכתובת ${lastOrder.delivery_address} בתאריך ${lastOrder.start_date}.`;
      }
    }
    // -------------------------------------------

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. הפרומפט הטקטי - הזרקתי את lastActionInfo פנימה
    const prompt = `
      זהות: מפקח מכולות חכם של סבן. סגנון: קצר, חד וממוקד עמודות.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      מידע שטח (מכולות פעילות): ${JSON.stringify(activeContainers)}
      ${lastActionInfo}  <-- נתון היסטורי שהתווסף
      
      חוקי ה"פינג-פונג":
      1. שאל שאלה אחת בלבד לפי סדר העץ.
      2. אם הלקוח קיים והפעולה האחרונה הייתה "הצבה", הצע לו בחוכמה לבצע "החלפה" או "הוצאה".
      3. אל תעבור לשאלה הבאה עד שהמשתמש סיפק תשובה ברורה.

      עץ שאלות:
      1. מי הלקוח? (חפש בהיסטוריה שצוינה אם זה אותו אחד)
      2. כתובת מדויקת?
      3. פעולה: הצבה/החלפה/הוצאה?
      4. קבלן: שארק 30/כראדי 32/שי שרון 40?
      5. תאריך ושעה?

      חוקים גלובליים:
      - גודל מכולה: תמיד 8 קוב. אל תשאל על גודל.
      
      סיום הזרקה:
      DATA_START{"complete": true, "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "קבלן", "date": "YYYY-MM-DD", "time": "HH:mm", "size": "8 קוב"}DATA_END
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
