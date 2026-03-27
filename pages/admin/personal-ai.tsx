import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { 
  Send, Bot, User, Zap, Settings, Moon, Sun, Menu, 
  Terminal, Sparkles, Layout, Database, ChevronLeft, 
  MoreVertical, Mic, Paperclip, Smile, History, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. הגדרת Interface קשיח ל-Props
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isDarkMode: boolean;
}

const BRAIN_LOGO = "https://iili.io/qstzfVf.jpg";

// 2. הגדרת הקומפוננטה כ-React.FC (זה יפתור את שגיאת ה-Build)
const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false, isDarkMode }) => {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all font-bold text-sm ${
      active ? 'bg-emerald-500 text-white shadow-lg' : (isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100')
    }`}>
      {icon}
      <span>{label}</span>
      {active && <ChevronLeft size={16} className="mr-auto opacity-50" />}
    </div>
  );
};

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
      if (data) {
        setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    <div className={`h-screen flex ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300 text-right antialiased`} dir="rtl">
      <Head><title>SABAN BRAIN | המוח של סבן</title></Head>

      <aside className={`fixed lg:relative z-40 w-72 h-full border-l ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col hidden lg:flex shadow-2xl lg:shadow-none`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <Zap size={24} />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter text-white">SABAN <span className="text-emerald-500">BRAIN</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<History size={18}/>} label="היסטוריית משימות" active isDarkMode={isDarkMode} />
          <SidebarItem icon={<Layout size={18}/>} label="ניהול פרויקטים" isDarkMode={isDarkMode} />
          <SidebarItem icon={<Database size={18}/>} label="דאטה ולוגיסטיקה" isDarkMode={isDarkMode} />
          <SidebarItem icon={<Settings size={18}/>} label="הגדרות מוח" isDarkMode={isDarkMode} />
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`mt-auto flex items-center gap-3 p-4 rounded-2xl border ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}>
          {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
          <span className="font-bold text-sm">{isDarkMode ? 'מצב יום' : 'מצב לילה'}</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <header className={`p-6 border-b ${isDarkMode ? 'border-white/5 bg-[#020617]/50' : 'border-slate-200 bg-white/50'} backdrop-blur-xl flex items-center justify-between z-10`}>
          <div className="flex items-center gap-4">
            <img src={BRAIN_LOGO} className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20" alt="Brain" />
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-white">המוח של סבן HUB</h2>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">ראמי מחובר | מוכן לביצוע</p>
            </div>
          </div>
          <MoreVertical className="opacity-40 cursor-pointer" />
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 pb-36">
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-3xl text-sm ${m.role === 'user' ? 'bg-[#1e293b] text-white rounded-tr-none' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-50 rounded-tl-none'}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className="mt-2 text-[9px] opacity-30 text-left uppercase">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          {isProcessing && <div className="text-[10px] font-bold text-emerald-500 animate-pulse px-4">ראמי מעבד...</div>}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#020617] to-transparent">
          <form onSubmit={handleCommand} className="max-w-5xl mx-auto relative group">
            <div className={`relative flex items-center gap-3 p-2 rounded-[2rem] border ${isDarkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'} shadow-2xl`}>
              <input 
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="בצע פעולה: 'עדכן מחירון'..."
                className="flex-1 bg-transparent border-none outline-none text-sm p-4 text-white"
              />
              <button type="submit" disabled={!input.trim() || isProcessing} className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg disabled:opacity-50">
                <Send size={20} className="ml-1" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
