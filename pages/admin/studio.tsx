'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { 
  Database, Zap, Play, Save, Plus, Trash2, Layout, 
  MessageSquare, Smartphone, Monitor, Search, Sparkles, 
  Image as ImageIcon, Youtube, Link as LinkIcon, Settings, 
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type StudioSection = 'KNOWLEDGE' | 'PROJECTS' | 'LOGISTICS' | 'BRAIN_SETTINGS';

export default function SabanStudioV2() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<StudioSection>('KNOWLEDGE');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    // שליפת מלאי ראשונית
    const fetchInv = async () => {
      const { data } = await supabase.from('inventory').select('*').limit(5);
      if (data) setInventory(data);
    };
    fetchInv();
  }, []);

  if (!mounted) return null;

  const handleSimulate = async () => {
    if (!testMessage.trim()) return;
    const msg = { role: 'user', content: testMessage };
    setChatHistory([...chatHistory, msg]);
    setTestMessage('');
    setIsTyping(true);
    
    // סימולציה של מענה AI
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `פקודה התקבלה: מבצע ניתוח עבור "${msg.content}"...` }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO 2.0</title></Head>

      {/* 1. Sidebar - עכשיו הכל לחיץ ומגיב */}
      <aside className={`w-72 border-l ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col z-20`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-black"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarBtn icon={<Database/>} label="ניהול ידע" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Briefcase/>} label="ניהול פרויקטים" active={activeSection === 'PROJECTS'} onClick={() => setActiveSection('PROJECTS')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Truck/>} label="דאטה ולוגיסטיקה" active={activeSection === 'LOGISTICS'} onClick={() => setActiveSection('LOGISTICS')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Settings/>} label="הגדרות מוח" active={activeSection === 'BRAIN_SETTINGS'} onClick={() => setActiveSection('BRAIN_SETTINGS')} isDarkMode={isDarkMode} />
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="mt-auto flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
          <span className="text-xs font-bold">מצב לילה</span>
          {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-blue-500"/>}
        </button>
      </aside>

      {/* 2. Main View - המרכז משתנה לפי הבחירה בסיידבר */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSection}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {activeSection === 'KNOWLEDGE' && <KnowledgePanel inventory={inventory} />}
              {activeSection === 'PROJECTS' && <PlaceholderPanel title="ניהול פרויקטים" icon={<Briefcase size={48}/>} />}
              {activeSection === 'LOGISTICS' && <PlaceholderPanel title="דאטה ולוגיסטיקה" icon={<Truck size={48}/>} />}
              {activeSection === 'BRAIN_SETTINGS' && <PlaceholderPanel title="הגדרות מוח" icon={<Settings size={48}/>} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. iPhone Simulator - סימולטור מוח מובנה בזכוכית */}
        <aside className="w-[450px] p-8 flex items-center justify-center bg-black/20 border-r border-white/5">
          <div className="relative w-full max-w-[320px] aspect-[9/19.5] bg-[#111] rounded-[3rem] border-[8px] border-[#222] shadow-2xl overflow-hidden flex flex-col">
             {/* Notch */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#222] rounded-b-2xl z-20"></div>
             
             {/* Chat Interface Inside Phone */}
             <div className="flex-1 flex flex-col bg-[#020617] pt-8">
                <header className="p-4 border-b border-white/5 flex items-center gap-3">
                   <img src="https://iili.io/qstzfVf.jpg" className="w-8 h-8 rounded-full border border-emerald-500"/>
                   <div className="text-[10px] font-black uppercase text-emerald-500 animate-pulse">ראמי מחובר</div>
                </header>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`p-3 rounded-2xl text-[11px] leading-relaxed ${m.role === 'user' ? 'bg-blue-600 mr-8 text-white' : 'bg-emerald-500/10 border border-emerald-500/20 ml-8 text-emerald-50'}`}>
                      {m.content}
                    </div>
                  ))}
                  {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse">ראמי חושב...</div>}
                </div>

                <div className="p-4 bg-[#0f172a] border-t border-white/5">
                   <div className="flex gap-2 bg-black/40 rounded-full p-1 items-center px-3 border border-white/10">
                      <input 
                        value={testMessage} onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="דבר אלי אחי..." 
                        className="flex-1 bg-transparent border-none outline-none text-[11px] p-2"
                      />
                      <button onClick={handleSimulate} className="p-2 bg-emerald-500 rounded-full text-black"><Send size={14}/></button>
                   </div>
                </div>
             </div>
          </div>
        </aside>
      </main>

      {/* 4. Action Toolbox - ארגז הכלים של הסטודיו */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-4 rounded-[2.5rem] flex gap-4 shadow-2xl z-50">
          <ToolBtn icon={<Plus/>} label="הוסף מוצר" color="emerald" />
          <ToolBtn icon={<Zap/>} label="חוק מהיר" color="purple" />
          <ToolBtn icon={<LinkIcon/>} label="Magic Link" color="blue" />
          <div className="w-[1px] bg-white/10 mx-2" />
          <button className="px-6 py-2 bg-emerald-500 text-black font-black rounded-full hover:scale-105 transition-all">סנכרן מוח</button>
      </div>
    </div>
  );
}

// --- תתי רכיבים ---

function SidebarBtn({ icon, label, active, onClick, isDarkMode }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all text-sm ${
        active 
        ? 'bg-emerald-500 text-[#020617] shadow-lg shadow-emerald-500/20' 
        : (isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100')
      }`}
    >
      {icon} <span>{label}</span>
      {active && <ChevronRight size={16} className="mr-auto opacity-50 rotate-180" />}
    </button>
  );
}

function KnowledgePanel({ inventory }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic">ניהול ידע ומלאי</h2>
        <div className="flex gap-4">
           <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500 font-bold text-xs">סטטוס: סנכרון חי</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inventory.map((item: any) => (
          <div key={item.sku} className="p-6 bg-[#0f172a] rounded-[2rem] border border-white/5 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase">{item.sku}</p>
              <h4 className="font-bold text-white">{item.product_name}</h4>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-white/5 rounded-lg opacity-30 hover:opacity-100"><Settings size={14}/></button>
              <button className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderPanel({ title, icon }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
      <div className="mb-6">{icon}</div>
      <h2 className="text-3xl font-black italic uppercase">{title}</h2>
      <p className="mt-4 font-bold">המודול נמצא בפיתוח ויתחבר ל-Supabase בקרוב</p>
    </div>
  );
}

function ToolBtn({ icon, label, color }: any) {
  return (
    <div className="group relative">
      <button className={`p-4 bg-${color}-500/10 text-${color}-500 rounded-2xl hover:bg-${color}-500 hover:text-black transition-all`}>
        {icon}
      </button>
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
