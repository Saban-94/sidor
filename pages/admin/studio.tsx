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
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck, ChevronRight, GitBranch, Target, Edit3, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type StudioSection = 'FLOW_BUILDER' | 'KNOWLEDGE' | 'PROJECTS' | 'LOGISTICS' | 'BRAIN_SETTINGS';

export default function SabanStudioUltra() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<StudioSection>('FLOW_BUILDER');
  const [isDarkMode, setIsDarkMode] = useState(false); // ברירת מחדל עיצוב בהיר פרימיום
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    const flowRef = ref(database, 'system/bot_flow_config');
    onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').limit(6);
    if (data) setInventory(data);
  };

  const saveToCloud = async () => {
    await set(ref(database, 'system/bot_flow_config'), {
      nodes, globalDNA, lastUpdated: Date.now()
    });
    alert('✅ המוח סונכרן בהצלחה לעננים!');
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO ULTRA | מרכז השליטה</title></Head>

      {/* --- Sidebar (Deep Dark Style) --- */}
      <aside className={`w-72 border-l shadow-2xl z-20 flex flex-col p-6 ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-[#0f172a] text-white border-none'}`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-black"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavBtn icon={<GitBranch/>} label="עיצוב תפריט וענפים" active={activeSection === 'FLOW_BUILDER'} onClick={() => setActiveSection('FLOW_BUILDER')} />
          <NavBtn icon={<Database/>} label="ניהול ידע ומלאי" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} />
          <NavBtn icon={<Briefcase/>} label="ניהול פרויקטים" active={activeSection === 'PROJECTS'} onClick={() => setActiveSection('PROJECTS')} />
          <NavBtn icon={<Truck/>} label="דאטה ולוגיסטיקה" active={activeSection === 'LOGISTICS'} onClick={() => setActiveSection('LOGISTICS')} />
          <NavBtn icon={<Settings/>} label="הגדרות מוח" active={activeSection === 'BRAIN_SETTINGS'} onClick={() => setActiveSection('BRAIN_SETTINGS')} />
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="mt-auto p-4 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-between transition-all">
          <span className="text-xs font-black uppercase">Switch Mode</span>
          {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-emerald-400"/>}
        </button>
      </aside>

      {/* --- Main Content View (Light Premium) --- */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar pb-40 bg-white">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto h-full">
              
              {activeSection === 'FLOW_BUILDER' && (
                <section className="space-y-8">
                  <header className="flex justify-between items-end border-b border-slate-100 pb-6">
                    <div>
                      <h2 className="text-4xl font-black italic tracking-tighter text-slate-900">FLOW <span className="text-emerald-500">BUILDER</span></h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">מעצב תפריט המספרים והענפים</p>
                    </div>
                    <button onClick={() => setNodes([...nodes, { id: Date.now(), name: 'ענף חדש', prompt: '' }])} className="px-8 py-3 bg-emerald-500 text-black font-black rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                       <Plus size={18}/> צור ענף
                    </button>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nodes.map((node, i) => (
                      <div key={node.id} className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex justify-between mb-4">
                           <input value={node.name} onChange={(e) => { const n = [...nodes]; n[i].name = e.target.value; setNodes(n); }} className="bg-transparent font-black text-slate-900 text-lg outline-none w-2/3 focus:text-emerald-500" />
                           <button onClick={() => setNodes(nodes.filter(nd => nd.id !== node.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                        </div>
                        <textarea value={node.prompt} onChange={(e) => { const n = [...nodes]; n[i].prompt = e.target.value; setNodes(n); }} placeholder="הנחיה למוח (מה ראמי יענה כאן?)" className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 outline-none min-h-[120px] focus:border-emerald-500/50 shadow-inner" />
                        <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-20" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeSection === 'KNOWLEDGE' && <KnowledgeGrid inventory={inventory} />}
              {activeSection === 'BRAIN_SETTINGS' && <BrainSettings globalDNA={globalDNA} setGlobalDNA={setGlobalDNA} />}
              {activeSection === 'PROJECTS' && <PlaceholderSection title="PROJECTS" icon={<Briefcase size={48}/>} />}
              {activeSection === 'LOGISTICS' && <PlaceholderSection title="LOGISTICS" icon={<Truck size={48}/>} />}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- iPhone Simulator Area (Live Sync) --- */}
        <aside className="w-[450px] bg-slate-100 border-r border-slate-200 flex items-center justify-center p-8 z-10 shadow-inner">
           <div className="relative w-full max-w-[300px] aspect-[9/19.5] bg-[#000] rounded-[3.5rem] border-[10px] border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
              <div className="flex-1 flex flex-col bg-[#070707] pt-10">
                 <header className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <img src="https://iili.io/qstzfVf.jpg" className="w-8 h-8 rounded-full border border-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Rami Brain Live</span>
                 </header>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold ${m.role === 'user' ? 'bg-blue-600 mr-6 text-white' : 'bg-white/5 border border-white/5 ml-6 text-white leading-relaxed'}`}>
                        {m.content}
                      </div>
                    ))}
                    {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse font-black px-2">ראמי מעבד פקודה...</div>}
                 </div>
                 <div className="p-5 bg-[#111]">
                    <div className="flex gap-2 bg-white/5 rounded-full p-1 px-4 items-center border border-white/10">
                       <input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="בדוק את הענפים..." className="flex-1 bg-transparent border-none outline-none text-[11px] p-2 text-white" />
                       <button className="p-2 bg-emerald-500 rounded-full text-black shadow-lg"><Send size={14}/></button>
                    </div>
                 </div>
              </div>
           </div>
        </aside>

        {/* --- Training Toolbox (ארגז כלים מקצועי) --- */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#0f172a] p-4 rounded-full flex gap-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-50 ring-2 ring-white/5">
           <ToolAction icon={<Target/>} label="אימון ממוקד" color="emerald" />
           <ToolAction icon={<Wand2/>} label="שיפור פקודה" color="purple" />
           <ToolAction icon={<LinkIcon/>} label="צור לינק קסם" color="blue" />
           <div className="w-[1px] bg-white/10 mx-2" />
           <button onClick={saveToCloud} className="px-10 py-3 bg-emerald-500 text-black font-black rounded-full hover:scale-105 transition-all text-sm shadow-xl flex items-center gap-2 tracking-tighter">
             <Save size={18}/> סנכרן מוח מבצע
           </button>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components (Helpers) ---

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all text-xs uppercase tracking-tighter ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.03]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="flex-1 text-right">{label}</span>
      {active && <ChevronRight size={14} className="opacity-50 rotate-180" />}
    </button>
  );
}

function KnowledgeGrid({ inventory }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">DATABASE & INVENTORY</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item: any) => (
          <div key={item.sku} className="p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] hover:bg-white hover:shadow-xl transition-all">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.sku}</span>
            <h4 className="font-black text-slate-800 text-lg mt-1">{item.product_name}</h4>
            <div className="mt-4 flex justify-between items-center text-xs font-bold text-slate-400">
               <span>₪{item.price}</span>
               <button className="text-emerald-500"><Edit3 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrainSettings({ globalDNA, setGlobalDNA }: any) {
  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-3xl font-black italic tracking-tighter uppercase text-purple-600">BRAIN DNA <span className="text-slate-900">CONFIG</span></h2>
      <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 shadow-inner">
         <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest">הגדרת אישיות הליבה של ראמי</p>
         <textarea value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)} className="w-full h-80 bg-white border border-slate-200 rounded-3xl p-8 text-sm text-slate-700 outline-none focus:border-purple-500/50 transition-all font-medium leading-relaxed shadow-sm" placeholder="כתוב כאן: 'אתה ראמי, המוח של סבן HUB...'" />
      </div>
    </div>
  );
}

function ToolAction({ icon, label, color }: any) {
  return (
    <div className="group relative">
      <button className={`p-4 bg-white/5 rounded-full hover:bg-${color}-500 hover:text-black transition-all text-slate-400`}>
        {icon}
      </button>
      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-2xl">
        {label}
      </span>
    </div>
  );
}

function PlaceholderSection({ title, icon }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
      <div className="mb-6">{icon}</div>
      <h2 className="text-3xl font-black italic tracking-widest uppercase">{title}</h2>
      <p className="mt-4 font-bold text-sm uppercase">Synchronizing with Supabase Real-time...</p>
    </div>
  );
}
