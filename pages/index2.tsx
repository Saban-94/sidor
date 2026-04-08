'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';

// טעינה דינמית עם מנגנון הגנה
const OrderBoard = dynamic(() => import('../components/OrderBoard'), { 
  ssr: false,
  loading: () => <div className="p-10 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest text-xs">SabanOS Loading Board...</div>
});

const SmartOrderSync = dynamic(() => import('../components/SmartOrderSync'), { 
  ssr: false 
});

export default function PWAHome() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Layout>
      <Head>
        <title>SabanOS | Console</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <main className="min-h-screen bg-[#0b141a] pb-32">
        <div className="p-4 bg-[#111b21] sticky top-0 z-40 border-b border-white/5 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <h1 className="text-xl font-bold text-emerald-500 italic tracking-tighter">SabanOS AI</h1>
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
            PWA Console
          </div>
        </div>

        <div className="p-2 max-w-5xl mx-auto">
          <OrderBoard />
        </div>

        <SmartOrderSync />
      </main>
    </Layout>
  );
}

export const forceDynamic = 'force-dynamic';
