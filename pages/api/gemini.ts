// pages/api/unified-brain.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const DRIVE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKpN3KZ6hGqmIO0rfG1oIjbFlJa2NsTSPsk5DNzI7EyPVhAiL_jdHHK1BW7lq5N849/exec";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const { message, senderPhone } = req.body;
  const targetPhone = String(senderPhone || 'אורח');

  try {
    // 1. קונטקסט מערכת
    const systemPrompt = `אתה המוח של ח.סבן. ענה ב-JSON בלבד. 
    זהה מוצרים בשדה identifiedProduct. 
    ספק ערך מוסף טכני בשדה reply בסטייל NotebookLM (מקצועי, קצר, חברי).`;import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// חיבור ל-Supabase לצורך תיעוד וזיכרון (Context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ה-URL של הסקריפט שסורק את הדרייב שלך
const DRIVE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKpN3KZ6hGqmIO0rfG1oIjbFlJa2NsTSPsk5DNzI7EyPVhAiL_jdHHK1BW7lq5N849/exec";

async function fetchKnowledgeFromDrive(productName: string) {
  try {
    const res = await fetch(DRIVE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ productName }),
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (e) {
    console.error("❌ שגיאה בשליפת נתונים מהדרייב:", e);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, senderPhone } = req.body;
  const targetPhone = String(senderPhone || 'אורח');
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. הגדרת ה-System Prompt (ה"אופי" של המוח בסטייל NotebookLM)
    const systemPrompt = `
      אתה "המוח" של ח. סבן - מומחה טכני מנוסה ושותף לביצוע. 
      תפקידך לספק ערך מוסף: אם לקוח מזמין מוצר או שואל שאלת יישום, זהה את המוצר.
      
      כללים מחייבים לתשובה:
      - החזר אך ורק פורמט JSON.
      - אם זיהית מוצר ספציפי (סיקה, דבק, מלט וכו'), רשום את שמו המדויק בשדה "identifiedProduct".
      - בשדה "reply", כתוב תשובה מקצועית, חמה ותמציתית (סטייל NotebookLM).
      - שדה "orderPlaced" יהיה true רק אם הלקוח ביקש להזמין בפועל.
    `;

    // 2. פנייה ל-Gemini לניתוח השאלה
    const aiResponse = await fetch(
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

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // 3. הקישור לדרייב: אם המוח זיהה מוצר, נלך להביא עליו מדיה
    let driveAssets = null;
    if (result.identifiedProduct) {
      driveAssets = await fetchKnowledgeFromDrive(result.identifiedProduct);
    }

    // 4. בניית האובייקט הסופי עבור הממשק היוקרתי
    const finalOutput = {
      ...result,
      suggested_media: driveAssets?.found ? {
        videos: driveAssets.videos,
        specs: driveAssets.specs,
        message: `שלפתי עבורך מהדרייב מפרט וסרטון הדרכה ל-${result.identifiedProduct}.`
      } : null
    };

    // 5. תיעוד הלוג ב-Supabase
    await supabase.from('logs').insert({
      customer_phone: targetPhone,
      message: message,
      reply: finalOutput.reply,
      is_order: finalOutput.orderPlaced || false
    });

    return res.status(200).json(finalOutput);

  } catch (error: any) {
    console.error("🔴 Brain API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

    // 2. פנייה ל-Gemini
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const aiData = await aiRes.json();
    const result = JSON.parse(aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // 3. חיבור אקטיבי לדרייב
    if (result.identifiedProduct) {
      const driveRes = await fetch(DRIVE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ productName: result.identifiedProduct })
      });
      const driveData = await driveRes.json();
      if (driveData.found) {
        result.suggested_media = {
          videos: driveData.videos,
          specs: driveData.specs,
          message: `שלפתי עבורך מהדרייב מפרט וסרטון ל-${result.identifiedProduct}`
        };
      }
    }

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: "Brain failure" });
  }
}
