import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // רק בקשות POST מתקבלות
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { query, multi } = req.body;
  
  // משיכת מפתחות מ-Vercel
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const CX = "635bc3eeee0194b16";

  // מלשינון מפתחות - בודק אם השרת בכלל רואה אותם
  if (!GOOGLE_KEY) return res.status(500).json({ error: "חסר מפתח GOOGLE_SEARCH_API_KEY ב-Vercel" });
  if (!GEMINI_KEY) return res.status(500).json({ error: "חסר מפתח GEMINI_API_KEY ב-Vercel" });

  try {
    // שלב 1: חיפוש בגוגל (תמונות ולינקים)
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (googleData.error) {
      return res.status(400).json({ error: `שגיאת גוגל: ${googleData.error.message}` });
    }

    if (!googleData.items || googleData.items.length === 0) {
      return res.status(404).json({ error: "לא נמצאו תוצאות בגוגל למוצר זה." });
    }

    // שלב 2: הפעלת Gemini לניתוח טכני
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const context = googleData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    const prompt = `נתח את המידע הבא על "${query}":
    ${context}
    החזר אך ורק JSON תקין (בלי מילים מסביב) בפורמט הבא:
    {"dry_time": "זמן ייבוש", "coverage_rate": "כיסוי למ"ר", "application_method": "שיטת יישום", "description": "תיאור קצר ללקוח"}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    
    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch (e) {
      aiData = { dry_time: "לא נמצא", coverage_rate: "לא נמצא", application_method: "לא נמצא", description: googleData.items[0].snippet };
    }

    // שלב 3: איחוד נתונים ושליחה חזרה
    const finalResults = googleData.items.map((item: any) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || "",
      link: item.link,
      dry_time: aiData.dry_time,
      coverage_rate: aiData.coverage_rate,
      application_method: aiData.application_method,
      description: aiData.description
    }));

    return res.status(200).json({ results: multi ? finalResults : [finalResults[0]] });

  } catch (error: any) {
    console.error("Critical Crash:", error);
    return res.status(500).json({ error: "קריסה בשרת: " + error.message });
  }
}
