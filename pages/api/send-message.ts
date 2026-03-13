// /pages/api/send-message.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, text } = req.body;

  try {
    // הכתובת המקומית של JONI (וודא שהתוכנה רצה במחשב על פורט 5633 או הפורט שמופיע לך)
    const response = await fetch('http://localhost:5633/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: phone, // מספר היעד
        message: text  // תוכן ההודעה
      }),
    });

    if (!response.ok) throw new Error('JONI returned an error');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Send Error:', error);
    return res.status(500).json({ error: 'Failed to send via JONI' });
  }
}
