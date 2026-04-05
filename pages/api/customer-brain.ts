import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-2.0-flash"];

// הפונקציה חייבת להיות export default כדי ש-Next.js יזהה אותה כ-Route
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'admin';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  console.log(`--- [START] הודעה מ: ${phone} | תוכן: ${cleanMsg} ---`);

  try {
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name || "";
    const chatHistory = memory?.accumulated_knowledge || "";

    const prompt = `אתה המוח של ח.סבן. לקוח: ${currentUserName}. הודעה: "${cleanMsg}". אשר קבלת פרטים והוסף CLIENT_NOTE:[פירוט] אם דחוף.`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // עדכון שם (אבי לוי / עבודות עפר)
    if (cleanMsg.includes("לוי") || cleanMsg.includes("עפר")) {
      currentUserName = cleanMsg.replace("אני ", "").trim();
    }

    // הזרקה ל-DB
    const isOrderRelated = cleanMsg.includes("מכולה") || cleanMsg.includes("ויצמן") || cleanMsg.includes("היום");
    
    if (isOrderRelated || replyText.includes("SAVE_ORDER_DB")) {
      const noteFromAI = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || "";
      const fullOrderDetails = `${cleanMsg}${noteFromAI ? ` | הערה: ${noteFromAI}` : ""}`;

      await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        warehouse: fullOrderDetails,
        status: 'pending',
        has_new_note: true,
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    // עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    let finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").trim();
    if (!finalReply) finalReply = `אח שלי, רשמתי את ההזמנה ל${cleanMsg}. בודק ומעדכן.`;

    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    console.error("Critical Error:", error);
    return res.status(200).json({ reply: "מטפל בזה עכשיו." });
  }
}
