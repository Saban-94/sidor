import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { phone, message, imageBase64, chatHistory } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey!);

  try {
    const cleanPhone = String(phone).replace(/[\[\]\s]/g, '');

    // 1. סנכרון לקוח ופרויקטים (לינק הקסם)
    let { data: customer } = await supabase
      .from('customers')
      .select('*, customer_projects(*)')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (!customer) {
      const { data: newCust } = await supabase
        .from('customers')
        .insert({ phone: cleanPhone, name: 'לקוח חדש' })
        .select('*, customer_projects(*)')
        .single();
      customer = newCust;
    }

    // 2. הגדרת המודל - תמיכה ב-Multimodal (טקסט + תמונה)
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    // 3. בניית הפרומפט המערכתי למומחה טכני
    const systemPrompt = `
      אתה "Saban Vision Expert" - מומחה טכני לבנייה ותשתיות.
      הלקוח: ${customer?.name}. פרויקטים: ${customer?.customer_projects?.map((p:any) => p.project_name).join(', ')}.
      
      תפקידך:
      - אם נשלחה תמונה: נתח את מצב השטח, זהה חוסרים או תקלות טכניות.
      - ייעוץ: תן רשימת פתרונות פרקטיים (חומרים, כמויות, שיטת עבודה).
      - הזמנה: אם זיהית צורך במוצר מהמחירון, הצע אותו ללקוח.
      
      פורמט תגובה:
      1. אבחון מהיר (מה רואים בתמונה).
      2. רשימת פתרונות מומלצת.
      3. הצעה להזמנה בפורמט [ORDER: {"product": "...", "qty": ...}].
    `;

    let promptParts: any[] = [`${systemPrompt}\n\nהודעה: ${message}`];

    // אם עברה תמונה מהמצלמה (בפורמט Base64)
    if (imageBase64) {
      promptParts.push({
        inlineData: {
          data: imageBase64.split(',')[1],
          mimeType: "image/jpeg"
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const aiResponse = result.response.text();

    // 4. עבודה שחורה - רישום לוג ב-DB
    await supabase.from('ai_consultations').insert({
      customer_id: customer?.id,
      query: message,
      has_image: !!imageBase64,
      ai_reply: aiResponse
    });

    return res.status(200).json({ 
      reply: aiResponse.replace(/\[.*?\]/g, '').trim(),
      customerName: customer?.name 
    });

  } catch (error) {
    return res.status(200).json({ reply: "בוס, המצלמה מסנוורת אותי. נסה לשלוח שוב." });
  }
}
