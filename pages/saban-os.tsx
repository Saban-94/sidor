'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, ShoppingCart, Share2, Sparkles, Sun, Moon, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

// אתחול Supabase מול הטבלאות שלך
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

export default function SabanOSUnifiedChat() {
  const router = useRouter();
  const { phone } = router.query;

  // מצבים לממשק (כולל מצב בהיר/כהה)
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // טעינת מצב כהה/בהיר מהגדרות המשתמש
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    if (messages.length === 0) {
      setMessages([{ 
        role: 'ai', 
        content: 'אהלן אחי! המוח של ח.סבן מחובר לכל המערכות. איך אני יכול לעזור היום?' 
      }]);
    }
    return () => clearTimeout(timer);
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

  const askAI = async (query: string | null, base64: string | null = null) => {
    if ((!query?.trim() && !base64) || loading || isTyping) return;
    
    // הצגת מה שרשם המשתמש בצ'אט
    const userDisplayContent = query || (base64 ? "📸 שלחתי תמונה לניתוח..." : "");
    setMessages(prev => [...prev, { role: 'user', content: userDisplayContent }]);
    
    setLoading(true);
    setInput('');

    try {
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
      
      // חיבור ל-API המאוחד (מול Gemini ו-Supabase)
      const data = await SabanAPI.sendMessage(targetPhone, query || "ניתוח תמונה", base64);
      
      setLoading(false);

      if (!data || !data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data?.reply || "בוס, יש תקלה בחיבור למוח." }]);
        return;
      }

      // --- זיהוי הזמנה והפעלה לסל ---
      if (data.orderPlaced) {
        playMagicSound(); // הפעלת צלצול הקסם
        const newItem = {
          id: Date.now(),
          name: data.items || "מוצר מהזמנה",
          qty: "נקלט",
          verified: true
        };
        setCartItems(prev => [...prev, newItem]);
        setTimeout(() => setShowCart(true), 500); // פתיחה חלקה של הסל
      }

      // אפקט הקלדה לתשובה
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

    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "שגיאת רשת, המוח לא מגיב." }]);
    }
  };

  // עיצוב דינמי למניעת טקסט שקוף
  const themeBg = isDarkMode ? "bg-[#0b141a]" : "bg-[#f0f2f5]";
  const themeText = isDarkMode ? "text-white" : "text-[#111b21]";
  const bubbleUser = isDarkMode ? "bg-[#202c33] border-white/5" : "bg-white border-black/10 text-black";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeBg} ${themeText}`} dir="rtl">
      <Head>
        <title>SabanOS | Unified Brain</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Header - Glassmorphism */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-[#202c33]/90 border-white/5' : 'bg-white/90 border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-white/10 transition-all active:scale-90">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-500">SABAN OS</span>
          <img src={SABAN_LOGO} className="w-8 h-8 rounded-full border border-emerald-500/30" />
        </div>

        <div className="relative p-2 cursor-pointer active:scale-90" onClick={() => setShowCart(true)}>
          <ShoppingCart size={22} className="text-emerald-500" />
          {cartItems.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white font-black border border-[#202c33]">
              {cartItems.length}
            </span>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        <div className="fixed inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center opacity-[0.02] pointer-events-none" />
        
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3.5 px-4 rounded-2xl shadow-md border ${m.role === 'user' ? bubbleUser : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3.5 px-4 rounded-2xl bg-[#005c4b] text-white rounded-tr-none shadow-md">
              <span className="text-sm">{streamingText || "סבן AI חושב..."}</span>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block w-1.5 h-1.5 bg-emerald-300 rounded-full mr-2" />
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
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed inset-y-0 right-0 w-[80%] max-w-sm z-[60] p-6 flex flex-col shadow-2xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-emerald-500 italic">הסל של סבן</h2>
                <X onClick={() => setShowCart(false)} className="cursor-pointer text-slate-500" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className={`p-4 rounded-2xl border-r-4 border-emerald-500 flex justify-between items-center ${isDarkMode ? 'bg-[#202c33]' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <div>
                        <p className="font-bold text-xs text-white">{item.name}</p>
                        <p className="text-emerald-500 font-black text-[10px]">{item.qty}</p>
                      </div>
                    </div>
                    <Trash2 size={16} className="text-red-400/50 cursor-pointer" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                  </div>
                ))}
              </div>
              <button onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה מ-SabanOS AI:\n" + cartItems.map(i => `• ${i.name}`).join('\n'))}`)} className="w-full bg-emerald-600 py-4 rounded-2xl mt-6 font-bold text-white flex items-center justify-center gap-2">
                <Share2 size={18}/> שלח הזמנה
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer & Camera */}
      <footer className="p-4 pb-10 z-10">
        <div className="flex items-center gap-3 max-w-5xl mx-auto bg-[#2a3942] p-2 rounded-2xl shadow-xl">
          <button onClick={() => document.getElementById('cam')?.click()} className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
            <Camera size={24}/>
          </button>
          <input id="cam" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = (ev) => askAI(null, ev.target?.result as string);
            }
          }} />
          <input 
            value={input} onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && askAI(input)}
            placeholder="איך אפשר לעזור היום בוס?" 
            className="flex-1 bg-transparent outline-none text-white text-sm px-2"
          />
          <button onClick={() => askAI(input)} className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
            <Send size={20} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
