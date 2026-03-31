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
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה" || cleanMsg === "חדש") history = "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    const prompt = `
      זהות: העוזר האישי של ראמי מסבן חומרי בניין. סגנון: קצר, מקצועי, תכליתי.
      
      עץ שאלות חובה (לפי הסדר):
      1. מי הלקוח?
      2. מה הכתובת למשלוח?
      3. מאיזה מחסן (החרש/התלמיד)?
      4. באיזה תאריך האספקה (בפורמט DD/MM/YYYY)?
      5. באיזו שעה (למשל 08:30)?
      6. איזה נהג (חכמת/עלי)?

      היסטוריה: ${localUpdatedHistory}

      חוק הזרקה:
      רק לאחר שכל הפרטים קיימים, הוסף:
      DATA_START{
        "complete": true, 
        "client": "שם", 
        "address": "כתובת", 
        "branch": "מחסן", 
        "date": "DD/MM/YYYY", 
        "time": "HH:mm", 
        "driver": "נהג"
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
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text.trim();
          break;
        }
      } catch (e) { continue; }
    }

    let finalReply = replyText || "בוס, המוח קצת עמוס. נסה שוב.";
    let isComplete = false;

    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          // --- נרמול תאריך לפורמט Database (YYYY-MM-DD) ---
          let formattedDate = new Date().toISOString().split('T')[0];
          if (d.date && d.date.includes('/')) {
            const [day, month, year] = d.date.split('/');
            formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }

          // --- עיגול שעה למשבצות 00/30 ---
          let finalTime = d.time || "08:00";
          if (finalTime.includes(':')) {
            const [h, m] = finalTime.split(':');
            const roundedMin = parseInt(m) < 30 ? '00' : '30';
            finalTime = `${h.padStart(2, '0')}:${roundedMin}`;
          }

          const { error: insertError } = await supabase.from('orders').insert([{
            client_info: d.client,
            location: d.address,
            source_branch: d.branch,
            driver_name: d.driver?.trim(),
            order_time: finalTime,
            delivery_date: formattedDate,
            status: 'approved' // הזרקה ישירה ל-LIVE
          }]);

          if (!insertError) {
            finalReply = `בוס, הזמנה ל-${d.client} הוזרקה ללוח ליום ${d.date} לשעה ${finalTime}. 🚀`;
            isComplete = true;
          }
        }
      } catch (e) { console.error("Parse Error", e); }
    }

    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף לרגע. נסה שוב." });
  }
}
