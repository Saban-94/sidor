import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-pro-exp-02-05", "gemini-2.0-flash"];

  try {
    // 1. שליפת זיכרון לקוח
    let { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name;
    let chatHistory = memory?.accumulated_knowledge || "";

    // 2. שליפת נתוני מלאי ואימון (לוגיקה קיימת ללא דריסה)
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let inventoryData = "";
    let trainingAnswer = "";
    if (searchWords.length > 0) {
      const { data: exact } = await supabase.from('brain_inventory').select('*').or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`).limit(1).maybeSingle();
      if (exact) inventoryData = `מוצר במלאי: ${exact.product_name}, מק"ט: ${exact.sku}, מחיר: ${exact.price}.`;
      const { data: matches } = await supabase.from('ai_training').select('answer').or(searchWords.map(word => `question.ilike.%${word}%`).join(','));
      if (matches) trainingAnswer = matches.map(m => m.answer).join("\n");
    }

    // 3. ה-PROMPT המנצח (פינג-פונג, זיכרון, פקודות UI)
    const prompt = `
      זהות: אתה איש המכירות והשירות המקצועי של "ח.סבן חומרי בנין". 
      לקוח: ${currentUserName || 'אורח (חדש)'}. 
      
      חוקי פינג-פונג (חובה):
      1. פתיחה לאורח: אם הלקוח אורח, ברך אותו בחום, הסבר שיוכל לבדוק מוצרים (כתוב שם מוצר) או להזמין (לחץ על כפתור), ובקש רק פרט אחד: "איך קוראים לך?".
      2. המשכיות: אם הלקוח מסר שם, ברך אותו בשמו והמשך לפרט הבא (טלפון/כתובת) רק אם הוא מבצע הזמנה.
      3. איסוף הזמנה: כשהלקוח מזמין, אשר את הפריטים בבולטים (•) והוסף: SAVE_ORDER_DB:[SKU]:[כמות]. אם אין מק"ט, השתמש ב-MANUAL.
      4. כרטיס מוצר: אם רק שאל על מוצר, הוסף: SHOW_PRODUCT_CARD:[SKU].
      5. סגנון: תמציתי מאוד, מקצועי, ללא המילה "בוס".

      מלאי/אימון: ${inventoryData} | ${trainingAnswer}
      היסטוריית שיחה: ${chatHistory.slice(-1000)}
      הודעת לקוח: ${cleanMsg}
    `;

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
      } catch (e) {}
    }

    // 4. עדכון זיכרון ושם (מאחורי הקלעים)
    if (!currentUserName && cleanMsg.length < 15 && !cleanMsg.includes("?") && !chatHistory.includes("שמי")) {
      currentUserName = cleanMsg.replace(/אני|שמי|קוראים לי/g, "").trim();
    }
    const updatedHistory = (chatHistory + `\nלקוח: ${cleanMsg}\nבוט: ${replyText}`).slice(-2000);
    await supabase.from('customer_memory').upsert({
      clientId: phone, user_name: currentUserName, accumulated_knowledge: updatedHistory, last_interaction: new Date().toISOString()
    }, { onConflict: 'clientId' });

    // 5. הזרקת הזמנה ל-DB (בלי דריסה)
    if (replyText.includes("SAVE_ORDER_DB:")) {
      const cleanItems = replyText.split('\n').filter(l => l.includes('•') || l.includes('-')).join('\n');
      await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        product_name: "📦 הזמנה חדשה", warehouse: cleanItems || cleanMsg, status: 'pending', order_time: new Date().toLocaleTimeString('he-IL')
      }]);
    }

    const finalReply = replyText.replace(/SAVE_ORDER_DB:[\w:-]+/g, "").replace(/SHOW_PRODUCT_CARD:[\w:-]+/g, "").trim();
    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    return res.status(200).json({ reply: "מצטער, נסה שוב." });
  }
}
