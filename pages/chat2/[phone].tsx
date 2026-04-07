'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, ShoppingCart, Share2, Sparkles, Sun, Moon, Trash2, CheckCircle2, Package } from 'lucide-react';
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

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    if (messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "בוקר טוב" : hour < 18 ? "צהריים טובים" : "ערב טוב";
      setMessages([{ role: 'ai', content: `${greeting} אחי! כאן המומחה של ח.סבן. מה נבנה היום? המחסן מסונכרן אצלי.` }]);
    }
    return () => clearTimeout(timer);
  }, []);

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
    
    if (query) {
      setMessages(prev => [...prev, { role: 'user', content: query }]);
    } else if (base64) {
      setMessages(prev => [...prev, { role: 'user', content: "📸 שולח תמונה לבדיקה..." }]);
    }

    setLoading(true);
    setInput('');

    try {
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'admin');
      
      // שליחה למוח - מעביר גם טקסט וגם תמונה אם קיימת
      const data = await SabanAPI.sendMessage(targetPhone, query || "נתח את התמונה הזו עבורי", base64);
      
      setLoading(false);

      if (!data || !data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data?.error || "אחי, יש תקלה בחיבור. נסה שוב." }]);
        return;
      }

      // הזרקת מוצרים לסל - תיקון שמות וצבעים
      if (data.orderPlaced) {
        playMagicSound();
        const newProduct = {
          id: Date.now(),
          name: data.items || "מוצר מהזמנה",
          qty: "נקלט",
          unit: "",
          isAiGenerated: true
        };
        setCartItems(prev => [...prev, newProduct]);
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
          
          if (data.reply.includes("SHOW_PRODUCT_CARD:")) {
             const sku = data.reply.split("SHOW_PRODUCT_CARD:")[1].split(/\s/)[0].trim();
             setSelectedProductSku(sku);
          }
        }
      }, 30);

    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "שגיאת תקשורת מול ה-API." }]);
    }
  };

  const themeClass = isDarkMode ? "bg-[#0b141a] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]";

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>SabanOS | המומחה של סבן</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Header - Fixed Contrast */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b ${isDarkMode ? 'bg-[#202c33] border-white/10' : 'bg-white border-black/10'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/5 rounded-xl">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-emerald-500 uppercase tracking-tighter">Saban AI</span>
          <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border-2 border-emerald-500" />
        </div>

        <div className="relative cursor-pointer p-2" onClick={() => setShowCart(true)}>
          <ShoppingCart size={24} className="text-emerald-500" />
          {cartItems.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#202c33]">
              {cartItems.length}
            </span>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-fixed bg-center bg-no-repeat opacity-100">
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none border border-white/5' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm leading-relaxed prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-lg">
              <span className="text-sm font-bold text-emerald-100">{streamingText || "סבן חושב..."}</span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-1 h-4 bg-emerald-300 ml-1" />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* Cart Drawer - High Contrast Fixed */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/80 z-[55] backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed inset-y-0 right-0 w-[90%] max-w-sm z-[60] p-6 flex flex-col ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8 border-b pb-4 border-white/10">
                <h2 className="text-2xl font-black text-emerald-500 italic">הסל שלי</h2>
                <X onClick={() => setShowCart(false)} className="text-white cursor-pointer" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-[#202c33] border border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Package size={20} className="text-emerald-500" />
                      <div>
                        {/* טקסט לבן חזק - אין שקיפות */}
                        <p className="font-bold text-sm text-white">{item.name}</p>
                        <p className="text-emerald-400 font-black text-xs mt-1">{item.qty}</p>
                      </div>
                    </div>
                    <Trash2 size={18} className="text-red-500 cursor-pointer" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה מ-SabanOS:\n" + cartItems.map(i => `• ${i.name}`).join('\n'))}`)} 
                className="w-full bg-emerald-600 py-4 rounded-2xl mt-6 font-black text-white flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20"
              >
                <Share2 size={20}/> אשר ושלח לוואטסאפ
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer & Input */}
      <footer className={`p-4 z-10 ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 max-w-5xl mx-auto">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-black bg-[#202c33] text-white border border-white/5">
              <span className="ml-2">{q.icon}</span>{q.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 max-w-5xl mx-auto bg-[#2a3942] p-2 rounded-2xl shadow-2xl">
          <button onClick={() => document.getElementById('camInput').click()} className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Camera size={24}/>
          </button>
          <input id="camInput" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = (ev) => askAI(null, ev.target.result);
          }} />
          
          <input 
            value={input} onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && askAI(input)}
            placeholder="איך אפשר לעזור אחי?" 
            className="flex-1 bg-transparent text-white outline-none font-bold placeholder:text-slate-500"
          />
          
          <button onClick={() => askAI(input)} disabled={loading || isTyping} className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-500">
            <Send size={22} className="rotate-180" />
          </button>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
