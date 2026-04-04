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

    // 2. זיהוי שם אוטומטי
    if (!currentUserName && cleanMsg.length < 12 && !cleanMsg.includes("?")) {
      const extractedName = cleanMsg.replace(/אני|שמי|זה|קוראים לי|נעים מאוד/g, "").trim();
      if (extractedName.length >= 2) {
        await supabase.from('customer_memory').upsert({ 
          clientId: phone, 
          user_name: extractedName 
        }, { onConflict: 'clientId' });
        currentUserName = extractedName;
      }
    }

    // 3. חיפוש מוצר ואימון - מותאם ל-brain_inventory
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let trainingAnswer = "";
    let inventoryData = "";

    if (searchWords.length > 0) {
      // א. חיפוש מוצר מדויק בטבלה החדשה
      const { data: exactProduct } = await supabase
        .from('brain_inventory')
        .select('*')
        .or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`)
        .limit(1)
        .maybeSingle();

      if (exactProduct) {
        inventoryData = `מוצר נמצא במלאי: ${exactProduct.product_name}, מק"ט: ${exactProduct.sku}, מחיר: ${exactProduct.price}, זמן ייבוש: ${exactProduct.dry_time || 'לפי יצרן'}, כיסוי: ${exactProduct.coverage_rate || 'משתנה'}.`;
      } else {
        // ב. חיפוש גמיש בטבלה החדשה
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
          // ג. ציד מוצרים ברשת (Web Hunt)
          const hunted = await huntProductOnline(cleanMsg);
          if (hunted) {
            const { data: saved, error: insertError } = await supabase
              .from('brain_inventory')
              .upsert([{
                sku: hunted.sku,
                product_name: hunted.product_name,
                description: hunted.description,
                image_url: hunted.image_url,
                search_text: hunted.search_text,
                price: 0
              }], { onConflict: 'sku' })
              .select()
              .single();

            if (!insertError && saved) {
              inventoryData = `מוצר חדש אותר ברשת ונשמר למערכת: ${saved.product_name}, מק"ט זמני: ${saved.sku}. תיאור: ${saved.description}`;
            } else {
              inventoryData = `מידע טכני שנמצא ברשת: ${hunted.product_name}. תיאור: ${hunted.description}`;
            }
          }
        }
      }

      // ד. חיפוש בטבלת אימון
      const orCondition = searchWords.map(word => `question.ilike.%${word}%`).join(',');
      const { data: matches } = await supabase
        .from('ai_training')
        .select('answer')
        .or(orCondition);
      
      if (matches && matches.length > 0) {
        trainingAnswer = matches.map(m => m.answer).join("\n");
      }
    }

      const prompt = `
      זהות: אתה שירות הלקוחות החכם של "ח.סבן חומרי בנין".
      לקוח: ${currentUserName || 'אורח'}.
      
      מידע פנימי (אימון): ${trainingAnswer || "אין."}
      נתוני מלאי: ${inventoryData || "לא נמצאו מוצרים תואמים."}

      חוקים קריטיים:
      1. זיהוי פריטים: אם הלקוח שואל על מוצר ספציפי, הוסף בסוף: SHOW_PRODUCT_CARD:[SKU].
      2. ריבוי מוצרים: אם הלקוח שואל על כמה מוצרים, הוסף את פקודת SHOW_PRODUCT_CARD עבור כל מק"ט שמצאת (למשל: SHOW_PRODUCT_CARD:11305 SHOW_PRODUCT_CARD:2020).
      3. ביצוע הזמנה (סל קניות): כאשר הלקוח אומר "אני רוצה להזמין" או "תזמין לי", אשר את כל הרשימה בנימוס. 
         במקרה כזה, חובה להוסיף עבור כל פריט את הפקודה: SAVE_ORDER_DB:[SKU]:[כמות].
      4. מניעת כפילות: אם ביצעת הזמנה (SAVE_ORDER_DB), אל תציג את ה-SHOW_PRODUCT_CARD עבור אותם מוצרים כדי לא להעמיס על המסך.
      5. לינק ישיר: עבור כל מוצר שהוזכר, צרף לינק: [🛒 לצפייה והזמנה](https://sidor.vercel.app/product/[SKU]).
      6. שפה: היה תמציתי ומקצועי. אל תשתמש במילה "בוס".
      
      פורמט אישור הזמנה רב-פריטים:
      "אני מאשר את קבלת הזמנתך:
      - כמות X של מוצר Y (מק"ט Z)
      - כמות A של מוצר B (מק"ט C)
      נציג יצור קשר בהקדם."

      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || "שיחה חדשה"}
    `;
    
    // 5. הרצה מול ה-AI
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

if (replyText.includes("SAVE_ORDER_DB:")) {
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  
  // חילוץ רק של שורות המוצרים (מסננים ברכות וטקסט חופשי)
  const productLines = replyText.split('\n')
    .filter(line => line.includes('•') || line.includes('-') || line.includes('מק"ט'))
    .map(line => line.replace(/[-•]/g, '').trim())
    .join('\n');

  await supabase.from('orders').insert([{
    client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
    product_name: productLines.includes('\n') ? "📦 הזמנה מרובת פריטים" : productLines.split('(')[0].trim(),
    warehouse: productLines, // רק רשימת הפריטים נקייה
    status: 'pending',
    order_time: new Date().toLocaleTimeString('he-IL')
  }]);
  
  replyText = replyText.replace(/SAVE_ORDER_DB:[\w:-]+/g, "").trim();
}

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    return res.status(200).json({ reply: "מצטער, נסה שוב." });
  }
}
