import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ה-URL של הסקריפט שנתת
const DRIVE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKpN3KZ6hGqmIO0rfG1oIjbFlJa2NsTSPsk5DNzI7EyPVhAiL_jdHHK1BW7lq5N849/exec";

async function fetchFromDrive(productName: string) {
  try {
    const res = await fetch(DRIVE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ productName }),
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (e) {
    console.error("Drive Fetch Error:", e);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64, senderPhone } = req.body;
  const targetPhone = String(senderPhone || 'אורח');
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. איסוף קונטקסט (מלאי, זיכרון לקוח וכו')
    const [inventory, customerMemory] = await Promise.all([
      supabase.from('brain_inventory').select('*').limit(20),
      supabase.from('customer_memory').select('*').eq('clientId', targetPhone).single(),
    ]);

    const systemPrompt = `
      אתה "המוח" של ח.סבן - מומחה טכני ושותף לביצוע בסטייל NotebookLM.
      המטרה שלך: לתת ערך מוסף מעבר למכירה.
      אם הלקוח מזמין מוצר או שואל שאלת יישום, עליך לזהות את המוצר ולבקש מידע טכני.
      
      כללים לתשובה:
      1. ענה בפורמט JSON בלבד.
      2. אם זיהית מוצר ספציפי (למשל: סיקה 107, דבק 116), ציין את שמו בשדה "identifiedProduct".
      3. בשדה "reply", תן תשובה מקצועית, חמה וממוקדת.
    `;

    // 2. פנייה ראשונית ל-Gemini לזיהוי כוונה ומוצר
    const initialAiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    const firstResult = await initialAiRes.json();
    const parsedResult = JSON.parse(firstResult.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // 3. ה"גשר" האקטיבי: אם זוהה מוצר, נשלב ידע מהדרייב
    let driveData = null;
    if (parsedResult.identifiedProduct) {
      driveData = await fetchFromDrive(parsedResult.identifiedProduct);
    }

    // 4. בניית התשובה הסופית (העשרת התשובה בסטייל NotebookLM)
    const finalResult = {
      ...parsedResult,
      suggested_media: driveData?.found ? {
        videos: driveData.videos,
        specs: driveData.specs,
        message: `מצאתי עבורך סרטון יישום ומפרט טכני ל-${parsedResult.identifiedProduct} בדרייב של סבן.`
      } : null
    };

    // 5. תיעוד לוגים ב-Supabase
    await supabase.from('logs').insert({
      customer_phone: targetPhone,
      message: message,
      reply: finalResult.reply,
      is_order: finalResult.orderPlaced
    });

    return res.status(200).json(finalResult);

  } catch (error: any) {
    console.error("Unified Brain Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
