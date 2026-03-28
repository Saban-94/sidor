import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // וידוא שהתגובה היא JSON בלבד!
  res.setHeader('Content-Type', 'application/json');

  console.log("--- [מלשינון שרת] בקשה נחתה ב-API ---");

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: "error", message: "Method Not Allowed" });
    }

    const { fileName, fileData, GOOGLE_URL } = req.body;

    if (!GOOGLE_URL) {
      return res.status(400).json({ status: "error", message: "חסר URL של גוגל בבקשה" });
    }

    console.log(`[מלשינון שרת] מנסה לשלוח לגוגל: ${fileName}`);

    const response = await fetch(GOOGLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    console.log("[מלשינון שרת] גוגל החזירה תשובה:", JSON.stringify(result));
    
    return res.status(200).json(result);

  } catch (err: any) {
    console.error("[מלשינון שרת] קריסה:", err.message);
    return res.status(500).json({ 
      status: "error", 
      message: "Server Crash: " + err.message 
    });
  }
}
