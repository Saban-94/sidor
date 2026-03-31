'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Send, Bot, Calendar, RefreshCcw, User, MapPin, Clock, MessageSquare, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const STATUS_MAP: any = {
  'approved': { label: 'מאושר', color: 'bg-emerald-500' },
  'pending': { label: 'ממתין להעמסה', color: 'bg-amber-500 shadow-amber-500/20' },
  'rejected': { label: 'נדחתה', color: 'bg-red-500' }
};

const QUICK_QUERIES = [
  "כמה הזמנות יש היום?", "מה מצב המכולות בשטח?", "האם היו העברות היום?",
  "כמה הזמנות סופקו?", "מי הנהג הפעיל ביותר היום?", "סטטוס שארק 30",
  "חיפוש לפי שם לקוח", "דוח יומי מקוצר", "הזמנות ללא נהג", "מכולות שצריכות פינוי"
];

// פונקציית עזר לחישוב זמן נותר
const getCountdown = (orderTime: string) => {
  if (!orderTime) return null;
  const [hours, minutes] = orderTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0);
  
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "בביצוע";
  
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  return `${h > 0 ? h + 'ש ו-' : ''}${m} דק'`;
};

export default function SabanAIAssistant() {
  const [activeView, setActiveView] = useState<'chat' | 'live'>('chat');
  const [isOpen, setIsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Splash Screen לכחצי שניה
    const timer = setTimeout(() => setShowSplash(false), 600);
    
    fetchLiveOrders();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000); // עדכון טיימר כל דקה
    
    const channel = supabase.channel('live-sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchLiveOrders).subscribe();
    
    return () => { clearTimeout(timer); clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  const fetchLiveOrders = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted');
    const { data: c } = await supabase.from('container_management').select('*').eq('start_date', today).neq('status', 'deleted');
    setOrders([...(o || []), ...(c || [])].sort((a,b) => (a.order_time || '').localeCompare(b.order_time || '')));
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (e) { setMessages(prev => [...prev, { role: 'ai', content: "בוס, תקלה בחיבור." }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-screen bg-[#0B0F1A] text-white flex flex-col font-sans overflow-hidden" dir="rtl">
      <Head><title>Saban AI Companion</title></Head>

      {/* Splash Screen - לוגו עולה */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B0F1A] z-[100] flex items-center justify-center"
          >
            <motion.img 
              initial={{ scale: 0.5, y: 0 }} animate={{ scale: 1, y: -20 }}
              src="https://ibb.co/yn0wjcrD" 
              className="w-32 h-32 object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-16 flex items-center justify-between px-6 bg-[#111827] border-b border-white/5 z-50 shadow-xl">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2"><Menu size={28} /></button>
        <div className="flex items-center gap-2">
            <motion.img src="https://ibb.co/yn0wjcrD" className="w-8 h-8 object-contain" />
            <span className="font-black italic text-xl text-emerald-500 tracking-tighter uppercase">SABAN {activeView === 'chat' ? 'AI' : 'LIVE'}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black border border-emerald-500/20 shadow-lg">
          {orders.length}
        </div>
      </header>

      {/* Side Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-[85%] bg-[#0B0F1A] z-[70] p-8 shadow-2xl border-l border-white/5">
              <div className="flex justify-between items-center mb-16">
                  <span className="font-black text-xl italic tracking-tighter">MENU</span>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <nav className="space-y-4">
                <button onClick={() => { setActiveView('chat'); setIsOpen(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 font-black text-lg ${activeView === 'chat' ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20 shadow-lg' : 'bg-white/5 text-slate-400'}`}>
                    <MessageSquare size={24}/> AI ANALYST
                </button>
                <button onClick={() => { setActiveView('live'); setIsOpen(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 font-black text-lg ${activeView === 'live' ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20 shadow-lg' : 'bg-white/5 text-slate-400'}`}>
                    <Calendar size={24}/> לוח משימות LIVE
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
        {activeView === 'chat' ? (
          /* תצוגת צ'אט */
          <div className="space-y-4">
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-5 rounded-[2rem] font-black shadow-xl ${m.role === 'user' ? 'bg-[#1E293B] border border-white/5 text-white' : 'bg-emerald-500 text-slate-900'}`}>{m.content}</div>
              </motion.div>
            ))}
            {loading && <RefreshCcw className="animate-spin text-emerald-500 mx-auto" />}
          </div>
        ) : (
          /* תצוגת LIVE עם טיימר והבהוב */
          <div className="grid grid-cols-1 gap-5">
            {orders.map((order) => {
              const countdown = getCountdown(order.order_time);
              const isUrgent = countdown && !countdown.includes('ש') && parseInt(countdown) < 30; // הבהוב אם נשאר פחות מ-30 דק'

              return (
                <div key={order.id} className={`p-6 rounded-[3rem] border border-white/5 shadow-2xl bg-[#161B2C] relative overflow-hidden transition-all ${isUrgent ? 'animate-pulse border-amber-500/40 shadow-amber-500/10' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-[10px] opacity-40">#{order.order_number || 'N/A'}</span>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black text-white shadow-lg ${STATUS_MAP[order.status]?.color || 'bg-slate-600'}`}>{STATUS_MAP[order.status]?.label || order.status}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-1 tracking-tighter">{order.client_name || order.client_info}</h3>
                  <div className="flex items-center gap-2 text-xs opacity-60 mb-6 font-bold"><MapPin size={14} className="text-emerald-500"/> {order.delivery_address || order.location}</div>
                  
                  <div className="flex justify-between items-center bg-black/30 p-5 rounded-[2rem]">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-emerald-400 font-mono text-2xl font-black"><Clock size={20}/> {order.order_time}</div>
                        {countdown && <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase mt-1 animate-bounce"><Timer size={12}/> בעוד {countdown}</div>}
                    </div>
                    <span className="text-xs font-black opacity-80">{order.contractor_name || order.driver_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Chat Input + Quick Queries */}
      {activeView === 'chat' && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B0F1A] to-transparent z-40">
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} onClick={() => askAI(q)} className="whitespace-nowrap px-6 py-3 bg-[#111827] border border-white/10 rounded-full text-[10px] font-black hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-xl italic">{q}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative max-w-2xl mx-auto">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל את המוח האנליטי..." className="w-full p-6 pr-14 rounded-[2.5rem] bg-[#111827] border border-white/10 text-white font-bold outline-none focus:border-emerald-500 shadow-2xl" />
            <button type="submit" className="absolute left-3 top-3 w-12 h-12 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><Send size={20} className="rotate-180" /></button>
          </form>
        </footer>
      )}
    </div>
  );
}
