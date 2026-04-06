import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// שימוש ב-Service Role כדי לעקוף RLS בשרת במידת הצורך
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, message, chatHistory } = req.body;
  const cleanMsg = message?.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, מה נשמע? איך אני יכול לעזור?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (API Key missing)." });

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelPool = ["gemini-1.5-flash", "gemini-pro"]; // שימוש במודלים יציבים

  try {
    const cleanPhone = String(phone).replace(/[\[\]\s]/g, '');

    // 1. שלב הזהות: בדיקה אם הלקוח קיים, אם לא - יצירה אוטומטית
    let { data: customer } = await supabase
      .from('customers')
      .select('*, customer_projects(*)')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (!customer) {
      const { data: newCust, error: createErr } = await supabase
        .from('customers')
        .insert({ phone: cleanPhone, name: 'לקוח חדש' })
        .select('*, customer_projects(*)')
        .single();
      
      if (createErr) throw createErr;
      customer = newCust;
    }

    // 2. שלב הידע: שליפת מחירון פעיל
    const { data: products } = await supabase
      .from('products_catalog')
      .select('*')
      .eq('is_active', true);

    const productList = products?.map(p => 
      `- ${p.product_name} (${p.unit}): ${p.price_retail}₪. מפרט: ${p.technical_notes || 'סטנדרטי'}`
    ).join('\n');

    const projectList = customer?.customer_projects?.map((p: any) => 
      `- ${p.project_name} (כתובת: ${p.address || 'לא צוינה'})`
    ).join('\n') || 'אין פרויקטים רשומים כרגע.';

    // 3. Advisor Pro Prompt
    const systemPrompt = `
      אתה "Saban Advisor Pro" - המוח של ח. סבן.
      הלקוח הנוכחי: ${customer?.name || 'קבלן'} (טלפון: ${cleanPhone}).
      
      פרויקטים של הלקוח:
      ${projectList}

      מחירון ומידע טכני:
      ${productList}

      הנחיות עבודה:
      1. פנה ללקוח בשמו אם הוא ידוע. אם הוא חדש, ברך אותו והצע לפתוח פרויקט.
      2. אם הלקוח מבקש מוצר, וודא כמויות ולאיזה פרויקט זה מיועד.
      3. אם הוא מציין פרויקט חדש, אשר שקלטת.
      4. פקודות סמויות (הוסף בסוף התשובה במידת הצורך):
         - ליצירת פרויקט: [CREATE_PROJECT: "שם הפרויקט"]
         - לרישום הזמנה: [ORDER: {"product": "שם", "qty": מספר, "unit": "יחידה"}]

      שפה: עברית מקצועית, חברית, קצרה ולעניין.
    `;

    // 4. שליחת הודעה ל-Gemini
    let aiResponse = "";
    let finalOrder = null;
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
        console.error(`מודל ${modelName} נכשל, מנסה באק-אפ...`);
        continue;
      }
    }

    if (!success) throw new Error("AI Connection Failed");

    // 5. עיבוד פקודות (עבודה שחורה ב-DB)
    
    // א. יצירת פרויקט חדש אם ה-AI זיהה צורך
    const projectMatch = aiResponse.match(/\[CREATE_PROJECT: "(.*?)"\]/);
    if (projectMatch && customer?.id) {
      await supabase.from('customer_projects').insert({
        customer_id: customer.id,
        project_name: projectMatch[1]
      });
    }

    // ב. חילוץ אובייקט הזמנה לממשק
    const orderMatch = aiResponse.match(/\[ORDER: (.*?)\]/);
    if (orderMatch) {
      try { finalOrder = JSON.parse(orderMatch[1]); } catch (e) {}
    }

    // ניקוי הפקודות מהטקסט שחוזר ללקוח
    const cleanReply = aiResponse
      .replace(/\[CREATE_PROJECT:.*?\]/g, '')
      .replace(/\[ORDER:.*?\]/g, '')
      .trim();

    return res.status(200).json({ 
      reply: cleanReply,
      detectedOrder: finalOrder,
      customerName: customer?.name
    });

  } catch (error) {
    console.error('Advisor Error:', error);
    return res.status(200).json({ reply: "בוס, המערכת בעומס. אני בודק את זה וחוזר אליך." });
  }
}
