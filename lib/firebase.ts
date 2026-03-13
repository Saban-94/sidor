import admin from 'firebase-admin';

/**
 * Saban-OS: Firebase Admin Connection Module
 * אחראי על חיבור מאובטח ל-Realtime Database עבור הצינור של JONI
 */
// /lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // ייבוא ה-Realtime DB

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "...",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app); // חיבור ל-RTDB

export { app, db };
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // טיפול אגרסיבי בתווי ירידת שורה עבור המפתח הפרטי ב-Vercel
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    // וודא שכתובת ה-DB תואמת למה שמוגדר אצלך (europe-west1)
    const databaseURL = process.env.FIREBASE_DATABASE_URL || 
      `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL
      });
      console.log("✅ Saban-OS: Firebase Admin מחובר בהצלחה");
    } else {
      console.error("❌ חסרים משתני סביבה ל-Firebase - לכן קיבלת 500/503");
      console.log("פרמטרים חסרים:", { 
        projectId: !!projectId, 
        clientEmail: !!clientEmail, 
        privateKey: !!privateKey 
      });
    }
  } catch (error: any) {
    console.error("❌ שגיאת אתחול Firebase:", error.message);
  }
}

// ייצוא ה-DB: אם האתחול נכשל, הוא יחזיר null וה-API ייתן הודעה ברורה במקום לקרוס
export const adminDb = admin.apps.length ? admin.database() : null;
