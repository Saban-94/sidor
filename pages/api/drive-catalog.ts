import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * מנוע שליפת מדיה וערך מוסף מהגוגל דרייב
 * שואב סרטוני הדרכה ומפרטים טכניים לפי שם מוצר
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productName } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    // 1. הגדרת חיבור ל-Google Drive API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_CATALOG_FOLDER_ID; // התיקייה הראשית של הקטלוגים

    // 2. חיפוש תיקיית המוצר הספציפי
    const folderSearch = await drive.files.list({
      q: `'${PARENT_FOLDER_ID}' in parents and name contains '${productName}' and mimeType = 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    const productFolder = folderSearch.data.files?.[0];

    if (!productFolder) {
      return res.status(200).json({ found: false, message: 'No media found for this product' });
    }

    // 3. שליפת כל הקבצים בתוך תיקיית המוצר (סרטונים, PDF, תמונות)
    const filesList = await drive.files.list({
      q: `'${productFolder.id}' in parents`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
    });

    const files = filesList.data.files || [];

    // 4. סיווג הקבצים להחזרה לאפליקציה
    const catalogData = {
      found: true,
      productName: productFolder.name,
      videos: files
        .filter(f => f.mimeType?.includes('video'))
        .map(f => ({ name: f.name, link: f.webViewLink })),
      specs: files
        .filter(f => f.mimeType?.includes('pdf'))
        .map(f => ({ name: f.name, link: f.webViewLink })),
      images: files
        .filter(f => f.mimeType?.includes('image'))
        .map(f => ({ name: f.name, link: f.webViewLink }))
    };

    return res.status(200).json(catalogData);

  } catch (error: any) {
    console.error('Drive API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Drive', details: error.message });
  }
}
