import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_POOL = [
  "gemini-3.1-flash-lite-preview",
  "gemma-4-26b-a4b-it",
  "gemini-2.0-flash" 
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // הגנה מפני שיטות לא מורשות
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // בדיקת מפתח API - מונע שגיאת 500
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return res.status(500).json({ error: "שרת לא מוגדר כראוי (Missing API Key)" });
  }

  try {
    const { imageBase64, query } = req.body;

    // אם אין תמונה ואין טקסט - שלח 400
    if (!imageBase64 && !query) {
      return res.status(400).json({ error: "נא לספק תמונה או פקודה טקסטואלית" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    for (const modelName of MODEL_POOL) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        let prompt = `אתה המוח של SabanOS. `;
        if (imageBase64) prompt += `נתח את תעודת המשלוח הזו והחזר JSON. `;
        prompt += `בקשת המשתמש: ${query || 'ניתוח כללי'}`;

        const contentParts: any[] = [prompt];
        if (imageBase64) {
          contentParts.push({
            inlineData: { mimeType: "image/jpeg", data: imageBase64 }
          });
        }

        const result = await model.generateContent(contentParts);
        const text = result.response.text();
        
        return res.status(200).json({ 
          reply: text.replace(/```json|```/g, "").trim(),
          model: modelName 
        });
      } catch (err) {
        console.error(`מודל ${modelName} נכשל, עובר לבא...`);
        continue;
      }
    }
    
    res.status(500).json({ error: "כל המודלים נכשלו בעיבוד הבקשה" });
  } catch (error: any) {
    console.error("General API Error:", error);
    res.status(500).json({ error: error.message || "Internal Error" });
  }
}
