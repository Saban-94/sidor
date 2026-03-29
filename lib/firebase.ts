// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // שימוש ב-Firestore למאגר מקצועי
import { getDatabase } from "firebase/database"; // שמירה על Realtime לגיבוי

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// אתחול האפליקציה
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// המאגר הראשי - Firestore (לבנייה מקצועית מ-0)
const db = getFirestore(app);

// המאגר המשני - Realtime Database (לצ'אטים מהירים וסנכרון מיידי)
const rtdb = getDatabase(app);

export { app, db, rtdb };
