'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Send, Bot, Calendar, BarChart3, RefreshCcw, User, MapPin, Clock, Box, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const STATUS_MAP: any = {
  'approved': { label: 'מאושר', color: 'bg-emerald-500' },
  'pending': { label: 'ממתין להעמסה', color: 'bg-amber-500 shadow-amber-500/20' },
  'rejected': { label: 'נדחתה', color: 'bg-red-500' }
};
  const quickQueries = [
    "כמה הזמנות יש היום?",
    "מה מצב המכולות בשטח?",
    "האם היו העברות היום?",
    "כמה הזמנות סופקו?",
    "מי הנהג הפעיל ביותר היום?",
    "סטטוס שארק 30",
    "חיפוש לפי שם לקוח",
    "דוח יומי מקוצר",
    "הזמנות ללא נהג",
    "מכולות שצריכות פינוי"
  ];
export default function SabanAIAssistant() {
  const [activeView, setActiveView] = useState<'chat' | 'live'>('chat'); // ניהול תצוגה
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
      <header className="h-16 flex items-center justify-between px-6 bg-[#111827] border-b border-white/5 z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2"><Menu size={28} /></button>
        <span className="font-black italic text-xl text-emerald-500 uppercase tracking-tighter">SABAN {activeView === 'chat' ? 'AI' : 'LIVE'}</span>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
          {orders.length}
        </div>
      </header>

      {/* תפריט צד (המבורגר) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-4/5 bg-[#111827] z-[70] p-8 shadow-2xl">
              <div className="flex justify-between mb-12"><Bot className="text-emerald-500" size={32}/><button onClick={() => setIsOpen(false)}><X size={32}/></button></div>
              <nav className="space-y-6">
                <button onClick={() => { setActiveView('chat'); setIsOpen(false); }} className={`w-full p-6 rounded-2xl flex items-center gap-4 font-black ${activeView === 'chat' ? 'bg-emerald-500 text-slate-900' : 'bg-white/5'}`}><MessageSquare size={24}/> AI ANALYST</button>
                <button onClick={() => { setActiveView('live'); setIsOpen(false); }} className={`w-full p-6 rounded-2xl flex items-center gap-4 font-black ${activeView === 'live' ? 'bg-emerald-500 text-slate-900' : 'bg-white/5'}`}><Calendar size={24}/> לוח משימות LIVE</button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
        {activeView === 'chat' ? (
          /* תצוגת צ'אט */
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] font-black shadow-xl ${m.role === 'user' ? 'bg-[#1E293B]' : 'bg-emerald-500 text-slate-900'}`}>{m.content}</div>
            </div>
          ))
        ) : (
          /* תצוגת לוח LIVE */
          <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
            {orders.map((order) => (
              <div key={order.id} className={`p-6 rounded-[2.5rem] border border-white/5 shadow-2xl bg-[#161B2C]`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-[10px] opacity-40">#{order.order_number}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white ${STATUS_MAP[order.status]?.color || 'bg-slate-600'}`}>{STATUS_MAP[order.status]?.label || order.status}</span>
                </div>
                <h3 className="text-xl font-black mb-1">{order.client_name || order.client_info}</h3>
                <div className="flex items-center gap-2 text-xs opacity-60 mb-4 font-bold"><MapPin size={14}/> {order.delivery_address || order.location}</div>
                <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-500 font-mono font-black italic"><Clock size={18}/> {order.order_time}</div>
                  <span className="text-xs font-black">{order.contractor_name || order.driver_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Chat Input (מוצג רק בצ'אט) */}
      {activeView === 'chat' && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#0B0F1A]">
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל את המוח..." className="w-full p-6 rounded-[2.5rem] bg-[#111827] border border-white/10 text-white font-bold outline-none" />
            <button type="submit" className="absolute left-3 top-3 w-12 h-12 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center"><Send size={20} className="rotate-180" /></button>
          </form>
        </footer>
      )}
    </div>
  );
}
