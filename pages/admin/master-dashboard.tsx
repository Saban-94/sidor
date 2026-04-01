'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase'; // תיקון נתיב
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Truck, Box, MessageSquare, ChevronLeft, AlertTriangle } from 'lucide-react';
import Layout from '../../components/Layout'; // תיקון נתיב ושם ה-Import

// רכיב טיימר עם הבהוב להזמנות דחופות
const LiveTimer = ({ targetTime, date }: { targetTime: string, date: string }) => {
  const [diff, setDiff] = useState<number>(0);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(`${date}T${targetTime}`).getTime();
      const distance = target - now;
      setDiff(distance);
      // הבהוב אם נשאר פחות מחצי שעה
      setIsUrgent(distance > 0 && distance < 1800000);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime, date]);

  const format = (ms: number) => {
    if (ms <= 0) return "ביצוע...";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`px-4 py-1.5 rounded-full text-xs font-black font-mono transition-all duration-500 shadow-lg ${
      isUrgent 
        ? 'bg-red-600 text-white animate-pulse border-2 border-white/20' 
        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
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
    // האזנה לשינויים בזמן אמת ב-Supabase
    const channel = supabase.channel('master_dashboard_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders')
      .select('*')
      .eq('delivery_date', today)
      .neq('status', 'history');
    
    const { data: c } = await supabase.from('container_management')
      .select('*')
      .eq('is_active', true);
    
    setOrders(o || []);
    setContainers(c || []);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col lg:flex-row overflow-hidden font-sans" dir="rtl">
        <Head>
          <title>SabanOS | Command Center</title>
          <meta name="theme-color" content="#0A0E17" />
        </Head>

        {/* לוח הבקרה */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 scrollbar-hide pb-24 lg:pb-8">
          <header className="flex justify-between items-center bg-white/[0.03] p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 italic font-black text-black text-xl">S</div>
               <div>
                  <h1 className="text-2xl font-black italic tracking-tighter leading-none">SABAN <span className="text-emerald-500">OS</span></h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1 italic">Intelligence & Logistics</p>
               </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)} 
              className="lg:hidden p-4 bg-emerald-500 rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              <MessageSquare size={24} className="text-black" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* עמודת הובלות */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Truck size={18} className="text-emerald-500" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">הובלות להיום</h2>
              </div>
              <div className="space-y-3">
                {orders.length > 0 ? orders.map(order => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={order.id} 
                    className="bg-white/[0.02] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Box size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-base leading-tight">{order.client_info}</h3>
                        <p className="text-[11px] text-gray-500 font-bold mt-1">{order.location} | {order.driver_name}</p>
                      </div>
                    </div>
                    <LiveTimer targetTime={order.order_time} date={order.delivery_date} />
                  </motion.div>
                )) : (
                  <div className="text-center py-10 opacity-20 font-black italic">אין הובלות פעילות</div>
                )}
              </div>
            </section>

            {/* עמודת מכולות */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Box size={18} className="text-blue-500" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">מכולות בשטח</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {containers.map(c => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={c.id} 
                    className="bg-white/[0.02] p-5 rounded-[2.5rem] border-r-4 border-blue-500 border border-white/5 shadow-xl relative overflow-hidden"
                  >
                    <h3 className="font-black text-sm mb-1">{c.client_name}</h3>
                    <p className="text-[10px] text-gray-500 font-bold mb-4 truncate">{c.delivery_address}</p>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-black uppercase tracking-tighter border border-blue-500/20">
                        {c.container_size || '8ק'}
                      </span>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-600 font-bold uppercase">זמן בשטח</p>
                        <span className="text-2xl font-black italic tracking-tighter">{c.days_on_site || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* צ'אט AI מובנה בצידוד */}
        <AnimatePresence>
          {(isChatOpen || (typeof window !== 'undefined' && window.innerWidth > 1024)) && (
            <motion.aside 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              className="fixed lg:relative right-0 top-0 bottom-0 w-full lg:w-[450px] bg-[#0A0E17] border-l border-white/10 z-[100] flex flex-col shadow-2xl"
            >
              <div className="p-6 bg-white/[0.03] border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                  <span className="font-black italic text-emerald-500 tracking-tighter">SABAN AI COMMAND</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="lg:hidden text-gray-500 hover:text-white transition-colors">
                  <ChevronLeft size={28} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <iframe 
                  src="/admin/group-chat" 
                  className="w-full h-full border-none"
                  style={{ filter: 'invert(0.9) hue-rotate(180deg) brightness(1.1)' }}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
