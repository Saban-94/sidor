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

  // בדיקות תקינות כפי שביקשת
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, מה השאלה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API חסר בשרת." });

  // עדכון שמות המודלים
const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];
  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון לקוח ושם משתמש
    let { data: memory } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge, user_name')
      .eq('clientId', phone)
      .maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase
        .from('customer_memory')
        .insert([{ clientId: phone, accumulated_knowledge: '', user_name: null }])
        .select()
        .single();
      memory = newUser;
    }

    const userName = memory?.user_name;

    // 2. בניית ה-Prompt האישי (ללא הצגת דאטה מיותרת)
    const prompt = `
      זהות: המוח של סבן 1994. 
      סגנון: מקצועי, חד, ענייני, ואישי מאוד.
      
      חוקי ניהול שיחה:
      - אם ה-userName הוא "${userName || 'לא ידוע'}", ואין לך שם, ברך את המשתמש ובקש את שמו לפני הכל.
      - אל תציג רשימות הזמנות או נתונים אלא אם נשאלת במפורש "מה הלו"ז?" או "הצג הזמנות".
      - לווה כל תשובה בפנייה אישית בשם המשתמש (אם ידוע).
      - אם המשתמש מוסר פרטי הזמנה (מכולה/חומרים), בצע הזרקה ולווה באישור אישי.

      שם משתמש נוכחי: ${userName || 'לא ידוע'}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
      הודעה חדשה: ${cleanMsg}

      פלט הזרקה (רק אם נדרש): DATA_START{...}DATA_END
    `;

    let replyText = "";
    // לופ ניסיון בין המודלים המעודכנים
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

    // 3. זיהוי ושמירת שם משתמש אם הוצג בשיחה
    if (!userName && cleanMsg.length < 25) {
        const nameKeywords = ["אני", "שמי", "קוראים לי", "זה"];
        if (nameKeywords.some(k => cleanMsg.includes(k))) {
            const extractedName = cleanMsg.split(" ").pop()?.replace(/[?!.]/g, "");
            if (extractedName) {
                await supabase.from('customer_memory').update({ user_name: extractedName }).eq('clientId', phone);
            }
        }
    }

    // 4. עדכון הזיכרון הכללי
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח בטעינה. נסה שוב." });
  }
}
