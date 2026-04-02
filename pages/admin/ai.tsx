'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, RefreshCcw, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const WA_BG = "bg-[#111b21]";
const WA_PANEL = "bg-[#202c33]";
const WA_TEXT = "text-[#e9edef]";
const WA_SUB = "text-[#f5fafc]";

const QUICK_QUERIES = [
  { label: 'מוצרי איטום', icon: '⛈️ ', color: 'text-emerald-500' },
  { label: 'הובלות מנוף', icon: '🏗️', color: 'text-amber-500' },
  { label: 'מכולת פסולת בנין', icon: '♻️', color: 'text-blue-500' },
  { label: 'בצע הזמנה', icon: '🎯', color: 'text-red-500' },
  { label: 'שעות פעילות סניפים', icon: '🏢', color: 'text-slate-400' },
  { label: 'יצירת לקוח', icon: '👤', color: 'text-purple-500' },
  { label: 'תכין להצעת מחיר', icon: '📄', color: 'text-emerald-400' },
  { label: 'יעוץ טכני', icon: '🎓️', color: 'text-orange-500' }
];

export default function SabanAIAssistant() {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // אפקט חושב
  const [streamingText, setStreamingText] = useState(""); // הטקסט שרץ כרגע
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingText]);

  // פונקציית אפקט ההקלדה האנושי
  const typeEffect = (fullText: string) => {
  setStreamingText("");
  const words = fullText.split(" ");
  let i = 0;

  const playNextWord = () => {
    if (i < words.length) {
      setStreamingText((prev) => prev + (i === 0 ? "" : " ") + words[i]);
      i++;
      
      // יצירת זמן המתנה אקראי בין 30 ל-100 מילישניות
      const randomSpeed = Math.floor(Math.random() * (100 - 30 + 1)) + 30;
      setTimeout(playNextWord, randomSpeed); 
    } else {
      setMessages(prev => [...prev, { role: 'ai', content: fullText }]);
      setStreamingText("");
      setIsTyping(false);
    }
  };

  playNextWord();
};
  const askAI = async (query: string) => {
    if (!query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      new Audio('/order-notification1.mp3').play().catch(() => {});
    } catch (e) { 
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור." }]); 
    } finally { setLoading(false); }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover bg-fixed ${WA_TEXT}`} dir="rtl">
      <div className="absolute inset-0 bg-[#0b141a]/70 z-0" />
      <Head><title>ח.סבן-AI</title></Head>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <AnimatePresence>{showSplash && <motion.div exit={{ opacity: 0 }} className={`fixed inset-0 ${WA_BG} z-[100] flex items-center justify-center`}><img src={SABAN_LOGO} className="w-40 h-40 rounded-3xl shadow-2xl"/></motion.div>}</AnimatePresence>

        <header className="h-16 flex items-center justify-between px-6 bg-[#202c33]/80 backdrop-blur-md border-b border-white/5 shrink-0">
          <Menu size={24} />
          <div className="flex items-center gap-2"><img src={SABAN_LOGO} className="w-8 h-8 rounded-full"/><span className="font-black text-emerald-500">AI-ח.סבן חומרי בנין</span></div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs">מחובר</div>
        </header>

        {/* האזור הגולל - תוקן עם flex-1 ו-overflow-y-auto */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth">
          {messages.map((m, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl ${m.role === 'user' ? 'bg-[#202c33] rounded-tr-none' : 'bg-[#005c4b] rounded-tl-none border border-emerald-400/10'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {loading && <div className="flex justify-end"><div className="bg-[#005c4b] p-3 rounded-xl animate-pulse text-xs">חושב על תשובה ...</div></div>}
          <div ref={scrollRef} className="h-20" />
        </main>

        <footer className="p-4 bg-[#111b21]/90 backdrop-blur-xl border-t border-white/5 shrink-0">
          <div className="max-w-4xl mx-auto mb-4 bg-white/5 p-2 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar flex gap-2">
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] rounded-xl text-[11px] font-bold flex items-center gap-2 border border-white/5 active:scale-95"><span className={q.color}>{q.icon}</span>{q.label}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="max-w-4xl mx-auto flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב משהו ..." className="flex-1 p-4 rounded-xl bg-[#202c33] border-none outline-none focus:ring-1 focus:ring-emerald-500 font-bold"/>
            <button type="submit" disabled={loading} className="w-14 h-14 bg-emerald-500 text-black rounded-xl flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50"><Send size={20} className="rotate-180"/></button>
          </form>
        </footer>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
