import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

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
    
    // תיקון מפתח פרטי עבור Vercel
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // יצירת הקובץ ללא שימוש ב-Stream (שימוש ב-Base64 ישיר)
    // זה הפתרון הסופי שעוקף את שגיאת .pipe() ב-Next.js 16
    const fileMetadata = {
      name: `${phone || 'customer'}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    // אנחנו שולחים את המדיה כ-String בפורמט Base64 או Buffer
    // גוגל יודעת לטפל בזה כ-Simple Request בתוך ה-SDK
    const media = {
      mimeType: mimeType,
      body: Buffer.from(fileData, 'base64'),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    } as any);

    console.log(`[Drive Success] File ID: ${response.data.id}`);

    return res.status(200).json({ 
      link: response.data.webViewLink,
      id: response.data.id 
    });

  } catch (error: any) {
    console.error('[Drive Critical Error]:', error.message);
    
    // אם השגיאה היא Permissions, זה אומר שלא שיתפת את התיקייה עם המייל מה-JSON
    return res.status(500).json({ 
      error: 'Upload Failed', 
      details: error.message 
    });
  }
}
