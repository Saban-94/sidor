import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { 
  Send, Bot, User, Zap, Settings, Moon, Sun, Menu, 
  Terminal, Sparkles, Layout, Database, ChevronLeft, 
  MoreVertical, Mic, Paperclip, Smile, History, Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isDarkMode: boolean;
  onClick?: () => void;
}

const BRAIN_LOGO = "https://iili.io/qstzfVf.jpg";

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false, isDarkMode, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all font-bold text-sm ${
      active 
      ? 'bg-emerald-500 text-[#020617] shadow-lg shadow-emerald-500/20' 
      : isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="flex-1 text-right">{label}</span>
    {active && <ChevronLeft size={16} className="opacity-50" />}
  </div>
);

export default function PersonalAI() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const aiChatRef = query(ref(database, 'private_brain/history'), limitToLast(50));
    const unsub = onValue(aiChatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!mounted) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const userMsg = input;
    setInput('');
    setIsProcessing(true);

    try {
      await push(ref(database, 'private_brain/history'), {
        role: 'user', content: userMsg, timestamp: Date.now()
      });

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, name: "ראמי", contextType: 'PRIVATE_ASSISTANT' })
      });
      const result = await response.json();

      await push(ref(database, 'private_brain/history'), {
        role: 'assistant', content: result.reply, timestamp: Date.now()
      });
    } catch (err) {
      console.error("Brain Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`h-screen flex ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'} font-sans text-right antialiased overflow-hidden`} dir="rtl">
      <Head><title>SABAN BRAIN | המוח של סבן</title></Head>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`fixed lg:relative z-50 w-72 h-full border-l transition-transform duration-300 ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-[#020617]"><Zap size={24} /></div>
            <h1 className={`text-xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SABAN <span className="text-emerald-500">BRAIN</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 opacity-50 hover:opacity-100"><X /></button>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<History size={18}/>} label="היסטוריית משימות" active isDarkMode={isDarkMode} />
          <SidebarItem icon={<Layout size={18}/>} label="ניהול פרויקטים" isDarkMode={isDarkMode} />
          <SidebarItem icon={<Database size={18}/>} label="דאטה ולוגיסטיקה" isDarkMode={isDarkMode} />
          <SidebarItem icon={<Settings size={18}/>} label="הגדרות מוח" isDarkMode={isDarkMode} />
        </nav>

        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className={`mt-auto flex items-center justify-between p-4 rounded-2xl border transition-all ${isDarkMode ? 'border-white/5 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
        >
          <span className="font-bold text-sm">{isDarkMode ? 'מצב לילה' : 'מצב יום'}</span>
          {isDarkMode ? <Moon size={18} className="text-emerald-400" /> : <Sun size={18} className="text-amber-500" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-dot-pattern">
        {/* Top Navigation Bar */}
        <header className={`px-4 lg:px-8 py-4 border-b ${isDarkMode ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-xl flex items-center justify-between z-10`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Menu size={20}/></button>
            <div className="relative">
              <img src={BRAIN_LOGO} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-emerald-500/50 object-cover" alt="Rami" />
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className={`font-black text-sm lg:text-base uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>העוזר של סבן HUB</h2>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">System Active</p>
              </div>
            </div>
          </div>
          <div className={`hidden md:flex gap-4 p-2 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
             <Search size={18} className="opacity-40" />
             <MoreVertical size={18} className="opacity-40" />
          </div>
        </header>

        {/* Chat Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col gap-6 pb-32">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
              <Sparkles size={64} className={`mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
              <p className={`font-black italic uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ready for action</p>
            </div>
          ) : (
            messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 lg:gap-4 ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-[#020617]'}`}>
                  {m.role === 'user' ? <User size={18}/> : <Bot size={18}/>}
                </div>
                <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-3xl text-[15px] leading-relaxed shadow-xl border ${
                  m.role === 'user' 
                  ? (isDarkMode ? 'bg-[#1e293b] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900')
                  : (isDarkMode ? 'bg-[#005c4b] border-emerald-500/20 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-900')
                }`}>
                  <div className="whitespace-pre-wrap font-medium">{m.content}</div>
                  <div className="mt-2 text-[10px] opacity-50 text-left font-bold tabular-nums">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {isProcessing && (
            <div className="flex items-center gap-3 px-12">
               <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
               </div>
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Processing command...</span>
            </div>
          )}
        </div>

        {/* Action Bar / Input Area */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 lg:p-6 bg-gradient-to-t ${isDarkMode ? 'from-[#020617] via-[#020617]/90' : 'from-slate-50 via-slate-50/90'} to-transparent`}>
          <form onSubmit={handleCommand} className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 rounded-[2rem] blur-2xl opacity-10 group-focus-within:opacity-20 transition-opacity bg-emerald-500" />
            <div className={`relative flex items-center gap-2 lg:gap-3 p-2 rounded-[2.5rem] border shadow-2xl transition-all ${isDarkMode ? 'bg-[#0f172a] border-white/10 group-focus-within:border-emerald-500/50' : 'bg-white border-slate-300'}`}>
              
              <div className="flex gap-1 pr-3 border-l border-white/5 ml-1 text-slate-400">
                 <Paperclip size={20} className="cursor-pointer hover:text-emerald-500 transition" />
              </div>

              <input 
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="בצע פעולה: 'עדכן מחירון' או 'מה קורה באשדוד?'"
                className={`flex-1 bg-transparent border-none outline-none text-sm lg:text-base p-3 font-medium placeholder:opacity-30 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              />
              
              <button type="submit" disabled={!input.trim() || isProcessing} className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-emerald-500 flex items-center justify-center text-[#020617] shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                <Send size={22} className="ml-1" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
