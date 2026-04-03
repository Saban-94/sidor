import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
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

    // 3. חיפוש מוצר ואימון - לוגיקה מדויקת
    const searchWords = cleanMsg.split(/\s+/).filter(word => word.length >= 3);
    let trainingAnswer = "";
    let inventoryData = "";

    if (searchWords.length > 0) {
      // א. חיפוש מוצר מדויק במלאי (עדיפות עליונה)
      const { data: exactProduct } = await supabase
        .from('inventory')
        .select('product_name, sku, consumption_per_mm, packaging_size, price, search_text')
        .or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`)
        .limit(1)
        .maybeSingle();

      if (exactProduct) {
        inventoryData = `מוצר מדויק נמצא: ${exactProduct.product_name}, מק"ט: ${exactProduct.sku}, מחיר: ${exactProduct.price}, צריכה: ${exactProduct.consumption_per_mm}, שק: ${exactProduct.packaging_size}. לינק: https://sidor.vercel.app/product/${exactProduct.sku}`;
      } else {
        // ב. חיפוש גמיש אם לא נמצא מוצר מדויק
        const { data: relatedProducts } = await supabase
          .from('inventory')
          .select('product_name, sku, consumption_per_mm, packaging_size, price')
          .or(searchWords.map(word => `search_text.ilike.%${word}%`).join(','))
          .limit(2);

        if (relatedProducts && relatedProducts.length > 0) {
          inventoryData = relatedProducts.map(p => 
            `מוצר רלוונטי: ${p.product_name}, מק"ט: ${p.sku}, מחיר: ${p.price}, צריכה: ${p.consumption_per_mm}, שק: ${p.packaging_size}. לינק: https://sidor.vercel.app/product/${p.sku}`
          ).join("\n");
        }
      }

      // ג. חיפוש בטבלת אימון (תמיד רץ במקביל)
      const orCondition = searchWords.map(word => `question.ilike.%${word}%`).join(',');
      const { data: matches } = await supabase
        .from('ai_training')
        .select('answer')
        .or(orCondition);
      
      if (matches && matches.length > 0) {
        trainingAnswer = matches.map(m => m.answer).join("\n\n---\n\n");
      }
    }

    // 4. בניית ה-Prompt
    const prompt = `
      זהות: אתה שירות הלקוחות החכם של "ח.סבן חומרי בנין" (חומרי בניין ולוגיסטיקה).
      לקוח: ${currentUserName || 'אורח'}.
      
      מידע פנימי (אימון): 
      ${trainingAnswer || "אין מידע ספציפי."}
      
      נתוני מלאי חיים:
      ${inventoryData || "לא נמצאו מוצרים תואמים במלאי."}

      חוקים קשיחים:
      1. אם מצאת מוצר במלאי, ענה עליו במקצועיות והוסף בסוף התשובה את הקוד: SHOW_PRODUCT_CARD:[SKU] (החלף [SKU] במק"ט האמיתי).
      2. השתמש בלינק הקסם: [🛒 לצפייה והזמנה](https://sidor.vercel.app/product/[SKU]).
      3. פנה ללקוח בשמו אם הוא ידוע.
      4. אל תשתמש לעולם במילה "בוס".
      5. היה תמציתי ומקצועי. שמור על פורמט Markdown.
      
      הודעת הלקוח: ${cleanMsg}
      היסטוריה: ${memory?.accumulated_knowledge || "שיחה חדשה"}
    `;

    // 5. הרצה מול ה-AI
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (text) {
          replyText = text;
          break;
        }
      } catch (e) {
        console.error(`Error with model ${modelName}:`, e);
      }
    }

    if (!replyText) throw new Error("All models failed");

    // 6. עדכון זיכרון
    const newKnowledge = ((memory?.accumulated_knowledge || "") + `\nלקוח: ${cleanMsg}\nבוט: ${replyText}`).slice(-1200);
    await supabase.from('customer_memory').upsert({ 
      clientId: phone, 
      accumulated_knowledge: newKnowledge 
    }, { onConflict: 'clientId' });

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Brain Error:", error);
    return res.status(200).json({ reply: "מצטער, אני חווה עומס קל. תוכל לנסות שוב בעוד רגע?" });
  }
}
