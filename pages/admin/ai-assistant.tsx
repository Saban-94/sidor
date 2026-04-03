'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingText]);

  // useEffect חדש: האזנה להודעות מה-Iframe של כרטיס המוצר
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // בדיקה שההודעה הגיעה מהסוג ששלחנו בכרטיס המוצר
      if (event.data.type === 'ADD_TO_ORDER') {
        const { productName, quantity, sku } = event.data;
        
        // 1. סגירת הכרטיס הצף
        setSelectedProductSku(null);
        
        // 2. הזנת הטקסט בתיבת הקלט באופן אוטומטי
        setInput(`אני רוצה להזמין ${quantity} שקים של ${productName} (מק"ט ${sku})`);
        
        // אופציונלי: אם תרצה שהבוט ישלח את ההודעה מיד, בטל את ההערה למטה:
        // askAI(`אני רוצה להזמין ${quantity} שקים של ${productName} (מק"ט ${sku})`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // פונקציה לזיהוי פקודות נסתרות מה-AI (כמו הקפצת כרטיס מוצר)
  const handleInternalCommands = (text: string) => {
    if (text.includes("SHOW_PRODUCT_CARD:")) {
      const sku = text.split("SHOW_PRODUCT_CARD:")[1].split(/\s/)[0].trim();
      setTimeout(() => setSelectedProductSku(sku), 1000); // השהייה קלה למראה טבעי
    }
  };

  const typeEffect = (fullText: string) => {
    setIsTyping(true);
    setStreamingText("");
    // ניקוי הפקודות הפנימיות מהטקסט שמוצג ללקוח
    const cleanText = fullText.replace(/SHOW_PRODUCT_CARD:[\w-]+\s?/, "");
    const words = cleanText.split(" ");
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        setStreamingText((prev) => prev + (i === 0 ? "" : " ") + words[i]);
        i++;
      } else {
        clearInterval(interval);
        setMessages(prev => [...prev, { role: 'ai', content: cleanText }]);
        setStreamingText("");
        setIsTyping(false);
        handleInternalCommands(fullText); // הפעלת הפקודה רק בסיום ההקלדה
      }
    }, 45);
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
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בתקשורת עם המוח." }]); 
    }
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] text-[#e9edef]" dir="rtl">
      <Head><title>ח.סבן | עוזר AI חכם</title></Head>

      {/* שכבת כרטיס מוצר צפה (Overlay) */}
      <AnimatePresence>
        {selectedProductSku && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedProductSku(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#202c33] w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#2a3942]">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Calculator size={18} /> <span>מחשבון מוצר חכם</span>
                </div>
                <button onClick={() => setSelectedProductSku(null)} className="p-2 hover:bg-white/5 rounded-full transition"><X size={20}/></button>
              </div>
              <div className="h-[500px] w-full bg-white">
                {/* הוספת embed=true כדי שהדף יידע להסתיר Header */}
                <iframe src={`/product/${selectedProductSku}?embed=true`} className="w-full h-full border-none" />
              </div>
              <div className="p-4 bg-[#2a3942]">
                <button onClick={() => setSelectedProductSku(null)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition shadow-lg">חזרה לשיחה</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Splash Screen */}
      <AnimatePresence>{showSplash && <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#111b21] z-[100] flex items-center justify-center"><img src={SABAN_LOGO} className="w-32 h-32 rounded-3xl shadow-2xl animate-pulse"/></motion.div>}</AnimatePresence>

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#202c33]/90 backdrop-blur-md border-b border-white/5 shrink-0 z-10">
        <Menu size={24} className="text-slate-400" />
        <div className="flex items-center gap-3">
          <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border border-emerald-500/30"/>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-emerald-500">ח. סבן AI</span>
            <span className="text-[10px] text-emerald-400/70">מחובר | מענה טכני פעיל</span>
          </div>
        </div>
        <div className="w-8 h-8" />
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-fixed bg-center bg-cover">
        <div className="absolute inset-0 bg-[#0b141a]/85 -z-10" />
        
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tr-none' : 'bg-[#005c4b] text-white rounded-tl-none border border-emerald-400/10'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert max-w-none text-sm leading-relaxed">
                {m.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {/* Streaming Effect */}
        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-4 rounded-2xl bg-[#005c4b] rounded-tl-none border border-emerald-400/10 shadow-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert text-sm">{streamingText || "..."}</ReactMarkdown>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1 h-4 bg-emerald-300 ml-1" />
            </div>
          </div>
        )}
        
        {loading && <div className="flex justify-end"><div className="bg-[#202c33] px-4 py-2 rounded-full text-xs text-emerald-400 animate-pulse border border-emerald-500/20">המוח מעבד נתונים...</div></div>}
        <div ref={scrollRef} className="h-10" />
      </main>

      {/* Footer */}
      <footer className="p-4 bg-[#111b21] border-t border-white/5 z-10">
        <div className="max-w-4xl mx-auto mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] rounded-full text-[11px] font-bold flex items-center gap-2 border border-white/5 transition-all active:scale-95">
              <span className={q.color}>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="max-w-4xl mx-auto flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל אותי על חומרים, הובלות או מחירים..." className="flex-1 p-4 rounded-2xl bg-[#2a3942] border-none outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-medium transition-all"/>
          <button type="submit" disabled={loading || isTyping} className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-[#0b141a] rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 disabled:opacity-50">
            <Send size={22} className="rotate-180"/>
          </button>
        </form>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #34d399; font-weight: 800; }
        .prose hr { border-top-color: rgba(255,255,255,0.1); margin: 10px 0; }
      `}</style>
    </div>
  );
}
