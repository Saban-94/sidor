import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';

// טעינה דינמית של הרכיבים כדי למנוע שגיאות Prerendering ב-Vercel
const OrderBoard = dynamic(() => import('../components/OrderBoard'), { ssr: false });
const SmartOrderSync = dynamic(() => import('../components/SmartOrderSync'), { ssr: false });

/**
 * SabanOS - Smart PWA Console
 * גרסה חסינה לבילד - Force Dynamic
 */
export default function PWAHome() {
  return (
    <Layout>
      <Head>
        <title>SabanOS | Console</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <main className="min-h-screen bg-[#0b141a] pb-32">
        {/* Header - Saban Style */}
        <div className="p-4 bg-[#111b21] sticky top-0 z-40 border-b border-white/5 flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <h1 className="text-xl font-bold text-emerald-500 italic tracking-tighter">SabanOS AI</h1>
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
            PWA Mode
          </div>
        </div>

        {/* Content Area */}
        <div className="p-2 max-w-5xl mx-auto">
          <OrderBoard />
        </div>

        {/* Bottom AI Sync Component */}
        <SmartOrderSync />
      </main>
    </Layout>
  );
}

// פקודה קריטית לורסל: אל תנסה לרנדר את הדף הזה כסטטי
export const forceDynamic = 'force-dynamic';
