import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// הגדרת המפתחות
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'שיטה לא מורשית' });
  }

  try {
    const { question, dateStr } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'חסרה שאלה' });
    }

    // 1. שולפים את נתוני הסידור מ-Supabase לפי התאריך המבוקש
    const { data: schedule, error } = await supabase
      .from('saban_dispatch')
      .select('*')
      .eq('scheduled_date', dateStr);

    if (error) throw error;

    // 2. מכינים את הקונטקסט למוח
    const prompt = `
    אתה "מוח הסידור" של חברת חומרי הבניין "ח. סבן". המטרה שלך היא לעזור לראמי (המנהל) לנהל את משאיות המנוף והנהגים.
    הנה נתוני סידור העבודה לתאריך ${dateStr}:
    ${JSON.stringify(schedule, null, 2)}

    כללים למענה:
    1. ענה בעברית, קצר, מקצועי וישיר. בלי הקדמות.
    2. חפש בנתונים לאיזה נהג (חכמת/עלי) משובצת ההזמנה, באיזו שעה, והאם זה מנוף/פסולת.
    3. אם אין נתונים רלוונטיים, אמור שאין הזמנות משובצות התואמות לשאלה.

    השאלה של המנהל: "${question}"
    `;

    // 3. ירייה ל-Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.status(200).json({ reply });
  } catch (err: any) {
    console.error('AI Dispatch Error:', err);
    res.status(500).json({ error: 'תקלה במוח הסידור, נסה שוב.' });
  }
}
