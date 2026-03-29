// pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // רישום ה-Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Saban OS SW registered: ', registration.scope);
          },
          (err) => {
            console.log('Saban OS SW registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#3B82F6" /> {/* כחול פרימיום */}
        <title>SABAN OS | Premium Logistics</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>

      <main className="min-h-screen font-sans antialiased bg-[#F0F4F8]">
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default MyApp;
