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
    // 1. חיפוש טקסט (מפרט)
    const resText = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + " מפרט טכני")}`);
    const dataText = await resText.json();
    
    // 2. חיפוש תמונה (חדש!)
    const resImage = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=1`);
    const dataImage = await resImage.json();
    
    const imageUrl = dataImage.items?.[0]?.link || ''; // הלינק לתמונה הראשונה שנמצאה

    if (!dataText.items) return null;

    return {
      product_name: dataText.items[0].title.split('|')[0].trim(),
      description: dataText.items[0].snippet,
      image_url: imageUrl, // מזריקים את הלינק לתמונה
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
// 3. חיפוש מוצר ואימון
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let trainingAnswer = "";
    let inventoryData = "";

    if (searchWords.length > 0) {
      // א. חיפוש מוצר מדויק במלאי (Exact Match)
      const { data: exactProduct } = await supabase
        .from('inventory')
        .select('*')
        .or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`)
        .limit(1)
        .maybeSingle();

      if (exactProduct) {
        console.log("Found exact product:", exactProduct.sku);
        inventoryData = `מוצר נמצא במלאי: ${exactProduct.product_name}, מק"ט: ${exactProduct.sku}, מחיר: ${exactProduct.price}, צריכה: ${exactProduct.consumption_per_mm}, שק: ${exactProduct.packaging_size}.`;
      } else {
        // ב. חיפוש גמיש במלאי (Partial Match)
        const { data: relatedProducts } = await supabase
          .from('inventory')
          .select('product_name, sku, price, search_text')
          .or(searchWords.map(word => `search_text.ilike.%${word}%`).join(','))
          .limit(2);

        if (relatedProducts && relatedProducts.length > 0) {
          console.log("Found related products in inventory");
          inventoryData = relatedProducts.map(p => 
            `מוצר רלוונטי במלאי: ${p.product_name}, מק"ט: ${p.sku}, מחיר: ${p.price}.`
          ).join("\n");
        } else {
          // ג. ציד מוצרים ברשת (Web Hunt) - רק אם לא נמצא כלום במלאי
          console.log("Nothing in inventory, starting web hunt for:", cleanMsg);
          const hunted = await huntProductOnline(cleanMsg);
          
          if (hunted) {
            // הזרקה למערכת עם טיפול בשגיאות (Ingestion)
            const { data: saved, error: insertError } = await supabase
              .from('inventory')
              .upsert([{
                sku: hunted.sku,
                product_name: hunted.product_name,
                description: hunted.description,
                search_text: hunted.search_text,
                is_ai_learned: true,
                price: 0
              }], { onConflict: 'sku' }) // מונע כפילויות מק"ט
              .select()
              .single();

            if (insertError) {
              console.error("Database Ingestion Error:", insertError.message);
              // גם אם נכשלה השמירה, עדיין נשתמש במידע שהמוח מצא כדי לענות
              inventoryData = `מידע טכני שנמצא ברשת: ${hunted.product_name}. תיאור: ${hunted.description}`;
            } else if (saved) {
              console.log("Successfully saved hunted product:", saved.sku);
              inventoryData = `מוצר חדש אותר ברשת ונשמר למערכת: ${saved.product_name}, מק"ט זמני: ${saved.sku}. תיאור: ${saved.description}`;
            }
          }
        }
      }

      // ד. חיפוש בטבלת אימון (AI Training Table)
      const orCondition = searchWords.map(word => `question.ilike.%${word}%`).join(',');
      const { data: matches } = await supabase
        .from('ai_training')
        .select('answer')
        .or(orCondition);
      
      if (matches && matches.length > 0) {
        trainingAnswer = matches.map(m => m.answer).join("\n");
      }
    }

    // 4. בניית ה-Prompt
    const prompt = `
      זהות: אתה שירות הלקוחות החכם של "ח.סבן חומרי בנין".
      לקוח: ${currentUserName || 'אורח'}.
      
      מידע פנימי (אימון): ${trainingAnswer || "אין."}
      נתוני מלאי: ${inventoryData || "לא נמצאו מוצרים תואמים."}

      חוקים:
      1. אם מצאת מוצר (גם כזה שנלמד עכשיו), הוסף בסוף: SHOW_PRODUCT_CARD:[SKU].
      2. לינק להזמנה: [🛒 לצפייה והזמנה](https://sidor.vercel.app/product/[SKU]).
      3. אם המוצר "חדש מהרשת", ציין שזה מידע טכני כללי ומומלץ לוודא זמינות סופית מול הנציג.
      4. היה תמציתי ומקצועי. אל תשתמש במילה "בוס".
      
      הודעה: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || "שיחה חדשה"}
    `;

    // 5. הרצה מול ה-AI (עם Fallback)
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) { replyText = text; break; }
      } catch (e) { console.error(`Fallback error: ${modelName}`); }
    }

    if (!replyText) throw new Error("No AI response");

    // 6. עדכון זיכרון
    const newKnowledge = ((memory?.accumulated_knowledge || "") + `\nלקוח: ${cleanMsg}\nבוט: ${replyText}`).slice(-1200);
    await supabase.from('customer_memory').upsert({ 
      clientId: phone, 
      accumulated_knowledge: newKnowledge 
    }, { onConflict: 'clientId' });

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Brain Error:", error);
    return res.status(200).json({ reply: "מצטער, אני חווה עומס קל. נסה שוב בעוד רגע." });
  }
}
