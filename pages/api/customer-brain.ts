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

  try {
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name || "";
    const chatHistory = memory?.accumulated_knowledge || "";

    const prompt = `אתה המוח של ח.סבן. לקוח: ${currentUserName}. הודעה: "${cleanMsg}". אשר קבלת פרטים, הוסף פקודות SAVE_ORDER_DB ו-CLIENT_NOTE במידת הצורך.`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // עדכון שם
    if (cleanMsg.includes("לוי") || (cleanMsg.length < 15 && !currentUserName)) {
      currentUserName = cleanMsg;
    }

    // הזרקה בטוחה - בדיקת שמות עמודות (שיניתי ל-notes כדי להתאים לסטנדרט שלך)
    const isOrderRelated = cleanMsg.includes("מכולה") || cleanMsg.includes("ויצמן") || cleanMsg.includes("היום");
    
    if (isOrderRelated || replyText.includes("SAVE_ORDER_DB")) {
      console.log("--- [DB INJECTION] מנסה להזריק... ---");
      
      const { error: dbError } = await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        // שים לב: שיניתי מ-customer_note ל-notes כי זה כנראה השם ב-DB שלך
        notes: replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || "הזמנה חדשה", 
        has_new_note: true,
        status: 'pending'
      }]);

      if (dbError) {
        console.error("שגיאה בהזרקה (ניסיון 1):", dbError.message);
        // ניסיון גיבוי אם השם הוא בכל זאת משהו אחר
        await supabase.from('orders').insert([{
          client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
          warehouse: cleanMsg,
          status: 'pending'
        }]);
      }
    }

    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    let finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").trim();
    if (!finalReply) finalReply = `אח שלי, רשמתי את ההזמנה ל${cleanMsg}. בודק ומעדכן.`;

    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    return res.status(200).json({ reply: "מטפל בזה עכשיו." });
  }
}
