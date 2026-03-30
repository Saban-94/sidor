import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, message, chatHistory } = req.body;
  const cleanMsg = message?.trim();
  const apiKey = process.env.GEMINI_API_KEY;
  // --- הגנות בסיס ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (API Key missing)." });

  // --- Expert Core: Model Pool ---
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash"];
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 1. Instant Sync: שליפת קונטקסט לקוח ומחירון
    const cleanPhone = String(phone).replace(/[\[\]\s]/g, '');
    
    const [{ data: customer }, { data: products }] = await Promise.all([
      supabase.from('customers').select('*, customer_projects(*)').eq('phone', cleanPhone).single(),
      supabase.from('products_catalog').select('*').eq('is_active', true)
    ]);

    const productContext = products?.map(p => 
      `- ${p.product_name} (${p.unit}): ${p.price_retail}₪. מידע טכני: ${p.technical_notes}`
    ).join('\n');

    const projectContext = customer?.customer_projects?.map((p: any) => 
      `${p.project_name} (כתובת: ${p.address})`
    ).join(', ');

    // 2. Advisor Pro: בניית הפרומפט המערכתי
   // שליפת מחירון ונתוני לקוח לסנכרון
    const [{ data: customer }, { data: products }] = await Promise.all([
      supabase.from('customers').select('*, customer_projects(*)').eq('phone', cleanPhone).single(),
      supabase.from('products_catalog').select('*').eq('is_active', true)
    ]);

    const systemPrompt = `
      אתה Saban Advisor Pro. 
      תפקידך: לעזור ללקוח (${customer?.name}) להזמין חומרי בניין או מכולות.
      
      מחירון זמין:
      ${products?.map(p => `- ${p.product_name} (${p.unit}): ${p.price_retail}₪`).join('\n')}

      חוקים לסגירת מעגל:
      1. אם הלקוח מבקש מוצר, ענה לו באדיבות ואשר את הכמות.
      2. בסוף כל הודעה שבה זיהית מוצר, הוסף שורה בפורמט הבא: [ORDER: {"product": "שם", "qty": מספר, "unit": "יחידה"}]
      3. אם הלקוח בחר פרויקט, ציין זאת.
    `;

    // 3. הפעלת ה-Model Pool (Fallback Logic)
    let aiResponse = "";
    let success = false;

    for (const modelName of modelPool) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
          history: (chatHistory || []).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        });

        const result = await chat.sendMessage(`${systemPrompt}\n\nהודעת הלקוח: ${cleanMsg}`);
        aiResponse = result.response.text();
        success = true;
        break; 
      } catch (err) {
        console.error(`מודל ${modelName} נכשל, מנסה את הבא...`);
        continue;
      }
    }

    if (!success) throw new Error("כל המודלים ב-Pool נכשלו");
    
    return res.status(200).json({ reply: aiResponse });

  } catch (error) {
    console.error('Advisor Error:', error);
    return res.status(500).json({ reply: "בוס, המוח בשיפוצים. נסה שוב עוד רגע." });
  }
}
