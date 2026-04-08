import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// בריכת המודלים המעודכנת
const MODEL_POOL = [
  "gemini-3.1-flash-lite-preview",
  "gemma-4-26b-a4b-it",
  "gemini-2.0-flash" 
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64, phone } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const targetPhone = String(phone || 'אורח');

  try {
    // 1. שליפת קונטקסט (זיכרון, מלאי, מכולות)
    const [inventory, customerMemory, containers] = await Promise.all([
      supabase.from('brain_inventory').select('*').limit(20),
      supabase.from('customer_memory').select('*').eq('clientId', targetPhone).single(),
      supabase.from('container_management').select('*').eq('client_phone', targetPhone).eq('is_active', true)
    ]);

    const memoryContext = customerMemory.data ? 
      `שם לקוח: ${customerMemory.data.user_name} | ידע צבור: ${customerMemory.data.accumulated_knowledge}` : 
      "לקוח חדש.";

    const inventoryContext = inventory.data?.map(item => 
      `* ${item.product_name} (${item.sku}) | כיסוי: ${item.coverage_rate}`
    ).join('\n');

    const prompt = `אתה רויטל מח.סבן. STRICT JSON ONLY.
    מלאי: ${inventoryContext}
    זיכרון: ${memoryContext}
    
    הנחיות:
    1. אם יש תמונה (Vision): נתח מוצר/שרטוט והצע פתרון מהמלאי.
    2. איסור שימוש במילה "בוס".
    
    JSON: { "reply": "...", "cart": [], "update_memory": "..." }`;

    // 2. לוגיקת הזרמת המידע וניסיונות חוזרים (MODEL_POOL)
    for (const modelName of MODEL_POOL) {
      try {
        const parts: any[] = [{ text: prompt }];
        
        // תמיכה במצלמה (Vision)
        if (imageBase64) {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
            }
          });
        }
        parts.push({ text: message || "ניתוח ויזואלי" });

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
          }
        );

        if (!aiRes.ok) continue; // אם המודל נכשל, עוברים לבא בתור ב-POOL

        const data = await aiRes.json();
        const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawReply) {
          const parsed = JSON.parse(rawReply.replace(/```json|```/g, "").trim());
          
          // 3. עדכון זיכרון לקוח בזמן אמת
          if (parsed.update_memory && targetPhone !== 'אורח') {
            await supabase.from('customer_memory').upsert({
              clientId: targetPhone,
              accumulated_knowledge: (customerMemory.data?.accumulated_knowledge || '') + '\n' + parsed.update_memory,
              updated_at: new Date()
            });
          }
          return res.status(200).json(parsed);
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
        continue;
      }
    }

    throw new Error("כל המודלים ב-POOL נכשלו");

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
