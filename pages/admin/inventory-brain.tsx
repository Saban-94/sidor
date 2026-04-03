import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { query, multi } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const CX = "3331a7d5c75e14f26";

  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2
  ].filter(Boolean) as string[];

  const modelPool = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-preview",
    "gemini-2.0-flash",
    "gemma-4-31b-it"
  ];

  if (!GOOGLE_KEY || geminiKeys.length === 0) {
    return res.status(500).json({ error: "חסרים מפתחות בשרת Vercel" });
  }

  try {
    // 1. ציד בגוגל
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (googleData.error) throw new Error(googleData.error.message);
    if (!googleData.items) return res.status(404).json({ error: "לא נמצאו תוצאות בגוגל." });

    const context = googleData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    const prompt = `Analyze product "${query}" based on: ${context}. Return ONLY JSON: {"dry_time": "...", "coverage_rate": "...", "application_method": "...", "description": "..."}`;

    // 2. רוטציה כפולה עם טיפוס נתונים מוגדר למניעת שגיאות Build
    let aiData: any = null;
    let usedKeyIndex = -1;

    for (let k = 0; k < geminiKeys.length; k++) {
      if (aiData) break;
      const genAI = new GoogleGenerativeAI(geminiKeys[k]);

      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const text = result.response.text().replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(text);
          if (parsed) {
            aiData = parsed;
            usedKeyIndex = k + 1;
            break;
          }
        } catch (err) {
          continue;
        }
      }
    }

    // 3. Fallback בטוח אם ה-AI נכשל
    if (!aiData) {
      aiData = { 
        dry_time: "לפי יצרן", 
        coverage_rate: "משתנה", 
        application_method: "סטנדרטי", 
        description: googleData.items[0].snippet 
      };
    }

    const results = googleData.items.map((item: any) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || "",
      link: item.link,
      dry_time: aiData.dry_time,
      coverage_rate: aiData.coverage_rate,
      application_method: aiData.application_method,
      description: aiData.description,
      debug_info: usedKeyIndex !== -1 ? `Key #${usedKeyIndex} active` : "Fallback mode"
    }));

    return res.status(200).json({ results: multi ? results : [results[0]] });

  } catch (error: any) {
    return res.status(500).json({ error: "קריסה: " + error.message });
  }
}
