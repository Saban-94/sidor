'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, BarChart3, Settings, Menu, X, PlusCircle, LayoutGrid, Clock, Briefcase, Lock, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// מימדים קבועים לרמת CRM (Fixed Constraints)
const CRM_DIMENSIONS = {
  desktop: { sidebarWidth: 300, headerHeight: 80, padding: 32 },
  mobile: { sidebarWidth: 320, headerHeight: 64, padding: 16 }
};

export default function SabanCRMPro() {
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // זיהוי מכשיר (Device Detection)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize(); // בדיקה ראשונית
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const D = isMobile ? CRM_DIMENSIONS.mobile : CRM_DIMENSIONS.desktop;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans selection:bg-emerald-100" dir="rtl">
      
      {/* 💻 מחשב שולחני: פאנל צדדי קבוע */}
      {!isMobile && (
        <aside style={{ width: D.sidebarWidth }} className="fixed top-0 right-0 h-screen bg-white shadow-xl z-40 p-8 flex flex-col gap-12 border-l border-slate-100">
          <CRM_Logo D={D}/>
          <CRM_Navigation D={D}/>
          <CRM_StatusBar D={D}/>
        </aside>
      )}

      {/* 📱 מובייל: המבורגר שכבות מקצועי (Layered Burger) */}
      <AnimatePresence>
        {isMobile && showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex" onClick={() => setShowMenu(false)}>
            <motion.aside initial={{ x: D.sidebarWidth }} animate={{ x: 0 }} exit={{ x: D.sidebarWidth }} transition={{ type: 'spring', damping: 20 }} className="bg-white h-full p-8 flex flex-col gap-10 shadow-2xl relative border-r border-slate-100" style={{ width: D.sidebarWidth }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowMenu(false)} className="absolute top-6 left-6 p-2 rounded-xl hover:bg-slate-100"><X/></button>
              <CRM_Logo D={D}/>
              <CRM_Navigation D={D}/>
              <CRM_StatusBar D={D}/>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* אזור תוכן ראשי */}
      <main style={{ paddingRight: isMobile ? D.padding : D.sidebarWidth + D.padding, paddingTop: D.headerHeight + D.padding, paddingLeft: D.padding, paddingBottom: D.padding }} className="transition-all duration-300">
        
        {/* Header (Responsive) */}
        <header style={{ height: D.headerHeight, paddingLeft: D.padding, paddingRight: D.padding, width: isMobile ? '100%' : `calc(100% - ${D.sidebarWidth}px)` }} className={`fixed top-0 left-0 bg-white shadow-lg z-30 flex items-center justify-between border-b border-slate-100 ${isMobile && 'right-0'}`}>
          <div className="flex items-center gap-4">
            {isMobile && <button onClick={() => setShowMenu(true)} className="p-2.5 rounded-xl hover:bg-slate-100 border border-slate-200"><Menu/></button>}
            <CRM_HeaderTitle D={D}/>
          </div>
          <CRM_HeaderActions D={D}/>
        </header>

        {/* תוכן הצאט/CRM (המקורי שלך) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[600px] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-5">
            <h2 className="text-sm font-black text-slate-400 mb-6 flex items-center gap-2"><Lock size={16}/> הסטטוס: סונכרן. בוס, המערכת מוכנה. איתחול DNA הסתיים. 11:28</h2>
            {/* כאן תבוא הסטוריה של הצאט והזנת משימות */}
        </div>

      </main>
    </div>
  );
}

// קומפוננטות עזר נקיות (ללא אלמנטים מסטרים)

function CRM_Logo({ D }: any) {
  return (
    <div className="flex items-center gap-3">
        <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/20"><ShieldCheck size={28}/></div>
        <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Saban OS</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Saban CRM Pro</p>
        </div>
    </div>
  );
}

function CRM_Navigation({ D }: any) {
  const items = [
    { name: 'דאשבורד', icon: <LayoutGrid/> },
    { name: 'לקוחות', icon: <UserCheck/> },
    { name: 'דוחות', icon: <BarChart3/> },
    { name: 'הגדרות', icon: <Settings/> }
  ];
  return (
    <nav className="flex flex-col gap-2">
      {items.map(i => (
        <button key={i.name} className="flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-black text-sm">
          {i.icon} {i.name}
        </button>
      ))}
    </nav>
  );
}

function CRM_StatusBar({ D }: any) {
  return (
    <div className="mt-auto font-mono text-[9px] text-slate-500 p-4 bg-slate-50 rounded-2xl space-y-1.5 opacity-80 border border-slate-100">
        <div>[{new Date().toLocaleTimeString()}] SABAN CRM Live.</div>
        <div>[{new Date().toLocaleTimeString()}] Location Monitor Active.</div>
        <div>[{new Date().toLocaleTimeString()}] ח.סבן (8) / פרטי (4).</div>
    </div>
  );
}

function CRM_HeaderTitle({ D }: any) {
    return (
        <div>
            <h2 className="font-black text-lg">ראמי מסארוה</h2>
            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 leading-none mt-1"><UserCheck size={10}/> מנהל ראשי (Samsung Note 25 Pro)</p>
        </div>
    );
}

function CRM_HeaderActions({ D }: any) {
    return (
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-5 py-3 bg-slate-950 text-white font-black text-xs rounded-xl shadow-xl hover:bg-slate-800"><PlusCircle size={16}/> הוסף משימה</button>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-black border border-slate-200">OS</div>
        </div>
    );
}
