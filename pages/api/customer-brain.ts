import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// פונקציית צייד מוצרים ברשת - לוגיקה מקורית
async function huntProductOnline(query: string) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  try {
    const resText = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + " מפרט טכני")}`);
    const dataText = await resText.json();
    const resImage = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=1`);
    const dataImage = await resImage.json();
    const imageUrl = dataImage.items?.[0]?.link || '';
    if (!dataText.items) return null;
    return {
      product_name: dataText.items[0].title.split('|')[0].trim(),
      description: dataText.items[0].snippet,
      image_url: imageUrl,
      sku: `AI-${Math.floor(1000 + Math.random() * 9000)}`,
      search_text: query.toLowerCase()
    };
  } catch (e) { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-pro-exp-02-05", "gemini-2.0-flash"];

  if (!cleanMsg) return res.status(200).json({ reply: "שלום, במה אוכל לעזור?" });

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. זיכרון לקוח
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge, user_name').eq('clientId', phone).maybeSingle();
    let currentUserName = memory?.user_name;

    // 2. חיפוש מלאי ואימון
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let inventoryData = "";
    let trainingAnswer = "";

    if (searchWords.length > 0) {
      const { data: exact } = await supabase.from('brain_inventory').select('*').or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`).limit(1).maybeSingle();
      if (exact) {
        inventoryData = `מוצר במלאי: ${exact.product_name}, מק"ט: ${exact.sku}, מחיר: ${exact.price}.`;
      } else {
        const { data: related } = await supabase.from('brain_inventory').select('product_name, sku').or(searchWords.map(word => `search_text.ilike.%${word}%`).join(',')).limit(2);
        if (related && related.length > 0) inventoryData = related.map(p => `${p.product_name} (מק"ט: ${p.sku})`).join(", ");
      }
      
      const { data: matches } = await supabase.from('ai_training').select('answer').or(searchWords.map(word => `question.ilike.%${word}%`).join(','));
      if (matches) trainingAnswer = matches.map(m => m.answer).join("\n");
    }

    // 3. ה-PROMPT המנצח - ללא סירובים
    const prompt = `
      זהות: אתה איש מכירות בכיר ב"ח.סבן חומרי בנין". הלקוח הוא: ${currentUserName || 'אורח'}.
      
      חוקים קריטיים:
      1. איסור סירוב: לעולם אל תגיד "אין במלאי" כסיבה לביטול הזמנה. אם מוצר לא נמצא בנתונים, אשר אותו כ"הזמנה בבדיקת מלאי ידנית".
      2. אישור הזמנה: כשהלקוח מבקש להזמין, אשר את כל הרשימה בבולטים (•). לכל פריט הוסף בסוף: SAVE_ORDER_DB:[SKU]:[כמות]. אם אין מק"ט, השתמש ב-SAVE_ORDER_DB:MANUAL:1.
      3. חוק האורח: אם הלקוח הוא "אורח", עליך לבקש בסוף האישור: "כדי שנשלים את ההזמנה, אנא ציין שם מלא, טלפון וכתובת למשלוח."
      4. SHOW_PRODUCT_CARD: הוסף רק אם הלקוח שואל "יש לכם X?". אם הוא כבר מזמין - אל תציג כרטיס.
      5. סגנון: תמציתי, מקצועי, ללא המילה "בוס".
      
      נתוני עזר: ${inventoryData} | ${trainingAnswer}
      הודעה: ${cleanMsg}
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

    // 4. הזרקת הזמנה לטבלה
    if (replyText.includes("SAVE_ORDER_DB:")) {
      const cleanLines = replyText.split('\n')
        .filter(l => l.includes('•') || l.includes('-') || l.includes('שקים') || l.includes('לוח'))
        .map(l => l.replace(/[-•]/g, '').trim())
        .join('\n');

      await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        product_name: cleanLines.includes('\n') ? "📦 סל מוצרים חדש" : "הזמנה חדשה",
        warehouse: cleanLines || cleanMsg,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL')
      }]);
      
      replyText = replyText.replace(/SAVE_ORDER_DB:[\w:-]+/g, "").replace(/SHOW_PRODUCT_CARD:[\w:-]+/g, "").trim();
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    return res.status(200).json({ reply: "מצטער, חלה שגיאה. נסה שוב." });
  }
}
