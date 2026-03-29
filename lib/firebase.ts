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

// אתחול רק אם יש API KEY - מונע קריסה ב-Build
const app = (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) 
  : null;

export const db = app ? getFirestore(app) : null;
export const rtdb = app ? getDatabase(app) : null;
export const database = rtdb; 
export const auth = app ? getAuth(app) : null;
export { app };
