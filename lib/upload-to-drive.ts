import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // מאפשר קבצים עד 10 מגה
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
    
    // תיקון מפתח פרטי - קריטי לשרתי Vercel
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // המרה לפורמט בסיסי שאינו דורש .pipe()
    const buffer = Buffer.from(fileData, 'base64');

    const fileMetadata = {
      name: `${phone || 'customer'}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    // הגדרה של "media" בצורה פשוטה - גוגל תזהה שזה Buffer ותטפל בזה פנימית
    const media = {
      mimeType: mimeType,
      body: buffer, 
    };

    // שימוש ב-create בצורה הכי בסיסית שלו
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    } as any); // as any מונע שגיאות Type של TS בגרסאות מסוימות

    return res.status(200).json({ 
      link: response.data.webViewLink,
      id: response.data.id 
    });

  } catch (error: any) {
    console.error('Drive Critical Error:', error.message);
    return res.status(500).json({ 
      error: 'Upload Failed', 
      details: error.message 
    });
  }
}
