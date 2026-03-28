import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרת מגבלת גודל קובץ ל-10MB
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

  const { fileName, fileData, mimeType, phone } = req.body;

  try {
    // אימות מול Google
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_DRIVE_JSON_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // הגדרת המטא-דאטה של הקובץ
    const fileMetadata = {
      name: `${phone}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    const media = {
      mimeType: mimeType,
      body: Buffer.from(fileData, 'base64'),
    };

    // יצירת הקובץ בדרייב
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return res.status(200).json({ 
      link: file.data.webViewLink, 
      fileId: file.data.id 
    });

  } catch (error: any) {
    console.error('Drive Upload Error:', error);
    return res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
}
