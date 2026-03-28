import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbznbFxme_g5DGn_6X1DrxP0hWZxBlpqAx6Jf9N8c87GaxhHLtfjyoPUyF3FzobDHxjJ/exec";

  try {
    // שליחת הנתונים ל-Apps Script
    const response = await axios.post(GOOGLE_SCRIPT_URL, req.body);

    if (response.data.status === 'success') {
      return res.status(200).json({ link: response.data.link });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    console.error('Proxy Error:', error.message);
    return res.status(500).json({ error: 'Failed to upload via Apps Script', details: error.message });
  }
}
