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

  // --- הגנות בסיס - חוקי ראמי ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפה ויצירת משתמש אם חסר
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה") history = "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. בניית ה-Prompt עם דגש על JSON קשיח להזרקה
    const prompt = `
      זהות: העוזר של ראמי. קצר (מילה-שתיים).
      סדר עץ: 1. לקוח? 2. כתובת? 3. מחסן? 4. נהג?
      
      היסטוריה: ${localUpdatedHistory}

      חוק הזרקה (קריטי):
      אם המשתמש נתן נהג (חכמת/עלי), ענה "הוזרק ללוח. 🚀" וחייב להוסיף JSON כזה:
      DATA_START{"complete": true, "client": "שם הלקוח", "address": "הכתובת", "branch": "המחסן", "driver": "שם הנהג"}DATA_END
    `;

    // 3. רוטציית מודלים
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

    // 4. חילוץ נתונים והזרקה פיזית ללוח
    if (replyText.includes('complete": true') || replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          // הזרקה לטבלת orders
          const { error: insertError } = await supabase.from('orders').insert([{
            client_info: d.client,
            location: d.address,
            source_branch: d.branch,
            driver_name: d.driver,
            order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            delivery_date: new Date().toISOString().split('T')[0]
          }]);

          if (!insertError) {
            finalReply = "הוזרק ללוח. 🚀";
            isComplete = true;
          }
        }
      } catch (e) { console.error("JSON Parse Error", e); }
    }

    // 5. עדכון זיכרון (איפוס אם הוזרק, אחרת צבירה)
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, תקלה בביצוע. נסה שוב." });
  }
}
