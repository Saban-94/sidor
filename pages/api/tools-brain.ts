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

  const { message, imageBase64, phone } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const targetPhone = String(phone || 'אורח');

  try {
    // 1. שליפת "בריכת המידע" על הלקוח (Context)
    const [inventory, customerMemory, containers, projects] = await Promise.all([
      supabase.from('brain_inventory').select('*').limit(15),
      supabase.from('customer_memory').select('*').eq('clientId', targetPhone).single(),
      supabase.from('container_management').select('*').eq('client_phone', targetPhone).eq('is_active', true),
      supabase.from('customer_projects').select('*').eq('customer_id', targetPhone)
    ]);

    // 2. בניית הזיכרון עבור רויטל
    const memoryContext = customerMemory.data ? 
      `שם לקוח: ${customerMemory.data.user_name} | ידע צבור: ${customerMemory.data.accumulated_knowledge}` : 
      "לקוח חדש - יש לבצע תהליך הקמה (שם, עסק, כתובת).";

    const logisticContext = containers.data?.length ? 
      `מכולות פעילות: ${containers.data.map(c => `${c.container_size} ב${c.delivery_address}`).join(', ')}` : 
      "אין מכולות פעילות כרגע.";

    const inventoryContext = inventory.data?.map(item => 
      `* ${item.product_name} (${item.sku}) | כיסוי: ${item.coverage_rate}`
    ).join('\n');

    const prompt = `אתה רויטל, מנהלת הלוגיסטיקה החכמה של ח.סבן. 
STRICT JSON OUTPUT ONLY.

זיכרון לקוח:
${memoryContext}

מצב לוגיסטי נוכחי:
${logisticContext}

מלאי טכני:
${inventoryContext}

הנחיות לרויטל:
1. זיהוי: אם הלקוח מזוהה, פני אליו בשמו. אם חדש, דרשי בנימוס שם וכתובת עסק.
2. הקשר לוגיסטי: אם יש לו מכולה פעילה, התייחסי אליה (פינוי? החלפה?).
3. מכירה: הציעי מוצרים משלימים לפי ההיסטוריה שלו.
4. איסור: אל תשתמשי במילה "בוס".
5. תגובה: החזירי JSON בלבד.

{
  "reply": "טקסט אישי ומקצועי",
  "cart": [{"name": "מוצר", "qty": 1}],
  "update_memory": "מידע חדש ללמידה על הלקוח (אם יש)"
}

הודעה: ${message}`;

    // 3. הרצת המודל (לוגיקת ה-Retry נשמרת)
    for (const modelName of MODEL_POOL) {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      const data = await aiRes.json();
      const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawReply) {
        const parsed = JSON.parse(rawReply.replace(/```json|```/g, "").trim());
        
        // 4. עדכון הזיכרון ב-Supabase במידה ורויטל למדה משהו חדש
        if (parsed.update_memory && targetPhone !== 'אורח') {
          await supabase.from('customer_memory').upsert({
            clientId: targetPhone,
            accumulated_knowledge: (customerMemory.data?.accumulated_knowledge || '') + '\n' + parsed.update_memory,
            updated_at: new Date()
          });
        }

        return res.status(200).json(parsed);
      }
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
