'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// טעינה דינמית של ה-AI STUDIO כרכיב הראשי והיחיד
const SabanAIStudio = dynamic(() => import('../../pages/admin/ai'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
      <div className="text-emerald-500 animate-pulse font-black text-xl italic tracking-tighter">
        SABAN AI CORE | INITIALIZING...
      </div>
    </div>
  )
});

export const Dashboard: React.FC = () => {
  return (
    <div className="h-screen w-full bg-[#020617] overflow-hidden">
      {/* אין יותר Sidebars, אין יותר ChatWindow חיצוני - רק המוח החדש */}
      <main className="h-full w-full relative">
        <SabanAIStudio />
      </main>

      <style jsx global>{`
        /* ביטול שוליים וגלילה כפולה של הדף הישן */
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        /* הסתרת אלמנטים ישנים שעלולים להופיע מה-Layout הכללי */
        aside, header:not(.ai-header) {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
