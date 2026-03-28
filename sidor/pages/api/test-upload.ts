import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // הגדרת Header שמוודא שהתגובה היא JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    const { fileName, fileData, mimeType } = req.body;

    // כתובת ה-Apps Script שקיבלת מה-Deploy (ה-URL שהצליח בבדיקה הידנית)
    const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

    if (!GOOGLE_URL || GOOGLE_URL.includes("YOUR_APPS_SCRIPT")) {
      return res.status(500).json({ error: "Missing Google URL" });
    }

    const response = await fetch(GOOGLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    return res.status(200).json(result);

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
