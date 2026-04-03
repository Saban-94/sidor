import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, multi } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const CX = "3331a7d5c75e14f26";

  if (!GOOGLE_KEY || !GEMINI_KEY) return res.status(500).json({ error: "Missing Keys" });

  // בריכת המודלים לפי סדר עדיפות (מהזול והמהיר ליקר/חזק)
  const modelPool = [
    "gemini-3.1-flash-lite-preview", 
    "gemini-3.1-flash",
    "gemini-2.0-flash", // מודל גיבוי יציב
    "gemma-4-31b-it"    // מודל קל וחדש
  ];

  try {
    // שלב 1: גוגל חיפוש (תמיד עובד)
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (!googleData.items) return res.status(404).json({ error: "לא נמצאו תוצאות בגוגל." });

    const context = googleData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    const prompt = `Analyze product "${query}" from: ${context}. Return ONLY JSON: {"dry_time": "...", "coverage_rate": "...", "application_method": "...", "description": "..."}`;

    // שלב 2: רוטציה בין מודלים למימוש מכסה
    let aiData = null;
    let lastError = "";

    for (const modelName of modelPool) {
      try {
        console.log(`Trying model: ${modelName}`);
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        aiData = JSON.parse(text);
        
        if (aiData) break; // הצלחנו! יוצאים מהלופ
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Model ${modelName} failed or quota hit. Error: ${err.message}`);
        continue; // עוברים למודל הבא בבריכה
      }
    }

    // אם כל המודלים נכשלו
    if (!aiData) {
      aiData = { 
        dry_time: "בבדיקה", 
        coverage_rate: "לפי יצרן", 
        application_method: "סטנדרטי", 
        description: googleData.items[0].snippet 
      };
    }

    // שלב 3: החזרת תוצאות
    const finalResults = googleData.items.map((item: any) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || "",
      dry_time: aiData.dry_time,
      coverage_rate: aiData.coverage_rate,
      application_method: aiData.application_method,
      description: aiData.description,
      used_model: aiData ? "Gemini-AI" : "Fallback-Google"
    }));

    return res.status(200).json({ results: multi ? finalResults : [finalResults[0]] });

  } catch (error: any) {
    return res.status(500).json({ error: "קריסה סופית: " + error.message });
  }
}
