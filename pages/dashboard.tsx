'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, ChevronRight, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, User, X, Save, Calendar, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// --- הגדרות קבועות לנהגים ---
const DRIVERS_DATA: Record<string, string> = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg',
  'אבי': 'https://i.pravatar.cc/150?u=avi'
};

// --- הגדרות צבעים לפי מחסן מכולות ---
const CONTRACTOR_COLORS: Record<string, string> = {
  'שארק 30': 'bg-orange-500',
  'כראדי 32': 'bg-blue-600',
  'שי שרון 40': 'bg-purple-600',
  'Default': 'bg-emerald-500'
};

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanUnifiedControl() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'chat'>('live');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
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
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/order-notification.mp3');
    }
    const channel = supabase.channel('realtime_all').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: t } = await supabase.from('orders').select('*').order('order_time', { ascending: true });
    if (c) setContainerSites(c);
    if (t) setTruckOrders(t);
  };

  const calculateCountdown = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true, text: "בביצוע" };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  const deleteItem = async (id: string, type: 'CONTAINER' | 'ORDER') => {
    if (!confirm("אחי, למחוק את המשימה לצמיתות?")) return;
    const table = type === 'CONTAINER' ? 'container_management' : 'orders';
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    const table = editingItem.type === 'CONTAINER' ? 'container_management' : 'orders';
    const updateData = editingItem.type === 'CONTAINER' 
      ? { client_name: editingItem.mainTitle, delivery_address: editingItem.subTitle, order_time: editingItem.order_time }
      : { client_info: editingItem.mainTitle, location: editingItem.subTitle, order_time: editingItem.order_time };

    await supabase.from(table).update(updateData).eq('id', editingItem.id);
    setEditingItem(null);
    fetchData();
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.reply.includes('בוצע')) { audioRef.current?.play(); fetchData(); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#F0F4F8] text-slate-900 overflow-hidden" dir="rtl">
      <Head><title>SABAN | COMMAND CENTER</title></Head>

      {/* Sidebar - PWA Style */}
      <motion.aside animate={{ width: isSidebarOpen ? 280 : 85 }} className="bg-[#0F172A] text-white flex flex-col z-50 shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20"><Truck size={24} className="text-slate-900"/></div>
          {isSidebarOpen && <span className="font-black text-2xl italic tracking-tighter uppercase">SABAN OS</span>}
        </div>
        <nav className="flex-1 p-5 space-y-3">
          {[
            { id: 'live', label: 'משימות להיום', icon: Timer },
            { id: 'sidor', label: 'סידור נהגים', icon: Truck },
            { id: 'containers', label: 'ניהול מכולות', icon: Box },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={26} /> {isSidebarOpen && <span className="text-sm font-black uppercase tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>
      </motion.aside>

      <main className="flex-1 flex flex-col relative min-w-0 bg-white/40 backdrop-blur-md">
        
        {/* Modal עריכה - מעוצב מחדש */}
        <AnimatePresence>
          {editingItem && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl space-y-8">
                <h2 className="text-3xl font-black italic tracking-tighter">עדכון משימה</h2>
                <div className="space-y-5">
                  <div className="space-y-2"><label className="text-xs font-black uppercase mr-4">שם הלקוח</label><input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none" value={editingItem.mainTitle} onChange={e => setEditingItem({...editingItem, mainTitle: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs font-black uppercase mr-4">כתובת יעד</label><input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none" value={editingItem.subTitle} onChange={e => setEditingItem({...editingItem, subTitle: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs font-black uppercase mr-4">שעת ביצוע</label><input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none" value={editingItem.order_time} onChange={e => setEditingItem({...editingItem, order_time: e.target.value})} /></div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={handleUpdate} className="flex-1 bg-emerald-500 text-slate-900 p-5 rounded-3xl font-black text-lg shadow-lg hover:scale-105 active:scale-95 transition-all">שמור שינויים</button>
                  <button onClick={() => setEditingItem(null)} className="flex-1 bg-slate-100 text-slate-500 p-5 rounded-3xl font-black text-lg">ביטול</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          
          {/* דף משימות להיום - Dashboard המאוחד */}
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 h-full overflow-y-auto space-y-12">
              <header className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div>
                  <h1 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase">לוח בקרה מרכזי</h1>
                  <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">מעקב משימות וזמני אספקה</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black font-mono text-emerald-600">{now.toLocaleTimeString('he-IL')}</div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Live System Feed</div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pb-10">
                {/* שילוב מכולות והובלות בדף אחד */}
                {[
                  ...containerSites.map(s => ({ ...s, type: 'CONTAINER', mainTitle: s.client_name, subTitle: s.delivery_address, target: `${s.start_date}T${s.order_time || '08:00'}`, person: s.contractor_name })),
                  ...truckOrders.map(t => ({ ...t, type: 'ORDER', mainTitle: t.client_info, subTitle: t.location, target: `${t.delivery_date}T${t.order_time}`, person: t.driver_name }))
                ].filter(o => !calculateCountdown(o.target).expired).map(order => {
                  const timer = calculateCountdown(order.target);
                  return (
                    <motion.div 
                      key={order.id} 
                      animate={timer.urgent ? { boxShadow: "0px 0px 40px rgba(245, 158, 11, 0.2)", scale: 1.02 } : {}}
                      className="bg-white p-10 rounded-[3.5rem] shadow-xl border-2 border-transparent relative group hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex justify-between">
                         <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${order.type === 'CONTAINER' ? (CONTRACTOR_COLORS[order.person] || 'bg-emerald-500') : 'bg-slate-900'}`}>
                           {order.type === 'CONTAINER' ? `מכולה | ${order.person}` : `הובלה | ${order.person}`}
                         </div>
                         <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditingItem(order)} className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-emerald-500 hover:text-white shadow-sm"><Edit3 size={18}/></button>
                            <button onClick={() => deleteItem(order.id, order.type as any)} className="p-3 bg-slate-100 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white shadow-sm"><Trash2 size={18}/></button>
                         </div>
                      </div>

                      <h2 className="text-4xl font-black text-slate-900 mt-8 tracking-tighter leading-none">{order.mainTitle}</h2>
                      <div className="flex items-center gap-2 text-slate-400 font-bold mt-4 text-sm italic"><MapPin size={16} className="text-emerald-500"/> {order.subTitle}</div>

                      {/* Countdown Timer */}
                      <div className={`mt-10 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl ${timer.urgent ? 'bg-amber-500 text-white animate-pulse shadow-amber-500/30' : 'bg-slate-900 text-emerald-400 shadow-slate-900/20'}`}>
                        <div className="flex items-center gap-4">
                          <Clock size={32}/>
                          <span className="text-5xl font-black font-mono tracking-tighter">
                            {`${String(timer.h).padStart(2,'0')}:${String(timer.m).padStart(2,'0')}:${String(timer.s).padStart(2,'0')}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{timer.urgent ? 'דחוף!' : 'זמן יעד'}</span>
                      </div>

                      <div className="mt-8 flex items-center gap-4 border-t border-slate-50 pt-6">
                         {order.type === 'ORDER' ? (
                           <img src={DRIVERS_DATA[order.person] || 'https://i.pravatar.cc/150'} className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg" />
                         ) : (
                           <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><Box size={24}/></div>
                         )}
                         <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">מבצע המשימה</span>
                           <span className="text-lg font-black text-slate-900">{order.person}</span>
                         </div>
                         <div className="mr-auto font-black font-mono text-slate-400 text-xl">{order.order_time}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* לוח סידור נהגים קלאסי */}
          {activeTab === 'sidor' && (
            <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 h-full overflow-y-auto space-y-16 scrollbar-hide">
              {Object.keys(DRIVERS_DATA).map(name => (
                <div key={name} className="space-y-8">
                  <div className="flex items-center gap-6 bg-white p-6 rounded-[3rem] shadow-xl border-b-4 border-emerald-500">
                    <img src={DRIVERS_DATA[name]} className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" />
                    <div>
                      <h3 className="text-4xl font-black italic tracking-tighter">{name}</h3>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Driver Schedule | Live Feed</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 px-4">
                    {TIME_SLOTS.map(slot => {
                      const order = truckOrders.find(o => o.driver_name === name && o.order_time === slot);
                      return (
                        <div key={slot} className="flex items-center gap-8 group">
                          <span className="text-sm font-black font-mono text-slate-400 w-14">{slot}</span>
                          <div className={`flex-1 p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${order ? 'bg-emerald-500 text-slate-900 shadow-xl' : 'bg-white border border-slate-100 text-slate-300 font-black italic uppercase text-base'}`}>
                            {order ? (
                              <div className="flex items-center gap-6">
                                <Truck size={20} className="opacity-40"/>
                                <div className="flex flex-col">
                                  <span className="font-black text-xl leading-none">{order.client_info}</span>
                                  <span className="text-xs font-bold opacity-80 mt-1">{order.location} | {order.source_branch}</span>
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

          {/* צ'אט AI מלא */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-white">
              <header className="p-10 border-b flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-900 rounded-3xl shadow-2xl shadow-emerald-500/20"><Bot size={24} className="text-emerald-400"/></div>
                  <div>
                    <h2 className="font-black text-3xl italic uppercase tracking-tighter">AI Supervisor</h2>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Saban Intelligence Unified</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"/>
                  <span className="text-xs font-black text-slate-400 uppercase">System Syncing</span>
                </div>
              </header>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-10 bg-[#F9FAFB] scrollbar-hide">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] p-10 rounded-[3.5rem] text-lg font-black shadow-2xl transition-all leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-emerald-500/5'}`}>{m.content}</div>
                  </div>
                ))}
                {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.6em] italic mr-4">Processing Command...</div>}
              </div>
              <footer className="p-10 bg-white border-t border-slate-100">
                <form onSubmit={handleChat} className="max-w-6xl mx-auto relative group">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="הזמן הובלה, מכולה או שאל על המצב בשטח..." className="w-full bg-slate-100 border-none rounded-[3rem] py-8 px-14 pr-28 text-xl font-black outline-none focus:bg-white shadow-inner transition-all border-2 border-transparent focus:border-emerald-500/20" />
                  <button type="submit" className="absolute left-4 top-4 bg-slate-900 text-emerald-400 w-20 h-20 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-90"><Send size={32} className="rotate-180"/></button>
                </form>
              </footer>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
