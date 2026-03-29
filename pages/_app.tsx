// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // בדיקה אם הדפדפן תומך ב-Service Workers
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('Saban OS Worker: Active', reg.scope),
          (err) => console.log('Saban OS Worker: Failed', err)
        );
      });
    }
  }, []);

  return (
    <>
      <Head>
        {/* הגדרות PWA קריטיות */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#10b981" /> 
        <title>SABAN OS | Premium AI</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>

      <main className="min-h-screen font-sans antialiased bg-[#F8FAFC]">
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default MyApp;
