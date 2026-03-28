import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // מאפשר העלאה של עד 10MB
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileData, mimeType, phone } = req.body;

  // מלשינון: תחילת תהליך
  console.log(`[Drive Debug] Starting upload: ${fileName} | Phone: ${phone}`);

  try {
    const jsonKey = process.env.GOOGLE_DRIVE_JSON_KEY;
    if (!jsonKey) {
      console.error("[Drive Debug] ERROR: GOOGLE_DRIVE_JSON_KEY is missing!");
      throw new Error("Missing GOOGLE_DRIVE_JSON_KEY");
    }

    const credentials = JSON.parse(jsonKey);
    
    // תיקון מפתח פרטי עבור Vercel (החלפת \n בתו שורה אמיתי)
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      console.log("[Drive Debug] Private key formatted.");
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // המרה ל-Buffer (עוקף את שגיאת .pipe כי זה לא Stream)
    const buffer = Buffer.from(fileData, 'base64');
    console.log(`[Drive Debug] Buffer created. Size: ${buffer.length} bytes`);

    const fileMetadata = {
      name: `${phone || 'customer'}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    const media = {
      mimeType: mimeType,
      body: buffer, // שליחה ישירה של ה-Buffer
    };

    console.log("[Drive Debug] Calling Google Drive API...");

    // ביצוע ההעלאה
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    } as any);

    console.log("[Drive Debug] SUCCESS! File ID:", response.data.id);

    return res.status(200).json({ 
      link: response.data.webViewLink,
      id: response.data.id 
    });

  } catch (error: any) {
    // המלשינון חושף את סיבת הקריסה בלוגים של Vercel
    console.error('[Drive Debug] CRITICAL ERROR:', error.message);
    
    return res.status(500).json({ 
      error: 'Upload Failed', 
      details: error.message 
    });
  }
}
