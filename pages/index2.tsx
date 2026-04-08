import React from 'react';
import Head from 'next/head';
import OrderBoard from '../components/OrderBoard';
import SmartOrderSync from '../components/SmartOrderSync';
import Layout from '../components/Layout';

export default function PWAHome() {
  return (
    <Layout>
      <Head>
        <title>SabanOS | ניהול חכם</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <main className="min-h-screen bg-[#0b141a] pb-32">
        {/* כותרת עליונה בסגנון אפליקציה */}
        <div className="p-4 bg-[#111b21] sticky top-0 z-40 border-b border-white/5 flex justify-between items-center">
          <h1 className="text-xl font-bold text-emerald-500">SabanOS AI</h1>
          <div className="flex gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* לוח ההזמנות הקיים במאגר */}
        <div className="p-2">
          <OrderBoard />
        </div>

        {/* רכיב הסנכרון החדש שבנינו - יושב קבוע למטה */}
        <SmartOrderSync />
      </main>
    </Layout>
  );
}
