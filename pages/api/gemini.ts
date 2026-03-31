import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // שימוש במפתח הקיים שלך ב-Vercel
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

    // 1. Instant Sync: שליפה ויצירת משתמש בזיכרון המוח
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה" || cleanMsg === "חדש") history = "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. Advisor Pro: בניית ה-Prompt עם עץ שאלות מלא (ללא שינוי לוגיקה)
    const prompt = `
      זהות: העוזר האישי של ראמי מסבן חומרי בניין. סגנון: קצר, מקצועי, תכליתי.
      
      עץ שאלות חובה (לפי הסדר):
      1. מי הלקוח?
      2. מה הכתובת למשלוח?
      3. מאיזה מחסן (החרש/התלמיד)?
      4. באיזה תאריך האספקה?
      5. באיזו שעה (למשל 08:30)?
      6. איזה נהג (חכמת/עלי)?

      היסטוריה: ${localUpdatedHistory}

      חוק הזרקה (קריטי):
      רק לאחר שהמשתמש נתן את כל הפרטים, ענה: "הוזרק ללוח. 🚀" 
      וחייב להוסיף JSON מדויק בפורמט הזה:
      DATA_START{
        "complete": true, 
        "client": "שם הלקוח", 
        "address": "הכתובת", 
        "branch": "המחסן", 
        "date": "YYYY-MM-DD", 
        "time": "HH:mm", 
        "driver": "שם הנהג"
      }DATA_END

      דגש: אל תאשר הזרקה עד שאין לך את התאריך והשעה המדויקים מהמשתמש.
    `;

    // 3. Expert Core: קריאה למודל (רוטציה קיימת)
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          replyText = data.candidates[0].content.parts[0].text.trim();
          break;
        }
      } catch (e) { continue; }
    }

    let finalReply = replyText || "בוס, המוח קצת עמוס. נסה שוב.";
    let isComplete = false;

    // 4. Instant Sync: חילוץ נתונים והזרקה פיזית לטבלת orders
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          // עיגול שעה למשבצות 00/30 לטובת הלוח
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
            delivery_date: d.date || new Date().toISOString().split('T')[0],
            status: 'pending'
          }]);

          if (!insertError) {
            finalReply = `בוס, הזמנה ל-${d.client} הוזרקה ללוח של ${d.driver} לשעה ${finalTime}. 🚀`;
            isComplete = true;
          } else {
            finalReply = "בוס, הפרטים חולצו אבל יש תקלה ברישום ל-Database.";
          }
        }
      } catch (e) {
        console.error("JSON Parse Error", e);
      }
    }

    // 5. עדכון זיכרון (איפוס אם הוזרק, אחרת צבירה)
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    console.error("Global Error:", e);
    return res.status(200).json({ reply: "בוס, המוח התעייף לרגע. נסה שוב." });
  }
}
