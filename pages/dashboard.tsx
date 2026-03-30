'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, 
  Clock, User, MapPin, Bot, Truck, ChevronRight, 
  PlusCircle, Box, RefreshCcw, Sun, Moon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanUnifiedOS() {
  const [activeTab, setActiveTab] = useState<'sidor' | 'containers'>('sidor');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [containerOrders, setContainerOrders] = useState<any[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/order-notification.mp3');
    }
    const sub = supabase.channel('global_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchData)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchData = async () => {
    const { data } = await supabase.from('container_management').select('*').eq('is_active', true);
    if (data) setContainerOrders(data);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      if (data.reply.includes('בוצע') || data.reply.includes('DATA_START')) {
        audioRef.current?.play().catch(() => {});
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 ${isDarkMode ? 'bg-[#0B0F1A]' : 'bg-[#F4F7FE]'}`} dir="rtl">
      <Head><title>SABAN | Control Center</title></Head>

      {/* תפריט צד (Sidebar) */}
      <motion.aside animate={{ width: isSidebarOpen ? 260 : 80 }} className="h-full bg-slate-900 text-white flex flex-col relative z-50 shadow-2xl shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 bg-emerald-500 rounded-xl"><LayoutDashboard size={20} className="text-slate-900" /></div>
          {isSidebarOpen && <span className="font-black italic text-lg tracking-tighter uppercase">SABAN OS</span>}
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab('sidor')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'sidor' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <MessageSquare size={20} /> {isSidebarOpen && <span className="font-bold">סידור הובלות</span>}
          </button>
          <button onClick={() => setActiveTab('containers')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'containers' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <Container size={20} /> {isSidebarOpen && <span className="font-bold">ניהול מכולות</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-4 p-4 text-slate-400 hover:text-white transition-colors uppercase font-black text-[10px]">
                {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
                {isSidebarOpen && <span>{isDarkMode ? 'מצב יום' : 'מצב לילה'}</span>}
            </button>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute -left-3 top-20 bg-emerald-500 text-slate-900 p-1 rounded-full border-4 border-[#F4F7FE] z-50 shadow-lg"><ChevronRight size={14} className={isSidebarOpen ? 'rotate-180' : ''} /></button>
      </motion.aside>

      {/* תוכן מרכזי */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'sidor' ? (
            <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full w-full">
              {/* לוח שעות נהגים (ימין) */}
              <div className="flex-1 flex flex-col border-l border-slate-200 overflow-hidden bg-white/50 backdrop-blur-sm shadow-inner">
                <div className="flex-1 overflow-y-auto p-6 space-y-12 scrollbar-hide">
                  {DRIVERS.map(driver => (
                    <div key={driver.name} className="space-y-6">
                      <div className="flex items-center gap-4 bg-emerald-500/5 p-4 rounded-[2.5rem] border border-emerald-500/10 shadow-sm">
                        <img src={driver.img} className="w-16 h-16 rounded-full border-4 border-emerald-500 object-cover shadow-xl" />
                        <h3 className={`font-black text-2xl tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{driver.name}</h3>
                      </div>
                      <div className="space-y-3 px-4">
                        {TIME_SLOTS.slice(0, 10).map(slot => (
                          <div key={slot} className="flex items-center gap-6 min-h-[50px] group">
                            <span className="text-[10px] font-black font-mono w-10 text-slate-300 group-hover:text-emerald-500 transition-colors uppercase">{slot}</span>
                            <div className="flex-1 border-b border-slate-100 min-h-[40px] flex items-center italic text-[10px] text-slate-300 font-bold uppercase tracking-widest">זמין לשיבוץ</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* צ'אט הזרקה (שמאל) */}
              <div className={`w-[420px] flex flex-col shadow-2xl z-10 shrink-0 ${isDarkMode ? 'bg-[#111827]' : 'bg-white'}`}>
                <div className={`p-6 border-b flex items-center gap-3 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg shadow-emerald-500/10"><Bot size={18} className="text-emerald-400"/></div>
                  <span className={`font-black text-sm uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Supervisor</span>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] px-5 py-4 rounded-3xl text-xs font-bold shadow-xl leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.3em] mr-2 italic">Thinking...</div>}
                </div>
                <form onSubmit={handleSend} className={`p-6 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className="relative group">
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="כתוב פקודה להזרקה..." className={`w-full border-2 border-transparent rounded-2xl py-4 px-5 pr-14 text-sm font-bold outline-none transition-all ${isDarkMode ? 'bg-white/5 text-white focus:bg-white/10' : 'bg-slate-100 focus:bg-white focus:border-emerald-500/20'}`} />
                    <button type="submit" className="absolute left-2.5 top-2.5 bg-slate-900 text-emerald-400 w-10 h-10 rounded-[14px] flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-lg"><Send size={16} className="transform rotate-180" /></button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-8 overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                 {containerOrders.map(site => (
                    <motion.div whileHover={{ y: -5 }} key={site.id} className="bg-white p-7 rounded-[3rem] border-2 border-transparent shadow-2xl hover:shadow-emerald-500/10 transition-all group relative overflow-hidden">
                       <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-emerald-500 text-slate-900 rounded-[1.5rem] shadow-lg shadow-emerald-500/20">
                             {site.action_type === 'PLACEMENT' ? <Box size={22}/> : <RefreshCcw size={22}/>}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-widest">{site.contractor_name}</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors tracking-tighter">{site.client_name}</h3>
                       <div className="flex items-center gap-1 text-slate-500 text-xs font-bold mt-2"><MapPin size={14} className="text-emerald-500"/> {site.delivery_address}</div>
                    </motion.div>
                 ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
