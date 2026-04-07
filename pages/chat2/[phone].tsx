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
    
    // הצגת הודעת משתמש (טקסט או חיווי תמונה)
    if (query) {
      setMessages(prev => [...prev, { role: 'user', content: query }]);
    } else if (base64) {
      setMessages(prev => [...prev, { role: 'user', content: "📸 שלחתי לך תמונה, תגיד לי מה אתה רואה ואיך להזמין..." }]);
    }

    setLoading(true);
    setInput('');

    try {
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'admin');
      
      // שליחה למוח עם תמיכה בתמונה (Base64)
      const data = await SabanAPI.sendMessage(targetPhone, query || "ניתוח תמונה מצורפת", base64);
      
      setLoading(false);

      if (!data || !data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data?.error || "משהו השתבש בחיבור, נסה שוב אחי." }]);
        return;
      }

      // ניהול סל קניות מקצועי - הזרקת נתונים מה-AI לממשק
      if (data.orderPlaced) {
        playMagicSound();
        const newProduct = {
          id: Date.now(),
          name: data.items || "מוצר מהזמנה חכמה",
          qty: "1", // כמות ברירת מחדל אם לא זוהתה אחרת
          unit: "יח'",
          aiVerified: true
        };
        setCartItems(prev => [...prev, newProduct]);
        setTimeout(() => setShowCart(true), 500); // פתיחה חלקה של הסל
      }

      // אפקט הקלדה יוקרתי
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
      }, 35);

    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "אחי, יש תקלה בתקשורת. תבדוק אינטרנט." }]);
    }
  };

  const themeClass = isDarkMode ? "bg-[#0b141a] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>SabanOS | AI Assistant</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              src={SABAN_LOGO} 
              className="w-28 h-28 rounded-3xl shadow-2xl shadow-emerald-500/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Glassmorphism UI */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-[#202c33]/90 border-white/5' : 'bg-white/90 shadow-sm border-black/5'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"><Menu size={20} className="text-slate-400" /></div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-white/5 transition-all active:scale-90">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Saban OS</span>
          <img src={SABAN_LOGO} className="w-8 h-8 rounded-full border-2 border-emerald-500/30 object-cover" />
        </div>

        <div className="relative p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all active:scale-90" onClick={() => setShowCart(true)}>
          <ShoppingCart size={22} className="text-emerald-500" />
          {cartItems.length > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-0 right-0 bg-red-500 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white font-black border-2 border-[#202c33]">
              {cartItems.length}
            </motion.span>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        <div className="fixed inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center opacity-[0.02] pointer-events-none" />
        
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[88%] p-3.5 px-4 rounded-2xl shadow-md leading-relaxed ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none border border-white/5' : 'bg-[#005c4b] text-white rounded-tr-none shadow-emerald-900/20'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[14px] prose prose-invert prose-p:leading-relaxed prose-strong:text-emerald-300">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3.5 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-md flex items-center gap-2">
              <span className="text-[14px] font-medium">{streamingText || "סבן AI חושב..."}</span>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* Cart Drawer - Modern Slide */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[55]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className={`fixed inset-y-0 right-0 w-full max-w-[340px] z-[60] p-6 flex flex-col shadow-2xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                  <h2 className="text-2xl font-black text-white italic tracking-tighter">הסל שלי</h2>
                </div>
                <X onClick={() => setShowCart(false)} className="cursor-pointer text-slate-500 hover:text-white transition-colors" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                    <ShoppingCart size={48} strokeWidth={1} />
                    <p className="text-sm">הסל ריק אחי, בוא נזמין משהו</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={item.id} className={`p-4 rounded-2xl border border-white/5 flex justify-between items-center group transition-all ${isDarkMode ? 'bg-[#202c33] hover:bg-[#2a3942]' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        {item.aiVerified && <CheckCircle2 size={16} className="text-emerald-500" />}
                        <div>
                          <p className="font-bold text-[13px] text-white line-clamp-1">{item.name}</p>
                          <p className="text-emerald-500 font-black text-xs mt-0.5">{item.qty} {item.unit}</p>
                        </div>
                      </div>
                      <Trash2 size={16} className="text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer transition-all" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                    </motion.div>
                  ))
                )}
              </div>

              <button 
                disabled={cartItems.length === 0}
                onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה חדשה דרך SabanOS AI:\n" + cartItems.map(i => `✅ ${i.name} - כמות: ${i.qty}`).join('\n'))}`)} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:grayscale py-4 rounded-2xl mt-6 font-bold text-white flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                <Share2 size={18}/> שלח הזמנה לוואטסאפ
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating UI Elements */}
      <AnimatePresence>
        {selectedProductSku && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#111b21] w-full max-w-lg h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
              <div className="p-5 bg-[#202c33] flex justify-between items-center border-b border-white/5">
                <span className="text-emerald-400 font-bold flex items-center gap-2"><Sparkles size={18}/> כרטיס מוצר חכם</span>
                <X size={22} className="cursor-pointer text-slate-400 hover:text-white" onClick={() => setSelectedProductSku(null)} />
              </div>
              <iframe src={`/product/${selectedProductSku}?embed=true`} className="flex-1 w-full bg-white border-none" />
              <button onClick={() => setSelectedProductSku(null)} className="m-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">חזרה לצ'אט המהיר</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Interactive Input */}
      <footer className={`p-4 pb-8 z-10 transition-colors ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 max-w-5xl mx-auto">
          {QUICK_QUERIES.map((q, i) => (
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} key={i} onClick={() => askAI(q.label)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[12px] font-bold border transition-all shadow-sm flex items-center gap-2 ${isDarkMode ? 'bg-[#202c33] border-white/5 text-white' : 'bg-white border-black/5 text-slate-700'}`}>
              <span>{q.icon}</span>{q.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-3 max-w-5xl mx-auto bg-[#2a3942] p-2 rounded-3xl shadow-xl border border-white/5">
          <motion.button 
            whileTap={{ scale: 0.85 }} 
            onClick={() => document.getElementById('camInput').click()} 
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Camera size={22}/>
          </motion.button>
          <input id="camInput" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (ev) => askAI(null, ev.target.result);
          }} />
          
          <input 
            value={input} onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && askAI(input)}
            placeholder="רשום הודעה או צלם מוצר..." 
            className="flex-1 bg-transparent outline-none text-sm font-medium text-white px-2 placeholder:text-slate-500"
          />
          
          <button 
            onClick={() => askAI(input)} 
            disabled={loading || isTyping} 
            className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-500 disabled:opacity-30 disabled:grayscale transition-all active:scale-90"
          >
            <Send size={20} className="rotate-180" />
          </button>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #34d399; font-weight: 800; }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
}
