'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Truck, Box, MessageSquare, Settings, ChevronLeft } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'לוח בקרה LIVE', href: '/admin/master-dashboard', icon: Truck },
    { name: 'ניהול מכולות', href: '/admin/containers', icon: Box },
    { name: 'צ\'אט סבן AI', href: '/chat', icon: MessageSquare },
    { name: 'הגדרות מערכת', href: '/settings', icon: Settings },
  ];

  // רשימת צוות מעודכנת עם IDs וקישורים
  const teamMembers = [
    { id: '22b540ab', name: 'הראל', role: 'מנכ"ל', avatar: 'https://ui-avatars.com/api/?name=Harel&background=059669&color=fff' },
    { id: '33c651bc', name: 'נתנאל ח. סבן', role: 'קניין', avatar: 'https://ui-avatars.com/api/?name=Netanel&background=0284c7&color=fff' },
    { id: '0df1b95b', name: 'ראמי מסארווה', role: 'מנהל מערכת', avatar: 'https://ui-avatars.com/api/?name=Rami&background=000&color=fff' },
    { id: '4db7e946', name: 'איציק זהבי', role: 'מנהל החרש', avatar: 'https://ui-avatars.com/api/?name=Itzik&background=7c3aed&color=fff' },
    { id: 'saban-ai', name: 'SABAN AI', role: 'מוח מערכת', avatar: 'https://i.postimg.cc/3wTMxG7W/ai.jpg' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111B21] font-sans" dir="rtl">
      <Head>
        <title>SABAN OS | Command Center</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[100] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <Menu size={24} />
          </button>
          <span className="font-black italic text-xl tracking-tighter text-slate-900">SABAN<span className="text-emerald-600">OS</span></span>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shadow-sm border border-emerald-200">RM</div>
      </header>

      <main className="pt-16">
        {children}
      </main>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
            />
            
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[120] p-6 shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <span className="font-black italic text-lg text-emerald-600 font-bold">SABAN OS</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-black">
                  <X size={22} />
                </button>
              </div>
              
              <nav className="space-y-1 overflow-y-auto scrollbar-hide">
                {menuItems.map((item) => (
                  <Link href={item.href} key={item.name} onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all group cursor-pointer">
                      <item.icon size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      <span className="font-bold text-sm text-slate-800">{item.name}</span>
                    </div>
                  </Link>
                ))}
                
                <div className="pt-6 mt-4 border-t border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">צוות וקבוצות</p>
                  {teamMembers.map(member => (
                    <Link 
                      href={`/chat?userId=${member.id}&name=${encodeURIComponent(member.name)}`} 
                      key={member.id}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-slate-100 active:scale-95 mb-1">
                        <div className="relative flex-shrink-0">
                          <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover" />
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold leading-none truncate">{member.role}</p>
                        </div>
                        <ChevronLeft size={14} className="text-slate-200 group-hover:text-emerald-600 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
