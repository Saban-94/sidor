import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin'; // תוודא שהנתיב לקובץ הקודם נכון

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!adminDb) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Missing phone or message' });
  }

  try {
    // עיבוד המספר לפורמט ש-JONI אוהב (9725XXXX@c.us)
    const formattedPhone = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@c.us`;

    // כתיבה לנתיב הצינור שציינת
    const joniRef = adminDb.ref('saban94/commands');
    const newMessage = await joniRef.push({
      number: formattedPhone,
      text: message,
      timestamp: Date.now(),
      status: 'pending' // JONI יזהה את זה וישלח
    });

    return res.status(200).json({ success: true, id: newMessage.key });
  } catch (error: any) {
    console.error("API Error:", error.message);
    return res.status(500).json({ error: 'Failed to send to pipe' });
  }
}
