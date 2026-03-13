// /pages/_app.tsx
import '../styles/globals.css'; // ייבוא חובה: מחבר את כל חבילת העיצוב של Tailwind
import type { AppProps } from 'next/app';
import Head from 'next/head';

/**
 * MyApp - רכיב העטיפה הראשי
 * כאן אנחנו מזריקים את העיצוב הגלובלי ומגדירים הגדרות PWA ו-SEO
 */
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* הגדרות תצוגה למובייל - מונע זום לא רצוי ומתאים את האפליקציה למסך */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        
        {/* צבע הסטטוס בר במובייל (צבע המותג של ח. סבן / וואטסאפ) */}
        <meta name="theme-color" content="#00a884" />
        
        {/* כותרת ברירת מחדל במידה ולא הוגדרה בדף ספציפי */}
        <title>SabanOS - מערכת ניהול צינור</title>
        
        {/* קישור למניפסט של ה-PWA (חובה כדי שיהיה אפשר להתקין את האפליקציה) */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>

      {/* העטיפה של ה-Main Layout */}
      <main className="min-h-screen font-sans antialiased text-gray-900 bg-[#f0f2f5]">
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default MyApp;
