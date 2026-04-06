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
      setMessages([{ role: 'ai', content: "אהלן בוס! שלח צילום של הליקוי או תאר לי מה הבעיה, המלאי של המחסן מסונכרן אצלי." }]);
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
      if (data.cart) {
        setCartItems(data.cart.map((item, idx) => ({ id: idx, ...item, unit: item.unit || "יח'" })));
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
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-80 bg-[#111b21] z-50 p-5 shadow-2xl border-l border-white/10">
            <div className="flex justify-between mb-8"><h2 className="text-xl font-bold text-emerald-500">הזמנה מהמלאי</h2><X onClick={() => setShowCart(false)} className="cursor-pointer" /></div>
            <div className="space-y-4">
              {cartItems.map((item, idx) => (
                <div key={idx} className="bg-[#202c33] p-4 rounded-xl border-r-4 border-emerald-500">
                  <p className="font-bold text-sm text-white">{item.name}</p>
                  <p className="text-emerald-500 font-black mt-1">{item.qty} {item.unit}</p>
                </div>
              ))}
            </div>
            <button onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה חדשה:\n" + cartItems.map(i => i.name + ': ' + i.qty).join('\n'))}`)} className="w-full bg-emerald-600 py-4 rounded-2xl mt-8 font-bold flex items-center justify-center gap-2"><Share2 size={20}/> שלח למחסן</button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-[#0b141a] border-t border-white/5">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <button onClick={() => document.getElementById('fileInput').click()} className="w-12 h-12 bg-[#2a3942] rounded-full flex items-center justify-center text-emerald-500"><Camera size={24}/></button>
          <input id="fileInput" type="file" className="hidden" onChange={(e) => {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = (ev) => askAI(null, ev.target.result);
          }} />
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI(input)} placeholder="מה צריך לבנות?" className="flex-1 bg-[#2a3942] rounded-3xl px-4 py-3 outline-none text-sm font-bold" />
          <button onClick={() => askAI(input)} className="text-emerald-500"><Send size={24} className="rotate-180"/></button>
        </div>
      </footer>
    </div>
  );
}
