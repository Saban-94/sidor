import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { fileName, fileData, mimeType, phone } = req.body;

  try {
    const jsonKey = process.env.GOOGLE_DRIVE_JSON_KEY;
    if (!jsonKey) throw new Error("Missing GOOGLE_DRIVE_JSON_KEY");

    const credentials = JSON.parse(jsonKey);
    // תיקון פורמט המפתח עבור ורסל
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // המרה ל-Uint8Array - הפתרון הסופי לשגיאת ה-pipe
    const fileBuffer = Buffer.from(fileData, 'base64');
    const uint8Array = new Uint8Array(fileBuffer);

    const fileMetadata = {
      name: `${phone || 'customer'}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    const media = { mimeType, body: uint8Array };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    } as any);

    return res.status(200).json({ link: response.data.webViewLink });
  } catch (error: any) {
    console.error('[Drive Error]:', error.message);
    return res.status(500).json({ error: 'Upload Failed', details: error.message });
  }
}
