// components/Layout.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Truck, Box, MessageSquare, 
  Settings, Bell, User, LayoutDashboard 
} from 'lucide-react';

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // האזנה לגלילה עבור אפקט ב-Header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'דאשבורד LIVE', href: '/admin/master-dashboard', icon: LayoutDashboard },
    { name: 'ניהול מכולות', href: '/admin/containers', icon: Box },
    { name: 'צ\'אט סבן AI', href: '/chat', icon: MessageSquare },
    { name: 'הגדרות', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111B21] font-sans selection:bg-emerald-100" dir="rtl">
      <Head>
        <title>SabanOS | Premium Experience</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Header מודרני צף */}
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 py-3 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Menu size={22} className="text-gray-700" />
            </button>
            <div className="flex flex-col">
              <span className="font-black italic text-xl tracking-tighter text-slate-900 leading-none">
                SABAN<span className="text-emerald-600">OS</span>
              </span>
              <span className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-[0.2em] leading-none mt-1">Premium Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-white shadow-sm border border-gray-100 rounded-2xl cursor-pointer">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-xl border-2 border-white overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=Rami&background=0f172a&color=fff" alt="Rami" />
            </div>
          </div>
        </div>
      </header>

      {/* תוכן העמוד */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {children}
      </main>

      {/* תפריט צד PWA - Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[110]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] md:w-80 bg-white z-[120] p-8 shadow-2xl flex flex-col border-l border-gray-100"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="font-black italic text-2xl text-slate-900">SABAN <span className="text-emerald-600">OS</span></span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl">
                  <X size={24} />
                </button>
              </div>
              
              <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                  <Link href={item.href} key={item.name} onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-emerald-100">
                      <div className="p-2 bg-gray-50 group-hover:bg-white rounded-xl transition-colors shadow-sm">
                        <item.icon size={20} className="text-gray-400 group-hover:text-emerald-600" />
                      </div>
                      <span className="font-bold text-gray-700 group-hover:text-emerald-700">{item.name}</span>
                    </div>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto p-4 bg-slate-900 rounded-[2rem] flex items-center gap-4 text-white shadow-2xl">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black">R</div>
                 <div>
                    <p className="text-xs font-black">ראמי מסארווה</p>
                    <p className="text-[10px] opacity-60">מנהל מערכת</p>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
