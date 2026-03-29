// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// פונקציית עזר לבדיקה אם המפתחות קיימים
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// אתחול האפליקציה רק אם יש הגדרות תקינות ורק פעם אחת
const app = (isConfigValid) 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) 
  : null;

// ייצוא שירותים בצורה בטוחה
export const db = app ? getFirestore(app) : null;
export const rtdb = app ? getDatabase(app) : null;
export const database = rtdb; // תאימות לקוד ישן
export const auth = app ? getAuth(app) : null;

export { app };
