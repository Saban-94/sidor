import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { query, multi } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const CX = "635bc3eeee0194b16"; // ה-CX התקין שלך

  // מלשינון מפתחות - בודק זמינות בשרת
  if (!GOOGLE_KEY) return res.status(500).json({ error: "Missing GOOGLE_SEARCH_API_KEY in Vercel" });
  if (!GEMINI_KEY) return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel" });

  try {
    // שלב 1: שליפה מגוגל (המנוע ששלחת לי)
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (googleData.error) throw new Error(`Google Search Error: ${googleData.error.message}`);
    if (!googleData.items) return res.status(404).json({ error: "לא נמצאו תוצאות בגוגל." });

    // שלב 2: ניתוח Gemini לנתונים טכניים (ייבוש, כיסוי וכו')
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const context = googleData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    const prompt = `נתח את המוצר "${query}" לפי המידע: ${context}. 
    החזר אך ורק JSON בעברית: 
    {"dry_time": "זמן ייבוש", "coverage_rate": "כושר כיסוי", "application_method": "שיטת יישום", "description": "תיאור קצר ללקוח"}`;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text().replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(aiText);

    // שלב 3: איחוד והחזרה
    const results = googleData.items.map((item: any) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || "",
      link: item.link,
      dry_time: aiData.dry_time,
      coverage_rate: aiData.coverage_rate,
      application_method: aiData.application_method,
      description: aiData.description
    }));

    return res.status(200).json({ results: multi ? results : [results[0]] });

  } catch (error: any) {
    console.error("Hunter Crash:", error.message);
    return res.status(500).json({ error: "קריסה: " + error.message });
  }
}
