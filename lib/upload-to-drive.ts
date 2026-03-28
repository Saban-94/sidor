import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרת גודל מקסימלי לקובץ (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // וידוא שהבקשה היא POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName, fileData, mimeType, phone } = req.body;

  try {
    // 1. טעינת המפתח מה-Environment Variables בוורסל
    const jsonKey = process.env.GOOGLE_DRIVE_JSON_KEY;
    if (!jsonKey) throw new Error("Missing GOOGLE_DRIVE_JSON_KEY");

    const credentials = JSON.parse(jsonKey);
    
    // 2. תיקון המפתח הפרטי (החלפת \n בתו שורה אמיתי עבור ורסל)
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    // 3. יצירת חיבור מאובטח (Service Account Auth)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 4. המרת הקובץ ל-Uint8Array - הפתרון הסופי לשגיאת ה-pipe
    const fileBuffer = Buffer.from(fileData, 'base64');
    const uint8Array = new Uint8Array(fileBuffer);

    // 5. הגדרת המידע על הקובץ (שם ותיקיית יעד)
    const fileMetadata = {
      name: `${phone || 'customer'}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    const media = {
      mimeType: mimeType,
      body: uint8Array, // שליחת המידע כגוש נתונים (עוקף את הצורך ב-Stream)
    };

    // 6. ביצוע ההעלאה בפועל
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    } as any);

    // החזרת הלינק לקובץ שהועלה
    return res.status(200).json({ 
      link: response.data.webViewLink,
      id: response.data.id 
    });

  } catch (error: any) {
    console.error('[Drive API Error]:', error.message);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
