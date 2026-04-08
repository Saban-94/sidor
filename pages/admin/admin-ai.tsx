'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerUnifiedManager from '@/components/sabanOS/CustomerUnifiedManager';

export const dynamic = 'force-dynamic';

export default function AdminAiPage() {
  const [isLoading, setIsLoading] = useState(true);

  // סימולציה קצרה של טעינה כדי להבטיח חוויית משתמש חלקה
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      {/* מיכל מרכזי המגביל רוחב */}
      <div className="max-w-7xl mx-auto">
        
        {/* כותרת הדף */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">ניהול לקוחות חכם (AI)</h1>
          <p className="mt-2 text-slate-600">צפייה, עריכה וניהול מאוחד של כלל הלקוחות במערכת.</p>
        </header>

        <AnimatePresence mode="wait">
          {isLoading ? (
            /* מצב טעינה זמני */
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </motion.div>
          ) : (
            /* התוכן המרכזי */
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }} // מתחיל שקוף וקצת נמוך יותר
              animate={{ opacity: 1, y: 0 }}   // עולה למעלה והופך לנראה
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <CustomerUnifiedManager />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
