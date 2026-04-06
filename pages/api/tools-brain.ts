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
        const prompt = `אתה המומחה של ח.סבן. :

         ${inventoryContext} 
הנחיות קריטיות למכירה:
1. אם הלקוח מבקש מוצר שמופיע במלאי לעיל - השתמש בפרטים המדויקים (SKU, יחס כיסוי).
2. אם הלקוח מבקש מוצר ש**לא** מופיע במלאי (כמו "מלט אפור") - אל תסרב! 
   הוסף אותו ל-JSON תחת השם שהלקוח ביקש והוסף בסוגריים "(הזמנה מיוחדת)".
3. תמיד תחזיר תשובה בפורמט JSON: 
   {"reply": "טקסט חופשי ללקוח", "cart": [{"name": "שם המוצר", "qty": כמות, "unit": "יחידה"}]}
4. בטקסט החופשי (reply), תסביר ללקוח שרשמת לו את המוצר כהזמנה מיוחדת והמחסן יחזור אליו.
5. אל תשתמש בשם בוס.

הודעת לקוח: ${message}`;


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
