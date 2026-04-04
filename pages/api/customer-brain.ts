import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

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
    let orderStatusInfo = lastOrder ? `סטטוס הזמנה אחרונה (#${lastOrder.order_number}): ${lastOrder.status}. שעה משוריינת: ${lastOrder.delivery_time || 'טרם נקבעה'}. נהג/מנוף: ${lastOrder.driver_info || 'טרם שויך'}.` : "אין הזמנה פעילה.";

    // 2. חיפוש מלאי (לוגיקה מקורית)
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let inventoryData = "";
    if (searchWords.length > 0) {
      const { data: exact } = await supabase.from('brain_inventory').select('*').or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`).limit(1).maybeSingle();
      if (exact) inventoryData = `מוצר במלאי: ${exact.product_name}, מק"ט: ${exact.sku}.`;
    }

    // 3. ה-PROMPT המתוחכם (סדרן עבודה)
    const prompt = `
      זהות: אתה סדרן ההזמנות של "ח.סבן". לקוח: ${currentUserName || 'אורח'}.
      מידע על הזמנה קיימת: ${orderStatusInfo}
      נתוני מלאי: ${inventoryData}

      חוקים:
      1. בירור סטטוס: אם הלקוח שואל "מתי יגיע", "איפה ההזמנה" - בדוק במידע לעיל וענה במדויק (שעה ונהג). אם אין שעה, ציין שזה בטיפול.
      2. ביצוע הזמנה: אשר מוצרים בבולטים (•) והוסף SAVE_ORDER_DB:[SKU]:[QTY]. 
      3. איסוף פרטים (פינג-פונג): בקש שם (אם אורח), כתובת מדויקת ושעת אספקה רצויה. ציין ששעת האספקה תיקבע סופית ע"י המשרד.
      4. הערות לקוח: אם הלקוח שולח הערה ("דחוף לי", "קומה 3"), הוסף פקודה: CLIENT_NOTE:[הטקסט].
      5. סגנון: קצר, מקצועי, ללא "בוס".

      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || ""}
    `;

    // הרצה מול Gemini
    let replyText = "";
    for (const modelName of modelPool) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      if (replyText) break;
    }

    // 4. טיפול ב-DB (איחוד הזמנה והערות)
    if (replyText.includes("SAVE_ORDER_DB:") || replyText.includes("CLIENT_NOTE:")) {
      const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || null;
      
      if (lastOrder && lastOrder.status === 'pending') {
        // עדכון הזמנה קיימת
        await supabase.from('orders').update({
          warehouse: lastOrder.warehouse + (replyText.includes("SAVE_ORDER_DB:") ? "\n• פריט נוסף עודכן" : ""),
          customer_note: clientNote || lastOrder.customer_note,
          has_new_note: !!clientNote // מדליק את הזיקית
        }).eq('id', lastOrder.id);
      } else {
        // יצירת חדשה
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

    // עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, user_name: currentUserName, accumulated_knowledge: (chatHistory + "\n" + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    return res.status(200).json({ reply: replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").trim() });
  } catch (e) { return res.status(200).json({ reply: "נסה שוב." }); }
}
