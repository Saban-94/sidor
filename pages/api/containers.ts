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

  // רשימת המודלים - ללא שינוי כפי שביקשת
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. הפרומפט המקורי (עץ השאלות) - ללא שינוי
    const prompt = `
      זהות: המוח של ח. סבן (ניהול מכולות).
      תפקיד: חילוץ נתוני מכולות בפורמט JSON.
      
      חוקים:
      1. אם חסר נתון (לקוח/כתובת/פעולה/קבלן) - תשאל בנימוס ואל תזריק.
      2. פעולות: PLACEMENT (הצבה), EXCHANGE (החלפה), REMOVAL (הוצאה).
      3. קבלנים: שארק 30, כראדי 32, שי שרון 40.

      היסטוריה: ${localUpdatedHistory}

      במידה והכל נמצא, הזרק:
      DATA_START{
        "action": "PLACEMENT" | "EXCHANGE" | "REMOVAL",
        "client": "שם הלקוח",
        "address": "כתובת מדויקת",
        "contractor": "שם הקבלן",
        "size": "8 קוב / 10 קוב",
        "date": "YYYY-MM-DD",
        "time": "HH:mm"
      }DATA_END
    `;

    // 3. הרצה מול ה-Model Pool
    let replyText = "";
    let success = false;

    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates[0].content.parts[0].text.trim();
        if (replyText) { success = true; break; }
      } catch (e) { continue; }
    }

    if (!success) throw new Error("Models failed");

    let isComplete = false;

    // 4. הזרקה כפולה (Container Management + Orders Dashboard)
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          // א. כיבוי מכולות ישנות בכתובת הזו
          if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }

          // ב. הזרקה לניהול מכולות
          const { error: insertError } = await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            action_type: d.action,
            contractor_name: d.contractor,
            container_size: d.size,
            start_date: d.date || new Date().toISOString().split('T')[0],
            order_time: d.time || "08:00",
            status: 'approved',
            is_active: d.action !== 'REMOVAL'
          }]);

          // ג. הזרקה ללוח ה-Orders (כדי שיופיע ב-Master Dashboard)
          const { error: orderError } = await supabase.from('orders').insert([{
            client_info: `מכולה: ${d.client} (${d.action === 'PLACEMENT' ? 'הצבה' : d.action === 'EXCHANGE' ? 'החלפה' : 'הוצאה'})`,
            location: d.address,
            order_time: d.time || "08:00",
            delivery_date: d.date || new Date().toISOString().split('T')[0],
            driver_name: d.contractor,
            status: 'approved',
            warehouse: 'מכולות'
          }]);

          if (!insertError && !orderError) isComplete = true;
        }
      } catch (e) { console.error("Parse/Insert Error", e); }
    }

    // 5. עדכון זיכרון וסגירה
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    const finalReply = isComplete ? `בוס, המשימה הוזרקה בהצלחה לניהול וללוח הסידור! 🚀 (${replyText.split('DATA_START')[0].trim() || 'בוצע'})` : replyText;

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    console.error(e);
    return res.status(200).json({ reply: "בוס, המוח התעייף לרגע. נסה שוב." });
  }
}
