'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Send, Bot, Calendar, BarChart3, RefreshCcw, User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQueries = ["כמה הזמנות יש היום?", "סטטוס שארק 30", "חיפוש לפי שם לקוח", "כמה הזמנות סופקו?"];

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
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, תקלה בחיבור." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0B0F1A] text-white flex flex-col font-sans overflow-hidden" dir="rtl">
      <header className="h-16 flex items-center justify-between px-6 bg-[#111827] border-b border-white/5 z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2"><Menu size={28} /></button>
        <div className="flex items-center gap-2">
          <span className="font-black italic text-xl text-emerald-500">SABAN AI</span>
          <Bot className="text-emerald-500" size={24} />
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <User size={20} className="text-emerald-500" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] font-black ${m.role === 'user' ? 'bg-[#1E293B]' : 'bg-emerald-500 text-slate-900'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <RefreshCcw className="animate-spin text-emerald-500 mx-auto" />}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#0B0F1A]">
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {quickQueries.map((q, i) => (
            <button key={i} onClick={() => askAI(q)} className="whitespace-nowrap px-6 py-3 bg-[#111827] border border-white/10 rounded-full text-xs font-black italic">{q}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל את המוח..." className="w-full p-6 rounded-[2.5rem] bg-[#111827] border border-white/10 text-white font-bold outline-none" />
          <button type="submit" className="absolute left-3 top-3 w-12 h-12 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center"><Send size={20} className="rotate-180" /></button>
        </form>
      </footer>
    </div>
  );
}
