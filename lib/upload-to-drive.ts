import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // מאפשר קבצים עד 10MB
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // חובה: תעתיק לכאן את ה-URL שקיבלת מה-Deploy בגוגל (Web App URL)
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwwKOwIks5wT_BEwaIVorKREucPAtBLQD-KcyuC-7cyrv31W4KPL1U8WG2iMhQLy1l3/exec";

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      // שליחת הנתונים בדיוק כפי שהם הגיעו מה-Frontend
      body: JSON.stringify(req.body),
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log("[Vercel] Upload successful:", result.link);
      return res.status(200).json({ link: result.link });
    } else {
      console.error("[Vercel] Google Script returned error:", result.message);
      return res.status(500).json({ error: result.message });
    }
  } catch (error: any) {
    console.error("[Vercel Proxy Error]:", error.message);
    return res.status(500).json({ error: 'Failed to communicate with Google Script' });
  }
}
