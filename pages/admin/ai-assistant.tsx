'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
// הוספתי כאן את MessageSquare שהיה חסר ב-Import
import { 
  Menu, X, Send, Bot, Calendar, RefreshCcw, User, MapPin, Clock, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const STATUS_MAP: any = {
  'approved': { label: 'מאושר', color: 'bg-emerald-500' },
  'pending': { label: 'ממתין להעמסה', color: 'bg-amber-500 shadow-amber-500/20' },
  'rejected': { label: 'נדחתה', color: 'bg-red-500' }
};

export default function SabanAIAssistant() {
  const [activeView, setActiveView] = useState<'chat' | 'live'>('chat');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLiveOrders();
    const channel = supabase.channel('live-sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchLiveOrders).subscribe();
    return () => { supabase.removeChannel(channel); };
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
      <Head>
        <title>Saban AI Companion</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      <header className="h-16 flex items-center justify-between px-6 bg-[#111827] border-b border-white/5 z-50 shadow-xl">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 active:scale-90 transition-all"><Menu size={28} /></button>
        <span className="font-black italic text-xl text-emerald-500 uppercase tracking-tighter">
            SABAN {activeView === 'chat' ? 'AI' : 'LIVE'}
        </span>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          {orders.length}
        </div>
      </header>

      {/* תפריט צד משודרג */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-[85%] bg-[#0B0F1A] z-[70] p-8 shadow-2xl border-l border-white/5">
              <div className="flex justify-between items-center mb-16">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500 rounded-lg text-slate-900"><Bot size={24}/></div>
                    <span className="font-black text-xl italic tracking-tighter">MENU</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <nav className="space-y-4">
                <button onClick={() => { setActiveView('chat'); setIsOpen(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 font-black text-lg transition-all ${activeView === 'chat' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    <MessageSquare size={24}/> AI ANALYST
                </button>
                <button onClick={() => { setActiveView('live'); setIsOpen(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 font-black text-lg transition-all ${activeView === 'live' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    <Calendar size={24}/> לוח משימות LIVE
                </button>
              </nav>
              <div className="absolute bottom-10 left-8 right-8 p-6 bg-white/5 rounded-[2rem] border border-white/5 italic opacity-50 text-xs text-center">
                  Saban 1994 OS v3.2
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
        {activeView === 'chat' ? (
          messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20 text-center px-10 grayscale">
                <Bot size={100} className="mb-4" />
                <h2 className="text-2xl font-black italic">המתנה לפקודה...</h2>
            </div>
          ) : (
            messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-5 rounded-[2rem] font-black shadow-xl ${m.role === 'user' ? 'bg-[#1E293B] border border-white/5 text-white' : 'bg-emerald-500 text-slate-900'}`}>{m.content}</div>
              </motion.div>
            ))
          )
        ) : (
          <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {orders.length === 0 ? (
                <div className="p-10 text-center opacity-30 font-black italic">אין משימות פעילות להיום</div>
            ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-6 rounded-[3rem] border border-white/5 shadow-2xl bg-[#161B2C] relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <span className="font-mono text-[10px] opacity-40">#{order.order_number || 'N/A'}</span>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black text-white shadow-lg ${STATUS_MAP[order.status]?.color || 'bg-slate-600'}`}>{STATUS_MAP[order.status]?.label || order.status}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-1 tracking-tighter relative z-10">{order.client_name || order.client_info}</h3>
                    <div className="flex items-center gap-2 text-xs opacity-60 mb-6 font-bold relative z-10"><MapPin size={14} className="text-emerald-500"/> {order.delivery_address || order.location}</div>
                    <div className="flex justify-between items-center bg-black/30 p-5 rounded-[2rem] relative z-10">
                      <div className="flex items-center gap-2 text-emerald-400 font-mono text-2xl font-black"><Clock size={20}/> {order.order_time}</div>
                      <span className="text-xs font-black uppercase tracking-widest opacity-80">{order.contractor_name || order.driver_name}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </main>

      {activeView === 'chat' && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A] to-transparent z-40">
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative max-w-2xl mx-auto">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל את המוח האנליטי..." className="w-full p-6 pr-14 rounded-[2.5rem] bg-[#111827] border border-white/10 text-white font-bold outline-none focus:border-emerald-500 transition-all shadow-2xl" />
            <button type="submit" className="absolute left-3 top-3 w-12 h-12 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><Send size={20} className="rotate-180" /></button>
          </form>
        </footer>
      )}
    </div>
  );
}
