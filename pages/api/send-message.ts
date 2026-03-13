import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, text } = req.body;

  if (!phone || !text) {
    return res.status(400).json({ error: 'Phone and text are required' });
  }

  // שימוש ב-IP הקבוע שלך ובפורט של JONI
  const JONI_ENDPOINT = "http://192.117.129.145:5633/send";

  const cleanPhone = phone.toString().replace(/\D/g, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 שניות טיימאאוט

    const response = await fetch(JONI_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: cleanPhone,
        message: text
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'JONI Server Error', 
        details: errorText 
      });
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Connection Error:', error.message);
    return res.status(502).json({ 
      error: 'Cannot reach JONI Server. Check Port Forwarding on your Router.', 
      details: error.message 
    });
  }
}
