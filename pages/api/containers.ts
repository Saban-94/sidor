import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// --- בלוק 1: חיבור למסד הנתונים ---
// כאן אנחנו מגדירים את החיבור ל-Supabase כדי שנוכל לקרוא ולכתוב נתונים.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  // בדיקות תקינות ראשוניות
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, ההודעה ריקה." });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר מפתח API." });

  // --- בלוק 2: מאגר המודלים של AI ---
  // הגדרת סדר העבודה של המודלים - אם אחד נכשל, עוברים לבא בתור.
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // --- בלוק 3: שליפת זיכרון שיחה ונתוני שטח ---
    // המערכת נזכרת על מה דיברנו קודם ובודקת אילו מכולות מוצבות כרגע בשטח.
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    // --- בלוק 4: תחקיר לקוח והיסטוריית פעולות ---
    // כאן המוח בודק אם הלקוח כבר קיים במערכת ומה הייתה הפעולה האחרונה שלו.
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
        lastActionInfo = `נמצא לקוח: ${lastOrder.client_name}. פעולה אחרונה: ${lastOrder.action_type} בכתובת ${lastOrder.delivery_address}.`;
      }
    }

    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // --- בלוק 5: הנחיות למפקח (הפרומפט) ---
    // הגדרת האישיות של ה-AI, חוקי הפינג-פונג, ואיסור ערבוב קבלנים.
    const prompt = `
      זהות: חכם של מכולות פינוי פסולת בשרון. סגנון: קצר, חד ומעוצב UI/UX.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      חוקי ברזל:
      1. שאל שאלה אחת בלבד בכל פעם לפי סדר העץ.
      2. אם נמצא לקוח (${foundClientName}), שאל לגביו בחוכמה.
      3. איסור ערבוב: אם בכתובת יש מכולה של קבלן מסוים, רק הוא רשאי להחליף או להוציא.
      4. גודל מכולה קבוע: 8 קוב. אל תשאל על גודל.
      5. בלי כוכביות (**), טקסט נקי בלבד.

      עץ שאלות: 1. לקוח -> 2. כתובת -> 3. פעולה -> 4. קבלן -> 5. זמן.
      
      DATA_START{"complete": true, "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "קבלן", "date": "YYYY-MM-DD", "time": "HH:mm", "size": "8 קוב"}DATA_END
    `;

    // --- בלוק 6: פנייה לבינה המלאכותית ---
    // שליחת הנתונים ל-Gemini וקבלת התשובה החכמה.
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

    // --- בלוק 7: הזרקה כפולה (Double Injection) ---
    // ברגע שהפקודה הושלמה, אנחנו מעדכנים את טבלת המכולות ואת לוח המשימות (Orders) בו-זמנית.
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);

          // א. בדיקת בעלות קבלן למניעת טעויות
          const currentOwner = activeContainers?.find(c => c.delivery_address.includes(d.address))?.contractor_name;
          if ((d.action === 'EXCHANGE' || d.action === 'REMOVAL') && currentOwner && currentOwner !== d.contractor) {
             return res.status(200).json({ reply: `❌ המכולה בכתובת זו שייכת ל${currentOwner}. ${d.contractor} לא מורשה לגעת בה.` });
          }

          // ב. הזרקה לטבלת ניהול מכולות
          await supabase.from('container_management').insert([{
            client_name: d.client, delivery_address: d.address, action_type: d.action,
            contractor_name: d.contractor, container_size: d.size, start_date: d.date,
            order_time: d.time, status: 'approved', is_active: d.action !== 'REMOVAL'
          }]);

          // ג. הזרקה ללוח ה-Orders (כדי שיופיע ב-Master Dashboard)
          await supabase.from('orders').insert([{
            client_info: `מכולה: ${d.client} (${d.action === 'PLACEMENT' ? 'הצבה' : d.action === 'EXCHANGE' ? 'החלפה' : 'הוצאה'})`,
            location: d.address, order_time: d.time, delivery_date: d.date, 
            driver_name: d.contractor, status: 'approved', warehouse: 'מכולות'
          }]);

          isComplete = true;
        }
      } catch (e) { console.error("Injection Error", e); }
    }

    // --- בלוק 8: עדכון זיכרון וסיום ---
    // שמירת ההיסטוריה או ניקוי שלה אם המשימה בוצעה בהצלחה.
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: isComplete ? "✅ בוס, המשימה עודכנה בלוח המשימות ובניהול המכולות! 🚀" : replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף לרגע. נסה שוב." });
  }
}
