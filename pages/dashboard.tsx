'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, ChevronRight, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, User, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// --- נהגים עם התמונות המקוריות שלך ---
const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanFinalOS() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'history' | 'chat'>('live');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null); // לוגיקת עריכה
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

  const fetchData = async () => {
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: t } = await supabase.from('orders').select('*');
    if (c) setContainerSites(c);
    if (t) setTruckOrders(t);
  };

  const calculateDays = (date: string) => {
    const diff = Math.abs(new Date().getTime() - new Date(date).getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleUpdate = async () => {
    if (!editingOrder) return;
    const table = editingOrder.type === 'CONTAINER' ? 'container_management' : 'orders';
    const idField = editingOrder.id;
    
    const updateData = editingOrder.type === 'CONTAINER' 
      ? { client_name: editingOrder.mainTitle, delivery_address: editingOrder.subTitle, order_time: editingOrder.order_time }
      : { client_info: editingOrder.mainTitle, location: editingOrder.subTitle, order_time: editingOrder.order_time };

    await supabase.from(table).update(updateData).eq('id', idField);
    setEditingOrder(null);
    fetchData();
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
    const userMsg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.reply.includes('בוצע')) { audioRef.current?.play(); fetchData(); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#F0F2F5] text-slate-900 overflow-hidden" dir="rtl">
      <Head><title>SABAN OS | CONTROL</title></Head>

      {/* Sidebar */}
      <motion.aside animate={{ width: isSidebarOpen ? 280 : 85 }} className="bg-[#1A1C23] text-white flex flex-col z-50 shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="p-3 bg-emerald-500 rounded-2xl"><Truck size={24} className="text-slate-900"/></div>
          {isSidebarOpen && <span className="font-black text-2xl tracking-tighter italic">SABAN OS</span>}
        </div>
        <nav className="flex-1 p-5 space-y-3">
          {[{ id: 'live', label: 'משימות', icon: Timer }, { id: 'sidor', label: 'נהגים', icon: Truck }, { id: 'containers', label: 'מכולות', icon: Box }, { id: 'chat', label: 'AI Supervisor', icon: Bot }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={24} /> {isSidebarOpen && <span className="text-sm uppercase font-black">{item.label}</span>}
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm overflow-hidden">
        
        {/* עריכת הזמנה - Modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter">עריכת פרטי הזמנה</h2>
              <div className="space-y-4">
                <input className="w-full p-4 bg-slate-100 rounded-2xl font-bold" value={editingOrder.mainTitle} onChange={e => setEditingOrder({...editingOrder, mainTitle: e.target.value})} placeholder="שם הלקוח" />
                <input className="w-full p-4 bg-slate-100 rounded-2xl font-bold" value={editingOrder.subTitle} onChange={e => setEditingOrder({...editingOrder, subTitle: e.target.value})} placeholder="כתובת" />
                <input className="w-full p-4 bg-slate-100 rounded-2xl font-bold" value={editingOrder.order_time} onChange={e => setEditingOrder({...editingOrder, order_time: e.target.value})} placeholder="שעה" />
              </div>
              <div className="flex gap-4">
                <button onClick={handleUpdate} className="flex-1 bg-emerald-500 text-slate-900 p-4 rounded-2xl font-black flex items-center justify-center gap-2"><Save size={18}/> שמור שינויים</button>
                <button onClick={() => setEditingOrder(null)} className="flex-1 bg-slate-100 text-slate-500 p-4 rounded-2xl font-black">ביטול</button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ניהול נהגים (Sidor) */}
          {activeTab === 'sidor' && (
            <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 h-full overflow-y-auto space-y-12">
              {DRIVERS.map(driver => (
                <div key={driver.name} className="space-y-6">
                  <div className="flex items-center gap-5 bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <img src={driver.img} className="w-20 h-20 rounded-full border-4 border-emerald-500 object-cover shadow-lg" />
                    <h3 className="text-3xl font-black italic tracking-tighter">{driver.name}</h3>
                  </div>
                  <div className="space-y-3 px-6">
                    {TIME_SLOTS.map(slot => {
                      const order = truckOrders.find(o => o.driver_name === driver.name && o.order_time === slot);
                      return (
                        <div key={slot} className="flex items-center gap-6 group">
                          <span className="text-sm font-black font-mono text-slate-400 w-12">{slot}</span>
                          <div className={`flex-1 p-5 rounded-3xl flex items-center justify-between transition-all ${order ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'border-b border-slate-100 text-slate-300 font-black italic uppercase text-sm'}`}>
                            {order ? (
                              <>
                                <div className="flex flex-col"><span className="font-black text-lg">{order.client_info}</span><span className="text-xs font-bold opacity-70">{order.location}</span></div>
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingOrder({ id: order.id, type: 'TRUCK', mainTitle: order.client_info, subTitle: order.location, order_time: order.order_time })} className="p-2 bg-white/20 rounded-xl hover:bg-white/40"><Edit3 size={16}/></button>
                                  <button onClick={() => deleteItem(order.id, 'TRUCK')} className="p-2 bg-white/20 rounded-xl hover:bg-red-500"><Trash2 size={16}/></button>
                                </div>
                              </>
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

          {/* ניהול מכולות (Containers) */}
          {activeTab === 'containers' && (
            <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {containerSites.map(site => {
                const days = calculateDays(site.start_date);
                const isUrgent = days >= 9;
                return (
                  <div key={site.id} className="bg-white p-8 rounded-[3rem] shadow-2xl relative border-2 border-transparent hover:border-emerald-500 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-emerald-500 rounded-2xl text-slate-900 shadow-lg shadow-emerald-500/20">
                        {site.action_type === 'PLACEMENT' ? <Box size={24}/> : <RefreshCcw size={24}/>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => setEditingOrder({ id: site.id, type: 'CONTAINER', mainTitle: site.client_name, subTitle: site.delivery_address, order_time: site.order_time })} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-emerald-500 hover:text-white"><Edit3 size={18}/></button>
                         <button onClick={() => deleteItem(site.id, 'CONTAINER')} className="p-2 bg-slate-100 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-none">{site.client_name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 font-bold mt-3 text-sm italic"><MapPin size={16} className="text-emerald-500"/> {site.delivery_address}</div>
                    
                    <div className="mt-8 space-y-3">
                       <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className={isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-400'}>ימים בשטח: {days}/10</span>
                          <span className="text-emerald-500">{site.contractor_name}</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} style={{ width: `${Math.min((days/10)*100, 100)}%` }} />
                       </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* דף צ'אט AI מלא */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-white">
              <header className="p-8 border-b flex items-center justify-between">
                <div className="flex items-center gap-4"><div className="p-3 bg-slate-900 rounded-2xl shadow-xl"><Bot className="text-emerald-400"/></div><span className="font-black text-xl italic uppercase tracking-tighter">Unified Brain Supervisor</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Integration</span></div>
              </header>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-8 bg-[#F8F9FB] scrollbar-hide">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] p-8 rounded-[3rem] text-base font-black shadow-2xl transition-all ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>{m.content}</div>
                  </div>
                ))}
              </div>
              <footer className="p-10 bg-white border-t">
                <form onSubmit={handleChat} className="max-w-5xl mx-auto relative">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב פקודה להזרקה או שאלה..." className="w-full bg-slate-100 border-none rounded-[2.5rem] py-8 px-12 pr-24 text-xl font-black outline-none focus:bg-white shadow-inner transition-all" />
                  <button type="submit" className="absolute left-4 top-4 bg-slate-900 text-emerald-400 w-16 h-16 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-90"><Send size={28} className="rotate-180"/></button>
                </form>
              </footer>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
