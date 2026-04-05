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
  { label: 'אני רוצה להזמין', icon: '🎯', color: 'text-red-500' },
  { label: 'הזמנת מכולה/מנוף', icon: '🏗️', color: 'text-blue-400' },
  { label: 'ייעוץ טכני/מפרט', icon: '🎓', color: 'text-orange-500' },
  { label: 'מוצרי איטום וגבס', icon: '⛈️', color: 'text-emerald-400' },
  { label: 'שעות פעילות וסניפים', icon: '🏢', color: 'text-slate-400' },
  { label: 'צריך עזרה מנציג', icon: '👤', color: 'text-purple-500' }
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

  // 1. Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // 2. קליטת הודעות מהמחשבון (Iframe)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ADD_TO_ORDER') {
        const { productName, quantity, sku } = event.data;
        setSelectedProductSku(null); 
        const orderText = `אני רוצה להזמין ${quantity} יחידות של ${productName} (מק"ט ${sku})`;
        askAI(orderText);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [messages]); 

  // 3. גלילה אוטומטית
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingText]);

  // 4. ניהול פקודות פנימיות
  const handleInternalCommands = (text: string) => {
    if (text.includes("SHOW_PRODUCT_CARD:")) {
      const parts = text.split("SHOW_PRODUCT_CARD:");
      if (parts[1]) {
        const sku = parts[1].split(/\s/)[0].trim();
        setTimeout(() => setSelectedProductSku(sku), 600);
      }
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
        setTimeout(playNextWord, Math.random() * 50 + 30); 
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
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: 'admin' })
      });
      const data = await res.json();
      setLoading(false);
      typeEffect(data.reply);
      // סאונד של הודעה נכנסת (אופציונלי)
      new Audio('/message-pop.mp3').play().catch(() => {});
    } catch (e) { 
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "משהו השתבש בחיבור למוח. נסה שוב אחי." }]); 
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] ${WA_TEXT}`} dir="rtl">
      <Head><title>ח.סבן AI | עוזר אישי</title></Head>

      {/* רקע מעוצב */}
      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-10 z-0" />

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <img src={SABAN_LOGO} className="w-32 h-32 rounded-3xl shadow-2xl animate-pulse"/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* מחשבון צף */}
      <AnimatePresence>
        {selectedProductSku && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedProductSku(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#111b21] w-full max-w-lg h-[80vh] rounded-3xl overflow-hidden border border-white/10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-[#202c33] flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Calculator size={18} /> <span>מפרט טכני ומחשבון</span>
                </div>
                <button onClick={() => setSelectedProductSku(null)} className="text-white hover:bg-white/10 p-1 rounded-full"><X size={20}/></button>
              </div>
              <iframe 
                src={`/product/${selectedProductSku}?embed=true`} 
                className="flex-1 w-full border-none bg-white"
              />
              <button onClick={() => setSelectedProductSku(null)} className="m-4 py-3 bg-emerald-600 rounded-xl font-bold text-white">סגור וחזור לצ'אט</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

 <Head>
        <title>ח.סבן AI | עוזר אישי</title>
        {/* הגדרות PWA קריטיות */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* OneSignal SDK - טעינה אסינכרונית */}
        <script 
          src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" 
          async 
        ></script>
      </Head>

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-5 bg-[#202c33] border-b border-white/5 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Menu size={22} className="text-slate-400 cursor-pointer hover:text-white transition" />
          
          {/* כפתור התקנה מהיר - מופיע רק אם הדפדפן תומך בהתקנה */}
          <button 
            id="install-pwa"
            className="hidden text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-1 rounded-md font-bold animate-pulse"
            onClick={() => {
              // לוגיקת התקנה (דורשת Service Worker תקין)
              console.log("Installing Saban App...");
            }}
          >
            התקן אפליקציה
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-left items-end">
            <span className="font-bold text-sm text-emerald-500 leading-none">ח.סבן - עוזר חכם</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-400">מחובר כעת</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
            </div>
          </div>
          <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border border-emerald-500/30 shadow-lg"/>
        </div>
        
        {/* כפתור הפעלת התראות OneSignal (פעמון) */}
        <div 
          className="onesignal-customlink-container" 
          style={{ minHeight: '30px' }}
        >
          {/* כאן OneSignal יזריק אוטומטית את כפתור ההרשמה אם הגדרת Custom Link */}
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar">
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, x: m.role === 'user' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[14px] leading-relaxed prose prose-invert max-w-none">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-md">
              <span className="text-[14px] leading-relaxed">{streamingText || "מקליד..."}</span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-1 h-4 bg-emerald-300 ml-1 translate-y-1" />
            </div>
          </div>
        )}

        {loading && <div className="flex justify-center"><div className="bg-[#202c33] px-3 py-1 rounded-full text-[10px] text-emerald-400 animate-pulse">המוח מעבד נתונים...</div></div>}
        <div ref={scrollRef} />
      </main>

      {/* Footer & Quick Queries */}
      <footer className="p-3 bg-[#0b141a] border-t border-white/5 z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] rounded-full text-[12px] font-semibold border border-white/5 flex items-center gap-2 hover:bg-[#2a3942] transition-all active:scale-95">
              <span className={q.color}>{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex gap-2 max-w-5xl mx-auto">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="איך אפשר לעזור אחי?" 
            className="flex-1 p-3 px-5 rounded-full bg-[#2a3942] text-white outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
          />
          <button 
            type="submit" 
            disabled={loading || isTyping} 
            className="w-12 h-12 bg-emerald-500 text-[#0b141a] rounded-full flex items-center justify-center hover:bg-emerald-400 disabled:opacity-50 transition-all"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </form>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #34d399; font-weight: 800; }
      `}</style>
    </div>
  );
}
