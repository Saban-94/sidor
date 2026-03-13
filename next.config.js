/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',         // מיקום קבצי ה-Service Worker
  register: true,         // רישום אוטומטי של ה-SW
  skipWaiting: true,      // עדכון גרסה מיידי כשיש שינוי ב-PWA
  disable: process.env.NODE_ENV === 'development', // ביטול PWA בסביבת פיתוח
});

const nextConfig = {
  reactStrictMode: true,
  env: {
    FIREBASE_DATABASE_URL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pps.whatsapp.net',
      },
    ],
  },
  // השורה הקריטית לפתרון השגיאה בגרסה 16 ומעלה
  experimental: {
    turbopack: {},
  },
};

module.exports = withPWA(nextConfig);
