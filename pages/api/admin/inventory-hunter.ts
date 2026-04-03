import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, multi } = req.body;
  const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const CX = "635bc3eeee0194b16";
  console.log("Checking API Key existence:", !!process.env.GOOGLE_SEARCH_API_KEY);
  if (!process.env.GOOGLE_SEARCH_API_KEY) {
  return res.status(500).json({ error: "בוס, השרת לא רואה את המפתח! בדוק הגדרות ב-Vercel" });
}
  if (!query) return res.status(400).json({ error: "בוס, מה לחפש?" });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: "⚠️ חסר מפתח GEMINI_API_KEY" });

  try {
    // 1. שלב גוגל: שליפת לינקים ותמונות
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=5`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    if (!googleData.items) return res.status(404).json({ error: "גוגל לא מצא כלום על המוצר הזה." });

    // 2. הכנת החומר ל-Gemini (לוקחים את הסניפטים של 3 התוצאות הראשונות)
    const context = googleData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    
    // 3. שלב Gemini: ניתוח והפקת נתונים טכניים
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      נתח את המידע הבא על המוצר "${query}":
      ${context}
      
      החזר תשובה בפורמט JSON בלבד (ללא טקסט נוסף) עם השדות הבאים בעברית:
      {
        "dry_time": "זמן ייבוש משוער",
        "coverage_rate": "כמות כיסוי למ"ר",
        "application_method": "איך מיישמים (רולר/מברשת וכו')",
        "description": "תיאור שיווקי קצר ומזמין ללקוח",
        "price_estimate": "הערכת מחיר שוק אם יש"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // ניקוי JSON (למקרה ש-Gemini הוסיף ```json)
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(cleanJson);

    // 4. איחוד נתונים: גוגל נותן מדיה, Gemini נותן מוח
    const finalResults = googleData.items.map((item: any, index: number) => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || "",
      link: item.link,
      snippet: item.snippet,
      // הזרקת הנתונים של Gemini לכל תוצאה
      dry_time: aiData.dry_time,
      coverage_rate: aiData.coverage_rate,
      application_method: aiData.application_method,
      ai_description: aiData.description
    }));

    return res.status(200).json({ results: multi ? finalResults : [finalResults[0]] });

  } catch (error: any) {
    console.error("Hunter Error:", error);
    return res.status(500).json({ error: "קריסה במוח: " + error.message });
  }
}
