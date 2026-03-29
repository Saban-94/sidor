import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון ויצירה אם חסר
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה") history = "";

    // המפתח: עדכון היסטוריה מקומי לפני הפנייה לבינה המלאכותית
    const updatedHistory = history + `\nUser: ${cleanMsg}`;

    // 2. בדיקת לקוח חוזר
    let clientInsight = "";
    if (updatedHistory.includes("שם לקוח?") && !updatedHistory.includes("כתובת?")) {
        const { data: past } = await supabase.from('orders').select('location, client_info').ilike('client_info', `%${cleanMsg}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (past) clientInsight = `בוס, ${past.client_info} מוכר. פעם אחרונה: ${past.location}. לשם או כתובת חדשה?`;
    }

    // 3. Prompt עם הגנת לופים אגרסיבית
    const prompt = `
      אתה העוזר של ראמי. קצר (מילה-שתיים).
      סדר עץ: 1. שם לקוח? -> 2. כתובת? -> 3. מחסן? -> 4. נהג?

      היסטוריה מעודכנת:
      ${updatedHistory}

      חוקי מעבר שלב קשיחים:
      - אם המשתמש כתב כתובת (זאב בלפר), עבור מיד ל-"מחסן?". אל תשאל "כתובת?" שוב!
      - אם המשתמש כתב מחסן (החרש/התלמיד), ענה אך ורק: "נהג? (חכמת/עלי)".
      - אם הכל הושלם, החזר JSON בסוף: {"complete": true, "client": "שם", "address": "כתובת", "branch": "מחסן", "driver": "נהג"}
    `;

    // 4. רוטציית מודלים
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

    // 5. הזרקה ללוח ואיפוס זיכרון
    let finalReply = clientInsight || replyText;
    if (replyText.includes('"complete": true')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        const d = JSON.parse(jsonMatch[0]);
        await supabase.from('orders').insert([{
          client_info: d.client,
          location: d.address,
          source_branch: d.branch,
          driver_name: d.driver,
          order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        }]);
        finalReply = "הוזרק ללוח. 🚀";
        await supabase.from('customer_memory').update({ accumulated_knowledge: "" }).eq('clientId', phone);
      }
    } else {
      // שמירה קשיחה של הזיכרון
      await supabase.from('customer_memory').update({ 
        accumulated_knowledge: updatedHistory + `\nAssistant: ${finalReply}` 
      }).eq('clientId', phone);
    }

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס. שוב?" });
  }
}
