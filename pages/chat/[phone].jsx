'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Camera, ShoppingCart, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

export default function SabanAIAssistant() {
  const router = useRouter();
  const { phone } = router.query;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'ai', content: "שלום שלח צילום של הליקוי או תאר לי מה הבעיה, המלאי של המחסן מסונכרן אצלי." }]);
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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

      // עדכון עגלת הקניות מהמלאי האמיתי אם ה-AI החזיר פריטים
if (data.cart && data.cart.length > 0) {
  setCartItems(prevCart => {
    // יצירת מערך חדש המשלב את מה שכבר היה בעגלה + המוצרים החדשים
    const newItems = data.cart.map((item, idx) => ({
      ...item,
      id: Date.now() + idx, // יצירת ID ייחודי כדי למנוע כפילויות ברינדור
      unit: item.unit || "יח'"
    }));
    
    return [...prevCart, ...newItems];
  });
  
  // פתיחת תפריט העגלה באופן אוטומטי כדי שהלקוח יראה את התוספת
  setShowCart(true); 
}
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור למחסן אחי." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0b141a] text-[#e9edef] overflow-hidden" dir="rtl">
      <header className="h-16 bg-[#202c33] flex items-center justify-between px-5 border-b border-white/5">
        <Menu size={22} className="text-slate-400" />
        <img src={SABAN_LOGO} className="w-10 h-10 rounded-full border-2 border-emerald-500/50" />
        <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
          <ShoppingCart size={22} className="text-emerald-500" />
          {cartItems.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">!</span>}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl ${m.role === 'user' ? 'bg-[#202c33]' : 'bg-[#005c4b]'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-500 animate-pulse">המוח בודק מלאי...</div>}
        <div ref={scrollRef} />
      </main>

<AnimatePresence>
  {showCart && (
    <>
      {/* Overlay רקע כהה לסגירה בלחיצה בחוץ */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setShowCart(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
      />
      
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#111b21] z-50 shadow-2xl border-l border-white/5 flex flex-col"
      >
        {/* Header עגלה */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#202c33]">
          <div>
            <h2 className="text-xl font-extrabold text-white">הסל שלי</h2>
            <p className="text-xs text-emerald-500 font-medium">{cartItems.length} מוצרים בהמתנה</p>
          </div>
          <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* רשימת פריטים */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {cartItems.length > 0 ? (
            cartItems.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                key={item.id || idx} 
                className="bg-[#202c33] p-4 rounded-2xl border-r-4 border-emerald-500 shadow-md group relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-[15px] text-white leading-tight">
                      {/* מסתיר את הכיתוב הטכני מהלקוח */}
                      {item.name.replace("(הזמנה מיוחדת)", "").trim()}
                    </p>
                    {item.name.includes("הזמנה מיוחדת") && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] rounded-md font-bold uppercase tracking-wider">
                        בטיפול אישי
                      </span>
                    )}
                  </div>
                  <div className="text-left mr-4">
                    <p className="text-emerald-500 font-black text-lg leading-none">{item.qty}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">{item.unit || 'יח\''}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm">הסל ריק, בוא נבנה משהו...</p>
            </div>
          )}
        </div>

        {/* Footer עגלה - כפתור שליחה */}
        <div className="p-6 bg-[#202c33] border-t border-white/5">
          <button 
            disabled={cartItems.length === 0}
            onClick={() => {
              const orderText = cartItems.map(i => `• ${i.name}: ${i.qty} ${i.unit}`).join('\n');
              window.open(`https://wa.me/972508860896?text=${encodeURIComponent("אהלן, הזמנה חדשה מה-AI:\n" + orderText)}`);
            }} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-white shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <Share2 size={20}/>
            <span>שלח הזמנה למחסן</span>
          </button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* פוטר הודעות משודרג */}
<footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#0b141a]/80 backdrop-blur-lg border-t border-white/5 z-40">
  <div className="flex items-center gap-3 max-w-4xl mx-auto">
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={() => document.getElementById('fileInput').click()} 
      className="w-12 h-12 bg-[#2a3942] hover:bg-[#374248] rounded-full flex items-center justify-center text-emerald-500 transition-colors shadow-lg"
    >
      <Camera size={22}/>
    </motion.button>
    
    <input id="fileInput" type="file" className="hidden" onChange={(e) => {
      const reader = new FileReader();
      if (e.target.files?.[0]) {
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = (ev) => askAI(null, ev.target.result);
      }
    }} />
    
    <div className="flex-1 relative flex items-center">
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)} 
        onKeyDown={e => e.key === 'Enter' && askAI(input)} 
        placeholder="מה צריך לבנות היום?" 
        className="w-full bg-[#2a3942] text-white rounded-2xl px-5 py-3.5 outline-none text-sm font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" 
      />
    </div>

    <motion.button 
      whileTap={{ scale: 0.9, rotate: -10 }}
      onClick={() => askAI(input)} 
      className="w-12 h-12 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
    >
      <Send size={20} className="rotate-180 ml-0.5" />
    </motion.button>
  </div>
</footer>
