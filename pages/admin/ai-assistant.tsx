'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Send, Bot, Calendar, RefreshCcw, User, MapPin, Clock, MessageSquare, Timer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// הלוגו החדש של סבן
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

// צבעי WhatsApp Dark Mode
const WA_BG = "bg-[#111b21]"; // רקע ראשי
const WA_PANEL = "bg-[#202c33]"; // פאנל/כרטיסים
const WA_GREEN = "bg-[#00a884]"; // כפתורים וסטטוס מאושר
const WA_TEXT = "text-[#e9edef]"; // טקסט בהיר
const WA_SUB = "text-[#8696a0]"; // טקסט משני/אפור

const STATUS_MAP: any = {
  'approved': { label: 'מאושר', color: 'bg-[#00a884]' },
  'pending': { label: 'ממתין להעמסה', color: 'bg-[#f1c40f] text-[#111b21]' },
  'rejected': { label: 'נדחתה', color: 'bg-[#ea0038]' }
};

const QUICK_QUERIES = [
  "כמה הזמנות יש היום?", "מצב מכולות", "העברות היום", "כמה סופקו?", 
  "סטטוס שארק 30", "חיפוש לקוח", "דוח יומי", "מכולות לפינוי"
];

const getCountdown = (orderTime: string) => {
  if (!orderTime) return null;
  const [h, m] = orderTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "בביצוע";
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours > 0 ? hours + 'ש ' : ''}${mins} דק'`;
};

export default function SabanAIAssistant() {
  const [activeView, setActiveView] = useState<'chat' | 'live'>('chat');
  const [isOpen, setIsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 60000);
    return () => { clearTimeout(timer); clearInterval(interval); };
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
    } catch (e) { setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור למערכת." }]); }
    finally { setLoading(false); }
  };

  return (
    <div className={`h-screen ${WA_BG} ${WA_TEXT} flex flex-col font-sans overflow-hidden`} dir="rtl">
      <Head><title>SABAN | AI Companion</title></Head>

      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className={`fixed inset-0 ${WA_BG} z-[100] flex items-center justify-center`}>
            <motion.img 
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              src={SABAN_LOGO} className="w-48 h-48 rounded-3xl object-cover shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`h-16 flex items-center justify-between px-6 ${WA_PANEL} border-b border-white/5 z-50 shadow-md`}>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2"><Menu size={28} /></button>
        <div className="flex items-center gap-3">
            <img src={SABAN_LOGO} className="w-9 h-9 rounded-full object-cover border border-[#00a884]/30 shadow-md" />
            <span className="font-black text-lg tracking-tighter uppercase text-[#00a884]">SABAN {activeView === 'chat' ? 'AI' : 'LIVE'}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#00a884]/10 flex items-center justify-center text-[#00a884] font-black border border-[#00a884]/20">
          {orders.length}
        </div>
      </header>
      
<AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-[85%] bg-[#111b21] z-[70] p-8 shadow-2xl border-l border-white/5">
              <div className="flex justify-between items-center mb-16">
                  <span className="font-black text-xl italic text-[#00a884]">SABAN 1994</span>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <nav className="space-y-4">
                <button onClick={() => { setActiveView('chat'); setIsOpen(false); }} className={`w-full p-6 rounded-2xl flex items-center gap-4 font-black transition-all ${activeView === 'chat' ? 'bg-[#00a884] text-[#111b21]' : 'bg-white/5'}`}><MessageSquare size={24}/> AI ANALYST</button>
                <button onClick={() => { setActiveView('live'); setIsOpen(false); }} className={`w-full p-6 rounded-2xl flex items-center gap-4 font-black transition-all ${activeView === 'live' ? 'bg-[#00a884] text-[#111b21]' : 'bg-white/5'}`}><Calendar size={24}/> לוח משימות LIVE</button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
        {activeView === 'chat' ? (
          messages.map((m, i) => (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl font-bold shadow-md ${m.role === 'user' ? 'bg-[#202c33] border border-white/5' : 'bg-[#005c4b] text-[#e9edef]'}`}>{m.content}</div>
            </motion.div>
          ))
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => {
              const countdown = getCountdown(order.order_time);
              return (
                <div key={order.id} className={`p-6 rounded-2xl ${WA_PANEL} border-r-4 border-[#00a884] shadow-lg`}>
                  <div className="flex justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${STATUS_MAP[order.status]?.color || 'bg-slate-700'}`}>{STATUS_MAP[order.status]?.label || order.status}</span>
                    <span className={`${WA_SUB} font-mono text-[10px]`}>#{order.order_number || 'N/A'}</span>
                  </div>
                  <h3 className="text-xl font-black">{order.client_name || order.client_info}</h3>
                  <div className={`${WA_SUB} text-xs flex items-center gap-1 mb-4`}><MapPin size={12}/> {order.delivery_address || order.location}</div>
                  <div className="flex justify-between items-center bg-[#111b21]/50 p-4 rounded-xl">
                    <div className="flex flex-col"><div className="flex items-center gap-2 text-[#00a884] font-black text-xl italic"><Clock size={18}/> {order.order_time}</div>
                    {countdown && <div className="text-[10px] font-black text-amber-500">בעוד {countdown}</div>}</div>
                    <span className="text-xs font-bold opacity-70">{order.contractor_name || order.driver_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {loading && <RefreshCcw className="animate-spin text-[#00a884] mx-auto" />}
      </main>

      {activeView === 'chat' && (
        <footer className={`fixed bottom-0 left-0 right-0 p-4 ${WA_BG} z-40`}>
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} onClick={() => askAI(q)} className={`whitespace-nowrap px-5 py-2 ${WA_PANEL} rounded-full text-[11px] font-bold border border-white/5 active:scale-95`}>{q}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב הודעה למוח..." className={`w-full p-4 pr-12 rounded-full ${WA_PANEL} border-none outline-none focus:ring-1 focus:ring-[#00a884]`} />
            <button type="submit" className="absolute left-2 top-2 w-10 h-10 bg-[#00a884] text-[#111b21] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><Send size={18} className="rotate-180" /></button>
          </form>
        </footer>
      )}
    </div>
  );
}
