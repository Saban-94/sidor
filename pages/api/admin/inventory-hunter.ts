import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { query, multi } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const CX = "3331a7d5c75e14f26";

  if (!GOOGLE_KEY || !GEMINI_KEY) {
    return res.status(500).json({ error: "Missing API Keys in Vercel. Check GOOGLE_SEARCH_API_KEY and GEMINI_API_KEY." });
  }

  // בריכת מודלים מעודכנת לאפריל 2026 - לפי סדר עדיפות (מהזול/חדש ליציב)
  const modelPool = [
    "gemini-3.1-flash-lite-preview", // הכי זול ומהיר (חדש!)
    "gemini-3.1-flash-preview",      // המודל המוביל הנוכחי
    "gemini-2.0-flash",              // מודל גיבוי יציב (נסגר ביוני 2026, כרגע מעולה)
    "gemma-4-31b-it"                 // מודל קל וחזק למשימות טקסט
  ];

  try {
    // שלב 1: ציד בגוגל (תמיד עובד)
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (googleData.error) throw new Error(`Google Search Error: ${googleData.error.message}`);
    if (!googleData.items) return res.status(404).json({ error: "לא נמצאו תוצאות בגוגל." });

    const context = googleData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    const prompt = `Analyze product "${query}" based on: ${context}. 
    Return ONLY JSON: {"dry_time": "...", "coverage_rate": "...", "application_method": "...", "description": "..."}`;

    // שלב 2: רוטציה חכמה בין מודלים
    let aiData = null;
    let successfulModel = "";

    for (const modelName of modelPool) {
      try {
        console.log(`Trying Model: ${modelName}`);
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        aiData = JSON.parse(text);
        
        if (aiData) {
          successfulModel = modelName;
          break; // מצאנו מודל עובד, יוצאים מהלופ
        }
      } catch (err: any) {
        console.error(`Model ${modelName} failed:`, err.message);
        // אם זו שגיאת מכסה (429) או שגיאה אחרת, עוברים למודל הבא
        continue;
      }
    }

    // אם כל המודלים נכשלו ברוטציה - נשתמש בנתוני גוגל כגיבוי סופי
    if (!aiData) {
      aiData = {
        dry_time: "לפי הוראות יצרן",
        coverage_rate: "משתנה",
        application_method: "סטנדרטי",
        description: googleData.items[0].snippet
      };
      successfulModel = "Fallback (Google Snippet)";
    }

    // שלב 3: איחוד נתונים
    const results = googleData.items.map((item: any) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || "",
      link: item.link,
      dry_time: aiData.dry_time,
      coverage_rate: aiData.coverage_rate,
      application_method: aiData.application_method,
      description: aiData.description,
      source_model: successfulModel
    }));

    return res.status(200).json({ results: multi ? results : [results[0]] });

  } catch (error: any) {
    console.error("Critical API Crash:", error.message);
    return res.status(500).json({ error: "קריסה במוח: " + error.message });
  }
}
