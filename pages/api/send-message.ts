// /pages/api/send-message.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, text } = req.body;

  // הכתובת המעודכנת מה-ngrok שלך
  const JONI_URL = "https://occupational-nonchromatically-jamal.ngrok-free.dev/send";

  try {
    const response = await fetch(JONI_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // עוקף את דף האזהרה של ngrok
      },
      body: JSON.stringify({
        number: phone.replace(/\D/g, ''), // מבטיח מספר נקי בלבד
        message: text
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: 'JONI Error', details: errorData });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(502).json({ error: 'Connection failed', details: error.message });
  }
}
