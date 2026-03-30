'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, 
  Clock, User, MapPin, CheckCircle2, BellRing, Bot,
  Truck, ChevronRight, Menu, X, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// רשימת נהגים לדוגמה עם תמונות
const DRIVERS = [
  { id: 1, name: 'אבי', img: 'https://i.pravatar.cc/150?u=avi' },
  { id: 2, name: 'מוחמד', img: 'https://i.pravatar.cc/150?u=momo' },
  { id: 3, name: 'יוסי', img: 'https://i.pravatar.cc/150?u=yossi' },
  { id: 4, name: 'סעיד', img: 'https://i.pravatar.cc/150?u=said' },
];

const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function SabanOS() {
  const [activeTab, setActiveTab] = useState<'sidor' | 'containers'>('sidor');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
    // מאזין לשינויים ב-Realtime
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchOrders)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('container_management').select('*').eq('is_active', true);
    if (data) setOrders(data);
  };

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed", e));
    }
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
      
      // אם המוח ביצע הזרקה מוצלחת - הפעל צלצול
      if (data.reply.includes('בוצע') || data.reply.includes('DATA_START')) {
        playNotification();
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7FE] font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN | Control Center</title></Head>
      <audio ref={audioRef} src="/order-notification.mp3" />

      {/* תפריט צד (Sidebar) */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="h-full bg-slate-900 text-white flex flex-col relative z-50 shadow-2xl shrink-0"
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 bg-emerald-500 rounded-xl"><LayoutDashboard size={20} className="text-slate-900" /></div>
          {isSidebarOpen && <span className="font-black italic text-lg tracking-tighter">SABAN 2026</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab('sidor')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'sidor' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <MessageSquare size={20} />
            {isSidebarOpen && <span className="font-bold">סידור הובלות</span>}
          </button>
          <button onClick={() => setActiveTab('containers')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'containers' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <Container size={20} />
            {isSidebarOpen && <span className="font-bold">ניהול מכולות</span>}
          </button>
        </nav>

        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute -left-3 top-20 bg-emerald-500 text-slate-900 p-1 rounded-full border-4 border-[#F4F7FE] z-50">
          <ChevronRight size={14} className={isSidebarOpen ? 'rotate-180' : ''} />
        </button>
      </motion.aside>

      {/* תוכן מרכזי */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <AnimatePresence mode="wait">
          {activeTab === 'sidor' ? (
            <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full">
              
              {/* לוח סידור שעות (צד ימין) */}
              <div className="flex-1 flex flex-col border-l border-slate-100 overflow-hidden">
                {/* שורת נהגים */}
                <div className="h-24 border-b border-slate-100 flex items-center px-6 gap-6 bg-white overflow-x-auto scrollbar-hide shrink-0">
                  {DRIVERS.map(driver => (
                    <div key={driver.id} className="flex flex-col items-center shrink-0">
                      <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500 p-0.5 overflow-hidden shadow-sm">
                        <img src={driver.img} className="w-full h-full object-cover rounded-xl" alt={driver.name} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">{driver.name}</span>
                    </div>
                  ))}
                  <button className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition-all"><PlusCircle size={20}/></button>
                </div>

                {/* גריד שעות והזמנות */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex gap-4 group">
                      <div className="w-16 pt-2 text-right shrink-0">
                        <span className="text-xs font-black text-slate-300 group-hover:text-emerald-500 transition-colors font-mono">{hour}</span>
                      </div>
                      <div className="flex-1 min-h-[80px] bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4 relative overflow-hidden">
                         {/* כאן תופיע הזמנה אם קיימת לשעה זו */}
                         <div className="w-1 h-8 bg-slate-100 rounded-full" />
                         <span className="text-slate-300 text-xs font-bold italic uppercase tracking-widest">אין הובלה משובצת</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* צ'אט הזרקה חכם (צד שמאל בתוך הדף) */}
              <div className="w-[400px] flex flex-col bg-slate-50 shrink-0">
                <div className="p-6 border-b border-slate-200 flex items-center gap-3 bg-white">
                  <div className="p-2 bg-slate-900 rounded-xl"><Bot size={18} className="text-emerald-400"/></div>
                  <span className="font-black text-slate-900 text-sm uppercase italic">Brain Sidor</span>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-widest">המפקח מסנכרן...</div>}
                </div>
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
                  <div className="relative">
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="הזמנה חדשה..." className="w-full bg-slate-100 border-none rounded-2xl py-3 px-4 pr-12 text-sm font-bold outline-none focus:ring-2 ring-emerald-500/20" />
                    <button type="submit" className="absolute left-2 top-1.5 bg-slate-900 text-emerald-400 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><Send size={14}/></button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-8 overflow-y-auto bg-slate-50">
               {/* לוח המכולות (אותו לוח שיצרנו קודם) */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {orders.map(site => (
                    <div key={site.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-transparent shadow-xl">
                       <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-emerald-500 text-slate-900 rounded-2xl">
                             {site.action_type === 'PLACEMENT' ? <Box size={24}/> : <RefreshCcw size={24}/>}
                          </div>
                          <span className="text-[10px] font-black text-slate-300 uppercase font-mono tracking-widest">{site.contractor_name}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-900 leading-tight">{site.client_name}</h3>
                       <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-1"><MapPin size={12}/> {site.delivery_address}</div>
                    </div>
                 ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
