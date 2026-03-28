import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("--- [DEBUG START] הגיע נתונים מהממשק ---");

  try {
    const { fileName, fileData, mimeType } = req.body;

    // שלב 1: בדיקת תקינות הנתונים שהגיעו מהדפדפן
    if (!fileData) {
      console.error("❌ שגיאה: fileData ריק!");
      return res.status(400).json({ error: "No file data received" });
    }
    console.log(`✅ נתונים התקבלו: ${fileName} (${mimeType}), גודל: ${fileData.length}`);

    // שלב 2: בדיקת ה-URL של גוגל
    const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec"; // שים פה את ה-URL שלך
    if (!GOOGLE_URL || GOOGLE_URL.includes("YOUR_APPS_SCRIPT")) {
      console.error("❌ שגיאה: שכחת לעדכן את ה-URL של גוגל!");
      return res.status(500).json({ error: "Google URL not configured" });
    }

    console.log("🚀 מנסה לשלוח לגוגל...");

    // שלב 3: שליחה לגוגל עם טיימאאוט
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(GOOGLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });
    clearTimeout(timeout);

    // שלב 4: בדיקת התשובה מגוגל
    const textResponse = await response.text();
    console.log("📩 תשובה גולמית מגוגל:", textResponse);

    let result;
    try {
      result = JSON.parse(textResponse);
    } catch (e) {
      console.error("❌ שגיאה: גוגל לא החזירה JSON תקין!");
      return res.status(500).json({ error: "Invalid JSON from Google", raw: textResponse });
    }

    if (result.status === 'success') {
      console.log("⭐⭐⭐ הצלחה סופית! ⭐⭐⭐");
      return res.status(200).json(result);
    } else {
      console.error("❌ גוגל החזירה שגיאה פנימית:", result.message);
      return res.status(500).json(result);
    }

  } catch (err: any) {
    console.error("💥 קריסה בשרת Vercel:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
