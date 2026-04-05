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
  const phone = senderPhone?.replace('@c.us', '') || 'admin';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  console.log(`--- [START] כניסת הודעה מ: ${phone} ---`);

  try {
    // 1. שליפת מידע גולמי מה-DB עבור ה-Gem
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    
    const currentUserName = memory?.user_name || "אורח";
    const chatHistory = memory?.accumulated_knowledge || "";

    // 2. בניית ה-Prompt (ה-Gem הוא המפקד)
    const prompt = `
      זהות: המוח המרכזי של "ח.סבן". אתה האחראי הבלעדי על הלוגיקה והשיחה.
      לקוח: ${currentUserName}. טלפון: ${phone}.
      
      ידע זמין:
      - מלאי: ${inventory?.map(i => `${i.product_name}: ${i.price}₪`).join(', ')}
      - הנחיות מקצועיות: ${training?.map(t => t.content).join('\n')}
      
      פקודות חובה למערכת (הוסף בסוף התשובה שלך):
      1. להזמנה/פינוי: SAVE_ORDER_DB:[מוצר]:[כמות]
      2. להערה/דחיפות/זיקית: CLIENT_NOTE:[תוכן ההערה]
      3. לעדכון שם הלקוח: SET_USER_NAME:[השם המלא]
      
      חוקי עירייה (באחריותך):
      - כפר סבא/ויצמן: ציר ראשי, פינוי עד 14:00.
      - תל אביב: פינוי בשישי עד 10:00.
      
      הודעה נוכחית: "${cleanMsg}"
      היסטוריה: ${chatHistory.slice(-800)}
    `;

    // 3. קריאה ל-Gemini
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log(`--- [GEMINI RAW REPLY] ---\n${replyText}`);

    // 4. עיבוד פקודות וביצוע ב-DB
    
    // א. עדכון שם לקוח בזיכרון
    const nameMatch = replyText.match(/SET_USER_NAME:\[(.*?)\]/);
    const updatedName = nameMatch ? nameMatch[1] : currentUserName;

    // ב. הזרקת הזמנה ללוח (כולל מנגנון הזרקה כפוי למילים דחופות)
    const isUrgent = cleanMsg.includes("מכולה") || cleanMsg.includes("ויצמן") || cleanMsg.includes("היום");
    const hasCommand = replyText.includes("SAVE_ORDER_DB") || replyText.includes("CLIENT_NOTE");

    if (hasCommand || isUrgent) {
      const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || (isUrgent ? cleanMsg : null);
      const orderItems = replyText.match(/SAVE_ORDER_DB:\[(.*?)\]/)?.[1] || cleanMsg;

      await supabase.from('orders').insert([{
        client_info: `שם: ${updatedName} | טלפון: ${phone}`,
        warehouse: orderItems,
        status: 'pending',
        has_new_note: !!clientNote, // מדליק זיקית
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
      console.log("--- [DB INJECTED] ---");
    }

    // ג. עדכון זיכרון לקוח
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    // 5. ניקוי התשובה - מחיקת כל הפקודות באנגלית מהטקסט של הלקוח
    let finalReply = replyText
      .replace(/SET_USER_NAME:\[.*?\]/g, "")
      .replace(/CLIENT_NOTE:\[.*?\]/g, "")
      .replace(/SAVE_ORDER_DB:\[.*?\]/g, "")
      .replace(/\[.*?\]/g, "") // ניקוי שאריות סוגריים
      .trim();

    if (!finalReply) {
      finalReply = `רשמתי אצלי, ${updatedName}. בודק זמינות ומעדכן אותך מיד.`;
    }

    console.log(`--- [FINAL REPLY TO CLIENT] ---\n${finalReply}`);
    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("--- [CRITICAL ERROR] ---", error.message);
    return res.status(200).json({ reply: "קיבלתי את ההודעה, כבר חוזר אליך עם תשובה." });
  }
}
