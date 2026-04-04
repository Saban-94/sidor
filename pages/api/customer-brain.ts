import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// פונקציית צייד מוצרים ברשת - לוגיקה מקורית ללא שינוי
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
      // חיפוש ב-brain_inventory
      const { data: exact } = await supabase.from('brain_inventory').select('*').or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`).limit(1).maybeSingle();
      if (exact) {
        inventoryData = `מוצר במלאי: ${exact.product_name}, מק"ט: ${exact.sku}, מחיר: ${exact.price}.`;
      } else {
        const { data: related } = await supabase.from('brain_inventory').select('product_name, sku').or(searchWords.map(word => `search_text.ilike.%${word}%`).join(',')).limit(2);
        if (related && related.length > 0) inventoryData = related.map(p => `${p.product_name} (מק"ט: ${p.sku})`).join(", ");
      }
      
      // חיפוש ב-ai_training
      const { data: matches } = await supabase.from('ai_training').select('answer').or(searchWords.map(word => `question.ilike.%${word}%`).join(','));
      if (matches) trainingAnswer = matches.map(m => m.answer).join("\n");
    }

    // 3. ה-PROMPT המנצח - הצלבה של כל הלוגיקות
    const prompt = `
      זהות: אתה שירות הלקוחות החכם של "ח.סבן חומרי בנין". הלקוח הוא: ${currentUserName || 'אורח'}.
      מידע פנימי (אימון): ${trainingAnswer || "אין."}
      נתוני מלאי: ${inventoryData || "לא נמצאו מוצרים תואמים."}

      חוקים קריטיים:
      1. זיהוי פריטים: אם הלקוח שואל על מוצר, הוסף בסוף: SHOW_PRODUCT_CARD:[SKU]. לריבוי פריטים, הוסף פקודה לכל מק"ט.
      2. ביצוע הזמנה (סל קניות): כשהלקוח מבקש להזמין ("אני רוצה להזמין", "תזמין לי"), אשר את כל הרשימה בבולטים (•).
         חובה להוסיף לכל פריט בסוף: SAVE_ORDER_DB:[SKU]:[כמות]. אם אין מק"ט, השתמש ב-SAVE_ORDER_DB:MANUAL:[כמות].
      3. חוק האורח (פינג-פונג): אם הלקוח הוא "אורח" ומזמין, אשר את הליקוט ומיד בקש פרט אחד: "כדי להשלים את ההזמנה, מה שמך המלא?". בשלבים הבאים תבקש נייד וכתובת.
      4. מניעת כפילות: אם ביצעת הזמנה (SAVE_ORDER_DB), אל תציג את ה-SHOW_PRODUCT_CARD לאותו מוצר.
      5. לינק ישיר: לכל מוצר במלאי הוסף: [🛒 לצפייה והזמנה](https://sidor.vercel.app/product/[SKU]).
      6. איסור סירוב: לעולם אל תגיד "אין במלאי". אם מוצר לא נמצא, אשר כ"הזמנה בבדיקה ידנית".
      7. שפה: תמציתי ומקצועי. אל תשתמש במילה "בוס".

      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || "שיחה חדשה"}
    `;

    // 4. הרצה מול Gemini
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

    // 5. הזרקת הזמנה לטבלה (ניקוי וליקוט)
    if (replyText.includes("SAVE_ORDER_DB:")) {
      const phone = senderPhone?.replace('@c.us', '') || 'unknown';
      const cleanLines = replyText.split('\n')
        .filter(l => l.includes('•') || l.includes('-') || l.includes('שקים') || l.includes('לוח') || l.includes('מק"ט'))
        .map(l => l.replace(/[-•]/g, '').trim())
        .join('\n');

      await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        product_name: cleanLines.includes('\n') ? "📦 הזמנה מרובת פריטים" : "הזמנה חדשה",
        warehouse: cleanLines || cleanMsg,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL')
      }]);
      
      // ניקוי פקודות מהטקסט ללקוח
      replyText = replyText.replace(/SAVE_ORDER_DB:[\w:-]+/g, "").replace(/SHOW_PRODUCT_CARD:[\w:-]+/g, "").trim();
    }

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    return res.status(200).json({ reply: "מצטער, חלה שגיאה קטנה. נסה שוב." });
  }
}
