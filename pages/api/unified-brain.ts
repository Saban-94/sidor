import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// בריכת המודלים לגיבוי וביצועי Vision
const MODEL_POOL = [
  "gemini-2.0-flash", 
  "gemini-3.1-flash-lite-preview",
  "gemini-1.5-flash"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64, senderPhone } = req.body;
  const targetPhone = String(senderPhone || 'אורח');
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. איסוף "בריכת המידע" (Context) מכל הטבלאות במקביל
    const [inventory, customerMemory, containers, projects] = await Promise.all([
      supabase.from('brain_inventory').select('*').limit(20),
      supabase.from('customer_memory').select('*').eq('clientId', targetPhone).single(),
      supabase.from('container_management').select('*').eq('client_phone', targetPhone).eq('is_active', true),
      supabase.from('customer_projects').select('*').eq('customer_id', targetPhone)
    ]);

    // בניית זיכרון וקונטקסט לרויטל
    const memoryContext = customerMemory.data ? 
      `שם לקוח: ${customerMemory.data.user_name} | ידע צבור: ${customerMemory.data.accumulated_knowledge}` : 
      "לקוח חדש - בצע תהליך הקמה.";

    const logisticContext = containers.data?.length ? 
      `מכולות פעילות בשטח: ${containers.data.map(c => `${c.container_size} ב-${c.delivery_address}`).join(', ')}` : 
      "אין מכולות פעילות.";

    const inventoryContext = inventory.data?.map(item => 
      `* ${item.product_name} (${item.sku}) | כיסוי: ${item.coverage_rate || 'לפי צורך'}`
    ).join('\n');

    const systemPrompt = `
      אתה רויטל, מנהלת הלוגיסטיקה החכמה של ה. סבן. עני בסגנון מקצועי וחברי.
      
      מלאי זמין: ${inventoryContext}
      זיכרון לקוח: ${memoryContext}
      מצב לוגיסטי: ${logisticContext}

      הנחיות קריטיות:
      1. אם יש תמונה (imageBase64): נתחי אותה (מוצר/שרטוט) והציעי פתרון מהמלאי.
      2. אם זוהתה הזמנה, החזירי אובייקט cart.
      3. איסור מוחלט על המילה "בוס".
      4. החזירי אך ורק JSON תקין.
      
      JSON Structure:
      {
        "reply": "התשובה שלך",
        "cart": [{"name": "שם המוצר", "qty": 1}],
        "orderPlaced": true/false,
        "update_memory": "תובנה חדשה על הלקוח ללמידה"
      }
    `;

    // 2. לוגיקת MODEL_POOL עם תמיכה במצלמה
    for (const modelName of MODEL_POOL) {
      try {
        const parts: any[] = [{ text: message || "ניתוח תמונה..." }];
        if (imageBase64) {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
            }
          });
        }

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (!aiRes.ok) continue;

        const data = await aiRes.json();
        const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

        // 3. סגירת מעגל: עדכון זיכרון ותיעוד לוגים
        if (result.update_memory && targetPhone !== 'אורח') {
          await supabase.from('customer_memory').upsert({
            clientId: targetPhone,
            accumulated_knowledge: (customerMemory.data?.accumulated_knowledge || '') + '\n' + result.update_memory,
            updated_at: new Date()
          });
        }

        await supabase.from('logs').insert({
          customer_phone: targetPhone,
          message: message,
          reply: result.reply,
          is_order: result.orderPlaced
        });

        return res.status(200).json(result);

      } catch (e) { continue; }
    }

    throw new Error("All models failed");

  } catch (error: any) {
    return res.status(500).json({ reply: "רויטל עמוסה כרגע, נסה שוב אחי.", error: error.message });
  }
}
