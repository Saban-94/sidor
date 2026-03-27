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
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck, ChevronRight, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type StudioSection = 'KNOWLEDGE' | 'PROJECTS' | 'LOGISTICS' | 'BRAIN_SETTINGS' | 'FLOW_BUILDER';

export default function SabanStudioV3() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<StudioSection>('FLOW_BUILDER'); // ברירת מחדל לסטודיו הענפים
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    // טעינת נתונים מ-Firebase (ענפים ו-DNA)
    const flowRef = ref(database, 'system/bot_flow_config');
    onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    // טעינת מלאי מ-Supabase
    const fetchInv = async () => {
      const { data } = await supabase.from('inventory').select('*').limit(10);
      if (data) setInventory(data);
    };
    fetchInv();
  }, []);

  const saveAll = async () => {
    await set(ref(database, 'system/bot_flow_config'), {
      nodes, globalDNA, lastUpdated: Date.now()
    });
    alert('✅ המוח סונכרן! כל הענפים וההגדרות עודכנו.');
  };

  const handleSimulate = () => {
    if (!testMessage.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: testMessage }]);
    setIsTyping(true);
    setTestMessage('');
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "קיבלתי, אחי. אני בודק את הלוגיקה של הענף שהגדרת..." }]);
      setIsTyping(false);
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO 2.0 | מנהל המוח</title></Head>

      {/* --- Sidebar (עכשיו הכל לחיץ ומנווט) --- */}
      <aside className={`w-72 border-l transition-all duration-300 ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col z-20 shadow-2xl`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-[#020617]"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarBtn icon={<GitBranch size={18}/>} label="עיצוב תפריט וענפים" active={activeSection === 'FLOW_BUILDER'} onClick={() => setActiveSection('FLOW_BUILDER')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Database size={18}/>} label="ניהול ידע ומלאי" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Briefcase size={18}/>} label="ניהול פרויקטים" active={activeSection === 'PROJECTS'} onClick={() => setActiveSection('PROJECTS')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Truck size={18}/>} label="דאטה ולוגיסטיקה" active={activeSection === 'LOGISTICS'} onClick={() => setActiveSection('LOGISTICS')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Settings size={18}/>} label="הגדרות מוח" active={activeSection === 'BRAIN_SETTINGS'} onClick={() => setActiveSection('BRAIN_SETTINGS')} isDarkMode={isDarkMode} />
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`mt-auto flex items-center justify-between p-4 rounded-2xl border transition-all ${isDarkMode ? 'border-white/5 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-200 bg-slate-100 text-slate-900'}`}>
          <span className="text-xs font-bold font-black">{isDarkMode ? 'מצב לילה' : 'מצב יום'}</span>
          {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-blue-500"/>}
        </button>
      </aside>

      {/* --- Main Dashboard Area --- */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              
              {/* 1. FLOW BUILDER - עיצוב תפריט וענפים */}
              {activeSection === 'FLOW_BUILDER' && (
                <div className="space-y-8 max-w-5xl mx-auto">
                  <header className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-black italic tracking-tighter">DESIGN MENU & FLOW</h2>
                      <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-[0.3em]">בניית עץ השיחה של ראמי</p>
                    </div>
                    <button onClick={() => setNodes([...nodes, { id: Date.now(), name: 'כפתור חדש', prompt: '' }])} className="px-6 py-3 bg-emerald-500 text-black font-black rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                       <Plus size={18}/> הוסף ענף/כפתור
                    </button>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nodes.map((node, i) => (
                      <div key={node.id} className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group shadow-xl">
                        <div className="flex justify-between mb-4">
                           <input value={node.name} onChange={(e) => { const n = [...nodes]; n[i].name = e.target.value; setNodes(n); }} className="bg-transparent font-black text-white text-lg outline-none w-2/3 focus:text-emerald-500" />
                           <button onClick={() => setNodes(nodes.filter(nd => nd.id !== node.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                        </div>
                        <textarea value={node.prompt} onChange={(e) => { const n = [...nodes]; n[i].prompt = e.target.value; setNodes(n); }} placeholder="מה ראמי יענה כאן? (למשל: 'הנה המחירון שלנו...')" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none min-h-[100px] focus:border-emerald-500/30" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. KNOWLEDGE - ניהול ידע ומלאי */}
              {activeSection === 'KNOWLEDGE' && <KnowledgePanel inventory={inventory} isDarkMode={isDarkMode} />}

              {/* 3. PROJECTS - ניהול פרויקטים */}
              {activeSection === 'PROJECTS' && (
                <div className="space-y-8">
                   <h2 className="text-3xl font-black italic tracking-tighter uppercase">Project Management</h2>
                   <div className="grid grid-cols-3 gap-6">
                      <MetricCard label="משימות פתוחות" value="12" icon={<Briefcase/>} color="blue" />
                      <MetricCard label="בהמתנה" value="4" icon={<Zap/>} color="amber" />
                      <MetricCard label="הושלמו" value="158" icon={<Sparkles/>} color="emerald" />
                   </div>
                </div>
              )}

              {/* 4. BRAIN SETTINGS - הגדרות מוח ו-DNA */}
              {activeSection === 'BRAIN_SETTINGS' && (
                <div className="max-w-3xl space-y-8">
                   <h2 className="text-3xl font-black italic tracking-tighter uppercase text-purple-500">Global Brain DNA</h2>
                   <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                      <p className="text-xs font-bold text-white/40 mb-4 uppercase tracking-widest">הגדרת האישיות הבסיסית של ראמי</p>
                      <textarea value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)} placeholder="כתוב כאן: 'אתה ראמי, המוח של סבן. דבר קצר ומקצועי...'" className="w-full h-64 bg-black/20 border border-white/10 rounded-2xl p-6 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-medium leading-relaxed" />
                   </div>
                </div>
              )}

              {/* 5. LOGISTICS - דאטה ולוגיסטיקה */}
              {activeSection === 'LOGISTICS' && (
                <div className="space-y-8">
                   <h2 className="text-3xl font-black italic tracking-tighter uppercase text-blue-500">Logistics & Data</h2>
                   <div className="p-12 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-30">
                      <Truck size={64} className="mb-6" />
                      <p className="font-black italic">בקרוב: סנכרון צי רכבים וסידור עבודה חי מול Supabase</p>
                   </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- iPhone Simulator (תמיד מוצג בצד) --- */}
        <aside className="hidden xl:flex w-[450px] p-8 items-center justify-center bg-black/20 border-r border-white/5">
           <div className="relative w-full max-w-[300px] aspect-[9/19.5] bg-[#000] rounded-[3.5rem] border-[10px] border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
              <div className="flex-1 flex flex-col bg-[#070707] pt-10">
                 <header className="px-4 py-2 flex items-center gap-3">
                    <img src="https://iili.io/qstzfVf.jpg" className="w-8 h-8 rounded-full border border-emerald-500" />
                    <div className="text-[10px] font-black uppercase text-emerald-500">ראמי מחובר</div>
                 </header>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold ${m.role === 'user' ? 'bg-blue-600 mr-6 text-white' : 'bg-[#1e1e1e] border border-white/5 ml-6 text-white'}`}>
                        {m.content}
                      </div>
                    ))}
                    {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse font-black px-2">ראמי חושב...</div>}
                 </div>
                 <div className="p-4 bg-[#111]">
                    <div className="flex gap-2 bg-white/5 rounded-full p-1 px-4 items-center border border-white/10">
                       <input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSimulate()} placeholder="בדיקת ענפים..." className="flex-1 bg-transparent border-none outline-none text-[11px] p-2 text-white" />
                       <button onClick={handleSimulate} className="p-2 bg-emerald-500 rounded-full text-black"><Send size={14}/></button>
                    </div>
                 </div>
              </div>
           </div>
        </aside>
      </main>

      {/* --- Global Action Bar --- */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-3 rounded-full flex gap-4 shadow-2xl z-50 ring-1 ring-white/10">
          <ToolIcon icon={<Plus size={20}/>} label="הוסף יחידה" />
          <ToolIcon icon={<Zap size={20}/>} label="משימה מהירה" />
          <div className="w-[1px] bg-white/10 mx-1" />
          <button onClick={saveAll} className="px-10 py-3 bg-emerald-500 text-black font-black rounded-full hover:scale-105 transition-all text-sm shadow-lg shadow-emerald-500/20">סנכרן מוח לעננים ☁️</button>
      </div>
    </div>
  );
}

// --- Sub-components (Helpers) ---

function SidebarBtn({ icon, label, active, onClick, isDarkMode }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all text-sm ${active ? 'bg-emerald-500 text-[#020617] shadow-lg shadow-emerald-500/20 scale-[1.03]' : (isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}`}>
      {icon} <span className="flex-1 text-right">{label}</span>
      {active && <ChevronRight size={16} className="opacity-50 rotate-180" />}
    </button>
  );
}

function MetricCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between shadow-xl">
      <div><p className="text-[10px] font-black uppercase opacity-30 mb-2">{label}</p><h4 className="text-3xl font-black">{value}</h4></div>
      <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-500 shadow-inner`}>{icon}</div>
    </div>
  );
}

function KnowledgePanel({ inventory, isDarkMode }: any) {
  return (
    <div className="space-y-8">
      <h2 className={`text-3xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KNOWLEDGE & INVENTORY</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inventory.map((item: any) => (
          <div key={item.sku} className={`p-8 rounded-[3rem] border transition-all ${isDarkMode ? 'bg-[#0f172a] border-white/5 hover:border-emerald-500/30' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-start">
               <div>
                  <span className="text-[10px] font-black text-emerald-500 font-mono uppercase tracking-widest">{item.sku}</span>
                  <h4 className={`font-black text-xl mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.product_name}</h4>
                  <p className="text-xs opacity-40 font-bold mt-2">מחיר: ₪{item.price}</p>
               </div>
               <button className="p-3 bg-white/5 rounded-xl opacity-20 hover:opacity-100 transition-opacity"><Settings size={18}/></button>
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
      <button className="p-4 bg-white/5 rounded-full hover:bg-emerald-500 hover:text-black transition-all border border-white/5 text-slate-400 shadow-inner">
        {icon}
      </button>
      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
        {label}
      </span>
    </div>
  );
}
