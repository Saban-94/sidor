import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData, mimeType, phone } = req.body;
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileData, mimeType, phone }),
    });

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
