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

  console.log(`[Drive Auth] Starting upload for: ${fileName} from ${phone}`);

  try {
    // 1. בדיקת קיום המפתח
    const jsonKey = process.env.GOOGLE_DRIVE_JSON_KEY;
    if (!jsonKey) {
      console.error("[Drive Error] GOOGLE_DRIVE_JSON_KEY is missing in Environment Variables!");
      throw new Error("Missing JSON Key in Vercel settings");
    }

    const credentials = JSON.parse(jsonKey);
    console.log("[Drive Auth] JSON parsed successfully. Project ID:", credentials.project_id);

    // 2. תיקון מפתח פרטי (החלפת \n בתו שורה אמיתי)
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      console.log("[Drive Auth] Private key format fixed.");
    } else {
      console.error("[Drive Error] Private key is missing inside the JSON!");
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 3. הכנת הקובץ (שימוש ב-Buffer ישיר למניעת שגיאת .pipe)
    const buffer = Buffer.from(fileData, 'base64');
    console.log(`[Drive Upload] Buffer created. Size: ${buffer.length} bytes`);

    const fileMetadata = {
      name: `${phone || 'customer'}_${fileName}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ''],
    };

    const media = {
      mimeType: mimeType,
      body: buffer, 
    };

    console.log("[Drive Upload] Sending request to Google Drive API...");

    // 4. ביצוע ההעלאה
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    } as any);

    console.log("[Drive Success] File uploaded! ID:", response.data.id);

    return res.status(200).json({ 
      link: response.data.webViewLink,
      id: response.data.id 
    });

  } catch (error: any) {
    // המלשינון המרכזי - כאן תראה למה זה קרס
    console.error('[Drive Critical Failure]:');
    console.error('Message:', error.message);
    
    if (error.message.includes('insufficient permissions')) {
      console.error('FIX: You must share the folder with the service account email as Editor!');
    }
    
    return res.status(500).json({ 
      error: 'Upload Failed', 
      details: error.message 
    });
  }
}
