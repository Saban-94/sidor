import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { query, multi } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_KEY_2 = process.env.GEMINI_API_KEY_2;
  const CX = "3331a7d5c75e14f26";

  const geminiKeys = [GEMINI_KEY, GEMINI_KEY_2].filter(Boolean) as string[];
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-flash-preview", "gemini-2.0-flash"];

  try {
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (!googleData.items) return res.status(404).json({ error: "לא נמצאו תוצאות בגוגל." });

    let aiData: any = null;
    const prompt = `Analyze "${query}" from snippets. Return ONLY JSON: {"dry_time": "...", "coverage_rate": "...", "application_method": "...", "description": "..."}`;

    // רוטציה כפולה
    for (const key of geminiKeys) {
      if (aiData) break;
      const genAI = new GoogleGenerativeAI(key);
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const text = result.response.text().replace(/```json|```/g, "").trim();
          aiData = JSON.parse(text);
          if (aiData) break;
        } catch (e) { continue; }
      }
    }

    if (!aiData) aiData = { dry_time: "לפי יצרן", coverage_rate: "משתנה", application_method: "מברשת/רולר", description: googleData.items[0].snippet };

    const results = googleData.items.map((item: any) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || "",
      dry_time: aiData.dry_time,
      coverage_rate: aiData.coverage_rate,
      application_method: aiData.application_method,
      description: aiData.description
    }));

    return res.status(200).json({ results: multi ? results : [results[0]] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
