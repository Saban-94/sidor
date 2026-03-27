'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
// תיקון ייבוא: כל האייקונים כולל ChevronRight
import { 
  Database, Zap, Play, Save, Plus, Trash2, Layout, 
  MessageSquare, Smartphone, Monitor, Search, Sparkles, 
  Image as ImageIcon, Youtube, Link as LinkIcon, Settings, 
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck, ChevronRight
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
    const fetchInv = async () => {
      const { data } = await supabase.from('inventory').select('*').limit(6);
      if (data) setInventory(data);
    };
    fetchInv();
  }, []);

  if (!mounted) return null;

  const handleSimulate = async () => {
    if (!testMessage.trim()) return;
    const msg = { role: 'user', content: testMessage };
    setChatHistory(prev => [...prev, msg]);
    setTestMessage('');
    setIsTyping(true);
    
    // סימולציה של מענה מוח
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `אח יקר, קיבלתי: "${msg.content}". אני מנתח את הנתונים מול המלאי ב-Supabase כרגע.` }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO 2.0 | המרכז הלוגיסטי</title></Head>

      {/* 1. Sidebar - לחיץ ומנווט */}
      <aside className={`w-72 border-l transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col z-20 shadow-2xl`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-[#020617]"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarBtn icon={<Database size={18}/>} label="ניהול ידע" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Briefcase size={18}/>} label="ניהול פרויקטים" active={activeSection === 'PROJECTS'} onClick={() => setActiveSection('PROJECTS')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Truck size={18}/>} label="דאטה ולוגיסטיקה" active={activeSection === 'LOGISTICS'} onClick={() => setActiveSection('LOGISTICS')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Settings size={18}/>} label="הגדרות מוח" active={activeSection === 'BRAIN_SETTINGS'} onClick={() => setActiveSection('BRAIN_SETTINGS')} isDarkMode={isDarkMode} />
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`mt-auto flex items-center justify-between p-4 rounded-2xl border transition-all ${isDarkMode ? 'border-white/5 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-200 bg-slate-100 text-slate-900'}`}>
          <span className="text-xs font-bold">{isDarkMode ? 'מצב לילה' : 'מצב יום'}</span>
          {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-blue-500"/>}
        </button>
      </aside>

      {/* 2. Main Content View */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSection}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {activeSection === 'KNOWLEDGE' && <KnowledgePanel inventory={inventory} isDarkMode={isDarkMode} />}
              {activeSection !== 'KNOWLEDGE' && (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <Sparkles size={64} className="mb-4" />
                  <h2 className="text-2xl font-black italic tracking-widest">{activeSection} IN PROGRESS</h2>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. iPhone Simulator - דמוי מכשיר קצה */}
        <aside className="hidden lg:flex w-[450px] p-8 items-center justify-center bg-black/10 border-r border-white/5">
           <div className="relative w-full max-w-[300px] aspect-[9/19.5] bg-[#000] rounded-[3rem] border-[8px] border-[#1a1a1a] shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
              <div className="flex-1 flex flex-col bg-[#070707] pt-8">
                 <header className="p-4 border-b border-white/5 flex items-center gap-3">
                    <img src="https://iili.io/qstzfVf.jpg" className="w-8 h-8 rounded-full border border-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-500">Rami Brain</span>
                 </header>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 mr-6 text-white' : 'bg-[#1e1e1e] border border-white/5 ml-6 text-white'}`}>
                        {m.content}
                      </div>
                    ))}
                    {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse font-bold px-2">ראמי מעבד פקודה...</div>}
                 </div>
                 <div className="p-4 bg-[#111] border-t border-white/5">
                    <div className="flex gap-2 bg-white/5 rounded-full p-1 px-3 items-center border border-white/10">
                       <input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="הודעת בדיקה..." className="flex-1 bg-transparent border-none outline-none text-[11px] p-2 text-white" />
                       <button onClick={handleSimulate} className="p-2 bg-emerald-500 rounded-full text-black"><Send size={14}/></button>
                    </div>
                 </div>
              </div>
           </div>
        </aside>
      </main>

      {/* 4. Action Toolbox - ארגז הכלים הצף */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 p-3 rounded-full flex gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
          <ToolIcon icon={<Plus size={20}/>} label="מוצר" />
          <ToolIcon icon={<LinkIcon size={20}/>} label="Magic Link" />
          <ToolIcon icon={<Zap size={20}/>} label="חוק" />
          <div className="w-[1px] bg-white/10 mx-1" />
          <button className="px-8 py-3 bg-emerald-500 text-black font-black rounded-full hover:scale-105 transition-all text-sm shadow-lg shadow-emerald-500/20">סנכרן מוח</button>
      </div>
    </div>
  );
}

// --- Sub-components ---

function SidebarBtn({ icon, label, active, onClick, isDarkMode }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all text-sm ${
        active 
        ? 'bg-emerald-500 text-[#020617] shadow-lg shadow-emerald-500/20 scale-[1.02]' 
        : (isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100')
      }`}
    >
      {icon} <span className="flex-1 text-right">{label}</span>
      {active && <ChevronRight size={16} className="opacity-50 rotate-180" />}
    </button>
  );
}

function KnowledgePanel({ inventory, isDarkMode }: any) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className={`text-3xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KNOWLEDGE BASE</h2>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Syncing with Supabase Live</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inventory.map((item: any) => (
          <div key={item.sku} className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${isDarkMode ? 'bg-[#0f172a] border-white/5 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-500'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-widest">{item.sku}</span>
                <h4 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.product_name}</h4>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Settings size={16}/></div>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold opacity-30 uppercase">In Inventory</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolIcon({ icon, label }: any) {
  return (
    <div className="group relative">
      <button className="p-4 bg-white/5 rounded-full hover:bg-emerald-500 hover:text-black transition-all border border-white/5 shadow-inner">
        {icon}
      </button>
      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[10px] px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl">
        {label}
      </span>
    </div>
  );
}
