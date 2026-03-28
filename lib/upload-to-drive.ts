import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // חובה: ה-URL העדכני ביותר מה-Deploy בגוגל
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwwKOwIks5wT_BEwaIVorKREucPAtBLQD-KcyuC-7cyrv31W4KPL1U8WG2iMhQLy1l3/exec";

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
      console.error("[Apps Script Error]:", result.message);
      return res.status(500).json({ error: result.message });
    }
  } catch (error: any) {
    console.error("[Vercel Proxy Error]:", error.message);
    return res.status(500).json({ error: 'Failed to connect to Google Bridge' });
  }
}
