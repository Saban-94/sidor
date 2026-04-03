import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { query, multi } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const CX = "3331a7d5c75e14f26"; // המזהה החדש והתקין שלך

  if (!GOOGLE_KEY || !GEMINI_KEY) {
    return res.status(500).json({ error: "בוס, חסרים מפתחות ב-Vercel (GOOGLE או GEMINI)" });
  }

  try {
    // שלב 1: ציד בגוגל עם המזהה החדש
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (googleData.error) throw new Error(`Google Error: ${googleData.error.message}`);
    if (!googleData.items) return res.status(404).json({ error: "לא נמצאו תוצאות למוצר זה." });

    // שלב 2: Gemini מנתח את התוצאות לנתונים טכניים
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const context = googleData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    const prompt = `נתח את המוצר "${query}" לפי המידע: ${context}. 
    החזר אך ורק JSON בעברית (בלי מילים מסביב): 
    {"dry_time": "זמן ייבוש", "coverage_rate": "כושר כיסוי", "application_method": "שיטת יישום", "description": "תיאור קצר ומזמין ללקוח"}`;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text().replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(aiText);

    // שלב 3: איחוד נתוני מדיה (גוגל) ונתונים טכניים (AI)
    const results = googleData.items.map((item: any) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || "",
      link: item.link,
      dry_time: aiData.dry_time || "לא צוין",
      coverage_rate: aiData.coverage_rate || "לא צוין",
      application_method: aiData.application_method || "לא צוין",
      description: aiData.description || item.snippet
    }));

    return res.status(200).json({ results: multi ? results : [results[0]] });

  } catch (error: any) {
    console.error("Hunter Crash:", error.message);
    return res.status(500).json({ error: "קריסה טכנית: " + error.message });
  }
}
