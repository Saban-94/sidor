'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { 
  Menu, 
  Send, 
  X, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  Sun, 
  Moon, 
  Package 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

const QUICK_ACTIONS = [
  { label: 'הזמנת חומרים', icon: '🏗️' },
  { label: 'בדיקת מלאי', icon: '📦' },
  { label: 'מצב חשבון', icon: '💰' }
];

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

const askAI = async (query: string, imageBase64: string | null = null) => {
    if ((!query.trim() && !imageBase64) || loading || isTyping) return;
    
    // הצגת הודעת המשתמש
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: query || "📸 ניתוח תמונה...", 
      timestamp: new Date() 
    }]);
    
    setLoading(true);
    setInput('');

    try {
      // פנייה למוח החדש ב-API הפנימי
      const res = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query, 
          imageBase64: imageBase64 // שליחת תמונה אם קיימת
        })
      });

      const data = await res.json();
      setLoading(false);

      if (data && data.reply) {
        // 1. בדיקה אם המוח הכניס מוצרים לסל (חישוב כמויות או זיהוי תמונה)
        if (data.cart && data.cart.length > 0) {
          playMagicSound();
          const newItems = data.cart.map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: `${item.name} (${item.qty} ${item.unit || 'יח'})`,
            qty: item.qty
          }));
          setCartItems(prev => [...prev, ...newItems]);
          
          // פתיחת הסל אוטומטית אם נוספו פריטים
          setTimeout(() => setShowCart(true), 1200);
        }

        // 2. אפקט הקלדה לתשובה המקצועית
        setIsTyping(true);
        let i = 0;
        const words = data.reply.split(" ");
        setStreamingText("");
        
        const interval = setInterval(() => {
          if (i < words.length) {
            setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
            i++;
          } else {
            clearInterval(interval);
            setMessages(prev => [...prev, { 
              role: 'ai', 
              content: data.reply, 
              timestamp: new Date() 
            }]);
            setStreamingText("");
            setIsTyping(false);
          }
        }, 30);
      }
    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, המוח עמוס כרגע. נסה שוב בעוד רגע." }]);
    }
  };
  
  const themeClass = isDarkMode ? "bg-[#0b141a] text-white" : "bg-[#f0f2f5] text-[#111b21]";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>SabanOS | צ'אט ניהול</title>
      </Head>

      {/* Header */}
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
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#202c33]">
              {cartItems.length}
            </span>
          )}
        </div>
      </header>

      {/* הודעות צ'אט */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] border border-white/5' : 'bg-[#005c4b] text-white'}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert leading-relaxed">
                {m.content}
              </ReactMarkdown>
            </motion.div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] text-white flex items-center gap-2">
              <span className="text-sm">{streamingText || "רויטל חושבת..."}</span>
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* סל קניות מונפש */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-[80%] max-w-sm z-[60] p-6 flex flex-col bg-[#111b21] shadow-2xl border-r border-white/10">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-black text-emerald-500 italic flex items-center gap-2"><Package /> הסל של סבן</h2>
                <X onClick={() => setShowCart(false)} className="cursor-pointer text-slate-400" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="p-4 bg-[#202c33] rounded-xl flex justify-between items-center border-r-4 border-emerald-500 shadow-inner">
                    <span className="text-sm font-bold text-white">{item.name}</span>
                    <Trash2 size={16} className="text-red-400/50 cursor-pointer" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה מ-SabanOS:\n" + cartItems.map(i => `• ${i.name}`).join('\n'))}`)}
                className="w-full bg-emerald-600 py-4 rounded-2xl mt-auto font-black text-white flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <Share2 size={18} /> שלח הודעה לראמי
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* פוטר עם כפתורי קיצור */}
      <footer className="p-4 bg-transparent z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-2 max-w-5xl mx-auto">
          {QUICK_ACTIONS.map((action, i) => (
            <button 
              key={i} 
              onClick={() => askAI(action.label)}
              className="whitespace-nowrap px-4 py-2 bg-[#2a3942] hover:bg-[#32444f] rounded-full text-xs font-bold text-white border border-white/5 transition-all flex items-center gap-2"
            >
              <span>{action.icon}</span> {action.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex gap-3 max-w-5xl mx-auto items-center">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="איך עוזרים היום בוס?" 
            className="flex-1 p-3.5 px-6 rounded-full bg-[#2a3942] text-white outline-none border border-transparent focus:border-emerald-500/50 shadow-inner"
          />
          <button type="submit" disabled={loading} className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50">
            <Send size={20} className="rotate-180" />
          </button>
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
