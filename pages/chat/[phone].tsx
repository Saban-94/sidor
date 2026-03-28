'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  ShieldCheck, UserCheck, BarChart3, Settings, Menu, X, 
  PlusCircle, LayoutGrid, Clock, Briefcase, Lock, Database, Send, Zap, Bell, Mail, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// מימדים קבועים לרמת CRM
const CRM_DIMENSIONS = {
  desktop: { sidebarWidth: 300, headerHeight: 80, padding: 32 },
  mobile: { sidebarWidth: 320, headerHeight: 64, padding: 16 }
};

export default function SabanCRMPro() {
  const [mounted, setMounted] = useState(false); // מונע שגיאות Hydration
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // פתרון לשגיאת Hydration: הרצה רק לאחר טעינה
  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    
    // עדכון זמן בצד לקוח בלבד
    setCurrentTime(new Date().toLocaleTimeString());
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null; // מחכה שהקומפוננטה תעלה בדפדפן

  const D = isMobile ? CRM_DIMENSIONS.mobile : CRM_DIMENSIONS.desktop;

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-100 transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      
      {/* 💻 מחשב שולחני: פאנל צדדי קבוע */}
      {!isMobile && (
        <aside style={{ width: D.sidebarWidth }} className={`fixed top-0 right-0 h-screen z-40 p-8 flex flex-col gap-12 border-l ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
          <CRM_Logo isDarkMode={isDarkMode}/>
          <CRM_Navigation isDarkMode={isDarkMode}/>
          <CRM_StatusBar time={currentTime}/>
        </aside>
      )}

      {/* 📱 מובייל: המבורגר שכבות מקצועי */}
      <AnimatePresence>
        {isMobile && showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex" onClick={() => setShowMenu(false)}>
            <motion.aside 
              initial={{ x: D.sidebarWidth }} 
              animate={{ x: 0 }} 
              exit={{ x: D.sidebarWidth }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className={`h-full p-8 flex flex-col gap-10 shadow-2xl relative ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'}`} 
              style={{ width: D.sidebarWidth }} 
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowMenu(false)} className="absolute top-6 left-6 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"><X/></button>
              <CRM_Logo isDarkMode={isDarkMode}/>
              <CRM_Navigation isDarkMode={isDarkMode}/>
              <CRM_StatusBar time={currentTime}/>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* אזור תוכן ראשי */}
      <main 
        style={{ 
          paddingRight: isMobile ? D.padding : D.sidebarWidth + D.padding, 
          paddingTop: D.headerHeight + D.padding, 
          paddingLeft: D.padding, 
          paddingBottom: D.padding 
        }} 
        className="transition-all duration-300"
      >
        
        {/* Header מקצועי */}
        <header 
          style={{ 
            height: D.headerHeight, 
            paddingLeft: D.padding, 
            paddingRight: D.padding, 
            width: isMobile ? '100%' : `calc(100% - ${D.sidebarWidth}px)` 
          }} 
          className={`fixed top-0 left-0 shadow-lg z-30 flex items-center justify-between border-b transition-colors ${isDarkMode ? 'bg-[#1E293B]/80 backdrop-blur-md border-white/5' : 'bg-white/80 backdrop-blur-md border-slate-100'} ${isMobile && 'right-0'}`}
        >
          <div className="flex items-center gap-4">
            {isMobile && <button onClick={() => setShowMenu(true)} className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}><Menu/></button>}
            <div>
                <h2 className="font-black text-lg leading-tight text-emerald-500">ראמי מסארוה</h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Samsung Note 25 Pro • System Active</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 text-orange-400' : 'bg-slate-100 text-slate-600'}`}>
                {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
             <button className="hidden md:flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                <PlusCircle size={18}/> משימה חדשה
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className={`rounded-[2.5rem] p-8 min-h-[70vh] shadow-inner relative overflow-hidden border ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100'}`}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />
            <div className="relative z-10">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black mb-8 ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Lock size={12}/> ה-DNA הוטמע: בוס, המערכת מוכנה לשליטה מלאה.
                </div>
                
                {/* דוגמה לממשק ביצועי */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCard title="משימות ח.סבן" count="8" icon={<Briefcase/>} color="emerald" isDarkMode={isDarkMode}/>
                    <DashboardCard title="משימות פרטיות" count="4" icon={<Lock/>} color="orange" isDarkMode={isDarkMode}/>
                    <DashboardCard title="התראות מיקום" count="Live" icon={<MapPin/>} color="blue" isDarkMode={isDarkMode}/>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}

// קומפוננטות עזר
function CRM_Logo({ isDarkMode }: any) {
  return (
    <div className="flex items-center gap-4">
        <div className="bg-emerald-500 text-black p-3 rounded-2xl shadow-xl shadow-emerald-500/20"><ShieldCheck size={28}/></div>
        <div>
            <h1 className={`text-xl font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Saban OS</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Intelligence Core</p>
        </div>
    </div>
  );
}

function CRM_Navigation({ isDarkMode }: any) {
  const items = [
    { name: 'דאשבורד', icon: <LayoutGrid size={20}/> },
    { name: 'ניהול נהגים', icon: <UserCheck size={20}/> },
    { name: 'דוחות בוקר', icon: <BarChart3 size={20}/> },
    { name: 'הגדרות DNA', icon: <Settings size={20}/> }
  ];
  return (
    <nav className="flex flex-col gap-2">
      {items.map(i => (
        <button key={i.name} className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group ${isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
          <span className="group-hover:scale-110 transition-transform text-emerald-500">{i.icon}</span> {i.name}
        </button>
      ))}
    </nav>
  );
}

function CRM_StatusBar({ time }: { time: string }) {
  return (
    <div className="mt-auto font-mono text-[9px] text-slate-500 p-5 bg-slate-500/5 rounded-3xl space-y-2 border border-white/5">
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> SYSTEM ONLINE</div>
        <div>[{time}] DNA SYNC ACTIVE</div>
        <div className="opacity-50 text-[8px]">MODEL: GEMINI-3.1-FLASH-LITE</div>
    </div>
  );
}

function DashboardCard({ title, count, icon, color, isDarkMode }: any) {
    const colors: any = {
        emerald: 'text-emerald-500 bg-emerald-500/10',
        orange: 'text-orange-500 bg-orange-500/10',
        blue: 'text-blue-500 bg-blue-500/10'
    };
    return (
        <div className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>{icon}</div>
            <div className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{count}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</div>
        </div>
    );
}
