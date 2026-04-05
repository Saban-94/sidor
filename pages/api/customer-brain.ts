import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-2.0-flash"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  console.log(`--- [START] הודעה מ: ${phone} | תוכן: ${cleanMsg} ---`);

  try {
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name || "";
    const chatHistory = memory?.accumulated_knowledge || "";

    const prompt = `
      זהות: המוח של "ח.סבן". מנהל עבודה תכליתי.
      לקוח: ${currentUserName || 'חדש'}.
      משימה: הלקוח שלח פרטים (שם/כתובת/הזמנה). 
      חוקים:
      1. אם הלקוח נתן שם (כמו "אבי לוי"), אשר שקיבלת והודה לו.
      2. חובה להוסיף פקודה נסתרת: SAVE_ORDER_DB:[ITEM]:[QTY] אם יש מוצרים.
      3. חובה להוסיף CLIENT_NOTE:[פירוט] אם יש כתובת או דחיפות.
      הודעה: "${cleanMsg}"
      היסטוריה: ${chatHistory.slice(-500)}
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log(`--- [GEMINI REPLY] --- \n${replyText}`);

    // --- לוגיקת הזרקה חסינת טעויות ---
    
    // עדכון שם
    if (cleanMsg.includes("לוי") || cleanMsg.includes("עפר") || (cleanMsg.length < 20 && !cleanMsg.includes("?"))) {
      currentUserName = cleanMsg;
    }

    // זיהוי אם זו הזמנה או עדכון פרטים קריטי
    const isOrderRelated = cleanMsg.includes("מכולה") || cleanMsg.includes("שק") || cleanMsg.includes("ויצמן") || cleanMsg.includes("כפר סבא");
    const hasCommand = replyText.includes("SAVE_ORDER_DB") || replyText.includes("CLIENT_NOTE");

    if (hasCommand || isOrderRelated) {
      console.log("--- [DB INJECTION] מזריק הזמנה/עדכון לטבלה ---");
      const { error: dbError } = await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        customer_note: replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || "עדכון פרטים/הזמנה",
        has_new_note: true, // תמיד ידליק זיקית במידע קריטי
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
      if (dbError) console.error("שגיאת DB:", dbError.message);
    }

    // עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    // ניקוי תשובה - אם יצא ריק, ניתן תשובה דיפולטיבית
    let finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").trim();
    if (!finalReply) finalReply = `רשמתי אצלי, ${currentUserName}. בודק ומעדכן אותך.`;

    console.log(`--- [FINAL REPLY] --- \n${finalReply}`);
    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    console.error("Critical Error:", error);
    return res.status(200).json({ reply: "קיבלתי את הפרטים, מטפל בזה." });
  }
}
