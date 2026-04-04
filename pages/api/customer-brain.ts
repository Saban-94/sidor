import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// פונקציית צייד מוצרים ברשת
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
  } catch (e) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-2.0-pro-exp-02-05", 
    "gemini-2.0-flash"
  ];

  if (!cleanMsg) return res.status(200).json({ reply: "שלום, במה אוכל לעזור?" });

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפת זיכרון לקוח
    let { data: memory } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge, user_name')
      .eq('clientId', phone)
      .maybeSingle();
    
    let currentUserName = memory?.user_name;

    // 2. זיהוי שם אוטומטי (רק אם זה לא חלק מהזמנה)
    if (!currentUserName && cleanMsg.length < 12 && !cleanMsg.includes("?") && !cleanMsg.includes("הזמנה")) {
      const extractedName = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      if (extractedName.length >= 2) {
        await supabase.from('customer_memory').upsert({ 
          clientId: phone, 
          user_name: extractedName 
        }, { onConflict: 'clientId' });
        currentUserName = extractedName;
      }
    }

    // 3. חיפוש מלאי ואימון
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let trainingAnswer = "";
    let inventoryData = "";

    if (searchWords.length > 0) {
      const { data: exactProduct } = await supabase
        .from('brain_inventory')
        .select('*')
        .or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`)
        .limit(1)
        .maybeSingle();

      if (exactProduct) {
        inventoryData = `מוצר נמצא במלאי: ${exactProduct.product_name}, מק"ט: ${exactProduct.sku}, מחיר: ${exactProduct.price}.`;
      } else {
        const { data: relatedProducts } = await supabase
          .from('brain_inventory')
          .select('product_name, sku, price, search_text')
          .or(searchWords.map(word => `search_text.ilike.%${word}%`).join(','))
          .limit(2);

        if (relatedProducts && relatedProducts.length > 0) {
          inventoryData = relatedProducts.map(p => 
            `מוצר רלוונטי במלאי: ${p.product_name}, מק"ט: ${p.sku}, מחיר: ${p.price}.`
          ).join("\n");
        } else {
          const hunted = await huntProductOnline(cleanMsg);
          if (hunted) {
            inventoryData = `מוצר חדש אותר ברשת (בדיקת מלאי ידנית נדרשת): ${hunted.product_name}, מק"ט זמני: ${hunted.sku}.`;
          }
        }
      }

      const orCondition = searchWords.map(word => `question.ilike.%${word}%`).join(',');
      const { data: matches } = await supabase.from('ai_training').select('answer').or(orCondition);
      if (matches && matches.length > 0) {
        trainingAnswer = matches.map(m => m.answer).join("\n");
      }
    }

    // 4. ה-PROMPT המעודכן - דרישת פרטים מאורח
    const prompt = `
      זהות: אתה איש מכירות חכם ב"ח.סבן חומרי בנין".
      לקוח נוכחי: ${currentUserName || 'אורח (לא מזוהה)'}.
      
      נתוני מלאי: ${inventoryData || "לא נמצאו מוצרים תואמים."}
      מידע פנימי: ${trainingAnswer || "אין."}

      חוקי הזמנה קריטיים:
      1. ביצוע הזמנה: כשהלקוח מבקש להזמין, אשר את רשימת המוצרים והמק"טים. 
      2. פקודת שמירה: לכל מוצר שהוזמן, חובה להוסיף בסוף: SAVE_ORDER_DB:[SKU]:[כמות].
      3. חוק האורח (חשוב): אם הלקוח מזוהה כ"אורח", אחרי אישור רשימת המוצרים, עליך לכתוב משפט דרישה: 
         "כדי להשלים את ההזמנה במערכת, אנא ציין את שמך המלא, מספר טלפון נייד וכתובת מדויקת לאספקה."
      4. SHOW_PRODUCT_CARD: הצג רק אם הלקוח שואל על מוצר ולא מזמין. אם הוא מזמין - אל תציג כרטיס.
      5. אל תשתמש במילה "בוס". היה מקצועי ותמציתי.

      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || "שיחה חדשה"}
    `;
    
    // 5. הרצה מול Gemini
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

    // 6. טיפול בהזרקת ההזמנה לטבלה
    if (replyText.includes("SAVE_ORDER_DB:")) {
      const phone = senderPhone?.replace('@c.us', '') || 'unknown';
      
      // חילוץ נקי של רשימת הפריטים
      const productLines = replyText.split('\n')
        .filter(line => line.includes('•') || line.includes('-') || line.includes('מק"ט') || line.includes('יחידות'))
        .map(line => line.replace(/[-•]/g, '').trim())
        .join('\n');

      await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        product_name: productLines.includes('\n') ? "📦 הזמנה מרובת פריטים" : (productLines.split('(')[0] || "הזמנה חדשה"),
        warehouse: productLines || cleanMsg,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL')
      }]);
      
      // הסרת הפקודות מהטקסט ללקוח
      replyText = replyText.replace(/SAVE_ORDER_DB:[\w:-]+/g, "").replace(/SHOW_PRODUCT_CARD:[\w:-]+/g, "").trim();
    }

    // 7. עדכון זיכרון
    const newKnowledge = ((memory?.accumulated_knowledge || "") + `\nלקוח: ${cleanMsg}\nבוט: ${replyText}`).slice(-1500);
    await supabase.from('customer_memory').upsert({ 
      clientId: phone, 
      accumulated_knowledge: newKnowledge 
    }, { onConflict: 'clientId' });

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Brain Error:", error);
    return res.status(200).json({ reply: "מצטער, חלה שגיאה במערכת. נסה שוב." });
  }
}
