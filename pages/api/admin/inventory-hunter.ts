// pages/api/admin/inventory-hunter.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req, res) {
  const { query } = req.body; // שם המוצר לחיפוש
  
  // 1. חיפוש בגוגל (טקסט + תמונה)
  const googleRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=1`);
  const googleData = await googleRes.json();
  
  // 2. חיפוש סרטון הדרכה ביוטיוב
  const youtubeRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query + " review youtube")}`);
  const youtubeData = await youtubeRes.json();
  const videoUrl = youtubeData.items?.find(i => i.link.includes('youtube.com'))?.link || "";

  // 3. החזרת טיוטה לסימולטור (בלי לשמור עדיין!)
  const draft = {
    product_name: query,
    image_url: googleData.items?.[0]?.link || "",
    youtube_url: videoUrl,
    description: "נא להזין תיאור מוצר...",
    sku: `SBN-${Math.floor(Math.random() * 90000)}`
  };

  return res.status(200).json(draft);
}
