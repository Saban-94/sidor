import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// מודלים מעודכנים לפי בקשתך
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

  console.log(`--- [START] הודעה מ: ${phone} | תוכן: ${cleanMsg} ---`);

  try {
    // 1. שליפת מידע מה-DB עבור ה-Gem
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    const currentUserName = memory?.user_name || "אורח";
    const chatHistory = memory?.accumulated_knowledge || "";

    // 2. בניית ה-Prompt (ה-Gem הוא המפקד הלוגיסטי)
    const prompt = `
      זהות: מנהל מחלקת הזמנות ב"ח.סבן". מומחה טכני ושותף לביצוע.
      לקוח: ${currentUserName}. טלפון: ${phone}.
      
      חוקים ותסריט:
      1. ברך את הלקוח בשמו. אם חדש, בקש שם ונייד.
      2. מכולה: ודא עיר, כתובת וחסמי גישה. התרע על חוקי עירייה (כ"ס/ויצמן - פינוי עד 14:00).
      3. ייעוץ טכני: תן מענה על חומרי בניין (מלט/בלוק/דבק), חשב כמויות לפי מ"ר אם ביקש.
      4. פקודות מערכת (חובה להוציא בסוף התשובה):
         - SET_USER_NAME:[השם המלא]
         - SAVE_ORDER_DB:[מוצר]:[כמות]
         - CLIENT_NOTE:[הערה דחופה/זיקית]

      הודעת לקוח: "${cleanMsg}"
      היסטוריה: ${chatHistory.slice(-800)}
    `;

    // 3. קריאה ל-Gemini
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(15000)
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log(`--- [GEMINI RAW] ---\n${replyText}`);

    // 4. עיבוד פקודות וביצוע ב-DB
    
    // א. עדכון שם (SET_USER_NAME)
    const nameMatch = replyText.match(/SET_USER_NAME[:\(\[]\s*(.*?)\s*[\]\)]/i);
    const updatedName = nameMatch ? nameMatch[1] : currentUserName;

    // ב. הזרקה ללוח (SAVE_ORDER_DB / CLIENT_NOTE)
    const isOrderRelated = cleanMsg.includes("מכולה") || cleanMsg.includes("ויצמן") || cleanMsg.includes("היום");
    const hasCommand = replyText.includes("SAVE_ORDER_DB") || replyText.includes("CLIENT_NOTE");

    if (hasCommand || isOrderRelated) {
      const clientNote = replyText.match(/CLIENT_NOTE[:\(\[]\s*(.*?)\s*[\]\)]/i)?.[1] || (isOrderRelated ? cleanMsg : null);
      const orderItems = replyText.match(/SAVE_ORDER_DB[:\(\[]\s*(.*?)\s*[\]\)]/i)?.[1] || cleanMsg;

      await supabase.from('orders').insert([{
        client_info: `שם: ${updatedName} | טלפון: ${phone}`,
        warehouse: orderItems, // פירוט הפריטים בלוח
        status: 'pending',
        has_new_note: !!clientNote, // מדליק זיקית
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    // ג. עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    // 5. ניקוי רדיקלי של פקודות (RegEx חסין לכל סוגי הסוגריים)
    let finalReply = replyText
      .replace(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SAVE_ORDER_DB[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SET_USER_NAME|CLIENT_NOTE|SAVE_ORDER_DB/gi, "") // ניקוי מילים בודדות
      .replace(/[\[\]\(\)]/g, "") // ניקוי סוגריים שנותרו
      .trim();

    if (!finalReply) {
      finalReply = `בוקר טוב ${updatedName}, איך אני יכול לעזור לך היום בח.סבן?`;
    }

    console.log(`--- [FINAL REPLY] ---\n${finalReply}`);
    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return res.status(200).json({ reply: "קיבלתי, בודק זמינות ומעדכן אותך מיד." });
  }
}
