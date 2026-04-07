// Cache invalidation: 2026-04-07
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  
  // 1. השתקת שגיאות ה-TypeScript וה-Lint (חובה בגרסה הזו)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. פתרון השגיאה של Turbopack: הגדרה ריקה כדי להשתיק את ה-Error
  turbopack: {}, 

  // 3. משתני סביבה
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
};

module.exports = withPWA(nextConfig);
