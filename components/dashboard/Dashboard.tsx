'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// טעינה דינמית של ה-AI STUDIO החדש - פריסה מלאה
const SabanAIStudio = dynamic(() => import('../../pages/admin/ai'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
      <div className="text-emerald-500 animate-pulse font-black text-xl italic tracking-tighter">
        SABAN AI CORE LOADING...
      </div>
    </div>
  )
});

export default function Dashboard() {
  return (
    <div className="h-screen w-full bg-[#020617] overflow-hidden" dir="rtl">
      <Head>
        <title>AI | ח.סבן</title>
      </Head>

      {/* פריסה של 100% מהמסך רק עבור הממשק החדש */}
      <main className="h-full w-full">
        <SabanAIStudio />
      </div>

      {/* ביטול גלילה מיותרת ותיקון באגים ויזואליים */}
      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #020617;
        }
        /* הסתרת אלמנטים שעלולים לצוף מהדף המקורי */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
