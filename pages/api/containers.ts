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

    // 1. שליפת זיכרון ומצב שטח נוכחי
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    // 2. תחקיר מקדים: האם הלקוח קיים ומה הפעולה האחרונה שלו?
    const clientNameMatch = cleanMsg.match(/(?:של\s+|לקוח\s+)([א-ת\s]+?)(?=\s|$)/);
    const searchedClient = clientNameMatch ? clientNameMatch[1].trim() : "";
    let lastActionInfo = "אין היסטוריה קודמת מתועדת ללקוח זה בשיחה הנוכחית.";
    
    if (searchedClient) {
      const { data: lastOrder } = await supabase
        .from('container_management')
        .select('action_type, start_date, delivery_address')
        .ilike('client_name', `%${searchedClient}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastOrder) {
        lastActionInfo = `תחקיר מפקח: לקוח זה ביצע ${lastOrder.action_type} בכתובת ${lastOrder.delivery_address} בתאריך ${lastOrder.start_date}.`;
      }
    }

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 3. הפרומפט הטקטי - חוקי הברזל, הפינג-פונג והזרקת ההיסטוריה
    const prompt = `
      זהות: מפקח מכולות חכם של סבן. סגנון: קצר, חד וממוקד עמודות.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      שטח נוכחי (מכולות פעילות): ${JSON.stringify(activeContainers)}
      היסטוריה: ${lastActionInfo}

      חוקי ה"פינג-פונג" (קריטי):
      1. שאל שאלה אחת בלבד בכל פעם לפי סדר העץ.
      2. אם הלקוח קיים והפעולה האחרונה הייתה "הצבה", הצע לו בחוכמה לבצע "החלפה" או "הוצאה".
      3. אל תעבור לשאלה הבאה עד שהמשתמש סיפק תשובה ברורה.

      עץ שאלות:
      1. מי הלקוח? (בדוק אם צוין בהיסטוריה)
      2. כתובת מדויקת?
      3. סוג פעולה: הצבה/החלפה/הוצאה?
      4. קבלן: שארק 30, כראדי 32 או שי שרון 40?
      5. תאריך ושעה?

      חוקים גלובליים:
      - גודל מכולה: כל המכולות בסבן הן 8 קוב בלבד. אל תשאל על גודל.
      - במידה וצוינה כתובת שקיימת ב"שטח נוכחי", עצור ושאל לגבי כפילות.

      סיום הזרקה: רק כשכל 5 השאלות נענו, ענה "בוצע 🚀" והוסף JSON מדויק:
      DATA_START{
        "complete": true,
        "client": "שם",
        "address": "כתובת",
        "action": "PLACEMENT/EXCHANGE/REMOVAL",
        "contractor": "שם הקבלן",
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

    // 5. הזרקה כפולה חזקה (ניהול + דשבורד LIVE)
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }

          const { error: containerErr } = await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            action_type: d.action,
            contractor_name: d.contractor,
            container_size: d.size,
            start_date: d.date,
            order_time: d.time,
            status: 'approved',
            is_active: d.action !== 'REMOVAL'
          }]);

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

    // 6. עדכון זיכרון
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    const finalReply = isComplete ? `בוס, המשימה נקלטה! הזרקתי לניהול ולדשבורד. 🚀` : replyText;

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
