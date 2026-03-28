import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // וידוא שהתגובה היא תמיד JSON כדי למנוע את שגיאת ה-token '<'
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ה-URL מה-Deploy בגוגל (זה שעבר את הבדיקה הידנית שלך)
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();

    if (result.status === 'success') {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ error: result.message });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
