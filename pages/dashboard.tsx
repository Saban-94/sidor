'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, ChevronRight, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, User, X, Save, Menu, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DRIVERS_DATA: Record<string, string> = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
};

const CONTRACTOR_COLORS: Record<string, string> = {
  'שארק 30': 'bg-orange-500',
  'כראדי 32': 'bg-blue-600',
  'שי שרון 40': 'bg-purple-600'
};

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanMobileOS() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'chat'>('live');
  const [isSidebarOpen, setSidebarOpen] = useState(false); // במובייל סגור כברירת מחדל
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    if (typeof window !== 'undefined') audioRef.current = new Audio('/order-notification.mp3');
    const channel = supabase.channel('realtime_all').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchData = async () => {
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: t } = await supabase.from('orders').select('*').order('order_time', { ascending: true });
    if (c) setContainerSites(c);
    if (t) setTruckOrders(t);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    const res = await fetch('/api/unified-brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, senderPhone: 'admin' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    setLoading(false);
    if (data.reply.includes('בוצע')) { audioRef.current?.play(); fetchData(); }
  };

  return (
    <div className="flex h-screen w-full bg-[#0F172A] text-slate-100 overflow-hidden font-sans" dir="rtl">
      <Head>
        <title>SABAN OS | Mobile</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> 
      </Head>

      {/* Mobile Bottom Navigation (NavBar) - חוויית אפליקציה */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#1E293B]/90 backdrop-blur-xl border-t border-white/10 z-[100] flex items-center justify-around px-6 lg:hidden">
        {[
          { id: 'live', icon: Timer, label: 'משימות' },
          { id: 'sidor', icon: Truck, label: 'נהגים' },
          { id: 'containers', icon: Box, label: 'מכולות' },
          { id: 'chat', icon: Bot, label: 'AI' },
        ].map((btn) => (
          <button 
            key={btn.id} 
            onClick={() => setActiveTab(btn.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === btn.id ? 'text-emerald-400 scale-110' : 'text-slate-400'}`}
          >
            <btn.icon size={24} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{btn.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-72 bg-[#1E293B] flex-col border-l border-white/5 shadow-2xl">
        <div className="p-8 font-black text-2xl italic tracking-tighter border-b border-white/5">SABAN OS</div>
        <div className="flex-1 p-6 space-y-4">
          {['live', 'sidor', 'containers', 'chat'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`w-full p-5 rounded-3xl flex items-center gap-4 font-black uppercase text-sm ${activeTab === t ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
               {t === 'live' && <Timer/>} {t === 'sidor' && <Truck/>} {t === 'containers' && <Box/>} {t === 'chat' && <Bot/>}
               {t}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden pb-20 lg:pb-0">
        
        {/* Header קבוע למובייל */}
        <header className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-[#0F172A]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20"><LayoutDashboard size={20}/></div>
            <span className="font-black italic text-xl tracking-tighter">SABAN</span>
          </div>
          <div className="font-mono font-black text-emerald-400">{now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* משימות להיום - כרטיסי ענק */}
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <h2 className="text-3xl font-black italic tracking-tighter mb-2">משימות פעילות</h2>
              {[
                ...containerSites.map(s => ({ ...s, type: 'CONTAINER', mainTitle: s.client_name, subTitle: s.delivery_address, target: `${s.start_date}T${s.order_time || '08:00'}`, person: s.contractor_name })),
                ...truckOrders.map(t => ({ ...t, type: 'ORDER', mainTitle: t.client_info, subTitle: t.location, target: `${t.delivery_date}T${t.order_time}`, person: t.driver_name }))
              ].filter(o => !calculateTime(o.target).expired).map(order => {
                const time = calculateTime(order.target);
                return (
                  <div key={order.id} className={`bg-[#1E293B] p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all ${time.urgent ? 'border-amber-500 animate-pulse' : 'border-white/5'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.type === 'CONTAINER' ? (CONTRACTOR_COLORS[order.person] || 'bg-emerald-500') : 'bg-slate-700 text-white'}`}>
                        {order.type === 'CONTAINER' ? 'מכולה' : 'הובלה'}
                      </span>
                      <div className="text-emerald-400 font-black font-mono text-xl">{order.order_time}</div>
                    </div>
                    <h3 className="text-3xl font-black leading-tight tracking-tighter mb-2">{order.mainTitle}</h3>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-8"><MapPin size={14}/> {order.subTitle}</div>
                    
                    <div className={`p-6 rounded-3xl flex items-center justify-between ${time.urgent ? 'bg-amber-500 text-white' : 'bg-[#0F172A] text-emerald-400 border border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <Clock size={28}/>
                        <span className="text-4xl font-black font-mono">{!time.expired ? `${String(time.h).padStart(2,'0')}:${String(time.m).padStart(2,'0')}:${String(time.s).padStart(2,'0')}` : "00:00:00"}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">זמן יעד</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* סידור נהגים - מותאם למובייל (כרטיס לכל נהג) */}
          {activeTab === 'sidor' && (
            <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
              {Object.keys(DRIVERS_DATA).map(name => (
                <div key={name} className="space-y-4">
                  <div className="flex items-center gap-4 bg-[#1E293B] p-4 rounded-[2rem] border border-white/5">
                    <img src={DRIVERS_DATA[name]} className="w-16 h-16 rounded-full border-4 border-emerald-500 object-cover shadow-xl" />
                    <h3 className="text-2xl font-black italic">{name}</h3>
                  </div>
                  <div className="space-y-2">
                    {TIME_SLOTS.slice(0, 15).map(slot => {
                      const order = truckOrders.find(o => o.driver_name === name && o.order_time === slot);
                      return (
                        <div key={slot} className={`p-5 rounded-2xl flex items-center justify-between ${order ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'bg-[#1E293B]/50 border border-white/5 text-slate-500'}`}>
                          <span className="font-mono font-black text-sm">{slot}</span>
                          <span className="font-black text-sm uppercase italic tracking-widest">{order ? order.client_info : "פנוי"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ניהול מכולות - גריד מובייל */}
          {activeTab === 'containers' && (
            <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <h2 className="text-3xl font-black italic mb-2">מכולות בשטח</h2>
              {containerSites.map(site => (
                <div key={site.id} className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${CONTRACTOR_COLORS[site.contractor_name] || 'bg-emerald-500'} text-white shadow-lg`}>
                      {site.action_type === 'PLACEMENT' ? <Box size={24}/> : <RefreshCcw size={24}/>}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase font-mono tracking-widest">{site.contractor_name}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-1 leading-tight">{site.client_name}</h3>
                  <div className="text-slate-400 font-bold text-sm flex items-center gap-1 mb-6"><MapPin size={12}/> {site.delivery_address}</div>
                  <div className="w-full h-3 bg-[#0F172A] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[60%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* צ'אט AI מלא - חוויית וואטסאפ */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-[#0F172A]">
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-32">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm font-black shadow-2xl ${m.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-emerald-500 text-slate-900 rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-emerald-500 font-black animate-pulse text-[10px] uppercase tracking-[0.3em]">מעבד פקודה...</div>}
               </div>
               <div className="fixed bottom-24 left-6 right-6 lg:static lg:p-8">
                  <form onSubmit={handleChat} className="relative">
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="הזמן הובלה/מכולה..." className="w-full bg-[#1E293B] border border-white/10 rounded-[2rem] py-6 px-10 text-base font-black outline-none focus:border-emerald-500 transition-all shadow-2xl shadow-black/50" />
                    <button type="submit" className="absolute left-3 top-3 bg-emerald-500 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Send size={20} className="rotate-180"/></button>
                  </form>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
