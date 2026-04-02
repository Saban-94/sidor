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

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, מה השאלה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API חסר בשרת." });

  const modelPool = ["gemini-2.0-flash", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

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

    // תיקון זיהוי שם משתמש - זיהוי שמות קצרים (כמו "אבי")
    let currentUserName = memory?.user_name;
    if (!currentUserName && cleanMsg.length < 15) {
      const extracted = cleanMsg.replace(/אני|שמי|זה|קוראים לי/g, "").trim();
      if (extracted.length >= 2) {
        await supabase.from('customer_memory').update({ user_name: extracted }).eq('clientId', phone);
        currentUserName = extracted;
      }
    }

    const prompt = `
      זהות: המוח של סבן 1994. 
      סגנון: מקצועי, חד, ענייני, ואישי מאוד.
      חוקים:
      - אם ה-userName הוא "לא ידוע", בקש שם בנימוס.
      - אל תציג רשימות הזמנות אלא אם נשאלת במפורש.
      - פנה למשתמש בשמו: ${currentUserName || 'לא ידוע'}.
      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
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

    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח בטעינה." });
  }
}
