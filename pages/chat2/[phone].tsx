'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
// הוספתי כאן את Menu וכל השאר שיהיו מוצהרים
import { 
  Menu, 
  Send, 
  X, 
  Calculator, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Package, 
  Share2, 
  Sun, 
  Moon, 
  Search, 
  Settings, 
  Mail, 
  CalendarDays, 
  LayoutGrid, 
  MessageSquareShare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

export default function SabanOSChatV2() {
  const router = useRouter();
  const { phone } = router.query;

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: '1', role: 'ai', content: 'שלום בוס! רויטל כאן. איך עוזרים היום?', timestamp: new Date() }]);
    }
    audioRef.current = new Audio(MAGIC_SOUND);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, loading]);

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
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
      const data = await SabanAPI.sendMessage(targetPhone, query);
      setLoading(false);

      if (data && data.success) {
        if (data.orderPlaced) {
          playMagicSound();
          setCartItems(prev => [...prev, { id: Date.now().toString(), name: data.items || query, qty: "1" }]);
          setTimeout(() => setShowCart(true), 600);
        }

        setIsTyping(true);
        let i = 0;
        const words = data.reply.split(" ");
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
        }, 35);
      }
    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור למוח." }]);
    }
  };

  const themeClass = isDarkMode ? "bg-[#0b141a] text-white" : "bg-[#f0f2f5] text-[#111b21]";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>SabanOS | Chat V2</title>
      </Head>

      {/* Header עם ה-Menu המתוקן */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-[#202c33]/90 border-white/5' : 'bg-white/90 border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <Menu size={24} className="text-slate-400 cursor-pointer" />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-black/5">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Saban OS</span>
          <img src={SABAN_LOGO} className="w-8 h-8 rounded-full border border-emerald-500/30 object-cover" />
        </div>
        <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
          <ShoppingCart size={24} className="text-emerald-500" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white font-bold">
              {cartItems.length}
            </span>
          )}
        </div>
      </header>

      {/* הודעות */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] border border-white/5' : 'bg-[#005c4b] text-white'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] text-white">
              <span className="text-sm">{streamingText || "..."}</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* פוטר */}
      <footer className="p-4 bg-transparent z-10">
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex gap-3 max-w-5xl mx-auto items-center">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="איך עוזרים היום?" 
            className="flex-1 p-3.5 px-6 rounded-full bg-[#2a3942] text-white outline-none border border-transparent focus:border-emerald-500/50"
          />
          <button type="submit" className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center">
            <Send size={20} className="rotate-180" />
          </button>
        </form>
      </footer>
    </div>
  );
}
