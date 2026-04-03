import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, category } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const CX = "3331a7d5c75e14f26";
  
  // רוטציית מפתחות לגיבוי מלא
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean) as string[];

  try {
    // 1. חיפוש בגוגל - דגש על מפרט טכני
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${CX}&q=${encodeURIComponent(query + " מפרט טכני דף מוצר")}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items) return res.status(404).json({ error: "לא נמצאו נתונים" });

    // 2. ניתוח AI עמוק (Gemini 3.1 Flash-Lite)
    const genAI = new GoogleGenerativeAI(keys[0]);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    
    const context = searchData.items.slice(0, 3).map((it: any) => it.snippet).join("\n");
    const prompt = `נתח מוצר בנייה: "${query}". קטגוריה: "${category}". 
    החזר אך ורק JSON: 
    {"dry_time": "...", "coverage_rate": "...", "application_method": "...", "description": "...", "sku": "SBN-XXXXX"}`;

    const result = await model.generateContent(prompt);
    const aiResponse = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

    return res.status(200).json({
      ...aiResponse,
      product_name: query,
      category: category,
      image_url: searchData.items[0].pagemap?.cse_image?.[0]?.src || "",
      technical_doc_url: searchData.items[0].link
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
