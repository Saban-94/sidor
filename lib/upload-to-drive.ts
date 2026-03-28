import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';
import { PassThrough } from 'stream';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileData, mimeType, phone } = req.body;

  try {
    const jsonKey = process.env.GOOGLE_DRIVE_JSON_KEY;
    if (!jsonKey) throw new Error("Missing GOOGLE_DRIVE_JSON_KEY");

    const credentials = JSON.parse(jsonKey);
    
    // תיקון מפתח פרטי עבור סביבת Vercel
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // יצירת צינור PassThrough - זה הפתרון הסופי לשגיאת .pipe()
    const buffer = Buffer.from(fileData, 'base64');
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    const fileMetadata = {
      name: `${phone || 'unknown'}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream, // כאן ה-PassThrough פותר את הבעיה
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return res.status(200).json({ link: file.data.webViewLink });

  } catch (error: any) {
    console.error('Drive Error Detail:', error.message);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
