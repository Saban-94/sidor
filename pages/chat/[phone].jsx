'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Camera, ShoppingCart, Share2, Sparkles, Sun, Moon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; // וודא שהקובץ קיים בתיקיית public

export default function SabanAIAssistant() {
  const router = useRouter();
  const { phone } = router.query;

  // מצבים לממשק
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  
  const scrollRef = useRef(null);
  const audioRef = useRef(null);

  // פונקציית ברכה אוטומטית עם עליית הקוד
  useEffect(() => {
    setIsAppReady(true);
    if (messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "בוקר טוב" : hour < 18 ? "צהריים טובים" : "ערב טוב";
      
      setTimeout(() => {
        setMessages([{ 
          role: 'ai', 
          content: `${greeting}  כאן  של ח.סבן. המחסן מסונכרן אצלי במוח - מה נבנה היום? 🏗️` 
        }]);
      }, 600);
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const playMagicSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked"));
    }
  };

  const askAI = async (query, base64 = null) => {
    if (!query?.trim() && !base64) return;
    
    if (query) setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, imageBase64: base64, senderPhone: phone })
      });
      const data = await res.json();

      if (data.cart && data.cart.length > 0) {
        playMagicSound();
        setCartItems(prev => {
          const newItems = data.cart.map((item, idx) => ({
            ...item,
            id: Date.now() + idx,
            unit: item.unit || "יח'"
          }));
          return [...prev, ...newItems];
        });
        setShowCart(true);
      }

      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "המחסן לא זמין כרגע, תנסה שוב אחי." }]);
    } finally {
      setLoading(false);
    }
  };

  const themeClass = isDarkMode ? "bg-[#0b141a] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]";
  const bubbleAi = isDarkMode ? "bg-[#202c33] text-white" : "bg-white text-black shadow-sm";
  const bubbleUser = "bg-emerald-600 text-white shadow-md";

  return (
    <div className={`h-screen w-full flex flex-col transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head><title>ח.סבן | AI Expert</title></Head>
      
      {/* אלמנט אודיו חבוי */}
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Header משודרג */}
      <header className={`h-20 flex items-center justify-between px-6 z-50 border-b ${isDarkMode ? 'bg-[#202c33] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <Menu size={24} className="text-slate-400 cursor-pointer" />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-black/5 transition-colors">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
        
        <motion.img 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          src={SABAN_LOGO} className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg" 
        />

        <div className="relative cursor-pointer p-2" onClick={() => setShowCart(true)}>
          <ShoppingCart size={26} className="text-emerald-500" />
          <AnimatePresence>
            {cartItems.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute top-0 right-0 bg-red-500 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white"
              >
                {cartItems.length}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* אזור הצ'אט */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 custom-scrollbar">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl relative ${m.role === 'user' ? bubbleUser : bubbleAi}`}>
              {m.role === 'ai' && <Sparkles size={14} className="absolute -top-2 -right-2 text-emerald-400" />}
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[15px] leading-relaxed prose prose-invert">
                {m.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className={`p-4 rounded-2xl animate-pulse ${bubbleAi}`}>המוח סורק מלאי...</div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      {/* עגלה מקצועית */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]" 
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className={`fixed inset-y-0 right-0 w-[85%] max-w-sm z-[60] shadow-2xl p-6 flex flex-col ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-emerald-500 italic underline decoration-2">הסל של סבן</h2>
                <X onClick={() => setShowCart(false)} className="cursor-pointer text-slate-400" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {cartItems.map((item, idx) => (
                  <motion.div 
                    layout key={item.id}
                    className={`p-4 rounded-2xl border-r-4 border-emerald-500 flex justify-between items-center ${isDarkMode ? 'bg-[#202c33]' : 'bg-slate-50 shadow-sm'}`}
                  >
                    <div>
                      <p className="font-bold text-sm">{item.name.replace("(הזמנה מיוחדת)", "")}</p>
                      <p className="text-emerald-500 font-black text-lg">{item.qty} <span className="text-[10px] text-slate-400 uppercase">{item.unit}</span></p>
                    </div>
                    <Trash2 size={18} className="text-red-400/50 hover:text-red-500 cursor-pointer" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => {
                  const txt = cartItems.map(i => `• ${i.name}: ${i.qty} ${i.unit}`).join('\n');
                  window.open(`https://wa.me/972508860896?text=${encodeURIComponent("אהלן, הזמנה חדשה:\n" + txt)}`);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl mt-6 font-black text-white shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <Share2 size={22}/> שלח למחסן
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer שליחה */}
      <footer className={`fixed bottom-0 left-0 right-0 p-4 transition-colors duration-500 ${isDarkMode ? 'bg-[#0b141a] border-t border-white/5' : 'bg-[#f0f2f5] border-t border-black/5'}`}>
        <div className="flex items-center gap-3 max-w-4xl mx-auto bg-transparent">
          <button 
            onClick={() => document.getElementById('camInput').click()}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-[#2a3942] text-emerald-400' : 'bg-white text-emerald-600 shadow-md'}`}
          >
            <Camera size={26}/>
          </button>
          <input id="camInput" type="file" className="hidden" onChange={(e) => {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = (ev) => askAI(null, ev.target.result);
          }} />
          
          <input 
            value={input} onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && askAI(input)}
            placeholder="תאר לי מה הבעיה..." 
            className={`flex-1 rounded-2xl px-6 py-4 outline-none text-sm font-bold shadow-inner ${isDarkMode ? 'bg-[#2a3942] text-white' : 'bg-white text-black border border-black/5'}`}
          />
          
          <button 
            onClick={() => askAI(input)}
            className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
          >
            <Send size={24} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
