import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { fileName, fileData, mimeType, phone } = req.body;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_DRIVE_JSON_KEY!),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
      name: `${phone}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!] // ה-ID של התיקייה בדרייב
    };

    const media = {
      mimeType: mimeType,
      body: Buffer.from(fileData, 'base64'),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return res.status(200).json({ link: file.data.webViewLink, fileId: file.data.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
