'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const WA_BG = "bg-[#111b21]";
const WA_TEXT = "text-[#e9edef]";

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
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedProductSku, setSelectedProductSku] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);
  }, []);

  // קליטת הודעות מה-Iframe (הזמנה מהמחשבון)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ADD_TO_ORDER') {
        const { productName, quantity, sku } = event.data;
        setSelectedProductSku(null); // סגירת המודאל
        setInput(`אני רוצה להזמין ${quantity} שקים של ${productName} (מק"ט ${sku})`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingText]);

  const handleInternalCommands = (text: string) => {
    if (text.includes("SHOW_PRODUCT_CARD:")) {
      const sku = text.split("SHOW_PRODUCT_CARD:")[1].split(/\s/)[0].trim();
      setTimeout(() => setSelectedProductSku(sku), 600);
    }
  };

  const typeEffect = (fullText: string) => {
    setIsTyping(true);
    setStreamingText("");
    const cleanText = fullText.replace(/SHOW_PRODUCT_CARD:[\w-]+\s?/, "");
    const words = cleanText.split(" ");
    let i = 0;

    const playNextWord = () => {
      if (i < words.length) {
        setStreamingText((prev) => prev + (i === 0 ? "" : " ") + words[i]);
        i++;
        const randomSpeed = Math.floor(Math.random() * (100 - 30 + 1)) + 35;
        setTimeout(playNextWord, randomSpeed); 
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: cleanText }]);
        setStreamingText("");
        setIsTyping(false);
        handleInternalCommands(fullText);
      }
    };
    playNextWord();
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: 'admin' })
      });
      const data = await res.json();
      setLoading(false);
      typeEffect(data.reply);
      new Audio('/order-notification1.mp3').play().catch(() => {});
    } catch (e) { 
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור." }]); 
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover bg-fixed ${WA_TEXT}`} dir="rtl">
      <div className="absolute inset-0 bg-[#0b141a]/85 z-0" />
      <Head><title>ח.סבן-AI</title></Head>

      {/* שכבת כרטיס מוצר צפה עם גלילה מאופשרת */}
      <AnimatePresence>
        {selectedProductSku && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedProductSku(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#111b21] w-full max-w-md max-h-[90vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#202c33] shrink-0">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Calculator size={18} /> <span>מחשבון וכמויות</span>
                </div>
                <button onClick={() => setSelectedProductSku(null)} className="p-2 hover:bg-white/5 rounded-full transition text-white"><X size={20}/></button>
              </div>
              
              {/* Container גמיש עם גלילה ל-Iframe */}
              <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                <iframe 
                  src={`/product/${selectedProductSku}?embed=true`} 
                  className="w-full h-[600px] border-none block" 
                  style={{ minHeight: '100%' }}
                />
              </div>

              <div className="p-4 bg-[#202c33] border-t border-white/5 shrink-0">
                <button onClick={() => setSelectedProductSku(null)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-white transition-all active:scale-95 shadow-lg">חזרה לצ'אט</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <AnimatePresence>{showSplash && <motion.div exit={{ opacity: 0 }} className={`fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center`}><img src={SABAN_LOGO} className="w-40 h-40 rounded-3xl shadow-2xl animate-pulse"/></motion.div>}</AnimatePresence>

        <header className="h-16 flex items-center justify-between px-6 bg-[#202c33]/90 backdrop-blur-md border-b border-white/5 shrink-0">
          <Menu size={24} className="text-slate-400" />
          <div className="flex items-center gap-2">
            <img src={SABAN_LOGO} className="w-8 h-8 rounded-full border border-emerald-500/20"/>
            <span className="font-black text-emerald-500 tracking-tighter">AI-ח.סבן חומרי בנין</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-500 font-bold">LIVE</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth">
          {messages.map((m, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl ${m.role === 'user' ? 'bg-[#202c33] rounded-tr-none' : 'bg-[#005c4b] rounded-tl-none border border-emerald-400/10'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm leading-relaxed prose prose-invert max-w-none">{m.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}

          {(isTyping || streamingText) && (
            <div className="flex justify-end">
              <div className="max-w-[85%] p-4 rounded-2xl bg-[#005c4b] rounded-tl-none border border-emerald-400/10 shadow-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm">{streamingText || "..."}</ReactMarkdown>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1 h-4 bg-emerald-300 ml-1" />
              </div>
            </div>
          )}

          {loading && <div className="flex justify-end"><div className="bg-[#202c33] px-3 py-1.5 rounded-full text-[10px] text-emerald-400 border border-emerald-500/20 animate-pulse">המוח מעבד נתונים...</div></div>}
          <div ref={scrollRef} className="h-10" />
        </main>

        <footer className="p-4 bg-[#0b141a]/95 border-t border-white/5 shrink-0">
          <div className="max-w-4xl mx-auto mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] rounded-xl text-[11px] font-bold flex items-center gap-2 border border-white/5 transition-all active:scale-95">
                <span className={q.color}>{q.icon}</span>{q.label}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="max-w-4xl mx-auto flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב משהו לבוט..." className="flex-1 p-4 rounded-2xl bg-[#202c33] border-none outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-sm"/>
            <button type="submit" disabled={loading || isTyping} className="w-14 h-14 bg-emerald-500 text-[#0b141a] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50 transition-all">
              <Send size={20} className="rotate-180"/>
            </button>
          </form>
        </footer>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #10b981; font-weight: 900; }
      `}</style>
    </div>
  );
}
