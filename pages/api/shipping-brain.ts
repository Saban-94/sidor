import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
export const config = { runtime: 'edge' };
// בריכת מודלים חסינה שתומכת ב-Vision
const MODEL_POOL = [
  "gemini-3.1-pro-preview",       // הכי חכם לניתוח PDF מורכב וכתב יד קשה
  "gemini-3.1-flash-lite-preview", // הכי מהיר וזול לעיבוד תעודות משלוח המוני
  "gemini-3.1-flash-image-preview" // מומחה ה-Vision החדש (Nano Banana 2) לניתוח ויזואלי חד
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64, phone } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const targetPhone = String(phone || 'אורח');

  if (!geminiKey) return res.status(500).json({ error: "Missing API Key" });

  try {
    // 1. שליפת קונטקסט (זיכרון ומלאי)
    const [inventory, customerMemory] = await Promise.all([
      supabase.from('brain_inventory').select('*').limit(20),
      supabase.from('customer_memory').select('*').eq('clientId', targetPhone).single()
    ]);

    const memoryContext = customerMemory.data ? 
      `לקוח: ${customerMemory.data.user_name} | ידע: ${customerMemory.data.accumulated_knowledge}` : 
      "לקוח חדש.";

    const inventoryContext = inventory.data?.map(item => 
      `* ${item.product_name} (${item.sku})`
    ).join('\n') || "המלאי בטעינה...";

    const prompt = `אתה joni מחברת ח.סבן. ענה תמיד בפורמט JSON בלבד.
    מלאי זמין: ${inventoryContext}
    היסטוריית לקוח: ${memoryContext}
    
    הנחיות קריטיות:
    - אם יש תמונה: נתח אותה והצע מוצר תואם מהמלאי.
    - אל תשתמש במילה "בוס".
    - החזר JSON במבנה הבא: { "reply": "תשובה ללקוח", "cart": [{"name": "שם", "qty": 1}], "update_memory": "תמצית לזיכרון" }`;

    for (const modelName of MODEL_POOL) {
      try {
        const parts: any[] = [{ text: prompt }];
        
        if (imageBase64) {
          // ניקוי Base64 קשיח למניעת שגיאות פורמט
          const base64Data = imageBase64.includes('base64,') 
            ? imageBase64.split('base64,')[1] 
            : imageBase64;

          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          });
        }
        
        parts.push({ text: message || (imageBase64 ? "נתח את התמונה ששלחתי" : "") });

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
          }
        );

        if (!aiRes.ok) continue;

        const data = await aiRes.json();
        let rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawReply) {
          // ניקוי Markdown ושאריות טקסט מה-JSON
          const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;
          
          const parsed = JSON.parse(jsonMatch[0]);
          
          // עדכון זיכרון ב-Supabase
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
        console.warn(`Model ${modelName} fail`, err);
        continue;
      }
    }

    return res.status(500).json({ error: "כל המודלים נכשלו בפענוח ה-JSON" });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
