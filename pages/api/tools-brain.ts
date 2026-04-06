import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

const MODEL_POOL = [
  "gemini-1.5-flash", 
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash" 
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64 } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. שליפת מלאי רלוונטי מתוך הטבלה brain_inventory
    const { data: inventory } = await supabase
      .from('brain_inventory')
      .select('product_name, sku, category, coverage_rate, rami_touch, description')
      .limit(10);

    const inventoryContext = inventory?.map(item => 
      `- ${item.product_name} (SKU: ${item.sku}): ${item.description}. טיפ של ראמי: ${item.rami_touch}`
    ).join('\n');

    for (const modelName of MODEL_POOL) {
      try {
        const isVisual = !!imageBase64;
        const prompt = `אתה המומחה של ח.סבן. המלאי הזמין כרגע:
        ${inventoryContext}
        
        הנחיות:
        1. אם הלקוח נותן מ"ר, ענה בפורמט JSON בלבד: {"reply": "טקסט חופשי", "cart": [{"name": "שם מוצר", "qty": כמות}]}
        2. השתמש במושגים מהמלאי (כמו "בלה סומסום" או "לוח גבס ניצן").
        3. אם זו תמונה, נתח אותה והצע פתרון מהמלאי.
        
        הודעת לקוח: ${message || "ניתוח תמונה"}`;

        const parts: any[] = [{ text: prompt }];
        if (isVisual) {
          parts.push({
            inline_data: { mime_type: "image/jpeg", data: imageBase64.replace(/^data:image\/\w+;base64,/, "") }
          });
        }

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
          }
        );

        const data = await aiRes.json();
        const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawReply) {
          // מנסה לחלץ JSON אם ה-AI החזיר אחד, אחרת מחזיר טקסט רגיל
          try {
            const parsed = JSON.parse(rawReply.replace(/```json|```/g, ""));
            return res.status(200).json(parsed);
          } catch {
            return res.status(200).json({ reply: rawReply });
          }
        }
      } catch (err) { continue; }
    }
    return res.status(500).json({ error: "Brain failure" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
