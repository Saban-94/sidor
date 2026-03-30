'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Container, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ייבוא הקומפוננטות שלך (בהנחה שהוצאת אותן לקבצים נפרדים או נשתמש ב-Iframe/Views)
import ChatSystem from './chat/[phone]'; 
import ContainerSystem from './containers/index';

export default function MainDashboard() {
  const [activeTab, setActiveTab] = useState<'chat' | 'containers'>('chat');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'chat', label: 'סידור הזמנות', icon: MessageSquare, color: 'text-blue-500' },
    { id: 'containers', label: 'ניהול מכולות', icon: Container, color: 'text-emerald-500' },
  ];

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans" dir="rtl">
      <Head>
        <title>SABAN | Control Center</title>
      </Head>

      {/* תפריט צד (Sidebar) מקצועי */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex flex-col transition-all duration-300 relative z-50 shadow-2xl"
      >
        {/* לוגו */}
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 bg-emerald-500 rounded-xl shrink-0">
            <LayoutDashboard size={24} className="text-slate-900" />
          </div>
          {isSidebarOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black italic text-xl tracking-tighter">
              SABAN OS
            </motion.span>
          )}
        </div>

        {/* פריטי תפריט */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative overflow-hidden group ${
                activeTab === item.id 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? item.color : 'text-slate-400'} />
              {isSidebarOpen && <span className="font-bold">{item.label}</span>}
              {activeTab === item.id && (
                <motion.div layoutId="activeNav" className="absolute right-0 w-1 h-8 bg-emerald-500 rounded-l-full" />
              )}
            </button>
          ))}
        </nav>

        {/* כפתור סגירה/פתיחה */}
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="absolute -left-3 top-20 bg-emerald-500 text-slate-900 p-1 rounded-full border-4 border-[#F1F5F9] hover:scale-110 transition-transform"
        >
          <ChevronRight size={16} className={isSidebarOpen ? 'rotate-180' : ''} />
        </button>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center gap-4 p-4 text-slate-500 hover:text-red-400 transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold text-sm">ניתוק מערכת</span>}
          </button>
        </div>
      </motion.aside>

      {/* אזור התוכן המרכזי */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 h-full"
          >
            {activeTab === 'chat' ? (
              <div className="h-full bg-white shadow-inner">
                 {/* כאן נטען את דף הסידור */}
                 <ChatSystem /> 
              </div>
            ) : (
              <div className="h-full">
                {/* כאן נטען את לוח המכולות */}
                <ContainerSystem />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
