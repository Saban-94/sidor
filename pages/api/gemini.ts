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
    ספק ערך מוסף טכני בשדה reply בסטייל NotebookLM (מקצועי, קצר, חברי).`;

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
