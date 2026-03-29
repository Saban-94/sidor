// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// הגדרות ה-Firebase שלך - נמשכות מקובץ ה-.env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// אתחול האפליקציה (מונע אתחול כפול ב-Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 1. המאגר המקצועי (Firestore) - לניהול הזמנות, לקוחות וסידור עבודה
const db = getFirestore(app);

// 2. המאגר המהיר (Realtime Database) - לסנכרון צ'אטים והודעות מיידיות
const rtdb = getDatabase(app);

// 3. אימות משתמשים (Auth)
const auth = getAuth(app);

export { app, db, rtdb, auth };
