import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const geminiKey = process.env.GEMINI_API_KEY;
  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-2.0-pro-exp-02-05", 
    "gemini-2.0-flash"
  ];

  try {
    // 1. שליפת זיכרון והזמנה קיימת
    let { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    let currentUserName = memory?.user_name || "";
    let chatHistory = memory?.accumulated_knowledge || "";
    
    let orderStatusInfo = lastOrder ? 
      `הזמנה #${lastOrder.order_number}: ${lastOrder.status}. שעה: ${lastOrder.delivery_time || 'בטיפול'}. נהג: ${lastOrder.driver_info || 'טרם שויך'}.` 
      : "אין הזמנה קודמת.";

    // 2. בניית ה-PROMPT עם דגש על סגירת פרטים (שם משפחה)
    const prompt = `
      זהות: אתה המוח של "ח.סבן חומרי בניין".
      לקוח: ${currentUserName || 'חדש'}. טלפון: ${phone}.
      היסטוריה קצרה: ${chatHistory.slice(-500)}
      מידע הזמנה: ${orderStatusInfo}

      משימה:
      - אם הלקוח נתן שם/שם משפחה (כמו "לוי"), עדכן את המערכת והודה לו.
      - אם חסר שם משפחה, בקש אותו בנימוס.
      - אם זו הזמנה חדשה, אשר מוצרים בבולטים (•) והוסף SAVE_ORDER_DB:[SKU]:[QTY].
      - אם יש הערה ("דחוף", "קומה 2"), הוסף פקודה: CLIENT_NOTE:[הטקסט].

      חשוב: אל תציג ללקוח פקודות כמו SAVE_ORDER_DB או CLIENT_NOTE. 
      הודעת הלקוח עכשיו: "${cleanMsg}"
    `;

    // 3. הרצה מול Gemini
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (replyText) break;
      } catch (e) { continue; }
    }

    // 4. זיהוי שם משפחה ועדכון ידני אם ה-AI מתמהמה
    if (cleanMsg.length < 15 && !cleanMsg.includes(" ") && !currentUserName.includes(cleanMsg)) {
        currentUserName = currentUserName ? `${currentUserName} ${cleanMsg}` : cleanMsg;
    }

    // 5. עדכון DB - סגירת ההזמנה עם הפרטים החדשים
    const hasOrderTrigger = replyText.includes("SAVE_ORDER_DB:") || replyText.includes("CLIENT_NOTE:") || (lastOrder && lastOrder.status === 'pending');
    
    if (hasOrderTrigger) {
      const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || null;
      
      if (lastOrder && lastOrder.status === 'pending') {
        // עדכון הזמנה קיימת (הוספת שם המשפחה ל-client_info או עדכון הערה)
        await supabase.from('orders').update({
          client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
          customer_note: clientNote || lastOrder.customer_note,
          has_new_note: !!clientNote
        }).eq('id', lastOrder.id);
      } else {
        // יצירת הזמנה חדשה
        await supabase.from('orders').insert([{
          client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
          warehouse: cleanMsg,
          customer_note: clientNote,
          has_new_note: !!clientNote,
          status: 'pending',
          order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }

    // 6. עדכון זיכרון לקוח
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nלקוח: " + cleanMsg + "\nבוט: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    // 7. ניקוי סופי של התשובה ללקוח (מניעת נזילת קוד)
    const finalReply = replyText
      .replace(/SAVE_ORDER_DB:\[?.*?\]?/g, "")
      .replace(/CLIENT_NOTE:\[?.*?\]?/g, "")
      .replace(/\[.*?\]/g, "")
      .trim() || "תודה, הפרטים עודכנו. נציג יחזור אליך במידת הצורך.";

    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    console.error("Brain Error:", error);
    return res.status(200).json({ reply: "קיבלתי, מטפל בזה עכשיו." });
  }
}
