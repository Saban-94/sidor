import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/"
  });
}

const adminDb = admin.database();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { phone, message } = req.body;
  const formattedPhone = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@c.us`;

  try {
    const joniRef = adminDb.ref('saban94/commands');
    await joniRef.push({
      number: formattedPhone,
      text: message,
      timestamp: Date.now(),
      status: 'pending'
    });
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
