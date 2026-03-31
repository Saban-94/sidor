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
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח." });

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

    // פריסת לוגיקה חכמה שמפרידה בין מכולה להובלה
    const prompt = `
      זהות: העוזר האישי של ראמי מסבן.
      תפקיד: זיהוי אם מדובר ב"הובלת חומרים" או "הצבת מכולה".

      חוקי ענפים:
      1. אם מדובר במכולה: הנהג הוא הקבלן המבצע (למשל: שארק 30, כראדי 32,שי שרון 40). אל תשאל על חכמת/עלי.
      2. אם מדובר בחומרי בניין: הנהג חייב להיות חכמת או עלי.

      עץ שאלות:
      - לקוח? כתובת? תאריך ושעה?
      - אם מכולה: מי הקבלן המבצע?
      - אם חומרים: איזה נהג (חכמת/עלי)?

      היסטוריה: ${localUpdatedHistory}

      חוק הזרקה:
      DATA_START{
        "type": "CONTAINER" או "ORDER",
        "client": "שם",
        "address": "כתובת",
        "date": "YYYY-MM-DD",
        "time": "HH:mm",
        "executor": "שם הנהג או הקבלן"
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
        
        if (d.type === "CONTAINER") {
          // הזרקה לטבלת מכולות
          await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            start_date: d.date,
            order_time: d.time,
            contractor_name: d.executor,
            is_active: true,
            status: 'delivered'
          }]);
        } else {
          // הזרקה לטבלת הובלות
          await supabase.from('orders').insert([{
            client_info: d.client,
            location: d.address,
            delivery_date: d.date,
            order_time: d.time,
            driver_name: d.executor,
            status: 'approved'
          }]);
        }
        finalReply = `בוס, הזמנת ${d.type === 'CONTAINER' ? 'מכולה' : 'חומרים'} ל-${d.client} הוזרקה ללוח של ${d.executor}. 🚀`;
        isComplete = true;
      }
    }

    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });
  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
