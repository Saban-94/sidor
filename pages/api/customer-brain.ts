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
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-pro-exp-02-05", "gemini-2.0-flash"];

  try {
    // 1. שליפת זיכרון והזמנה קיימת
    let { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    let currentUserName = memory?.user_name;
    let chatHistory = memory?.accumulated_knowledge || "";
    
    let orderStatusInfo = lastOrder ? 
      `סטטוס הזמנה #${lastOrder.order_number}: ${lastOrder.status}. שעה: ${lastOrder.delivery_time || 'טרם נקבעה'}. נהג: ${lastOrder.driver_info || 'טרם שויך'}.` 
      : "אין הזמנה פעילה.";

    // 2. חיפוש מלאי מהיר
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let inventoryData = "";
    if (searchWords.length > 0) {
      const { data: exact } = await supabase.from('brain_inventory').select('*').or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`).limit(1).maybeSingle();
      if (exact) inventoryData = `מוצר במלאי: ${exact.product_name}, מק"ט: ${exact.sku}.`;
    }

    // 3. ה-PROMPT (הכל בתוך מחרוזת אחת סגורה)
    const prompt = `
      זהות: אתה סדרן ההזמנות החכם של "ח.סבן". לקוח: ${currentUserName || 'אורח'}.
      מידע על הזמנה קיימת: ${orderStatusInfo}
      נתוני מלאי: ${inventoryData}

      חוקים:
      1. בירור סטטוס: אם הלקוח שואל מתי יגיע או איפה ההזמנה, ענה לפי המידע לעיל (שעה ונהג).
      2. ביצוע הזמנה: אשר מוצרים בבולטים (•) והוסף SAVE_ORDER_DB:[SKU]:[QTY]. 
      3. איסוף פרטים: בקש שם (אם אורח), כתובת ושעת אספקה רצויה (ציין שהשעה תיקבע ע"י המשרד).
      4. הערות לקוח: אם יש הערה מיוחדת, הוסף פקודה: CLIENT_NOTE:[הטקסט].
      5. סגנון: קצר, מקצועי, ללא "בוס".

      הודעה: ${cleanMsg}
      היסטוריה: ${chatHistory}
    `;

    // הרצה מול Gemini
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

    // 4. טיפול ב-DB
    if (replyText.includes("SAVE_ORDER_DB:") || replyText.includes("CLIENT_NOTE:")) {
      const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || null;
      
      if (lastOrder && lastOrder.status === 'pending') {
        await supabase.from('orders').update({
          warehouse: lastOrder.warehouse + (replyText.includes("SAVE_ORDER_DB:") ? "\n• פריט נוסף עודכן" : ""),
          customer_note: clientNote || lastOrder.customer_note,
          has_new_note: !!clientNote
        }).eq('id', lastOrder.id);
      } else {
        await supabase.from('orders').insert([{
          client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
          warehouse: cleanMsg,
          customer_note: clientNote,
          has_new_note: !!clientNote,
          status: 'pending',
          order_time: new Date().toLocaleTimeString('he-IL')
        }]);
      }
    }

    // עדכון זיכרון ושם
    if (!currentUserName && cleanMsg.length < 15 && !cleanMsg.includes("?")) {
      currentUserName = cleanMsg.replace(/שמי|קוראים לי|אני/g, "").trim();
    }

    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nלקוח: " + cleanMsg + "\nבוט: " + replyText).slice(-1500)
    }, { onConflict: 'clientId' });

    // ניקוי פקודות לפני שליחה ללקוח
    const finalReply = replyText
      .replace(/CLIENT_NOTE:\[.*?\]/g, "")
      .replace(/SAVE_ORDER_DB:[\w:-]+/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    return res.status(200).json({ reply: "מצטער, נסה שוב." });
  }
}
