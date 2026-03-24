import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// מפתח ג'מיני ממשתני הסביבה בוורסל
const geminiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'שיטה לא מורשית' });
  }

  try {
    const { phone, message } = req.body;

    if (!message || !phone) {
      return res.status(400).json({ error: 'חסרים נתונים (טלפון או הודעה)' });
    }

    // ה-Prompt של הבוט מול הלקוח - פה אתה מגדיר את האופי שלו
    const prompt = `
    אתה נציג שירות וירטואלי חכם של חברת חומרי הבניין "ח. סבן".
    לקוח הרגע שלח לך הודעה בווטסאפ. 
    
    כללים למענה:
    1. תהיה אדיב, שירותי, קצר ולעניין. בלי חפירות מיותרות.
    2. ענה תמיד בעברית טבעית וזורמת.
    3. אם הלקוח שואל על מחירים או מלאי ספציפי, תגיד שאתה בודק במערכת (בינתיים רק תענה תשובה כללית כי עוד לא חיברנו מלאי מלא לבוט הזה).
    4. אם הלקוח רק אומר "שלום", תענה "שלום! הגעתם לח. סבן. איך אפשר לעזור היום?".

    הודעת הלקוח: "${message}"
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    // מחזירים את התשובה לשרת המקומי
    res.status(200).json({ reply });
  } catch (err: any) {
    console.error('Auto-Reply AI Error:', err);
    res.status(500).json({ error: 'שגיאה ביצירת תגובה מול ג\'מיני' });
  }
}
