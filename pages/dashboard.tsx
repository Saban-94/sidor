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

export default function SabanUnifiedOS() {
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

  const handleUpdate = async () => {
    const table = editingItem.type === 'CONTAINER' ? 'container_management' : 'orders';
    const data = editingItem.type === 'CONTAINER' 
      ? { client_name: editingItem.mainTitle, delivery_address: editingItem.subTitle, order_time: editingItem.order_time }
      : { client_info: editingItem.mainTitle, location: editingItem.subTitle, order_time: editingItem.order_time };
    await supabase.from(table).update(data).eq('id', editingItem.id);
    setEditingItem(null);
    fetchData();
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    const res = await fetch('/api/unified-brain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    setLoading(false);
    if (data.reply.includes('בוצע')) { audioRef.current?.play(); fetchData(); }
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN | COMMAND CENTER</title></Head>

      {/* Sidebar */}
      <aside className={`w-20 lg:w-72 flex flex-col border-l transition-all ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="p-8 font-black text-2xl italic tracking-tighter border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900"><LayoutDashboard size={20}/></div>
          <span className="hidden lg:block">SABAN OS</span>
        </div>
        <nav className="flex-1 p-4 space-y-4">
          {['live', 'sidor', 'containers', 'chat'].map(id => (
            <button key={id} onClick={() => setActiveTab(id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === id ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              {id === 'live' && <Timer/>} {id === 'sidor' && <Truck/>} {id === 'containers' && <Box/>} {id === 'chat' && <Bot/>}
              <span className="hidden lg:block font-black text-xs uppercase">{id}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-8 text-slate-400 hover:text-emerald-500 flex items-center gap-4">
          {isDarkMode ? <Sun size={24}/> : <Moon size={24}/>}
          <span className="hidden lg:block font-bold">מצב תצוגה</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header עם יומן */}
        <header className={`h-24 shrink-0 flex items-center justify-between px-10 border-b ${isDarkMode ? 'bg-[#0B0F1A]/80 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 bg-emerald-500/10 p-2 rounded-xl px-4 border border-emerald-500/20">
               <Calendar size={18} className="text-emerald-500"/>
               <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm outline-none cursor-pointer" />
             </div>
             <h1 className="text-2xl font-black italic uppercase tracking-tighter hidden md:block">ניהול מבצעי</h1>
          </div>
          <div className="font-mono font-black text-3xl text-emerald-500">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <AnimatePresence mode="wait">
          {/* משימות LIVE עם העברות ומכולות */}
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {allOrders.filter(o => !calculateTime(o.target).expired).map(order => {
                const time = calculateTime(order.target);
                const isTransfer = order.mainTitle?.includes('העברה');
                return (
                  <motion.div 
                    key={order.id} 
                    className={`p-8 rounded-[3rem] border-2 transition-all group relative shadow-2xl ${isDarkMode ? 'bg-[#161B2C]' : 'bg-white'} ${time.urgent ? 'border-amber-500 animate-pulse' : 'border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                       <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isTransfer ? 'bg-indigo-600 text-white' : (order.type === 'CONTAINER' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white')}`}>
                         {isTransfer ? 'העברה' : (order.type === 'CONTAINER' ? 'מכולה' : 'הובלה')}
                       </span>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditingItem(order)} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:bg-emerald-500 hover:text-white"><Edit3 size={18}/></button>
                          <button onClick={() => deleteItem(order.id, order.type)} className="p-2.5 bg-white/5 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                       </div>
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter leading-none mb-3">{order.mainTitle}</h3>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm italic mb-8"><MapPin size={14}/> {order.subTitle}</div>
                    
                    <div className={`p-6 rounded-[2rem] flex items-center justify-between ${time.urgent ? 'bg-amber-500 text-white' : 'bg-slate-900 text-emerald-400 shadow-xl'}`}>
                       <div className="flex items-center gap-4">
                         <Clock size={28}/>
                         <span className="text-4xl font-black font-mono">
                           {!time.expired ? `${String(time.h).padStart(2,'0')}:${String(time.m).padStart(2,'0')}:${String(time.s).padStart(2,'0')}` : "00:00"}
                         </span>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest">זמן יעד</span>
                    </div>

                    <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
                       {DRIVERS_DATA[order.person] ? (
                         <img src={DRIVERS_DATA[order.person]} className="w-14 h-14 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" />
                       ) : (
                         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500"><Box size={24}/></div>
                       )}
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">מבצע המשימה</span>
                         <span className="text-lg font-black">{order.person}</span>
                       </div>
                       <div className="mr-auto font-black font-mono text-emerald-500 text-xl">{order.order_time}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* צ'אט AI מלא */}
          {activeTab === 'chat' && (
            <motion.div key="chat" className="flex-1 flex flex-col bg-transparent">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] p-8 rounded-[3rem] text-lg font-black shadow-2xl ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>{m.content}</div>
                  </div>
                ))}
              </div>
              <footer className="p-10">
                <form onSubmit={handleChat} className="max-w-5xl mx-auto relative group">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="הזמן הובלה/מכולה..." className={`w-full p-8 px-12 pr-28 rounded-[2.5rem] text-xl font-black outline-none transition-all shadow-2xl ${isDarkMode ? 'bg-white/5 text-white focus:bg-white/10' : 'bg-white text-slate-900'}`} />
                  <button type="submit" className="absolute left-4 top-4 bg-emerald-500 text-slate-900 w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 shadow-xl"><Send size={28} className="rotate-180"/></button>
                </form>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* עריכה - Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white text-slate-900 p-12 rounded-[3.5rem] w-full max-w-xl space-y-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">עריכת נתונים</h2>
            <div className="space-y-4">
               <input className="w-full p-5 bg-slate-100 rounded-3xl font-bold" value={editingItem.mainTitle} onChange={e => setEditingItem({...editingItem, mainTitle: e.target.value})} />
               <input className="w-full p-5 bg-slate-100 rounded-3xl font-bold" value={editingItem.subTitle} onChange={e => setEditingItem({...editingItem, subTitle: e.target.value})} />
               <input className="w-full p-5 bg-slate-100 rounded-3xl font-bold" value={editingItem.order_time} onChange={e => setEditingItem({...editingItem, order_time: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button onClick={handleUpdate} className="flex-1 bg-emerald-500 text-slate-900 p-5 rounded-3xl font-black">שמור</button>
              <button onClick={() => setEditingItem(null)} className="flex-1 bg-slate-100 p-5 rounded-3xl font-black">ביטול</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
