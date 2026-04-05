import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// העדפת מודלים מהירים ויציבים יותר
const modelPool = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash"
];
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'admin';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  try {
    // שליפת זיכרון כדי שה-Gem ידע שזה "אבי" ולא "אורח"
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    const currentUserName = memory?.user_name || "אורח";

    // שליחת פקודה ברורה ל-Gem לענות כבן אדם
    const prompt = `אתה מנהל ההזמנות בח.סבן. לקוח: ${currentUserName}. הודעה: "${cleanMsg}". 
    ענה בעברית חמה ומקצועית. בסוף התשובה הוסף פקודות: SET_USER_NAME, CLIENT_NOTE, SAVE_ORDER_DB רק אם רלוונטי.`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(15000) // הגדלת זמן המתנה ל-15 שניות
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // אם ה-Gem ענה - אנחנו מנקים ושולחים את התשובה שלו
    if (replyText) {
      // ביצוע פקודות ב-DB (שם, הזרקה וכו')
      const nameMatch = replyText.match(/SET_USER_NAME:\[(.*?)\]/);
      const updatedName = nameMatch ? nameMatch[1] : currentUserName;
      
      // ניקוי ושליחה
      const finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SET_USER_NAME:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").trim();
      
      // עדכון זיכרון
      await supabase.from('customer_memory').upsert({ clientId: phone, user_name: updatedName }, { onConflict: 'clientId' });

      return res.status(200).json({ reply: finalReply });
    }

    // אם הגענו לכאן, ה-Gem לא ענה - ננסה תשובה חכמה יותר
    return res.status(200).json({ reply: `שלום ${currentUserName}, המערכת בעומס קל, מטפל בבקשה שלך ידנית תוך רגע.` });

  } catch (error) {
    return res.status(200).json({ reply: "אחי, קיבלתי, בודק לך וחוזר." });
  }
}
