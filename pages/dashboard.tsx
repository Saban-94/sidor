'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, ArrowRightLeft, Sun, Moon, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DRIVERS_DATA: Record<string, string> = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
};

export default function SabanLogisticsOS() {
  const [activeTab, setActiveTab] = useState<'live' | 'orders' | 'containers' | 'transfers' | 'chat'>('live');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // States לנתונים
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    const channel = supabase.channel('logistics_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate]);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: tr } = await supabase.from('transfers').select('*').eq('transfer_date', selectedDate);
    
    setTruckOrders(o || []);
    setContainerSites(c || []);
    setTransfers(tr || []);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return { expired: false, h, m, urgent: diff < 3600000 };
  };

  const deleteItem = async (id: string, table: string) => {
    if (!confirm("למחוק סופית?")) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  return (
    <div className={`flex h-screen w-full transition-all duration-500 ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN LOGISTICS | OS</title></Head>

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`w-20 lg:w-72 flex flex-col border-l ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="p-8 font-black text-2xl italic tracking-tighter flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg"><LayoutDashboard size={20}/></div>
          <span className="hidden lg:block uppercase">Saban OS</span>
        </div>
        <nav className="flex-1 p-4 space-y-4">
          {[
            { id: 'live', label: 'לוח LIVE', icon: Timer },
            { id: 'orders', label: 'הזמנות חומר', icon: Truck },
            { id: 'containers', label: 'מכולות', icon: Box },
            { id: 'transfers', label: 'העברות', icon: ArrowRightLeft },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={22} /> <span className="hidden lg:block font-black text-xs uppercase">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-8 text-slate-400">{isDarkMode ? <Sun/> : <Moon/>}</button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header עם יומן */}
        <header className={`h-24 flex items-center justify-between px-10 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4 bg-emerald-500/10 p-2 rounded-xl px-4 border border-emerald-500/20">
            <Calendar size={18} className="text-emerald-500"/>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm outline-none cursor-pointer" />
          </div>
          <div className="font-mono font-black text-3xl text-emerald-500">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* לוח LIVE - שליפה מכל הטבלאות */}
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[
                  ...truckOrders.map(t => ({ ...t, type: 'ORDER', title: t.client_info, sub: t.location, target: `${t.delivery_date}T${t.order_time}` })),
                  ...containerSites.map(c => ({ ...c, type: 'CONTAINER', title: c.client_name, sub: c.delivery_address, target: `${c.start_date}T${c.order_time || '08:00'}` })),
                  ...transfers.map(tr => ({ ...tr, type: 'TRANSFER', title: `העברה: ${tr.to_branch}`, sub: `מ-${tr.from_branch}`, target: `${tr.transfer_date}T${tr.transfer_time}` }))
                ].filter(o => !calculateTime(o.target).expired).map(order => {
                  const t = calculateTime(order.target);
                  return (
                    <div key={order.id} className={`p-8 rounded-[3rem] shadow-2xl relative border-2 ${isDarkMode ? 'bg-[#161B2C] border-transparent' : 'bg-white border-slate-100'} ${t.urgent ? 'border-amber-500 animate-pulse' : ''}`}>
                      <div className="flex justify-between mb-4">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${order.type === 'TRANSFER' ? 'bg-indigo-600' : (order.type === 'CONTAINER' ? 'bg-emerald-600' : 'bg-slate-700')}`}>{order.type}</span>
                        <div className="flex items-center gap-2 text-emerald-500 font-black font-mono">{order.order_time || order.transfer_time}</div>
                      </div>
                      <h3 className="text-3xl font-black tracking-tighter mb-2">{order.title}</h3>
                      <p className="text-slate-500 font-bold text-sm italic mb-8">{order.sub}</p>
                      <div className={`p-6 rounded-[2rem] flex items-center justify-between ${t.urgent ? 'bg-amber-500 text-white' : 'bg-slate-900 text-emerald-400'}`}>
                         <div className="flex items-center gap-3"><Clock size={24}/><span className="text-3xl font-black font-mono">{t.h}:{t.expired ? '00' : '00'}</span></div>
                         <span className="text-[10px] font-black uppercase">יעד</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* דף העברות - טבלה ייעודית */}
            {activeTab === 'transfers' && (
              <motion.div key="transfers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-center"><h2 className="text-4xl font-black italic tracking-tighter">ניהול העברות</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {transfers.map(tr => (
                    <div key={tr.id} className={`p-8 rounded-[3rem] shadow-xl ${isDarkMode ? 'bg-[#161B2C]' : 'bg-white'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white"><ArrowRightLeft size={24}/></div>
                        <button onClick={() => deleteItem(tr.id, 'transfers')} className="text-slate-500 hover:text-red-500"><Trash2 size={20}/></button>
                      </div>
                      <h3 className="text-2xl font-black">מ-{tr.from_branch} ל-{tr.to_branch}</h3>
                      <p className="text-slate-400 font-bold mt-1 uppercase text-xs">נהג מבצע: {tr.driver_name}</p>
                      <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                        <span className="font-mono text-xl text-emerald-500 font-black">{tr.transfer_time}</span>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${tr.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{tr.status === 'active' ? 'בביצוע' : 'היסטוריה'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* דפי מכולות והזמנות - טבלאות נפרדות... */}
            {/* (ממשיך את אותה לוגיקה לכל דף בנפרד) */}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
