'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, ShoppingCart, Share2, Sparkles, Sun, Moon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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
  const router = useRouter();
  const { phone } = router.query;

  // מצבים לממשק
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProductSku, setSelectedProductSku] = useState(null);
  
  const scrollRef = useRef(null);
  const audioRef = useRef(null);

  // 1. Splash & Greeting
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    if (messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "בוקר טוב" : hour < 18 ? "צהריים טובים" : "ערב טוב";
      setMessages([{ role: 'ai', content: `${greeting} אחי! כאן המומחה של ח.סבן. מה נבנה היום? המחסן מסונכרן אצלי.` }]);
    }
    return () => clearTimeout(timer);
  }, []);

  // 2. קליטת הודעות מהמחשבון (Iframe)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'ADD_TO_ORDER') {
        const { productName, quantity, sku } = event.data;
        setSelectedProductSku(null); 
        askAI(`אני רוצה להזמין ${quantity} יחידות של ${productName} (מק"ט ${sku})`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); 

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText, loading]);

  const playMagicSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const askAI = async (query, base64 = null) => {
    if ((!query?.trim() && !base64) || loading || isTyping) return;
    
    if (query) setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, imageBase64: base64, senderPhone: phone || 'admin' })
      });
      const data = await res.json();
      setLoading(false);

      // עדכון עגלה עם צליל קסם
      if (data.cart && data.cart.length > 0) {
        playMagicSound();
        setCartItems(prev => [...prev, ...data.cart.map((item, idx) => ({ ...item, id: Date.now() + idx }))]);
        setShowCart(true);
      }

      // אפקט הקלדה
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
          if (data.reply.includes("SHOW_PRODUCT_CARD:")) {
             const sku = data.reply.split("SHOW_PRODUCT_CARD:")[1].split(/\s/)[0].trim();
             setSelectedProductSku(sku);
          }
        }
      }, 40);

    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "משהו השתבש בחיבור, נסה שוב אחי." }]);
    }
  };

  const themeClass = isDarkMode ? "bg-[#0b141a] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>ח.סבן AI | Expert</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
      </Head>
      
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <img src={SABAN_LOGO} className="w-24 h-24 rounded-2xl animate-pulse"/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b ${isDarkMode ? 'bg-[#202c33] border-white/5' : 'bg-white shadow-sm border-black/5'}`}>
        <div className="flex items-center gap-3">
          <Menu size={22} className="text-slate-400" />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-black/5">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>

        <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border border-emerald-500 shadow-md" />

        <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
          <ShoppingCart size={24} className="text-emerald-500" />
          {cartItems.length > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold">
              {cartItems.length}
            </motion.span>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main
        className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col justify-end items-center py-[55px] px-[1px]"
        style={{
          backgroundImage: 'url(https://cdn.builder.io/api/v1/image/assets%2Fcabd8c0810ce4a7ba54438e9d28391d7%2F4daee3e0ba8b4b97ab75588ab91cb61d)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          fontFamily: 'Helvetica, sans-serif',
          lineHeight: '44px'
        }}
      >
        <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center opacity-[0.03] pointer-events-none" />
        
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, x: m.role === 'user' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-sm">
              <span className="text-sm">{streamingText || "המוח מעבד..."}</span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-1 h-4 bg-emerald-300 ml-1 translate-y-1" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      {/* עגלה מקצועית */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed inset-y-0 right-0 w-[85%] max-w-sm z-[60] p-6 flex flex-col shadow-2xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8 border-b pb-4 border-white/5">
                <h2 className="text-xl font-black text-emerald-500 italic">הסל של סבן</h2>
                <X onClick={() => setShowCart(false)} className="cursor-pointer text-slate-400" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {cartItems.map((item, idx) => (
                  <div key={item.id} className={`p-4 rounded-2xl border-r-4 border-emerald-500 flex justify-between items-center ${isDarkMode ? 'bg-[#202c33]' : 'bg-slate-50'}`}>
                    <div>
                      <p className="font-bold text-sm text-white">{item.name.replace("(הזמנה מיוחדת)", "")}</p>
                      <p className="text-emerald-500 font-black mt-1">{item.qty} {item.unit || 'יח\''}</p>
                    </div>
                    <Trash2 size={18} className="text-red-400/50 cursor-pointer" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                  </div>
                ))}
              </div>
              <button onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה חדשה מח.סבן AI:\n" + cartItems.map(i => `• ${i.name}: ${i.qty}`).join('\n'))}`)} className="w-full bg-emerald-600 py-4 rounded-2xl mt-6 font-bold text-white flex items-center justify-center gap-2"><Share2 size={18}/> שלח הזמנה</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* מחשבון צף */}
      <AnimatePresence>
        {selectedProductSku && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111b21] w-full max-w-lg h-[80vh] rounded-3xl overflow-hidden flex flex-col">
              <div className="p-4 bg-[#202c33] flex justify-between items-center">
                <span className="text-emerald-400 font-bold flex items-center gap-2"><Calculator size={18}/> מחשבון טכני</span>
                <X size={20} className="cursor-pointer" onClick={() => setSelectedProductSku(null)} />
              </div>
              <iframe src={`/product/${selectedProductSku}?embed=true`} className="flex-1 w-full bg-white border-none" />
              <button onClick={() => setSelectedProductSku(null)} className="m-4 py-3 bg-emerald-600 text-white font-bold rounded-xl">חזור לצ'אט</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`p-4 z-10 transition-colors ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${isDarkMode ? 'bg-[#202c33] border-black text-white' : 'bg-white border-black shadow-sm'}`}>
              <span className={q.color + " ml-2"}>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-5xl mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => document.getElementById('camInput').click()} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-[#2a3942] text-emerald-400' : 'bg-white text-emerald-600'}`}>
            <Camera size={24}/>
          </motion.button>
          <input id="camInput" type="file" className="hidden" onChange={(e) => {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = (ev) => askAI(null, ev.target.result);
          }} />
          
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAI(input)}
            placeholder="איך עוזרים היום?"
            className={`flex-1 p-3.5 px-6 rounded-full outline-none text-sm font-semibold shadow-inner transition-all ${isDarkMode ? 'bg-[#2a3942] text-white focus:ring-1 focus:ring-emerald-500' : 'bg-white text-black border border-black/5'}`}
          />
          
          <button onClick={() => askAI(input)} disabled={loading || isTyping} className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-500 disabled:opacity-50">
            <Send size={20} className="rotate-180" />
          </button>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #34d399; font-weight: 800; }
        .prose p { font-weight: 600; text-align: right; }
        .prose u { text-decoration: underline; }
      `}</style>
    </div>
  );
}
