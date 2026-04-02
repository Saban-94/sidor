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

  if (!cleanMsg) return res.status(200).json({ reply: "שלום, במה אוכל לעזור?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת חיבור לשרת." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון ושם לקוח
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge, user_name').eq('clientId', phone).maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '', user_name: null }]).select().single();
      memory = newUser;
    }

    let currentUserName = memory?.user_name;

    // 2. זיהוי שם אגרסיבי - אם אין שם, מחלצים מהודעה קצרה
    if (!currentUserName && cleanMsg.length < 15) {
      const extracted = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      if (extracted.length >= 2) {
        await supabase.from('customer_memory').update({ user_name: extracted }).eq('clientId', phone);
        currentUserName = extracted;
      }
    }

    // 3. שליפת ידע מאומן (AI Training) - חובה להשתמש בזה קודם!
    const { data: trainingData } = await supabase.from('ai_training').select('answer').ilike('question', `%${cleanMsg}%`).limit(1).maybeSingle();

    // 4. בניית ה-Prompt - שפה שירותית ללקוח
    const prompt = `
      זהות: המוח של סבן 1994 (שירות לקוחות).
      לקוח נוכחי: ${currentUserName || 'לא ידוע'}.
      מידע מהמערכת (חובה להשתמש מילה במילה): ${trainingData?.answer || "אין מידע ספציפי בטבלה"}.

      חוקים קשיחים:
      - לעולם אל תשתמש במילה "בוס"! אתה פונה ללקוח בצורה מכובדת.
      - אם שם הלקוח הוא "לא ידוע", בקש את שמו בנימוס פעם אחת בלבד.
      - אם שם הלקוח ידוע (${currentUserName}), פנה אליו בשמו בכל תשובה.
      - אם יש "מידע מהמערכת", ענה רק לפיו. אל תמציא שעות או נהלים מדמיונך.
      - שמור על תשובות קצרות, מקצועיות וברורות.
      
      הודעת המשתמש: ${cleanMsg}
      היסטוריית שיחה: ${memory?.accumulated_knowledge || ""}
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

    // 5. עדכון זיכרון - שמירה על רצף שיחה
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "").slice(-1500) + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "שלום, חלה תקלה קלה בתקשורת. אנא נסה שוב." });
  }
}
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        
        if (replyText) break; // הצלחה
      } catch (e) {
        lastError = e;
        continue; // עובר למודל הבא
      }
    }

    if (!replyText) throw lastError || new Error("Connection failed");

    // 7. שמירת היסטוריית השיחה
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "").slice(-2000) + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    console.error("Brain Failure:", e);
    return res.status(200).json({ reply: "בוס, המוח בריענון. נסה שוב בעוד רגע." });
  }
}
