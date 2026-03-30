'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, ChevronRight, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, User, Moon, Sun, Calendar, ArrowRightLeft, X, Save
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

export default function SabanUltimateOS() {
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  const deleteItem = async (id: string, type: string) => {
    if (!confirm("אחי, למחוק סופית?")) return;
    const table = type === 'CONTAINER' ? 'container_management' : 'orders';
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    const res = await fetch('/api/unified-brain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, senderPhone: 'admin' }) });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    setLoading(false);
    if (data.reply.includes('בוצע')) { audioRef.current?.play(); fetchData(); }
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 font-sans overflow-hidden ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN | COMMAND CENTER</title></Head>

      {/* Sidebar - נסתר במובייל, מוצג בדסקטופ */}
      <aside className={`hidden lg:flex w-72 flex-col border-l transition-all ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="p-8 font-black text-2xl italic tracking-tighter border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg"><LayoutDashboard size={20}/></div>
          <span>SABAN OS</span>
        </div>
        <nav className="flex-1 p-5 space-y-4">
          {[{ id: 'live', label: 'משימות להיום', icon: Timer }, { id: 'sidor', label: 'סידור נהגים', icon: Truck }, { id: 'containers', label: 'מכולות', icon: Box }, { id: 'chat', label: 'AI Supervisor', icon: Bot }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-5 rounded-[2rem] flex items-center gap-5 transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 font-black shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={24} /> <span className="uppercase text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-10 flex items-center gap-4 text-slate-400 hover:text-emerald-500 transition-colors">
          {isDarkMode ? <Sun size={24}/> : <Moon size={24}/>} <span className="font-black uppercase text-xs">שינוי עיצוב</span>
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 h-20 z-[100] flex items-center justify-around border-t transition-colors ${isDarkMode ? 'bg-[#111827]/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'}`}>
        {[{ id: 'live', icon: Timer, label: 'משימות' }, { id: 'sidor', icon: Truck, label: 'נהגים' }, { id: 'containers', icon: Box, label: 'מכולות' }, { id: 'chat', icon: Bot, label: 'AI' }].map(btn => (
          <button key={btn.id} onClick={() => setActiveTab(btn.id as any)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === btn.id ? 'text-emerald-500' : 'text-slate-400'}`}>
            <btn.icon size={22} /> <span className="text-[10px] font-black uppercase">{btn.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        
        {/* Header קבוע */}
        <header className={`h-24 shrink-0 flex items-center justify-between px-8 border-b ${isDarkMode ? 'bg-[#0B0F1A]/80 border-white/5' : 'bg-white border-slate-100'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`p-3 rounded-xl font-black text-xs outline-none ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`} />
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="lg:hidden p-3 rounded-xl bg-emerald-500/10 text-emerald-500">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
          </div>
          <div className="font-mono font-black text-2xl lg:text-4xl text-emerald-500">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* לוח LIVE - מציג הכל (הובלות, מכולות, העברות) */}
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-10 h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 scrollbar-hide">
              {allOrders.filter(o => !calculateTime(o.target).expired).map(order => {
                const time = calculateTime(order.target);
                const isTransfer = order.mainTitle?.includes('העברה');
                return (
                  <div key={order.id} className={`p-8 rounded-[3rem] border-2 transition-all relative group shadow-2xl ${isDarkMode ? 'bg-[#161B2C]' : 'bg-white border-slate-100'} ${time.urgent ? 'border-amber-500 animate-pulse' : 'border-transparent'}`}>
                    <div className="flex justify-between items-start mb-6">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${isTransfer ? 'bg-blue-600' : (order.type === 'CONTAINER' ? (CONTRACTOR_COLORS[order.person] || 'bg-emerald-600') : 'bg-slate-900')}`}>
                         {isTransfer ? 'העברה' : (order.type === 'CONTAINER' ? 'מכולה' : 'הובלה')}
                       </span>
                       <button onClick={() => deleteItem(order.id, order.type)} className="p-3 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black tracking-tighter leading-none mb-3">{order.mainTitle}</h3>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm italic mb-10"><MapPin size={16} className="text-emerald-500"/> {order.subTitle}</div>
                    
                    <div className={`p-6 lg:p-8 rounded-[2.5rem] flex items-center justify-between ${time.urgent ? 'bg-amber-500 text-white shadow-amber-500/40' : (isDarkMode ? 'bg-slate-900 text-emerald-400 shadow-xl' : 'bg-slate-900 text-emerald-400')}`}>
                       <div className="flex items-center gap-4">
                         <Clock size={32}/>
                         <span className="text-4xl lg:text-5xl font-black font-mono">
                           {!time.expired ? `${String(time.h).padStart(2,'0')}:${String(time.m).padStart(2,'0')}:${String(time.s).padStart(2,'0')}` : "00:00"}
                         </span>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest">{order.order_time}</span>
                    </div>

                    <div className="mt-8 flex items-center gap-5 border-t border-white/5 pt-8">
                       {DRIVERS_DATA[order.person] ? (
                         <img src={DRIVERS_DATA[order.person]} className="w-16 h-16 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" />
                       ) : (
                         <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/10"><Box size={28}/></div>
                       )}
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">מבצע המשימה</span>
                         <span className="text-xl font-black">{order.person}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* צ'אט AI - גלילה חופשית מעלה */}
          {activeTab === 'chat' && (
            <motion.div key="chat" className="flex-1 flex flex-col bg-transparent overflow-hidden">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 scroll-smooth scrollbar-hide pb-40">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] lg:max-w-[70%] p-8 rounded-[3rem] text-lg font-black shadow-2xl ${m.role === 'user' ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-900 text-white') : (isDarkMode ? 'bg-emerald-500 text-slate-900' : 'bg-emerald-500 text-slate-900')}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.5em] italic mr-4">חושב...</div>}
              </div>
              <footer className="fixed lg:static bottom-24 left-6 right-6 lg:p-10">
                <form onSubmit={handleChat} className="max-w-5xl mx-auto relative group">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב פקודה..." className={`w-full p-8 px-12 pr-28 rounded-[3rem] text-xl font-black outline-none transition-all shadow-2xl ${isDarkMode ? 'bg-[#1E293B] border border-white/5 text-white' : 'bg-white text-slate-900 border border-slate-100'}`} />
                  <button type="submit" className="absolute left-4 top-4 bg-emerald-500 text-slate-900 w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 shadow-xl transition-all"><Send size={28} className="rotate-180"/></button>
                </form>
              </footer>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
