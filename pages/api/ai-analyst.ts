import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. שליפת כל הנתונים של היום לצורך ניתוח
    const today = new Date().toISOString().split('T')[0];
    const [orders, containers, transfers] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today),
      supabase.from('container_management').select('*').eq('start_date', today),
      supabase.from('transfers').select('*').eq('transfer_date', today)
    ]);

    // 2. שליחת הנתונים ל-Gemini שינתח וייתן תשובה אנושית
    const prompt = `
      אתה מנתח הנתונים של חברת סבן חומרי בניין. 
      הנתונים להיום (${today}):
      - הזמנות חומרים: ${JSON.stringify(orders.data)}
      - מכולות: ${JSON.stringify(containers.data)}
      - העברות: ${JSON.stringify(transfers.data)}

      המשתמש שאל: "${query}"
      ענה בצורה מקצועית, קצרה ותמציתית (כמו שותף עסקי).
      אם ביקשו מספר הזמנה או לקוח ספציפי, חפש בנתונים ופרט את כל המידע עליו.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    const answer = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ answer: "שגיאה בניתוח הנתונים." });
  }
}
