'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Menu, X, Bell, User, Settings, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';

// טעינה דינמית של הרכיבים למניעת שגיאות בבילד
const OrderBoard = dynamic(() => import('../components/OrderBoard'), { 
  ssr: false,
  loading: () => <div className="p-10 text-center text-slate-400 animate-pulse font-bold">טוען לוח הזמנות...</div>
});

const SmartOrderSync = dynamic(() => import('../components/SmartOrderSync'), { 
  ssr: false 
});

export default function PWAHome() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const menuItems = [
    { icon: User, label: 'פרופיל אישי' },
    { icon: Bell, label: 'התראות מערכת' },
    { icon: Settings, label: 'הגדרות מסוף' },
    { icon: LogOut, label: 'ניתוק מהמערכת', color: 'text-red-500' },
  ];

  return (
    <Layout>
      <Head>
        <title>SabanOS | Smart Console</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-x-hidden">
        
        {/* Header מעוצב - Light Professional */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Saban OS</span>
              <h1 className="text-lg font-black text-slate-900 italic tracking-tighter">SmartConsole</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-500">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm">
              RM
            </div>
          </div>
        </header>

        {/* תפריט המבורגר (Side Menu) */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl p-6 flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="font-black italic text-xl text-blue-600">MENU</div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex-1 space-y-2">
                  {menuItems.map((item, i) => (
                    <button 
                      key={i}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group ${item.color || 'text-slate-600'}`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">{item.label}</span>
                      </div>
                      <ChevronRight size={16} className="opacity-30" />
                    </button>
                  ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">R</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">ראמי מסארווה</span>
                      <span className="text-[10px] text-blue-500 font-bold italic">Admin Access</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* תוכן מרכזי */}
        <main className="p-4 max-w-5xl mx-auto pb-40">
          {/* באנר סטטוס מהיר */}
          <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['הכל', 'בביצוע', 'ממתין', 'הושלם'].map((tab, i) => (
              <button 
                key={i}
                className={`px-6 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap shadow-sm
                  ${i === 0 ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* לוח ההזמנות - עבר התאמה ל-Light Mode */}
          <section className="space-y-4">
            <OrderBoard />
          </section>
        </main>

        {/* קונסולת ה-AI החכמה - מחוברת ל-Shipping Brain */}
        <SmartOrderSync />
      </div>
    </Layout>
  );
}

export const forceDynamic = 'force-dynamic';
