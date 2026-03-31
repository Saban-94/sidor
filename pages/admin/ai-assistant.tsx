'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
// הוספתי כאן את User ו-RefreshCcw שהיו חסרים
import { 
  Menu, X, Send, Bot, Calendar, Truck, Box, 
  ArrowRightLeft, Search, Hash, MessageSquare, BarChart3, HelpCircle, User, RefreshCcw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQueries = [
    "כמה הזמנות יש היום?",
    "מה מצב המכולות בשטח?",
    "האם היו העברות היום?",
    "כמה הזמנות סופקו?",
    "מי הנהג הפעיל ביותר היום?",
    "סטטוס שארק 30",
    "חיפוש לפי שם לקוח",
    "דוח יומי מקוצר",
    "הזמנות ללא נהג",
    "מכולות שצריכות פינוי"
  ];
    const STATUS_MAP: Record<string, { label: string, color: string }> = {
   'approved': { label: 'מאושר', color: 'bg-emerald-500' },
   'pending': { label: 'ממתין להעמסה', color: 'bg-amber-500' },
   'rejected': { label: 'נדחתה', color: 'bg-red-500' },
   'loading': { label: 'בהעמסה', color: 'bg-blue-500' }
   };
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const askAI = async (query: string) => {
    if (!query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, יש תקלה בחיבור לנתונים." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0B0F1A] text-white flex flex-col font-sans overflow-hidden" dir="rtl">
      <Head>
        <title>Saban AI Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      <header className="h-16 flex items-center justify-between px-6 bg-[#111827] border-b border-white/5 shadow-2xl z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-all">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <div className="flex items-center gap-2">
          <span className="font-black italic text-xl tracking-tighter text-emerald-500">SABAN AI</span>
          <Bot className="text-emerald-500" size={24} />
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <User size={20} className="text-emerald-500" />
        </div>
      </header>
           <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase text-white ${STATUS_MAP[order.status]?.color || 'bg-slate-500'}`}>
         {STATUS_MAP[order.status]?.label || order.status}
          </span>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed inset-0 top-16 bg-[#111827] z-40 p-6 space-y-4 shadow-2xl border-l border-white/5"
          >
            <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">ניהול מהיר</div>
            {[
              { label: 'לוח משימות', icon: Calendar },
              { label: 'סטטיסטיקה', icon: BarChart3 },
              { label: 'הגדרות', icon: RefreshCcw }
            ].map((item, i) => (
              <button key={i} className="w-full p-5 bg-white/5 rounded-2xl flex items-center gap-4 font-bold text-lg active:scale-95 transition-all">
                <item.icon className="text-emerald-500" /> {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-32" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-10">
            <Bot size={80} className="mb-4 text-emerald-500" />
            <h2 className="text-2xl font-black italic">בוס, במה נעזור?</h2>
            <p className="text-sm font-bold">הנתונים של היום מסונכרנים ומוכנים לשאלות שלך.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-lg font-black shadow-xl ${
              m.role === 'user' ? 'bg-[#1E293B] text-white border border-white/5' : 'bg-emerald-500 text-slate-900'
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {loading && <div className="flex justify-end pr-4"><RefreshCcw className="animate-spin text-emerald-500" /></div>}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A] to-transparent">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
          {quickQueries.map((q, i) => (
            <button 
              key={i} onClick={() => askAI(q)}
              className="whitespace-nowrap px-6 py-3 bg-[#111827] border border-white/10 rounded-full text-xs font-black hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-lg"
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative">
          <input 
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="חפש לקוח, הזמנה או שאל על הלוז..."
            className="w-full p-6 pr-14 rounded-[2.5rem] bg-[#111827] border border-white/10 text-white font-bold outline-none focus:border-emerald-500 shadow-2xl"
          />
          <button type="submit" className="absolute left-3 top-3 w-12 h-12 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all">
            <Send size={20} className="rotate-180" />
          </button>
        </form>
      </footer>
    </div>
  );
}
