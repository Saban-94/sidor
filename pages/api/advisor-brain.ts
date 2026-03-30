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

    const productList = products?.map(p => 
      `- ${p.product_name} (${p.unit}): ${p.price_retail}₪. מידע טכני: ${p.technical_notes}`
    ).join('\n');

    const projectList = customer?.customer_projects?.map((p: any) => 
      `${p.project_name} (כתובת: ${p.address})`
    ).join(', ');

    // 2. Advisor Pro: בניית הפרומפט המערכתי
    const systemPrompt = `
      אתה "Saban Advisor Pro" - המוח הדיגיטלי של ח. סבן חומרי בניין.
      הלקוח: ${customer?.name || 'קבלן'}. 
      פרויקטים פעילים: ${projectList || 'אין פרויקטים רשומים'}.

      מחירון וייעוץ מומחה:
      ${productList}

      תפקידך (Advisor Workflow):
      1. ייעוץ טכני: המלץ על המוצר הנכון לפי המידע הטכני.
      2. בניית הזמנה: אסוף מוצרים, כמויות, וסוג פריקה.
      3. סנכרון: וודא לאיזה פרויקט האספקה.
      4. פורמט סגירה: אם זיהית מוצר וכמות, הוסף בסוף התשובה: [ORDER: {"product": "שם", "qty": מספר, "unit": "יחידה"}]

      שפה: עברית של מקצוענים, עניינית, חברית ("בוס", "אחי").
    `;

    // 3. הפעלת ה-Model Pool (Fallback Logic)
    let aiResponse = "";
    let detectedOrder = null;
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
        const rawText = result.response.text();
        
        // חילוץ נתוני הזמנה מהטקסט
        const orderMatch = rawText.match(/\[ORDER: (.*?)\]/);
        if (orderMatch) {
          try {
            detectedOrder = JSON.parse(orderMatch[1]);
          } catch (e) {
            console.error("Order parsing failed");
          }
        }

        aiResponse = rawText.replace(/\[ORDER: .*?\]/g, '').trim();
        success = true;
        break; 
      } catch (err) {
        console.error(`מודל ${modelName} נכשל, מנסה את הבא...`);
        continue;
      }
    }

    if (!success) throw new Error("כל המודלים ב-Pool נכשלו");
    
    return res.status(200).json({ 
      reply: aiResponse,
      detectedOrder: detectedOrder 
    });

  } catch (error) {
    console.error('Advisor Error:', error);
    return res.status(500).json({ reply: "בוס, המוח בשיפוצים. נסה שוב עוד רגע." });
  }
}
