'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, Sparkles, Smartphone, Moon, Sun, Save, Database, GitBranch, Settings, X, Loader2 } from 'lucide-react';

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
    // הודעת פתיחה אוטומטית
    setTimeout(() => {
      typeWriter("אהלן אחי, כאן המוח של ראמי. 🏗️ המערכת מסונכרנת, מה נתקתק היום?");
    }, 1000);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // אפקט הקלדה מילה אחרי מילה
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
            return [...prev.slice(0, -1), { ...last, content: currentText }];
          }
          return [...prev, { role: 'assistant', content: currentText }];
        });
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 80); // מהירות הקלדה יוקרתית
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
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      typeWriter(data.reply);
    } catch (e) {
      typeWriter("אחי, יש תקלה בחיבור. תבדוק אינטרנט.");
    }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f0f2f5] text-slate-900'}`} dir="rtl">
      <Head>
        <title>Rami Brain Live</title>
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {/* --- Sidebar (Glassmorphism) --- */}
      <aside className={`w-20 md:w-72 flex flex-col p-6 border-l transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} backdrop-blur-xl z-50`}>
        <div className="flex items-center gap-4 mb-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Cpu className="text-black" size={28} />
          </motion.div>
          <h1 className="hidden md:block text-2xl font-black italic tracking-tighter uppercase">Rami <span className="text-emerald-500">Brain</span></h1>
        </div>

        <nav className="flex-1 space-y-4">
          <SideBtn icon={<Sparkles/>} label="צאט-AI" active={activeTab === 'CHAT'} onClick={() => setActiveTab('CHAT')} isDark={isDarkMode}/>
          <SideBtn icon={<Database/>} label="מלאי חי" active={activeTab === 'STOCK'} onClick={() => setActiveSection('KNOWLEDGE')} isDark={isDarkMode}/>
          <SideBtn icon={<GitBranch/>} label="ענפי Flow" active={activeTab === 'FLOW'} onClick={() => setActiveSection('FLOW_BUILDER')} isDark={isDarkMode}/>
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-4 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 text-amber-400' : 'bg-slate-100 text-slate-500'}`}>
          {isDarkMode ? <Sun size={24}/> : <Moon size={24}/>}
        </button>
      </aside>

      {/* --- Main Chat Stage --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Animated Pop-Up (AI Persona) */}
        <AnimatePresence>
          <motion.div 
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute top-10 left-10 z-40 hidden lg:flex flex-col items-center"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
              <img src={BRAIN_LOGO} className="w-24 h-24 rounded-full border-4 border-emerald-500 shadow-2xl relative z-10" />
              <div className="absolute -bottom-2 -right-2 bg-black p-2 rounded-full border border-white/20 z-20">
                <Sparkles size={16} className="text-emerald-400 animate-bounce" />
              </div>
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">System Online</p>
          </motion.div>
        </AnimatePresence>

        {/* Chat Room */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar pt-24" ref={scrollRef}>
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: m.role === 'user' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-5 rounded-[2rem] text-sm md:text-base font-bold shadow-sm ${
                m.role === 'user' 
                ? 'bg-emerald-500 text-black rounded-tl-none' 
                : isDarkMode ? 'bg-white/5 border border-white/10 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tr-none'
              }`}>
                {m.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-emerald-500/10 px-4 py-2 rounded-full flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Dock (Glassmorphism) */}
        <div className="p-6 md:p-10">
          <div className={`max-w-4xl mx-auto rounded-full p-2 flex items-center gap-3 transition-all border ${
            isDarkMode ? 'bg-white/5 border-white/10 focus-within:border-emerald-500/50' : 'bg-white shadow-xl border-slate-100 focus-within:border-emerald-500'
          }`}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב הודעה למוח..."
              className="flex-1 bg-transparent px-6 py-3 outline-none text-sm md:text-base font-bold"
            />
            <button 
              onClick={handleSend}
              className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function SideBtn({ icon, label, active, onClick, isDark }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all group ${
      active 
      ? 'bg-emerald-500 text-black shadow-lg' 
      : isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'
    }`}>
      <span className={active ? 'text-black' : 'group-hover:text-emerald-500'}>{icon}</span>
      <span className="hidden md:block font-black text-xs uppercase tracking-tighter">{label}</span>
    </button>
  );
}
