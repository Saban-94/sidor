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

    // הזרקה ל-DB - התאמה לעמודות הקיימות שלך
    const isOrderRelated = cleanMsg.includes("מכולה") || cleanMsg.includes("ויצמן") || cleanMsg.includes("היום");
    
    if (isOrderRelated || replyText.includes("SAVE_ORDER_DB")) {
      console.log("--- [DB INJECTION] מנסה להזריק למבנה הטבלה המזוהה... ---");
      
      const noteFromAI = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || "";
      // איחוד המידע לתוך עמודת ה-warehouse כדי שלא יהיו שגיאות עמודה חסרה
      const fullOrderDetails = `${cleanMsg}${noteFromAI ? ` | הערה: ${noteFromAI}` : ""}`;

      const { error: dbError } = await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        warehouse: fullOrderDetails, // כאן נכנס הכל (הזמנה + הערה)
        status: 'pending',
        has_new_note: true, // מדליק זיקית
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);

      if (dbError) {
        console.error("שגיאה סופית בהזרקה:", dbError.message);
        // ניסיון אחרון - הזרקה מינימלית בלבד
        await supabase.from('orders').insert([{
          client_info: phone,
          warehouse: cleanMsg,
          status: 'pending'
        }]);
      } else {
        console.log("הזמנה הוזרקה בהצלחה לטבלה!");
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

    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    return res.status(200).json({ reply: "מטפל בזה, כבר חוזר אליך." });
  }
}
