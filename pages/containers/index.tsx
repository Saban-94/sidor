'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Box, Truck, RefreshCcw, Trash2, MapPin, Bot, Send, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ContainerOS() {
  const [mounted, setMounted] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchActiveSites();
    const sub = supabase.channel('container_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchActiveSites)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  // גלילה אוטומטית בכל פעם שהודעות משתנות
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const fetchActiveSites = async () => {
    const { data } = await supabase.from('container_management').select('*').eq('is_active', true).order('start_date', { ascending: true });
    if (data) setSites(data);
  };

  const calculateDays = (startDate: string) => {
    if (!startDate) return 0;
    return Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) { console.error(err); } finally { setLoading(true); setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] font-sans flex flex-col lg:flex-row overflow-hidden selection:bg-emerald-100" dir="rtl">
      <Head><title>SABAN | Container Control</title></Head>

      {/* לוח ניהול אתרים (Scrollable Sidebar) */}
      <aside className="w-full lg:w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-10 overflow-hidden shrink-0">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Truck size={24} className="text-emerald-400" />
            <h2 className="font-black italic uppercase tracking-tighter">SABAN SITES</h2>
          </div>
          <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-[10px] font-black text-emerald-400 animate-pulse">LIVE</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50">
          <AnimatePresence>
            {sites.map((site) => {
              const days = calculateDays(site.start_date);
              const isUrgent = days >= 9;
              return (
                <motion.div key={site.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} 
                  className={`bg-white p-5 rounded-3xl border-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer touch-manipulation ${isUrgent ? 'border-red-500' : 'border-transparent'}`}>
                  <div className="flex justify-between mb-3">
                    <div className={`p-2 rounded-xl ${isUrgent ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>
                      {site.action_type === 'PLACEMENT' ? <Box size={18}/> : <RefreshCcw size={18}/>}
                    </div>
                    <span className="text-[10px] font-mono font-black opacity-20 italic uppercase">{site.contractor_name}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{site.client_name}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-1"><MapPin size={12}/> {site.delivery_address}</div>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} style={{ width: `${Math.min(days * 10, 100)}%` }} />
                    </div>
                    <span className={`text-[10px] font-black ${isUrgent ? 'text-red-500' : 'text-slate-400'}`}>{days}/10d</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </aside>

      {/* צ'אט מרוכז (Main UI) */}
      <div className="flex-1 flex flex-col relative h-full bg-[#F8FAFC]">
        {/* Header קבוע */}
        <header className="h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl"><Bot size={18} className="text-emerald-400"/></div>
            <span className="font-black text-slate-900 text-sm tracking-widest uppercase italic">The Supervisor</span>
          </div>
        </header>

        {/* גוף הצ'אט מרוכז */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth scrollbar-hide">
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-sm font-bold shadow-sm transition-all ${
                  m.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-emerald-500/5'
                }`}>
                  {m.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">המפקח חושב...</div>
              </div>
            )}
          </div>
        </main>

        {/* Input קבוע בתחתית */}
        <footer className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto relative flex items-center">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב פקודה (למשל: הזמנה חדשה)"
              className="w-full bg-slate-100 border-none rounded-full py-4 pr-6 pl-16 text-sm font-bold outline-none focus:ring-2 ring-emerald-500/20 transition-all placeholder-slate-400"
            />
            <button type="submit" className="absolute left-2 bg-slate-900 text-emerald-400 w-11 h-11 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-90 touch-manipulation">
              <Send size={18} className="transform rotate-180" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
