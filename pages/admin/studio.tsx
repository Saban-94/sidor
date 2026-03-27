'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, Sparkles, Moon, Sun, Database, GitBranch, Settings, X, Loader2, ChevronRight, MessageSquare } from 'lucide-react';

const BRAIN_LOGO = "https://iili.io/qstzfVf.jpg";

export default function RamiBrainLivePWA() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('CHAT');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // הודעת פתיחה יוקרתית
    setTimeout(() => {
      typeWriter("אהלן אחי, כאן המוח הלוגיסטי של ראמי. 🏗️ המערכת מסונכרנת 100%, איך נתקתק עבודה היום?");
    }, 800);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const typeWriter = (text: string) => {
    setIsTyping(true);
    let words = text.split(" ");
    let currentText = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += words[i] + " ";
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', content: currentText }];
          }
          return [...prev, { role: 'assistant', content: currentText }];
        });
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 70); 
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, state: 'CHAT_LIVE' })
      });
      const data = await res.json();
      typeWriter(data.reply);
    } catch (e) {
      typeWriter("אחי, המוח בסידור עבודה. תנסה שוב רגע?");
      setIsTyping(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex transition-all duration-700 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f4f7f6] text-slate-900'}`} dir="rtl">
      <Head>
        <title>צאט-AI | Rami Brain Live</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* --- Sidebar (PWA Style) --- */}
      <aside className={`w-20 md:w-80 flex flex-col p-6 border-l transition-all ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200'} backdrop-blur-3xl z-50`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-emerald-500/20 shadow-2xl">
            <Cpu className="text-black" size={26} />
          </div>
          <h1 className="hidden md:block text-2xl font-black italic uppercase tracking-tighter">RAMI <span className="text-emerald-500">AI</span></h1>
        </div>

        <nav className="flex-1 space-y-3">
          <SideBtn icon={<MessageSquare size={20}/>} label="צאט-AI חי" active={activeTab === 'CHAT'} onClick={() => setActiveTab('CHAT')} isDark={isDarkMode}/>
          <SideBtn icon={<Database size={20}/>} label="ניהול מלאי" active={activeTab === 'STOCK'} onClick={() => setActiveTab('STOCK')} isDark={isDarkMode}/>
          <SideBtn icon={<GitBranch size={20}/>} label="ענפי Flow" active={activeTab === 'FLOW'} onClick={() => setActiveTab('FLOW')} isDark={isDarkMode}/>
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="mt-auto p-4 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
          {isDarkMode ? <Sun size={24}/> : <Moon size={24}/>}
        </button>
      </aside>

      {/* --- Main Chat Stage --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Floating AI Persona Logo */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 z-40 hidden lg:block"
        >
          <div className="relative p-1 bg-gradient-to-tr from-emerald-500 to-emerald-200 rounded-full shadow-2xl">
            <img src={BRAIN_LOGO} className="w-20 h-20 rounded-full border-4 border-black" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-full ring-4 ring-black">
              <Sparkles size={14} className="text-black animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Chat Message Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-6 custom-scrollbar pt-20" ref={scrollRef}>
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-5 rounded-[2.5rem] text-sm md:text-lg font-bold shadow-xl ${
                  m.role === 'user' 
                  ? 'bg-emerald-500 text-black rounded-tr-none' 
                  : isDarkMode ? 'bg-white/10 text-white rounded-tl-none border border-white/5' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <div className="flex justify-start items-center gap-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          )}
        </div>

        {/* Floating Input Dock */}
        <div className="p-6 md:p-12">
          <div className={`max-w-4xl mx-auto rounded-full p-2 flex items-center gap-3 transition-all border shadow-2xl ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
          }`}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="דבר עם המוח..."
              className="flex-1 bg-transparent px-8 py-4 outline-none text-lg font-bold"
            />
            <button 
              onClick={handleSend}
              className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-lg"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function SideBtn({ icon, label, active, onClick, isDark }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all group ${
      active 
      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
      : isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'
    }`}>
      {icon}
      <span className="hidden md:block font-black text-xs uppercase tracking-widest">{label}</span>
      {active && <ChevronRight size={14} className="mr-auto opacity-50 rotate-180" />}
    </button>
  );
}
