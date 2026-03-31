import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (GEMINI_API_KEY)." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    const prompt = `
      זהות: העוזר האישי של ראמי מסבן (Saban OS).
      תפקיד: סיווג והזרקת נתונים ל-3 מחלקות:
      1. ORDER (חומרי בניין): מחייב נהג (חכמת/עלי).
      2. CONTAINER (מכולות): מחייב קבלן מבצע (שארק 30/כראדי 32/שי שרון 40).
      3. TRANSFER (העברה בין סניפים): מחייב סניף מקור ויעד (החרש/התלמיד) ונהג.

      חוקים קריטיים:
      - אם המשתמש הזכיר "מכולה" או "הצבה,החלפה,הוצאה ממחסן שארק/כראדי/שי שרון" -> סווג כ-CONTAINER.
      - אם המשתמש הזכיר "העברה", "סניף" או "מהחרש לתלמיד" -> סווג כ-TRANSFER.
      - אחרת -> סווג כ-ORDER.

      עץ שאלות חסר:
      - בקש פרטים שחסרים (לקוח, כתובת, תאריך YYYY-MM-DD, שעה HH:mm, מבצע).

      היסטוריה: ${localUpdatedHistory}

      חוק הזרקה:
      DATA_START{
        "type": "ORDER" | "CONTAINER" | "TRANSFER",
        "client": "שם הלקוח/פרויקט",
        "address": "כתובת מלאה",
        "date": "YYYY-MM-DD",
        "time": "HH:mm",
        "executor": "שם נהג או שם קבלן מכולות",
        "from_branch": "החרש/התלמיד (רק להעברות)",
        "to_branch": "החרש/התלמיד (רק להעברות)"
      }DATA_END
    `;

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

    let finalReply = replyText;
    let isComplete = false;

    if (replyText.includes('DATA_START')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        const d = JSON.parse(jsonMatch[0]);
        
        // נרמול תאריך ללוח (למניעת 404 ותצוגה ריקה)
        const dbDate = d.date;

        if (d.type === "CONTAINER") {
          // הזרקה כפולה: 1. לניהול מכולות (תקופת שכירות) 2. ללוח המשימות הכללי
          await Promise.all([
            supabase.from('container_management').insert([{
              client_name: d.client,
              delivery_address: d.address,
              start_date: dbDate,
              order_time: d.time,
              contractor_name: d.executor,
              is_active: true,
              status: 'delivered'
            }]),
            supabase.from('orders').insert([{
              client_info: `מכולה: ${d.client}`,
              location: d.address,
              delivery_date: dbDate,
              order_time: d.time,
              driver_name: d.executor,
              status: 'approved'
            }])
          ]);
        } 
        else if (d.type === "TRANSFER") {
          // הזרקה לטבלת העברות
          await supabase.from('transfers').insert([{
            from_branch: d.from_branch,
            to_branch: d.to_branch,
            transfer_date: dbDate,
            transfer_time: d.time,
            driver_name: d.executor,
            status: 'approved'
          }]);
        } 
        else {
          // הזרקה להזמנות חומרים רגילות
          await supabase.from('orders').insert([{
            client_info: d.client,
            location: d.address,
            delivery_date: dbDate,
            order_time: d.time,
            driver_name: d.executor,
            status: 'approved'
          }]);
        }

        finalReply = `בוס, משימת ${d.type} עבור ${d.client || d.to_branch} הוזרקה ללוח של ${d.executor} לשעה ${d.time}. 🚀`;
        isComplete = true;
      }
    }

    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });
  } catch (e) {
    console.error("Brain Error:", e);
    return res.status(200).json({ reply: "בוס, המוח התעייף לרגע. נסה שוב." });
  }
}
