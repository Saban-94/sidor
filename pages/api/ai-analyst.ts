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

  // --- הגנות בסיס ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  // Model Pool מעודכן לשמות המודלים של Google
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';
    
    // 1. Instant Sync: שליפה ויצירת משתמש בזיכרון
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. Advisor Pro: בניית ה-Prompt ל-3 המחלקות
    const prompt = `
      זהות: העוזר האישי של ראמי (סבן חומרי בניין). סגנון: מקצועי, חד, ענייני.
      
      תפקיד: זיהוי ענף וסוג פעולה:
      1. ORDER (חומרים): נהג חכמת/עלי.
      2. CONTAINER (מכולות): קבלן שארק 30/כראדי 32/שי שרון 40.
         סוגי פעולה: "הצבה" (ירוק), "החלפה" (כתום), "הוצאה" (אדום).
      3. TRANSFER (העברות): מהחרש/מהתלמיד.

      מספר הזמנה: אם צוין מספר (למשל 6212303), חלץ אותו לשדה order_id. אחרת null.

      היסטוריה: ${localUpdatedHistory}

      חוק הזרקה:
      DATA_START{
        "type": "ORDER" | "CONTAINER" | "TRANSFER",
        "action_type": "הצבה" | "החלפה" | "הוצאה",
        "order_id": "מספר הזמנה אם יש",
        "client": "שם הלקוח",
        "address": "כתובת",
        "date": "YYYY-MM-DD",
        "time": "HH:mm",
        "executor": "נהג או קבלן",
        "from_branch": "סניף מקור",
        "to_branch": "סניף יעד"
      }DATA_END
    `;

    // 3. Expert Core: רוטציה ב-Model Pool
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

    // 4. Instant Sync: חילוץ נתונים והזרקה פיזית
    if (replyText.includes('DATA_START')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        const d = JSON.parse(jsonMatch[0]);
        const commonData: any = { order_time: d.time, status: 'approved' };
        if (d.order_id) commonData.order_number = d.order_id;

        if (d.type === "CONTAINER") {
          // הזרקה כפולה: מכולות + לוח משימות
          const { data: ins } = await supabase.from('container_management').insert([{
            ...commonData,
            client_name: d.client,
            delivery_address: d.address,
            start_date: d.date,
            contractor_name: d.executor,
            action_type: d.action_type,
            is_active: true
          }]).select('order_number').single();
          
          await supabase.from('orders').insert([{
            ...commonData,
            order_number: d.order_id || ins?.order_number,
            client_info: `מכולה: ${d.client} (${d.action_type})`,
            location: d.address,
            delivery_date: d.date,
            driver_name: d.executor
          }]);
        } 
        else if (d.type === "TRANSFER") {
          await supabase.from('transfers').insert([{
            ...commonData,
            from_branch: d.from_branch,
            to_branch: d.to_branch,
            transfer_date: d.date,
            driver_name: d.executor
          }]);
        } 
        else {
          await supabase.from('orders').insert([{
            ...commonData,
            client_info: d.client,
            location: d.address,
            delivery_date: d.date,
            driver_name: d.executor
          }]);
        }

        finalReply = `בוס, הזמנה ${d.order_id ? '#' + d.order_id : ''} הוזרקה ללוח של ${d.executor}. 🚀`;
        isComplete = true;
      }
    }

    // 5. עדכון זיכרון (איפוס אם הוזרק)
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    console.error("Global Brain Error:", e);
    return res.status(200).json({ reply: "בוס, המוח התעייף לרגע. נסה שוב." });
  }
}
