// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register Service Worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('SabanOS Service Worker: Active', reg.scope),
          (err) => console.log('SabanOS Service Worker: Failed', err)
        );
      });
    }

    // Prevent double tap zoom on mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Prevent pinch zoom
    document.addEventListener('gesturestart', (event) => {
      event.preventDefault();
    }, false);

    // Prevent wheel zoom (Ctrl+Scroll)
    document.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    }, { passive: false });
  }, []);

  return (
    <>
      <Head>
        {/* Critical PWA Configuration */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" 
        />
        <meta name="theme-color" content="#0b141a" />
        <meta name="description" content="SabanOS - Professional Building Materials Management System powered by Saban AI" />
        <meta name="apple-mobile-web-app-capable" content="true" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SabanOS" />
        
        {/* Prevent address bar hide/show issues on iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        
        {/* PWA Manifest and Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" href="/icon-192x192.png" />
        
        <title>SabanOS - Building Materials Management</title>
      </Head>

      <main className="h-screen w-full font-sans antialiased overflow-hidden">
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default MyApp;
