'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ShieldCheck, UserCheck, BarChart3, Settings, Menu, X, 
  PlusCircle, LayoutGrid, Briefcase, Lock, MapPin, 
  Sun, Moon, Database, MessageSquare, Send, Zap, Bell, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// מימדים קבועים לרמת CRM מקצועי
const CRM_DIMENSIONS = {
  desktop: { sidebarWidth: 300, headerHeight: 80, padding: 32 },
  mobile: { sidebarWidth: 320, headerHeight: 64, padding: 16 }
};

export default function SabanCRMPro() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // דיפולט כהה לבוס
  const [currentTime, setCurrentTime] = useState('');

  // מניעת שגיאות Hydration וזיהוי מכשיר
  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    setCurrentTime(new Date().toLocaleTimeString('he-IL'));
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  const D = isMobile ? CRM_DIMENSIONS.mobile : CRM_DIMENSIONS.desktop;

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      
      {/* 💻 מחשב שולחני: פאנל צדדי (Sidebar) */}
      {!isMobile && (
        <aside style={{ width: D.sidebarWidth }} className={`fixed top-0 right-0 h-screen z-40 p-8 flex flex-col gap-12 border-l transition-all ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
          <CRM_Logo isDarkMode={isDarkMode}/>
          <CRM_Navigation isDarkMode={isDarkMode}/>
          <CRM_StatusBar time={currentTime}/>
        </aside>
      )}

      {/* 📱 מובייל: המבורגר שכבות (Layered Menu) */}
      <AnimatePresence>
        {isMobile && showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex" onClick={() => setShowMenu(false)}>
            <motion.aside 
              initial={{ x: D.sidebarWidth }} 
              animate={{ x: 0 }} 
              exit={{ x: D.sidebarWidth }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className={`h-full p-8 flex flex-col gap-10 shadow-2xl relative ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'}`} 
              style={{ width: D.sidebarWidth }} 
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowMenu(false)} className="absolute top-6 left-6 p-2 rounded-xl hover:bg-white/10 text-slate-400"><X/></button>
              <CRM_Logo isDarkMode={isDarkMode}/>
              <CRM_Navigation isDarkMode={isDarkMode}/>
              <CRM_StatusBar time={currentTime}/>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main 
        style={{ 
          paddingRight: isMobile ? D.padding : D.sidebarWidth + D.padding, 
          paddingTop: D.headerHeight + D.padding, 
          paddingLeft: D.padding, 
          paddingBottom: D.padding 
        }} 
        className="transition-all duration-300"
      >
        
        {/* Header פרימיום */}
        <header 
          style={{ 
            height: D.headerHeight, 
            paddingLeft: D.padding, 
            paddingRight: D.padding, 
            width: isMobile ? '100%' : `calc(100% - ${D.sidebarWidth}px)` 
          }} 
          className={`fixed top-0 left-0 shadow-2xl z-30 flex items-center justify-between border-b transition-all ${isDarkMode ? 'bg-[#1E293B]/90 backdrop-blur-xl border-white/5' : 'bg-white/90 backdrop-blur-xl border-slate-200'} ${isMobile && 'right-0'}`}
        >
          <div className="flex items-center gap-4">
            {isMobile && <button onClick={() => setShowMenu(true)} className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}><Menu/></button>}
            <div>
                <h2 className="font-black text-xl leading-tight text-emerald-500 uppercase tracking-tighter">ראמי מסארוה</h2>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Samsung Note 25 Ultra • Control Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'bg-white/5 text-orange-400 shadow-inner' : 'bg-slate-100 text-slate-600 shadow-sm'}`}>
                {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
             <button className="hidden md:flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-black text-xs rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95 hover:bg-emerald-400 transition-all uppercase">
                <PlusCircle size={18}/> פקודה חדשה
             </button>
          </div>
        </header>

        {/* אזור התוכן המרכזי */}
        <div className={`rounded-[3rem] p-10 min-h-[75vh] shadow-2xl relative overflow-hidden border transition-all ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'}`}>
            {/* רקע שכבות טכנולוגי */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat" />
            
            <div className="relative z-10 flex flex-col gap-8">
                <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/>
                    SABAN CORE: מחובר למערכת השליטה (DNA SYNC OK)
                </div>
                
                {/* דשבורד כרטיסים מקצועי */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <DashboardCard title="משימות ח.סבן" count="12" sub="הובלות והזמנות" icon={<Briefcase/>} color="emerald" isDarkMode={isDarkMode}/>
                    <DashboardCard title="משימות פרטיות" count="4" sub="תזכורות אישיות" icon={<Lock/>} color="orange" isDarkMode={isDarkMode}/>
                    <DashboardCard title="מעקב נהגים" count="Live" sub="עלי וחכמת בפעילות" icon={<MapPin/>} color="blue" isDarkMode={isDarkMode}/>
                </div>

                {/* כאן תבוא הזרקת הצאט שלך */}
            </div>
        </div>

      </main>
    </div>
  );
}

// קומפוננטות עזר מעוצבות

function CRM_Logo({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
        <div className="bg-emerald-500 text-black p-3.5 rounded-[1.2rem] shadow-2xl shadow-emerald-500/40 group-hover:rotate-12 transition-transform duration-500">
          <ShieldCheck size={32}/>
        </div>
        <div>
            <h1 className={`text-2xl font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Saban</h1>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-1">OS Master</p>
        </div>
    </div>
  );
}

function CRM_Navigation({ isDarkMode }: { isDarkMode: boolean }) {
  const items = [
    { name: 'מרכז בקרה', icon: <LayoutGrid size={22}/> },
    { name: 'ניהול נהגים', icon: <UserCheck size={22}/> },
    { name: 'דוחות וואטסאפ', icon: <MessageSquare size={22}/> },
    { name: 'הגדרות DNA', icon: <Settings size={22}/> }
  ];
  return (
    <nav className="flex flex-col gap-3">
      {items.map(i => (
        <button key={i.name} className={`flex items-center gap-5 px-6 py-5 rounded-[1.5rem] font-black text-sm transition-all group ${isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-200'}`}>
          <span className="text-emerald-500 group-hover:scale-125 transition-transform duration-300">{i.icon}</span> 
          {i.name}
        </button>
      ))}
    </nav>
  );
}

function CRM_StatusBar({ time }: { time: string }) {
  return (
    <div className="mt-auto font-mono text-[9px] text-slate-500 p-6 bg-slate-500/5 rounded-[2rem] space-y-3 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> ONLINE</span>
          <span className="opacity-40 uppercase">v2.4.0</span>
        </div>
        <div className="text-emerald-500/70 font-bold tracking-widest uppercase">[{time}] Sync Active</div>
        <div className="pt-2 border-t border-white/5 opacity-30 text-[8px]">PRIMARY: GEMINI-3.1-LITE</div>
    </div>
  );
}

function DashboardCard({ title, count, sub, icon, color, isDarkMode }: any) {
    const colors: any = {
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    };
    return (
        <div className={`p-8 rounded-[2.5rem] border transition-all hover:translate-y-[-5px] cursor-pointer group ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-slate-50 border-slate-200 shadow-md'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
            <div className={`text-4xl font-black mb-1 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{count}</div>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</div>
            <div className="text-[9px] opacity-40 font-bold">{sub}</div>
        </div>
    );
}
