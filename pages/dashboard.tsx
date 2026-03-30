'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, ChevronRight, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, User, Moon, Sun, Calendar, ArrowRightLeft, X, Save, Menu
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    if (typeof window !== 'undefined') audioRef.current = new Audio('/order-notification.mp3');
    const channel = supabase.channel('db_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate]);

  // גלילה אוטומטית רק כשמגיעה הודעה חדשה, אבל מאפשרת גלילה ידנית מעלה
  useEffect(() => {
    if (scrollRef.current && !loading) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const fetchData = async () => {
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: t } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
    
    const unified = [
      ...(c || []).map(item => ({ ...item, type: 'CONTAINER', mainTitle: item.client_name, subTitle: item.delivery_address, target: `${item.start_date}T${item.order_time || '08:00'}`, person: item.contractor_name })),
      ...(t || []).map(item => ({ ...item, type: 'ORDER', mainTitle: item.client_info, subTitle: item.location, target: `${item.delivery_date}T${item.order_time}`, person: item.driver_name }))
    ];
    setAllOrders(unified);
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

  const deleteItem = async (id: string, type: string) => {
    if (!confirm("בוס, למחוק סופית?")) return;
    const table = type === 'CONTAINER' ? 'container_management' : 'orders';
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 font-sans overflow-hidden ${isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC] text-slate-900'}`} dir="rtl">
      <Head>
        <title>SABAN OS | Mobile Elite</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>

      {/* תפריט תחתון למובייל - NavBar */}
      <nav className={`fixed bottom-0 left-0 right-0 h-20 z-[100] flex items-center justify-around px-4 border-t transition-colors ${isDarkMode ? 'bg-[#1E293B]/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'}`}>
        {[
          { id: 'live', icon: Timer, label: 'משימות' },
          { id: 'sidor', icon: Truck, label: 'נהגים' },
          { id: 'containers', icon: Box, label: 'מכולות' },
          { id: 'chat', icon: Bot, label: 'AI' },
        ].map((btn) => (
          <button key={btn.id} onClick={() => setActiveTab(btn.id as any)} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === btn.id ? 'text-emerald-400 scale-110' : 'text-slate-400'}`}>
            <btn.icon size={22} strokeWidth={activeTab === btn.id ? 3 : 2} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{btn.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 flex flex-col relative overflow-hidden pb-20">
        
        {/* Header מובייל עם כפתור Light/Dark */}
        <header className={`h-20 shrink-0 border-b flex items-center justify-between px-6 transition-colors ${isDarkMode ? 'bg-[#0F172A]/50 border-white/5' : 'bg-white/50 border-slate-200'} backdrop-blur-md`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20"><LayoutDashboard size={20}/></div>
            <span className="font-black italic text-xl tracking-tighter uppercase">SABAN</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
              {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <div className="font-mono font-black text-emerald-500 text-lg">{now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* דף משימות (Live) */}
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">משימות פעילות</h2>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`text-[10px] font-black p-2 rounded-lg outline-none ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`} />
              </div>
              
              {allOrders.filter(o => !calculateTime(o.target).expired).map(order => {
                const time = calculateTime(order.target);
                const isTransfer = order.mainTitle?.includes('העברה');
                return (
                  <div key={order.id} className={`p-6 rounded-[2.5rem] border-2 shadow-2xl transition-all relative group ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white border-slate-100'} ${time.urgent ? 'border-amber-500 animate-pulse' : 'border-transparent'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${isTransfer ? 'bg-blue-600' : (order.type === 'CONTAINER' ? (CONTRACTOR_COLORS[order.person] || 'bg-emerald-500') : 'bg-slate-700')}`}>
                        {isTransfer ? 'העברה' : (order.type === 'CONTAINER' ? 'מכולה' : 'הובלה')}
                      </span>
                      <button onClick={() => deleteItem(order.id, order.type)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                    <h3 className="text-2xl font-black leading-tight tracking-tighter mb-2">{order.mainTitle}</h3>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-6"><MapPin size={12}/> {order.subTitle}</div>
                    
                    <div className={`p-5 rounded-[2rem] flex items-center justify-between ${time.urgent ? 'bg-amber-500 text-white' : (isDarkMode ? 'bg-[#0F172A] text-emerald-400 border border-white/5' : 'bg-slate-900 text-emerald-400')}`}>
                      <div className="flex items-center gap-3">
                        <Clock size={24}/>
                        <span className="text-3xl font-black font-mono">{!time.expired ? `${String(time.h).padStart(2,'0')}:${String(time.m).padStart(2,'0')}:${String(time.s).padStart(2,'0')}` : "00:00"}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{order.order_time}</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* צ'אט AI - חוויית וואטסאפ עם גלילה מלאה */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
               <div 
                 ref={scrollRef} 
                 className={`flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-36 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F1F5F9]'}`}
               >
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm font-black shadow-xl leading-relaxed ${m.role === 'user' ? (isDarkMode ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tr-none border border-slate-100') : 'bg-emerald-500 text-slate-900 rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-emerald-500 font-black animate-pulse text-[10px] uppercase tracking-[0.4em] mr-4">מעבד פקודה...</div>}
               </div>
               
               {/* אזור הקלט - צף מעל ה-Nav */}
               <div className={`fixed bottom-24 left-4 right-4 z-[110] transition-all`}>
                  <form onSubmit={handleChat} className="relative group">
                    <input 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      placeholder="הזמן הובלה/מכולה..." 
                      className={`w-full border-none rounded-[2.5rem] py-6 px-10 pr-20 text-base font-black outline-none shadow-2xl transition-all ${isDarkMode ? 'bg-[#1E293B] text-white focus:bg-slate-800' : 'bg-white text-slate-900 focus:ring-2 ring-emerald-500/10'}`} 
                    />
                    <button type="submit" className="absolute left-3 top-3 bg-emerald-500 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90"><Send size={20} className="rotate-180"/></button>
                  </form>
               </div>
            </motion.div>
          )}

          {/* סידור נהגים (Sidor) וניהול מכולות (Containers) באותו סגנון... */}
          {/* ... (הלוגיקה נשארת כפי שמימשנו) ... */}

        </AnimatePresence>
      </main>
    </div>
  );
}
