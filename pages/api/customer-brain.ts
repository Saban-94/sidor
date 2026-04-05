import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  
  // זיהוי ייחודי לכל לקוח (מונע ערבוב שמות)
  const phone = senderPhone?.replace('@c.us', '') || req.headers['x-forwarded-for'] || 'guest_session';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  // 1. שליפת זיכרון ספציפית למזהה הנוכחי בלבד
  const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
  
  // אם אין זיכרון למזהה הזה, הוא "אורח". אם יש, הוא השם השמור (למשל רפי).
  let currentUserName = memory?.user_name || "אורח";
  const chatHistory = memory?.accumulated_knowledge || "";

  try {
    const prompt = `
      זהות: מנהל הזמנות בח.סבן. 
      לקוח נוכחי: ${currentUserName} (מזהה: ${phone}).
      
      חוקי זיהוי:
      - אם הלקוח הוא "אורח": ברך בנימוס ובקש שם מלא ונייד. אל תנחש שמות!
      - אם הלקוח מזוהה בשם: ברך אותו אישית (למשל: "אהלן רפי").
      
      משימה: ענה על: "${cleanMsg}".
      הקשר קודם: ${chatHistory.slice(-1000)}
      פקודות: SET_USER_NAME:[שם], SAVE_ORDER_DB:[פריט], CLIENT_NOTE:[הערה].
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(20000)
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // 2. עדכון שם רק אם ה-Gem זיהה שם חדש בשיחה
    const nameMatch = replyText.match(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/i);
    const updatedName = nameMatch ? nameMatch[1].replace(/[\[\]\(\):]/g, "").trim() : currentUserName;

    // 3. הזרקה ללוח הזמנות (רק אם יש פקודה או הקשר מובהק)
    if (replyText.includes("SAVE_ORDER_DB") || (cleanMsg.includes("מכולה") && replyText.includes("SAVE_ORDER_DB"))) {
      await supabase.from('orders').insert([{
        client_info: `שם: ${updatedName} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    // 4. עדכון זיכרון - ספציפי למזהה (clientId)
    const memoryEntry = `\n[${new Date().toLocaleDateString('he-IL')}] U: ${cleanMsg} | AI: ${replyText.slice(0, 200)}`;
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + memoryEntry).slice(-2000)
    }, { onConflict: 'clientId' });

    // 5. ניקוי אנגלית מהתשובה
    let finalReply = replyText
      .replace(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SAVE_ORDER_DB[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/[\[\]\(\)]/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply || `שלום, איך אני יכול לעזור?` });

  } catch (error) {
    // ב-Catch מחזירים תשובה ניטרלית אם השם לא ידוע
    const fallbackMsg = currentUserName !== "אורח" ? `אחי ${currentUserName}, שנייה בודק...` : "קיבלתי, בודק ומעדכן.";
    return res.status(200).json({ reply: fallbackMsg });
  }
}
