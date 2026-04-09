import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// חיבור ל-Supabase לצורך תיעוד וזיכרון (Context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ה-URL של הסקריפט שסורק את הדרייב שלך
const DRIVE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEWO_DfRRHjkLAZxtvnEqHtlYTkT8ZhbQhqxdBD10sKffUmyzrVEhzDLk25U6vCbFE/exec";

async function fetchKnowledgeFromDrive(productName: string) {
  try {
    const res = await fetch(DRIVE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ productName }),
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (e) {
    console.error("❌ Drive Fetch Error:", e);
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
    const systemPrompt = `אתה המוח של ח. סבן - מומחה טכני מנוסה ושותף לביצוע בסטייל NotebookLM.
    ענה תמיד בפורמט JSON בלבד.
    אם זיהית מוצר ספציפי (סיקה 107, דבק 116 וכו'), רשום את שמו המדויק בשדה identifiedProduct.
    בשדה reply, תן תשובה מקצועית, חמה ותמציתית הכוללת ערך מוסף טכני.`;

    // 2. פנייה ל-Gemini לניתוח השאלה
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${geminiKey}`,
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

    if (!aiResponse.ok) {
      throw new Error(`Gemini API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // 3. הקישור לדרייב: אם המוח זיהה מוצר, נלך להביא עליו מדיה
    let driveAssets = null;
    const rawName = result.identifiedProduct; // "סיקה 107 (SikaTop Seal-107)"
    const cleanName = rawName.split('(')[0].trim(); // הופך ל-"סיקה 107"
    driveAssets = await fetchKnowledgeFromDrive(cleanName);
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
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
