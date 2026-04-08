import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const MODEL_POOL = [
  "gemini-3.1-flash-lite-preview",
  "gemma-4-26b-a4b-it",
  "gemini-2.0-flash" 
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64 } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) return res.status(500).json({ error: "Missing API Key" });

  try {
    // שליפת מלאי עם דגש על שדות טכניים ויחס כיסוי
    const { data: inventory } = await supabase
      .from('brain_inventory')
      .select('product_name, sku, description, coverage_rate, rami_touch, unit:wastage_factor') 
      .limit(20);

    const inventoryContext = inventory?.map(item => 
      `* מוצר: ${item.product_name} | מק"ט: ${item.sku} | כיסוי: ${item.coverage_rate || 'לפי צורך'} | טיפ ראמי: ${item.rami_touch || 'אין'} | תיאור: ${item.description || 'אין'}`
    ).join('\n');

    for (const modelName of MODEL_POOL) {
      try {
        const isVisual = !!imageBase64;
        
        // פרום טכני, חד וממוקד ללא מילים מיותרות
const prompt = `STRICT JSON OUTPUT ONLY. DO NOT PROVIDE EXPLANATIONS. DO NOT PROVIDE CHAIN OF THOUGHT.
אתה המומחה הטכני של ח.סבן. 

מלאי זמין:
${inventoryContext}

הנחיות עבודה (חובה לביצוע):
1. זהה מוצרים לפי בקשת הלקוח.
2. חוסרים: מוצר לא במלאי יירשם כ"(הזמנה מיוחדת)".
3. חישוב: אם צוין שטח (מ"ר), חשב כמויות לפי יחס הכיסוי.
4. איסור מוחלט: אל תשתמש במילה "בוס".
5. תגובה: החזר אך ורק אובייקט JSON תקין. כל טקסט אחר שאינו JSON יגרום לקריסת המערכת.

מבנה ה-JSON הנדרש:
{
  "reply": "טקסט קצר ומקצועי בעברית בלבד",
  "cart": [{"name": "שם המוצר", "qty": 1, "unit": "יחידה"}]
}

הודעת לקוח: ${message}`;

הודעת לקוח/תוכן: ${message || "נתח תמונה מצורפת"}`;

        const parts: any[] = [{ text: prompt }];
        if (isVisual) {
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
            body: JSON.stringify({ contents: [{ parts }] })
          }
        );

        const data = await aiRes.json();
        const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawReply) {
          try {
            // ניקוי תגיות Markdown וחילוץ JSON נקי
            const cleanJson = rawReply.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            return res.status(200).json(parsed);
          } catch (e) {
            // גיבוי במקרה של כשל בחילוץ ה-JSON
            return res.status(200).json({ 
              reply: rawReply.replace(/\{.*\}/s, "").trim(), 
              cart: [] 
            });
          }
        }
      } catch (err) { continue; }
    }
    return res.status(500).json({ error: "Brain failure" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
