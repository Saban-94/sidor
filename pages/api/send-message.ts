// /pages/api/send-message.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, text } = req.body;

  // וודא שהמספר בפורמט בינלאומי ללא פלוס (למשל 972501234567)
  const cleanPhone = phone.replace(/\D/g, '');

  try {
    // שליחה לצינור של JONI - הכתובת היא ה-IP/URL שמופיע לך בתוכנה במחשב
    const response = await fetch('http://localhost:5633/send', { // וודא פורט מול JONI
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: cleanPhone,
        message: text
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Send Error:', error);
    return res.status(500).json({ error: 'Failed to connect to JONI pipeline' });
  }
}
