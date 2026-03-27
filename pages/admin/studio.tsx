'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
// ייבוא אייקונים כולל ImageIcon
import { 
  Database, Zap, Play, Save, Plus, Trash2, Layout, 
  MessageSquare, Smartphone, Monitor, Search, Sparkles, 
  Image as ImageIcon, Youtube, Link as LinkIcon, Settings, 
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck, ChevronRight, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- קבועי מותג ---
const BRAIN_LOGO = "https://iili.io/qstzfVf.jpg"; // לוגו המוח של סבן HUB

type StudioSection = 'KNOWLEDGE' | 'FLOW_BUILDER';

export default function SabanStudioV3() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<StudioSection>('FLOW_BUILDER');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    // טעינת ה-Flow מה-Firebase
    const flowRef = ref(database, 'system/bot_flow_config');
    onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
      }
    });
  }, []);

  if (!mounted) return null;

  const handleSimulate = async () => {
    if (!testMessage.trim() || isTyping) return;
    
    const userMsg = { role: 'user', content: testMessage };
    setChatHistory(prev => [...prev, userMsg]);
    const currentInput = testMessage;
    setTestMessage('');
    setIsTyping(true);
    
    try {
      // קריאה ל-API האמיתי של המוח
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput, 
          state: 'STUDIO_TEST', 
          manualInjection: true 
        })
      });

      const data = await res.json();

      // הצגת התגובה המעוצבת (כולל מדיה)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        media: data.mediaUrl || BRAIN_LOGO // fallback ללוגו המוח אם אין מדיה ספציפית
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO 2.0 | מנהל המוח</title></Head>

      {/* --- Sidebar --- */}
      <aside className={`w-72 border-l transition-all duration-300 ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col z-20 shadow-2xl`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-[#020617]"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn icon={<GitBranch size={18}/>} label="עיצוב תפריט וענפים" active={activeSection === 'FLOW_BUILDER'} onClick={() => setActiveSection('FLOW_BUILDER')} isDarkMode={isDarkMode} />
          <SidebarBtn icon={<Database size={18}/>} label="ניהול ידע ומלאי" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} isDarkMode={isDarkMode} />
        </nav>
      </aside>

      {/* --- Main Dashboard Area --- */}
      <main className="flex-1 flex overflow-hidden relative bg-dot-pattern">
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar pb-36">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full space-y-8 max-w-5xl mx-auto">
              
              {/* FLOW BUILDER - עיצוב תפריט וענפים */}
              {activeSection === 'FLOW_BUILDER' && (
                <>
                  <header className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-black italic tracking-tighter text-white">DESIGN FLOW</h2>
                      <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-[0.3em]">בניית עץ השיחה של ראמי</p>
                    </div>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nodes.map((node, i) => (
                      <div key={node.id} className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-3">
                        <input value={node.name} className="bg-transparent font-black text-white text-lg outline-none w-full" />
                        <textarea value={node.prompt} placeholder="מה ראמי יענה כאן? (תדגיש טקסט ב-**) 🏗️" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none min-h-[100px]" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- iPhone Simulator (תמיד מוצג בצד) --- */}
        <aside className="hidden xl:flex w-[450px] p-8 items-center justify-center bg-black/10 border-r border-white/5">
           <div className="relative w-full max-w-[300px] aspect-[9/19.5] bg-[#000] rounded-[3.5rem] border-[10px] border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
              <div className="flex-1 flex flex-col bg-[#070707] pt-10">
                 <header className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                    <img src={BRAIN_LOGO} className="w-8 h-8 rounded-full border border-emerald-500" />
                    <div className="text-[10px] font-black uppercase text-emerald-500">ראמי מחובר</div>
                 </header>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold leading-relaxed ${m.role === 'user' ? 'bg-blue-600 mr-6 text-white' : 'bg-[#1e1e1e] border border-white/5 ml-6 text-white'}`}>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                        {m.media && (
                           <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                              <img src={m.media} className="w-full h-32 object-cover" alt="Brain Response" />
                           </div>
                        )}
                      </div>
                    ))}
                    {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse font-black px-2">ראמי מעבד...</div>}
                 </div>
                 <div className="p-4 bg-[#111]">
                    <div className="flex gap-2 bg-white/5 rounded-full p-1 px-4 items-center border border-white/10">
                       <input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSimulate()} placeholder="בדיקה..." className="flex-1 bg-transparent border-none outline-none text-[11px] p-2 text-white" />
                       <button onClick={handleSimulate} className="p-2 bg-emerald-500 rounded-full text-black"><Send size={14}/></button>
                    </div>
                 </div>
              </div>
           </div>
        </aside>
      </main>
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
