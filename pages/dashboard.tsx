'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, User, MapPin, 
  CheckCircle2, BellRing, Bot, Truck, ChevronRight, PlusCircle, Box, 
  RefreshCcw, History, Edit3, Trash2, AlertTriangle, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanOSV4() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'history' | 'chat'>('live');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const channel = supabase.channel('realtime_updates').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(timer); channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const { data: containers } = await supabase.from('container_management').select('*');
    const { data: trucks } = await supabase.from('orders').select('*');
    
    // איחוד וסידור נתונים
    const unified = [
      ...(containers || []).map(c => ({ ...c, type: 'CONTAINER', title: c.client_name, target: `${c.start_date}T${c.order_time || '08:00'}` })),
      ...(trucks || []).map(t => ({ ...t, type: 'TRUCK', title: t.client_info, target: `${t.delivery_date}T${t.order_time}` }))
    ];
    setAllOrders(unified);
  };

  const getTimeRemaining = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - currentTime.getTime();
    if (diff <= 0) return { total: 0, hours: 0, mins: 0, secs: 0, isUrgent: false, isExpired: true };
    const secs = Math.floor((diff / 1000) % 60);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)));
    return { total: diff, hours, mins, secs, isUrgent: diff < 3600000, isExpired: false };
  };

  const deleteOrder = async (id: string, type: string) => {
    if (!confirm('בוס, למחוק את ההזמנה?')) return;
    const table = type === 'CONTAINER' ? 'container_management' : 'orders';
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7FE] font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN | Command Center</title></Head>

      {/* Sidebar */}
      <motion.aside animate={{ width: isSidebarOpen ? 260 : 80 }} className="h-full bg-slate-900 text-white flex flex-col z-50 shrink-0 shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 bg-emerald-500 rounded-xl"><LayoutDashboard size={20} className="text-slate-900" /></div>
          {isSidebarOpen && <span className="font-black italic text-lg tracking-tighter uppercase">SABAN OS</span>}
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab('live')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === 'live' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
            <Timer size={20} /> {isSidebarOpen && <span className="font-bold text-sm">מבצעים בשידור חי</span>}
          </button>
          <button onClick={() => setActiveTab('sidor')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === 'sidor' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-white/5'}`}>
            <Truck size={20} /> {isSidebarOpen && <span className="font-bold text-sm">סידור הובלות</span>}
          </button>
          <button onClick={() => setActiveTab('containers')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === 'containers' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-white/5'}`}>
            <Container size={20} /> {isSidebarOpen && <span className="font-bold text-sm">ניהול מכולות</span>}
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === 'history' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-white/5'}`}>
            <History size={20} /> {isSidebarOpen && <span className="font-bold text-sm">היסטוריית הזמנות</span>}
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === 'chat' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-white/5'}`}>
            <Bot size={20} /> {isSidebarOpen && <span className="font-bold text-sm">AI Supervisor</span>}
          </button>
        </nav>
      </motion.aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* דף מבצעים בשידור חי - Live Dashboard */}
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full overflow-y-auto space-y-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">המשימות להיום</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allOrders.filter(o => !getTimeRemaining(o.target).isExpired).map(order => {
                  const time = getTimeRemaining(order.target);
                  return (
                    <motion.div 
                      key={order.id} 
                      animate={time.isUrgent ? { scale: [1, 1.02, 1], borderColor: ['#f1f5f9', '#f59e0b', '#f1f5f9'] } : {}}
                      transition={time.isUrgent ? { repeat: Infinity, duration: 2 } : {}}
                      className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-transparent relative overflow-hidden group"
                    >
                      <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl ${order.type === 'CONTAINER' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          {order.type === 'CONTAINER' ? <Box size={24}/> : <Truck size={24}/>}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-emerald-500 hover:text-white"><Edit3 size={16}/></button>
                          <button onClick={() => deleteOrder(order.id, order.type)} className="p-2 bg-slate-100 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mt-4 leading-tight">{order.title}</h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-1"><MapPin size={12}/> {order.location || order.delivery_address}</div>
                      
                      {/* Timer Section */}
                      <div className={`mt-6 p-4 rounded-2xl flex items-center justify-between ${time.isUrgent ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                         <div className="flex items-center gap-2">
                           <Clock size={16} className={time.isUrgent ? 'animate-spin' : ''}/>
                           <span className="text-lg font-black font-mono">
                             {time.hours.toString().padStart(2, '0')}:{time.mins.toString().padStart(2, '0')}:{time.secs.toString().padStart(2, '0')}
                           </span>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest">{time.isUrgent ? 'דחוף!' : 'עד ליעד'}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* דף היסטוריה - Archive */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full overflow-y-auto">
              <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter">היסטוריית הזמנות</h2>
              <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
                <table className="w-full text-right">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-[0.2em]">
                    <tr>
                      <th className="p-6">לקוח</th>
                      <th className="p-6">כתובת</th>
                      <th className="p-6">סוג</th>
                      <th className="p-6">נהג/קבלן</th>
                      <th className="p-6">בוצע בתאריך</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allOrders.filter(o => getTimeRemaining(o.target).isExpired).map(o => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-black text-slate-900">{o.title}</td>
                        <td className="p-6 text-slate-400 text-xs font-bold">{o.location || o.delivery_address}</td>
                        <td className="p-6">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black ${o.type === 'CONTAINER' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                             {o.type}
                           </span>
                        </td>
                        <td className="p-6 font-mono text-xs">{o.driver_name || o.contractor_name}</td>
                        <td className="p-6 font-bold text-slate-400 text-xs">{o.target.replace('T', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* שאר הדפים (Sidor/Containers/Chat) - נשארים כפי שהיו */}
          {/* ... */}
          
        </AnimatePresence>
      </main>
    </div>
  );
}
