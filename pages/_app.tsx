import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#00A884" />
        <title>SABAN HUB | AI Customer Management</title>
        <meta name="description" content="SABAN HUB - Unified AI customer management and WhatsApp messaging platform" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>

      <main className="min-h-screen font-sans antialiased bg-saban-dark text-white">
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default MyApp;
