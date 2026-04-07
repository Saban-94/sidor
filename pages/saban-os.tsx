'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, ShoppingCart, Trash2, CheckCircle2, Sparkles, Package, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

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
  const [userCid, setUserCid] = useState<string>('guest');
  
  // מצבים לסל הקניות
  const [cartItems, setCartItems] = useState<{id: string, name: string, qty: string}[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);
    const storedCid = localStorage.getItem('saban_cid') || `guest_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('saban_cid', storedCid);
    setUserCid(storedCid);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingText]);

  const playMagicSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

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
      
      // בדיקה אם ה-AI זיהה הזמנה (לוגיקה מבוססת על מבנה ה-API שלך)
      if (data.orderPlaced || data.reply.includes("הוספתי לסל")) {
        playMagicSound();
        const newItem = {
          id: Date.now().toString(),
          name: data.items || query,
          qty: "1"
        };
        setCartItems(prev => [...prev, newItem]);
        setTimeout(() => setShowCart(true), 1000);
      }

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
    <div className="h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] text-[#e9edef]" dir="rtl">
      <Head>
        <title>Saban AI | Premium</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* רקע דקורטיבי */}
      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-5 pointer-events-none" />

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <motion.img 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              src={SABAN_LOGO} className="w-32 h-32 rounded-3xl shadow-2xl shadow-emerald-500/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Glassmorphism */}
      <header className="h-16 flex items-center justify-between px-5 bg-[#202c33]/80 backdrop-blur-md border-b border-white/5 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Menu size={22} className="text-slate-400 cursor-pointer" />
          <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
            <ShoppingCart size={22} className="text-emerald-500" />
            {cartItems.length > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white font-bold border border-[#202c33]">
                {cartItems.length}
              </motion.span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="font-black text-xs tracking-tighter text-emerald-500 uppercase">Saban OS</span>
            <span className="text-[10px] text-slate-400 font-bold">מחובר למוח</span>
          </div>
          <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border border-emerald-500/30 shadow-lg"/>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar relative">
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3.5 px-4 rounded-2xl shadow-lg leading-relaxed ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none border border-white/5' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[14px] prose prose-invert prose-strong:text-emerald-300">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3.5 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-md flex items-center gap-2">
              <span className="text-[14px]">{streamingText || "..."}</span>
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-[85%] max-w-sm z-[60] p-6 flex flex-col shadow-2xl bg-[#111b21]">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Package className="text-emerald-500" size={24} />
                  <h2 className="text-xl font-black text-white italic">הסל שלי</h2>
                </div>
                <X onClick={() => setShowCart(false)} className="cursor-pointer text-slate-500" />
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-sm">הסל ריק כרגע...</div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div layout key={item.id} className="p-4 rounded-2xl border-r-4 border-emerald-500 bg-[#202c33] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="font-bold text-sm text-white">{item.name}</span>
                      </div>
                      <Trash2 size={18} className="text-red-400/40 cursor-pointer" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                    </motion.div>
                  ))
                )}
              </div>

              <button 
                onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה מ-Saban AI:\n" + cartItems.map(i => `• ${i.name}`).join('\n'))}`)} 
                className="w-full bg-emerald-600 py-4 rounded-2xl mt-6 font-bold text-white flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <Share2 size={18}/> שלח הזמנה לוואטסאפ
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-4 bg-[#0b141a] border-t border-white/5 z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 max-w-5xl mx-auto">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] rounded-full text-[12px] font-bold border border-white/5 flex items-center gap-2 active:scale-95 transition-all">
              <span className={q.color}>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex gap-3 max-w-5xl mx-auto items-center">
          <div className="flex-1 relative">
            <input 
              value={input} onChange={e => setInput(e.target.value)} 
              placeholder="איך עוזרים היום בוס?" 
              className="w-full p-3.5 px-6 rounded-full bg-[#2a3942] text-white outline-none text-sm border border-transparent focus:border-emerald-500/50 transition-all shadow-inner"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
               <Sparkles size={16} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-12 h-12 bg-emerald-500 text-[#0b141a] rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50">
            <Send size={20} className="rotate-180"/>
          </button>
        </form>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #34d399; font-weight: 800; }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
}
