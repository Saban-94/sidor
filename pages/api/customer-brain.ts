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

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון ושם משתמש
    let { data: memory } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge, user_name')
      .eq('clientId', phone)
      .maybeSingle();
    
    let currentUserName = memory?.user_name;

    // 2. חיפוש ידע מאומן ב-DB (AI Training)
    const { data: trainingData } = await supabase
      .from('ai_training')
      .select('answer')
      .ilike('question', `%${cleanMsg}%`)
      .limit(1)
      .maybeSingle();

    const trainedContext = trainingData ? `מידע רלוונטי מהמערכת (עדיפות עליונה): ${trainingData.answer}` : "";

    // 3. בניית ה-Prompt
    const prompt = `
      זהות: המוח של סבן 1994. 
      משתמש: ${currentUserName || 'לא ידוע'}.
      ${trainedContext}

      חוקים קשיחים:
      - השתמש ב"מידע רלוונטי מהמערכת" כתשובה המדויקת ביותר.
      - אל תמציא נתונים שאינם במידע המערכת.
      - אם שם המשתמש ידוע (${currentUserName}), אל תשאל אותו שוב.
      - סגנון: מקצועי, חד, ענייני, וקצר.
      
      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
    `;

    let replyText = "";
    let lastError: any = null; // תיקון הטיפוס כאן

    // 4. ניסיון שליחה עם מנגנון Fallback
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
      } catch (e) {
        lastError = e;
        continue; 
      }
    }

    if (!replyText) throw lastError || new Error("כל המודלים נכשלו");

    // 5. שמירת היסטוריה
    await supabase.from('customer_memory').update({ 
      accumulated_knowledge: (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}\nAI: ${replyText}` 
    }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText.replace(/\*\*/g, '*') });

  } catch (e) {
    console.error("Brain Error:", e);
    return res.status(200).json({ reply: "בוס, המוח בריענון נתונים. נסה שוב." });
  }
}
