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

    // --- שלב א': בדיקה בטבלת אימונים (הזרקת ידע מהבוס) ---
    const { data: trainingMatch } = await supabase
      .from('ai_training')
      .select('answer')
      .ilike('question', `%${cleanMsg}%`) // חיפוש גמיש בשאלה
      .limit(1)
      .maybeSingle();

    if (trainingMatch) {
      return res.status(200).json({ 
        reply: `${trainingMatch.answer}\n\n![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)` 
      });
    }

    // --- שלב ב': ניהול זיכרון ופנייה ל-AI ---
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    const prompt = `
      זהות: העוזר האישי של ראמי (ח. סבן). סגנון: מקצועי, חד, ענייני.
      
      תפקיד א': הזרקת נתונים (אם המשתמש נותן פרטי הזמנה):
      1. ORDER (חומרים): נהג חכמת/עלי.
      2. CONTAINER (מכולות): קבלן שארק 30/כראדי 32/שי שרון 40.
         סוגי פעולה: "הצבה" (חדש/ירוק), "החלפה" (כתום), "הוצאה" (פינוי/אדום).
      3. TRANSFER (העברות): מהחרש/מהתלמיד.
      חלץ order_id אם צוין מספר (למשל 6212303).

      תפקיד ב': חיפוש לקוחות (אם המשתמש שאל "חפש לקוח" או "מי הלקוחות"):
      הצג את הרשימה הבאה בפורמט בועות מודגשות עם אימוג'י מתאים:
      - 🏗️ למכולה, 🚛 להובלה, 🛠️ לשיפוץ.
      רשימה: גבריאל מזרחי, מודי יבוא, גבי מזרחי, וגשל דאו, גל בן דוד, לירן/ביל"ו, קדם גלעד/מזל דלי, אורניל/אבי לוי, ד.ניב/שיפוצים הוד הש, אלנבי על הים/האגדה.

      היסטוריה: ${localUpdatedHistory}

      פלט הזרקה (חובה JSON בין DATA_START ל-DATA_END אם זו פקודת הזרקה):
      DATA_START{
        "type": "ORDER" | "CONTAINER" | "TRANSFER",
        "action_type": "הצבה" | "החלפה" | "הוצאה",
        "order_id": "מספר",
        "client": "שם",
        "address": "כתובת",
        "date": "YYYY-MM-DD",
        "time": "HH:mm",
        "executor": "שם מבצע",
        "from_branch": "מקור",
        "to_branch": "יעד"
      }DATA_END

      אם זה חיפוש לקוחות, ענה בטקסט חופשי מעוצב עם בועות (Bold) וחתימה בסוף.
      חתימה: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)
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
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (replyText) break;
      } catch (e) { continue; }
    }

    let finalReply = replyText;
    let isComplete = false;

    if (replyText.includes('DATA_START')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const d = JSON.parse(jsonMatch[0]);
          const commonData: any = { order_time: d.time, status: 'approved' };
          if (d.order_id) commonData.order_number = d.order_id;

          if (d.type === "CONTAINER") {
            await Promise.all([
              supabase.from('container_management').insert([{
                ...commonData,
                client_name: d.client,
                delivery_address: d.address,
                start_date: d.date,
                contractor_name: d.executor,
                action_type: d.action_type,
                is_active: true
              }]),
              supabase.from('orders').insert([{
                ...commonData,
                client_info: `מכולה: ${d.client} (${d.action_type})`,
                location: d.address,
                delivery_date: d.date,
                driver_name: d.executor
              }])
            ]);
          } else if (d.type === "TRANSFER") {
            await supabase.from('transfers').insert([{
              ...commonData,
              from_branch: d.from_branch,
              to_branch: d.to_branch,
              transfer_date: d.date,
              driver_name: d.executor
            }]);
          } else {
            await supabase.from('orders').insert([{
              ...commonData,
              client_info: d.client,
              location: d.address,
              delivery_date: d.date,
              driver_name: d.executor
            }]);
          }
          finalReply = `✅ בוס, הזמנה ${d.order_id ? '#' + d.order_id : ''} הזרקה ללוח של ${d.executor}.\n![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)`;
          isComplete = true;
        } catch (e) {
          console.error("JSON Parse Error", e);
        }
      }
    }

    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח בטעינה. נסה שוב." });
  }
}
