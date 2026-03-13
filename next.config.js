/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  
  // פתרון השגיאה: הגדרת אובייקט turbopack ריק ברמה הראשית
  turbopack: {}, 

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
