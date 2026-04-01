'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Truck, Box, MessageSquare, ChevronLeft, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/Layout';

// רכיב טיימר עם הבהוב להזמנות דחופות
const LiveTimer = ({ targetTime, date }: { targetTime: string, date: string }) => {
  const [diff, setDiff] = useState<number>(0);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(`${date}T${targetTime}`).getTime();
      const distance = target - now;
      setDiff(distance);
      setIsUrgent(distance > 0 && distance < 1800000); // פחות מ-30 דקות
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime, date]);

  const format = (ms: number) => {
    if (ms < 0) return "ביצוע...";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`px-3 py-1 rounded-full text-[11px] font-black font-mono transition-all ${
      isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
    }`}>
      {format(diff)}
    </div>
  );
};

export default function MasterDashboardV2() {
  const [orders, setOrders] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('master_live')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history');
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setOrders(o || []);
    setContainers(c || []);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0F1219] text-white flex flex-col lg:flex-row overflow-hidden" dir="rtl">
        <Head><title>SabanOS | Live Master</title></Head>

        {/* מרכז הבקרה הראשי */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 scrollbar-hide">
          <header className="flex justify-between items-center bg-[#161B26] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">OS</span></h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Live Operational Intelligence</p>
            </div>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className="lg:hidden p-3 bg-emerald-500 rounded-2xl shadow-lg">
              <MessageSquare size={20} className="text-[#0F1219]" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* כרטיסי הובלות */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest px-2">
                <Truck size={16} className="text-emerald-500" /> הובלות דחופות
              </h2>
              {orders.map(order => (
                <motion.div layout key={order.id} className="bg-[#161B26] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center group">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 transition-all group-hover:text-[#0F1219]">
                      <Box size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-base leading-tight">{order.client_info}</h3>
                      <p className="text-[11px] text-gray-500 font-bold">{order.location}</p>
                    </div>
                  </div>
                  <LiveTimer targetTime={order.order_time} date={order.delivery_date} />
                </motion.div>
              ))}
            </section>

            {/* כרטיסי מכולות */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest px-2">
                <Box size={16} className="text-blue-500" /> מכולות בשטח
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {containers.map(c => (
                  <div key={c.id} className="bg-[#161B26] p-5 rounded-[2rem] border-r-4 border-blue-500 relative shadow-xl">
                    <h3 className="font-black text-sm">{c.client_name}</h3>
                    <p className="text-[10px] text-gray-500 font-bold mb-4">{c.delivery_address}</p>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg font-black uppercase">{c.container_size || '8ק'}</span>
                      <span className="text-xl font-black italic">{c.days_on_site || 0}<span className="text-[10px] opacity-30 mr-1">ימים</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* צ'אט AI מובנה (Sidebar) */}
        <AnimatePresence>
          {(isChatOpen || (typeof window !== 'undefined' && window.innerWidth > 1024)) && (
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed lg:relative right-0 top-0 bottom-0 w-full lg:w-[400px] bg-[#0F1219] border-l border-white/5 z-[100] flex flex-col"
            >
              <div className="p-4 bg-[#161B26] border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="font-black italic text-emerald-500">SABAN AI SUPERVISOR</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="lg:hidden text-gray-500"><ChevronLeft /></button>
              </div>
              <iframe src="/admin/group-chat" className="flex-1 w-full border-none" />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
