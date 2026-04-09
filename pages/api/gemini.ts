import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    const systemPrompt = `אתה המוח של ח. סבן - מומחה טכני מנוסה בסטייל NotebookLM.
    ענה תמיד בפורמט JSON בלבד.
    זהה מוצר בשדה identifiedProduct.
    בשדה reply תן תשובה מקצועית ותמציתית.`;

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

    let driveAssets = null;
    if (result.identifiedProduct) {
      // ניקוי השם לחיפוש בדרייב (לוקח רק את מה שלפני הסוגריים)
      const cleanName = result.identifiedProduct.split('(')[0].trim();
      driveAssets = await fetchKnowledgeFromDrive(cleanName);
    }

    const finalOutput = {
      ...result,
      suggested_media: driveAssets?.found ? {
        videos: driveAssets.videos,
        specs: driveAssets.specs,
        message: `שלפתי עבורך מהדרייב מפרט וסרטון הדרכה ל-${result.identifiedProduct}.`
      } : null
    };

    // תיעוד לוג
    await supabase.from('logs').insert({
      customer_phone: targetPhone,
      message: message,
      reply: finalOutput.reply
    });

    return res.status(200).json(finalOutput);

  } catch (error: any) {
    console.error("🔴 Brain API Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}
