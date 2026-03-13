/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',         // מיקום קבצי ה-Service Worker
  register: true,         // רישום אוטומטי של ה-SW
  skipWaiting: true,      // עדכון גרסה מיידי כשיש שינוי ב-PWA
  disable: process.env.NODE_ENV === 'development', // ביטול PWA בסביבת פיתוח כדי למנוע קאש מעצבן
});

const nextConfig = {
  reactStrictMode: true,
  // הגדרת משתני סביבה שיעברו גם לצד הלקוח אם צריך
  env: {
    FIREBASE_DATABASE_URL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
  },
  // אופציונלי: אם אתה משתמש בתמונות ממקור חיצוני (כמו פרופילי וואטסאפ)
  images: {
    domains: ['pps.whatsapp.net'],
  },
};

module.exports = withPWA(nextConfig);
