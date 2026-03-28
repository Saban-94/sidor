import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // תומך בקבצים עד 10 מגה
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // חשוב ביותר: תעתיק לכאן את ה-URL החדש שקיבלת מה-Deploy בגוגל!
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body), // הפיכה לסטרינג קריטית למניעת undefined
    });

    const result = await response.json();

    if (result.status === 'success') {
      return res.status(200).json({ link: result.link });
    } else {
      console.error("[Google Script Error]:", result.message);
      return res.status(500).json({ error: result.message });
    }
  } catch (error: any) {
    console.error("[Vercel Proxy Error]:", error.message);
    return res.status(500).json({ error: 'Failed to connect to Google Bridge' });
  }
}
