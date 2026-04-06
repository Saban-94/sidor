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
  const [userCid, setUserCid] = useState<string>('guest');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. אתחול ראשוני (Splash, OneSignal, וזיהוי לקוח)
  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);

    // זיהוי ID זמני (ניתן להחליף בטלפון אמיתי אחרי זיהוי)
    const storedCid = localStorage.getItem('saban_cid') || `guest_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('saban_cid', storedCid);
    setUserCid(storedCid);

    // אתחול OneSignal
    if (typeof window !== 'undefined') {
      const OneSignal = (window as any).OneSignal || [];
      OneSignal.push(() => {
        OneSignal.init({
          appId: "YOUR_ONESIGNAL_APP_ID", // בוס, שים כאן את ה-ID שלך
          allowLocalhostAsSecureOrigin: true,
        });
      });
    }
  }, []);

  // 2. האזנה למענה ידני מהמשלט (Realtime Listener)
  useEffect(() => {
    if (userCid === 'guest') return;

    const channel = supabase
      .channel('chat-sync')
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_memory',
          filter: `clientId=eq.${userCid}`
        },
        (payload) => {
          const history = payload.new.accumulated_knowledge || "";
          const lines = history.split('\n').filter(Boolean);
          const lastLine = lines[lines.length - 1];

          // אם המנהל כתב [ADMIN], נציג את זה בצאט של הלקוח
          if (lastLine?.includes('[ADMIN]:')) {
            const adminContent = lastLine.replace('[ADMIN]:', '').trim();
            
            setMessages(prev => {
              const alreadyExists = prev.some(m => m.content === adminContent);
              if (alreadyExists) return prev;
              return [...prev, { role: 'ai', content: adminContent }];
            });
            new Audio('/message-pop.mp3').play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userCid]);

  // 3. גלילה אוטומטית
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingText]);

  // 4. קליטת הודעות מהמחשבון (Iframe)
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data.type === 'ADD_TO_ORDER') {
        setSelectedProductSku(null);
        askAI(`אני רוצה להזמין ${e.data.quantity} יחידות של ${e.data.productName} (מק"ט ${e.data.sku})`);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [userCid]);

  const askAI = async (query: string) => {
    if (!query.trim() || loading || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: userCid })
      });
      const data = await res.json();
      setLoading(false);
      
      // אפקט כתיבה
      setIsTyping(true);
      setStreamingText("");
      const words = data.reply.split(" ");
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
          i++;
        } else {
          clearInterval(interval);
          setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
          setStreamingText("");
          setIsTyping(false);
        }
      }, 40);
    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור למוח אחי." }]);
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] ${WA_TEXT}`} dir="rtl">
      <Head>
        <title>ח.סבן AI | עוזר אישי</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async></script>
      </Head>

      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-10 z-0" />

      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <img src={SABAN_LOGO} className="w-32 h-32 rounded-3xl shadow-2xl animate-pulse"/>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-16 flex items-center justify-between px-5 bg-[#202c33] border-b border-white/5 z-10 shrink-0">
        <Menu size={22} className="text-slate-400" />
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-left items-end">
            <span className="font-bold text-sm text-emerald-500 leading-none">ח.סבן - עוזר חכם</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-400 uppercase">Live</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
            </div>
          </div>
          <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border border-emerald-500/30"/>
        </div>
        <div id="install-pwa" className="hidden" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[14px] leading-relaxed prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-md">
              <span className="text-[14px] leading-relaxed">{streamingText || "..."}</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      <footer className="p-3 bg-[#0b141a] border-t border-white/5 z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] rounded-full text-[12px] font-semibold border border-white/5 flex items-center gap-2 active:scale-95">
              <span className={q.color}>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex gap-2 max-w-5xl mx-auto">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="איך אפשר לעזור אחי?" className="flex-1 p-3 px-5 rounded-full bg-[#2a3942] text-white outline-none text-sm"/>
          <button type="submit" disabled={loading} className="w-12 h-12 bg-emerald-500 text-[#0b141a] rounded-full flex items-center justify-center disabled:opacity-50"><Send size={18} className="rotate-180"/></button>
        </form>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
