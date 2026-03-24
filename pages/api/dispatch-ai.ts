import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// הגדרת המפתחות מתוך משתני הסביבה
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

    // 2. מכינים את הקונטקסט למוח (ה-Prompt המשודרג והאנושי)
    const prompt = `
    אתה "מוח הסידור" של חברת חומרי הבניין "ח. סבן". ראמי (המנהל) מדבר איתך עכשיו.
    
    נתוני סידור העבודה ליום המבוקש (${dateStr}):
    ${schedule && schedule.length > 0 ? JSON.stringify(schedule, null, 2) : 'אין כרגע הזמנות משובצות בטבלה.'}

    כללים חשובים למענה:
    1. אם ראמי רק כותב מילות ברכה (כמו "שלום", "היי", "בוקר טוב", "מה קורה"), ענה לו בטבעיות כמו אח: "שלום ראמי! איך אפשר לעזור עם סידור העבודה?". **אל תדבר על הזמנות או תגיד שאין הזמנות אלא אם הוא שאל ספציפית.**
    2. אם הוא שואל על הלו"ז, על הנהגים (חכמת/עלי), או על הזמנה ספציפית - נתח את הנתונים וענה לו קצר, ישיר ולעניין.
    3. תמיד ענה בעברית טבעית וזורמת.

    ההודעה של ראמי: "${question}"
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
