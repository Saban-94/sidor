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
  const phone = senderPhone?.replace('@c.us', '') || 'admin';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  console.log(`--- [START] צינור חיבור: הודעה מ-${phone} ---`);

  try {
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name || "";
    const chatHistory = memory?.accumulated_knowledge || "";

    const prompt = `
      זהות: המוח של "ח.סבן". מנהל עבודה תכליתי.
      לקוח: ${currentUserName || 'חדש'}.
      משימה: הלקוח ביקש: "${cleanMsg}".
      חוקים:
      1. אם יש שם (כמו לוי), עדכן זיכרון.
      2. חובה להוציא CLIENT_NOTE:[פירוט] לכל כתובת או דחיפות.
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // עדכון שם חכם (מזהה "אבי לוי" או "עבודות עפר")
    if (cleanMsg.includes("לוי") || cleanMsg.includes("עפר") || (cleanMsg.length < 20 && !currentUserName)) {
      currentUserName = cleanMsg.replace("אני ", "").trim();
    }

    // הזרקה ל-DB - תיקון שמות עמודות לפי הלוג
    const isOrderRelated = cleanMsg.includes("מכולה") || cleanMsg.includes("ויצמן") || cleanMsg.includes("היום");
    
    if (isOrderRelated || replyText.includes("SAVE_ORDER_DB")) {
      console.log("--- [DB INJECTION] מנסה להזריק לטבלה ---");
      
      // שליפת הערה מה-AI
      const noteFromAI = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || "הזמנה חדשה";

      const { error: dbError } = await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        // תיקון: שימוש בשם העמודה הנכון (notes או customer_notes)
        customer_notes: noteFromAI, 
        has_new_note: true,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);

      if (dbError) {
        console.error("שגיאת הזרקה (ניסיון 1):", dbError.message);
        // ניסיון גיבוי עם עמודה בשם 'notes' למקרה שזה השם ב-DB
        await supabase.from('orders').insert([{
          client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
          warehouse: cleanMsg,
          notes: noteFromAI,
          status: 'pending'
        }]);
      }
    }

    // עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    let finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").trim();
    if (!finalReply) finalReply = `אח שלי, רשמתי את ההזמנה ל${cleanMsg}. בודק ומעדכן.`;

    console.log(`--- [END] תשובה סופית: ${finalReply} ---`);
    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    console.error("Critical Error:", error);
    return res.status(200).json({ reply: "מטפל בזה, כבר חוזר אליך." });
  }
}
