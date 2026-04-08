import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';

// בריכת המודלים לגיבוי וביצועי Vision כפי שהגדרת
cconst MODEL_POOL = [
  "gemini-3.1-flash-lite-preview",
  "gemma-4-26b-a4b-it",
  "gemini-2.0-flash" 
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * המוח המנתח - Shipping Document Vision Processor
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "נא לספק תמונה של תעודת משלוח" });
  }

  // לוגיקת סבב מודלים (Fallback Logic)
  for (const modelName of MODEL_POOL) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        אתה אנליסט לוגיסטי בחברת "ח. סבן". תפקידך לחלץ נתונים מתעודת משלוח.
        חלץ את השדות הבאים בפורמט JSON בלבד:
        1. customer_name (שם הלקוח/אתר)
        2. delivery_note_number (מספר תעודת משלוח)
        3. items (רשימת פריטים וכמויות)
        4. warehouse_source (מהיכן יצאה הסחורה - למשל קראדי, שאי שרון וכו')
        5. status: "verified" אם הנתונים ברורים, "manual_review" אם יש ספק.

        החזר אך ורק JSON תקני.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // ניקוי טקסט ופירסום JSON
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const extractedData = JSON.parse(cleanJson);

      // הזרקה אוטומטית ל-Supabase (טבלת סידור או לוגים)
      const { data, error } = await supabase
        .from('shipping_logs')
        .insert([{
          raw_data: extractedData,
          processed_by: modelName,
          client_name: extractedData.customer_name
        }]);

      return res.status(200).json({
        success: true,
        model_used: modelName,
        data: extractedData
      });

    } catch (err) {
      console.error(`מודל ${modelName} נכשל, מנסה את הבא בתור...`, err);
      continue; // עובר למודל הבא בבריכה
    }
  }

  return res.status(500).json({ error: "כל מודלי ה-Vision נכשלו בעיבוד התמונה" });
}
