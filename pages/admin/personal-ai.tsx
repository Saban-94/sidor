import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, app } from '../../lib/firebase';
import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { 
  Send, Bot, User, Zap, Settings, Moon, Sun, Menu, 
  Terminal, Sparkles, Layout, Database, ChevronLeft, 
  MoreVertical, Mic, Paperclip, Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// נכסי מותג
const BRAIN_LOGO = "https://iili.io/qstzfVf.jpg"; // לוגו המוח של סבן HUB

export default function PersonalAI() {
  const [mounted, setMounted] = useState(false); // הגנה קריטית ל-Hydration
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת היסטוריה והגנת mounted
  useEffect(() => {
    setMounted(true); // סימון שהקומפוננטה נטענה בדפדפן
    
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

  // מניעת רינדור שרת כדי למנוע את שגיאת ה-Hydration (React Error #418)
  if (!mounted) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const userMsg = input;
    setInput('');
    setIsProcessing(true);

    try {
      // 1. שמירת הודעת המשתמש ב-RTDB
      await push(ref(database, 'private_brain/history'), {
        role: 'user',
        content: userMsg,
        timestamp: Date.now()
      });

      // 2. קריאה למוח (Gemini API)
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, name: "אח יקר", contextType: 'PRIVATE_ASSISTANT' })
      });
      const result = await response.json();

      // 3. שמירת תשובת המוח ב-RTDB
      await push(ref(database, 'private_brain/history'), {
        role: 'assistant',
        content: result.reply,
        action: result.action || null,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Brain Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`h-screen flex ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300 text-right antialiased`} dir="rtl">
      <Head>
        <title>SABAN BRAIN | המוח הפרטי שלי</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* Hamburger Menu לנייד */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-emerald-500 rounded-2xl shadow-lg text-white active:scale-95 transition-transform">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <AnimatePresence>
        {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth > 1024)) && (
          <motion.aside 
            initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
            className={`fixed lg:relative z-40 w-72 h-full border-l ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col shadow-2xl lg:shadow-none`}
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">BRAIN</span></h1>
            </div>

            <nav className="flex-1 space-y-2">
              <SidebarItem icon={<History size={18}/>} label="היסטוריית משימות" active isDarkMode={isDarkMode} />
              <SidebarItem icon={<Layout size={18}/>} label="ניהול פרויקטים" isDarkMode={isDarkMode} />
              <SidebarItem icon={<Database size={18}/>} label="דאטה ולוגיסטיקה" isDarkMode={isDarkMode} />
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

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden bg-dot-pattern">
        <header className={`p-6 border-b ${isDarkMode ? 'border-white/5 bg-[#020617]/50' : 'border-slate-200 bg-white/50'} backdrop-blur-xl flex items-center justify-between z-10`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={BRAIN_LOGO} className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20" alt="Rami Brain" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-fullanimate-pulse"></div>
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-white">המוח של סבן HUB</h2>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">ראמי מחובר | מוכן לביצוע</p>
            </div>
          </div>
          <div className="flex gap-2 opacity-40">
            <Search size={18} className="cursor-pointer" />
            <MoreVertical size={18} className="cursor-pointer" />
          </div>
        </header>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar pb-36 bg-[#020617]/20">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-center">
              <Sparkles size={80} className="mb-6 text-white" />
              <p className="font-black italic uppercase tracking-widest text-white text-xl">דבר אלי אחי, אני מוכן לביצוע.</p>
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
                <div className="mt-2 text-[9px] opacity-30 font-bold uppercase tracking-tighter text-left">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 animate-pulse px-12">
              ראמי מעבד את הפקודה שלך...
            </div>
          )}
        </div>

        {/* Input Bar היוקרתי */}
        <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDarkMode ? 'bg-gradient-to-t from-[#020617] via-[#020617] to-transparent' : 'bg-gradient-to-t from-slate-50 via-slate-50 to-transparent'}`}>
          <form onSubmit={handleCommand} className="max-w-5xl mx-auto relative group">
            <div className="absolute inset-0 rounded-[2rem] blur-2xl opacity-10 group-focus-within:opacity-30 transition-opacity bg-emerald-500"></div>
            <div className={`relative flex items-center gap-3 p-2 rounded-[2rem] border ${isDarkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'} shadow-2xl`}>
              
              <div className="flex gap-1 pr-2 border-l border-white/5 ml-2 text-[#8696a0]">
                 <Smile size={22} className="cursor-pointer hover:text-white transition" />
                 <Paperclip size={22} className="cursor-pointer hover:text-white transition" />
              </div>

              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="בצע פעולה: 'עדכן מחירון' או 'שלח משאית לאשדוד'..."
                className="flex-1 bg-transparent border-none outline-none text-sm p-3 placeholder:opacity-30"
              />
              
              {input.trim() ? (
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={20} className="ml-1" />
                </button>
              ) : (
                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#8696a0] ml-1 cursor-pointer hover:bg-white/10 transition">
                    <Mic size={22} />
                 </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// רכיב עזר לסרגל צד
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
