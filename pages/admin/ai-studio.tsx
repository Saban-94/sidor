'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, Zap, Database, MessageSquare, 
  Settings, Loader2, Sparkles, Terminal, ShieldCheck,
  Box // <--- הוספתי את האייקון החסר כאן
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

export default function SabanAIStudio() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('ראמי');
  const [dbStatus, setDbStatus] = useState({ orders: 0, containers: 0, memory: 0 });
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    fetchStats();
    setMessages([{ role: 'ai', content: `שלום בוס ${userName}, סטודיו האימון של SABAN AI מוכן. המוח מחובר לטבלאות בזמן אמת. מה נבדוק היום?` }]);
    const sub = supabase.channel('system_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchStats).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [o, c, m] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact' }).eq('delivery_date', today),
      supabase.from('container_management').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('google_ai').select('id', { count: 'exact' })
    ]);
    setDbStatus({ orders: o.count || 0, containers: c.count || 0, memory: m.count || 0 });
  };

  const playSound = () => { new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {}); };

  const askAI = async (query: string) => {
    if (!query.trim() || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput(''); setIsTyping(true);

    try {
      const res = await fetch('/api/google-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userName, history: messages.slice(-3) })
      });
      const data = await res.json();
      typeWriterEffect(data.answer);
      playSound();
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ שגיאה בחיבור ל-API.' }]);
      setIsTyping(false);
    }
  };

  const typeWriterEffect = (text: string) => {
    let currentText = "";
    const words = text.split(" ");
    setMessages(prev => [...prev, { role: 'ai', content: '' }]);
    
    words.forEach((word, i) => {
      setTimeout(() => {
        currentText += word + " ";
        setMessages(prev => {
          const last = [...prev];
          last[last.length - 1].content = currentText;
          return last;
        });
        if (i === words.length - 1) setIsTyping(false);
      }, i * 70);
    });
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN | AI Studio</title></Head>

      <aside className="w-full lg:w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-8 shadow-xl z-20">
        <div className="flex items-center gap-3">
          <img src={SABAN_LOGO} className="w-12 h-12 rounded-2xl shadow-lg border-2 border-blue-500" />
          <div>
            <h1 className="font-black text-xl italic leading-none">AI STUDIO</h1>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Saban OS Core</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מצב טבלאות (LIVE)</p>
          {[
            { label: 'הזמנות היום', count: dbStatus.orders, icon: <Zap size={16}/>, color: 'text-blue-600' },
            { label: 'מכולות בשטח', count: dbStatus.containers, icon: <Box size={16}/>, color: 'text-purple-600' },
            { label: 'זיכרון לימוד', count: dbStatus.memory, icon: <Database size={16}/>, color: 'text-emerald-600' }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className={item.color}>{item.icon}</span>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <span className="font-black text-lg">{item.count}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2 text-blue-700">
            <ShieldCheck size={16} />
            <span className="text-xs font-black uppercase">System Status</span>
          </div>
          <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed">
            המוח מוגדר להאזנה בלבד לטבלאות. ה-API Key פעיל ומוגדר על Gemini 3.1.
          </p>
        </div>
      </aside>

      <section className="flex-1 flex flex-col relative bg-[#F1F5F9]">
        <header className="p-4 bg-white/80 backdrop-blur-md border-b flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-black text-sm uppercase tracking-tighter">Live Simulator</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">USER: {userName}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`group relative max-w-[85%] lg:max-w-[70%] p-5 rounded-[2rem] shadow-sm transition-all ${
                  m.role === 'user' ? 'bg-white rounded-tr-none text-slate-800' : 'bg-blue-600 text-white rounded-tl-none shadow-blue-200'
                }`}>
                   {m.role === 'ai' && (
                     <div className="absolute -top-6 right-2 flex items-center gap-1 opacity-40">
                        <Bot size={12} /> <span className="text-[10px] font-bold uppercase">Saban AI</span>
                     </div>
                   )}
                   <div className="prose prose-sm max-w-none text-inherit font-bold leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                   </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-end p-4">
                <div className="flex gap-1 bg-blue-600/10 p-3 rounded-full">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        <footer className="p-6 bg-white/80 backdrop-blur-md border-t">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {["כמה סופקו היום?", "סטטוס מכולות", "חכמת פנוי?"].map(q => (
                <button 
                  key={q} onClick={() => askAI(q)}
                  className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-full text-[11px] font-black transition-all border border-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>
            <form 
              onSubmit={(e) => { e.preventDefault(); askAI(input); }}
              className="relative flex items-center gap-3"
            >
              <div className="flex-1 relative">
                <input 
                  value={input} onChange={e => setInput(e.target.value)}
                  placeholder="שלח פקודה למוח..."
                  className="w-full p-4 pr-12 bg-slate-100 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm"
                />
                <Sparkles size={18} className="absolute right-4 top-4 text-blue-500 opacity-50" />
              </div>
              <button 
                type="submit" disabled={isTyping}
                className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-all disabled:opacity-50"
              >
                <Send size={24} className="rotate-180" />
              </button>
            </form>
          </div>
        </footer>
      </section>
    </div>
  );
}
