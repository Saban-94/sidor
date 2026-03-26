import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, app } from '../../lib/firebase';
import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { 
  Send, Bot, User, Settings, Moon, Sun, Menu, 
  Terminal, Zap, History, Sparkles, Layout, Database, 
  ChevronLeft, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SABAN HUB - Personal AI Assistant (Private Brain)
 * עיצוב יוקרתי, תמיכה ב-PWA, מצב כהה/בהיר וביצוע פעולות מטקסט חופשי.
 */

export default function PersonalAI() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת היסטוריית שיחות מהמוח הפרטי (RTDB)
  useEffect(() => {
    const aiChatRef = query(ref(database, 'private_brain/history'), limitToLast(50));
    return onValue(aiChatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      }
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input;
    setInput('');
    setIsProcessing(true);

    try {
      // 1. תיעוד ושמירת השיחה
      await push(ref(database, 'private_brain/history'), {
        role: 'user',
        content: userMsg,
        timestamp: serverTimestamp()
      });

      // 2. שליחה לביצוע (API Call)
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          state: 'PRIVATE_ASSISTANT',
          manualInjection: true 
        })
      });

      const result = await response.json();

      // 3. תיעוד תשובת ה-AI וביצוע הפעולה
      await push(ref(database, 'private_brain/history'), {
        role: 'assistant',
        content: result.reply,
        actionTaken: result.newState || null,
        timestamp: serverTimestamp()
      });

    } catch (err) {
      console.error("AI execution error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300 text-right`} dir="rtl">
      <Head>
        <title>SABAN HUB | My Brain</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-emerald-500 rounded-2xl shadow-lg text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <AnimatePresence>
        {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth > 1024)) && (
          <motion.aside 
            initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
            className={`fixed lg:relative z-40 w-72 h-full border-l ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col`}
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">BRAIN</span></h1>
            </div>

            <nav className="flex-1 space-y-2">
              <SidebarItem icon={<History size={18}/>} label="היסטוריית משימות" active isDarkMode={isDarkMode} />
              <SidebarItem icon={<Layout size={18}/>} label="עריכת תפריטים" isDarkMode={isDarkMode} />
              <SidebarItem icon={<Database size={18}/>} label="מלאי ודאטה" isDarkMode={isDarkMode} />
              <SidebarItem icon={<Settings size={18}/>} label="הגדרות מוח" isDarkMode={isDarkMode} />
            </nav>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`mt-auto flex items-center gap-3 p-4 rounded-2xl border ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'} transition-all`}
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
              <span className="font-bold text-sm">{isDarkMode ? 'מצב יום' : 'מצב לילה'}</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <header className={`p-6 border-b ${isDarkMode ? 'border-white/5 bg-[#020617]/50' : 'border-slate-200 bg-white/50'} backdrop-blur-xl flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <Bot size={24} />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-full"></div>
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest">העוזר של סבן</h2>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">Online & Ready</p>
            </div>
          </div>
          <MoreVertical className="opacity-40 cursor-pointer" />
        </header>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar pb-32">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
              <Sparkles size={64} className="mb-4" />
              <p className="font-black italic uppercase tracking-widest">דבר אלי, אני מוכן לביצוע.</p>
            </div>
          )}
          {messages.map((m) => (
            <motion.div 
              key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {m.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
              </div>
              <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                ? (isDarkMode ? 'bg-[#1e293b] text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tr-none')
                : (isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-50 rounded-tl-none' : 'bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-tl-none')
              }`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className="mt-2 text-[9px] opacity-30 font-bold uppercase tracking-tighter">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 animate-pulse px-12">
              ראמי מעבד את הבקשה שלך...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDarkMode ? 'bg-gradient-to-t from-[#020617] via-[#020617] to-transparent' : 'bg-gradient-to-t from-slate-50 via-slate-50 to-transparent'}`}>
          <form onSubmit={handleCommand} className="max-w-4xl mx-auto relative group">
            <div className={`absolute inset-0 rounded-[2rem] blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity bg-emerald-500`}></div>
            <div className={`relative flex items-center gap-3 p-2 rounded-[2rem] border ${isDarkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'} shadow-2xl`}>
              <div className="p-3 text-emerald-500"><Terminal size={20} /></div>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="בצע פעולה: 'עדכן מחיר בלוק ל-5 שח' או 'מה המצב במלאי?'"
                className="flex-1 bg-transparent border-none outline-none text-sm p-2 placeholder:opacity-30"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isProcessing}
                className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send size={20} className="ml-1" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, isDarkMode }: any) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all font-bold text-sm ${
      active 
      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
      : (isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100')
    }`}>
      {icon}
      <span>{label}</span>
      {active && <ChevronLeft size={16} className="mr-auto opacity-50" />}
    </div>
  );
}
