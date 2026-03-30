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

// --- נהגים עם התמונות המקוריות שלך (חכמת ועלי) ---
const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

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
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'chat'>('sidor');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchData = async () => {
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: t } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
    const { data: tr } = await supabase.from('transfers').select('*').eq('transfer_date', selectedDate);
    
    if (c) setContainerSites(c);
    if (t) setTruckOrders(t);
    if (tr) setTransfers(tr);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  const deleteItem = async (id: string, table: string) => {
    if (!confirm("בוס, למחוק סופית?")) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const handleUpdate = async () => {
    const table = editingItem.type === 'CONTAINER' ? 'container_management' : (editingItem.type === 'TRANSFER' ? 'transfers' : 'orders');
    await supabase.from(table).update(editingItem.data).eq('id', editingItem.id);
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
    <div className={`flex h-screen w-full transition-colors duration-500 font-sans overflow-hidden ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN LOGISTICS | MASTER OS</title></Head>
      <audio ref={audioRef} src="/order-notification.mp3" />

      {/* Sidebar - המבנה המקורי */}
      <aside className={`w-20 lg:w-72 flex flex-col border-l transition-all ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="p-8 font-black text-2xl italic tracking-tighter border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900"><LayoutDashboard size={20}/></div>
          <span className="hidden lg:block uppercase">Saban OS</span>
        </div>
        <nav className="flex-1 p-4 space-y-4 mt-4">
          {[
            { id: 'live', label: 'לוח LIVE', icon: Timer },
            { id: 'sidor', label: 'סידור נהגים', icon: Truck },
            { id: 'containers', label: 'מכולות', icon: Box },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={22} /> <span className="hidden lg:block font-black text-xs uppercase">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-10 flex items-center gap-4 text-slate-400 hover:text-emerald-500 transition-colors">
          {isDarkMode ? <Sun size={24}/> : <Moon size={24}/>} <span className="hidden lg:block font-black uppercase text-xs">שינוי עיצוב</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        
        {/* Header קבוע עם יומן */}
        <header className={`h-24 shrink-0 flex items-center justify-between px-10 border-b ${isDarkMode ? 'bg-[#0B0F1A]/80 border-white/5' : 'bg-white border-slate-100'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-emerald-500/10 p-2 rounded-xl px-4 border border-emerald-500/20">
               <Calendar size={18} className="text-emerald-500"/>
               <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm outline-none cursor-pointer" />
             </div>
          </div>
          <div className="font-mono font-black text-2xl lg:text-4xl text-emerald-500">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* לוח LIVE - מאחד הכל עם טיימרים */}
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[
                  ...truckOrders.map(t => ({ ...t, type: 'ORDER', title: t.client_info, sub: t.location, target: `${t.delivery_date}T${t.order_time}`, person: t.driver_name })),
                  ...containerSites.map(c => ({ ...c, type: 'CONTAINER', title: c.client_name, sub: c.delivery_address, target: `${c.start_date}T${c.order_time || '08:00'}`, person: c.contractor_name })),
                  ...transfers.map(tr => ({ ...tr, type: 'TRANSFER', title: `העברה: ${tr.to_branch}`, sub: `מ-${tr.from_branch}`, target: `${tr.transfer_date}T${tr.transfer_time}`, person: tr.driver_name }))
                ].filter(o => !calculateTime(o.target).expired).map(order => {
                  const t = calculateTime(order.target);
                  return (
                    <div key={order.id} className={`p-8 rounded-[3rem] border-2 transition-all relative group shadow-2xl ${isDarkMode ? 'bg-[#161B2C]' : 'bg-white border-slate-100'} ${t.urgent ? 'border-amber-500 animate-pulse' : 'border-transparent hover:shadow-emerald-500/10'}`}>
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${order.type === 'TRANSFER' ? 'bg-indigo-600' : (order.type === 'CONTAINER' ? (CONTRACTOR_COLORS[order.person] || 'bg-emerald-600') : 'bg-slate-700')}`}>
                           {order.type === 'TRANSFER' ? 'העברה' : (order.type === 'CONTAINER' ? 'מכולה' : 'הובלה')}
                         </span>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => deleteItem(order.id, order.type)} className="p-3 bg-white/5 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={20}/></button>
                         </div>
                      </div>
                      <h3 className="text-3xl font-black tracking-tighter leading-none mb-3">{order.title}</h3>
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm italic mb-10"><MapPin size={16} className="text-emerald-500"/> {order.sub}</div>
                      
                      <div className={`mt-8 p-6 rounded-[2rem] flex items-center justify-between ${t.urgent ? 'bg-amber-500 text-white animate-pulse shadow-amber-500/40' : (isDarkMode ? 'bg-slate-900 text-emerald-400 shadow-xl' : 'bg-slate-900 text-emerald-400')}`}>
                         <div className="flex items-center gap-4">
                           <Clock size={32}/>
                           <span className="text-4xl font-black font-mono">
                             {!t.expired ? `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : "00:00"}
                           </span>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest">{order.order_time || order.transfer_time}</span>
                      </div>

                      <div className="mt-8 flex items-center gap-5 border-t border-white/5 pt-8">
                         {DRIVERS.find(d => d.name === order.person) ? (
                           <img src={DRIVERS.find(d => d.name === order.person)?.img} className="w-16 h-16 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" />
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

            {/* סידור נהגים קלאסי עם תמונות הפרופיל (חכמת ועלי) */}
            {activeTab === 'sidor' && (
              <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                {DRIVERS.map(driver => (
                  <div key={driver.name} className="space-y-8">
                    <div className="flex items-center gap-6 bg-white p-6 rounded-[3rem] shadow-xl border-b-4 border-emerald-500">
                      <img src={driver.img} className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" />
                      <div>
                        <h3 className="text-4xl font-black italic tracking-tighter text-slate-900">{driver.name}</h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Driver Schedule | Live Feed</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 px-4">
                      {TIME_SLOTS.map(slot => {
                        const order = truckOrders.find(o => o.driver_name === driver.name && o.order_time === slot);
                        return (
                          <div key={slot} className="flex items-center gap-8 group">
                            <span className="text-sm font-black font-mono text-slate-400 w-14">{slot}</span>
                            <div className={`flex-1 p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${order ? 'bg-emerald-500 text-slate-900 shadow-xl' : 'bg-white border border-slate-100 text-slate-300 font-black italic uppercase text-base'}`}>
                              {order ? (
                                <div className="flex items-center gap-6">
                                  <Truck size={20} className="opacity-40"/>
                                  <div className="flex flex-col">
                                    <span className="font-black text-xl leading-none">{order.client_info}</span>
                                    <span className="text-xs font-bold opacity-80 mt-1">{order.location}</span>
                                  </div>
                                </div>
                              ) : "זמין לשיבוץ"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ניהול מכולות חזר להציג הכל */}
            {activeTab === 'containers' && (
              <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {containerSites.map(site => (
                  <div key={site.id} className="bg-white p-8 rounded-[3rem] shadow-2xl relative border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-emerald-500 rounded-2xl text-slate-900 shadow-lg shadow-emerald-500/20">
                        {site.action_type === 'PLACEMENT' ? <Box size={24}/> : <RefreshCcw size={24}/>}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-widest">{site.contractor_name}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{site.client_name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 font-bold mt-1 text-sm"><MapPin size={16}/> { site.delivery_address }</div>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                       <span className="font-mono text-xl text-emerald-500 font-black">{site.start_date}</span>
                       <div className="w-1/2 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[60%]" />
                       </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* צ'אט הוחזר לצד שמאל של לוח השעות (או למטה במובייל) */}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-transparent overflow-hidden">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-8 scroll-smooth scrollbar-hide pb-40">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] p-8 rounded-[3rem] text-lg font-black shadow-2xl ${m.role === 'user' ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-900 text-white') : 'bg-emerald-500 text-slate-900'}`}>{m.content}</div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.5em] italic mr-4">חושב...</div>}
                </div>
                <footer className="fixed lg:static bottom-24 left-6 right-6 lg:p-10">
                  <form onSubmit={handleChat} className="max-w-5xl mx-auto relative group">
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב פקודה להזרקה או שאלה..." className={`w-full p-8 px-12 pr-28 rounded-[3rem] text-xl font-black outline-none transition-all shadow-2xl ${isDarkMode ? 'bg-[#1E293B] border border-white/5 text-white' : 'bg-white text-slate-900 border border-slate-100'}`} />
                    <button type="submit" className="absolute left-4 top-4 bg-emerald-500 text-slate-900 w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 shadow-xl transition-all"><Send size={28} className="rotate-180"/></button>
                  </form>
                </footer>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
