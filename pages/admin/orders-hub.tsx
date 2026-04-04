'use client';
import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Package, Eye, Save, 
  Printer, Share2, Truck, MessageSquare, BellRing 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase.channel('realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        fetchOrders();
        // עקיפת שגיאת ה-Property 'has_new_note' 
        if (payload.new && (payload.new as any).has_new_note) {
          audioRef.current?.play().catch(() => {});
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateOrder = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { ...updates, has_new_note: false } })
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Update error", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 pb-20" dir="rtl">
      <Head><title>SABAN OS | CONTROL CENTER</title></Head>
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />

      {/* Header משרדי יוקרתי */}
      <header className="bg-slate-900 text-white sticky top-0 z-[100] p-6 md:p-10 flex justify-between items-center shadow-2xl border-b-8 border-blue-600">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-[2rem] shadow-lg animate-pulse"><ShoppingBag size={35} /></div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">SABAN <span className="text-blue-400">LOGISTICS</span></h1>
            <p className="text-[12px] text-slate-400 font-bold tracking-[0.5em] uppercase mt-2">Professional Control Tower</p>
          </div>
        </div>
        <div className="bg-slate-800 border-2 border-slate-700 px-8 py-3 rounded-[2rem] flex items-center gap-5 shadow-inner">
          <BellRing className="text-emerald-400 animate-bounce" size={28} />
          <span className="text-3xl font-black italic">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      <main className="p-4 md:p-12 max-w-[1900px] mx-auto space-y-12">
        <AnimatePresence>
          {orders.map((order) => {
            const isChameleon = order.has_new_note === true;

            return (
              <motion.div 
                layout 
                key={order.id} 
                className={`relative rounded-[4rem] overflow-hidden border-4 transition-all duration-1000 ${isChameleon ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_80px_rgba(16,185,129,0.2)]' : 'border-white bg-white shadow-2xl'}`}
              >
                <div className="p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
                  <div className={`w-28 h-28 md:w-44 md:h-44 rounded-[3.5rem] flex flex-col items-center justify-center font-black italic shadow-2xl shrink-0 ${isChameleon ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                    <span className="text-xs opacity-40 uppercase tracking-widest">ID</span>
                    <span className="text-4xl md:text-8xl">#{order.order_number}</span>
                  </div>
                  
                  <div className="flex-1 text-center md:text-right w-full">
                    <div className="flex items-center justify-center md:justify-start gap-5 mb-5">
                       {isChameleon && <span className="bg-emerald-600 text-white text-sm px-6 py-2 rounded-full font-black animate-bounce shadow-xl italic">🦎 הערה דחופה מהצאט</span>}
                       <span className="text-base font-bold text-slate-400 flex items-center gap-2 bg-slate-50 px-5 py-2 rounded-2xl border"><Clock size={20}/> {order.order_time}</span>
                    </div>
                    <h2 className="text-4xl md:text-[9rem] font-black text-slate-900 tracking-tighter leading-none italic uppercase truncate">{order.product_name || "סל מוצרים"}</h2>
                    <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                       <span className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] text-xl font-black italic shadow-xl"><Truck size={24} className="text-blue-400 inline ml-3"/> {order.client_info}</span>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-6 shrink-0 z-50">
                    <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className={`p-10 md:p-14 rounded-[3.5rem] md:rounded-[4.5rem] transition-all shadow-xl ${expandedId === order.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}><Eye size={55}/></button>
                    <button onClick={() => updateOrder(order.id, { status: 'completed' })} className={`p-10 md:p-14 rounded-[3.5rem] md:rounded-[4.5rem] text-white shadow-xl ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500 shadow-orange-100'}`}><CheckCircle size={55}/></button>
                  </div>
                </div>

                {expandedId === order.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-10 md:p-24 bg-slate-50 border-t-8 border-slate-100 space-y-16 italic font-black">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <div className="bg-white p-12 rounded-[4.5rem] border-4 border-slate-100 shadow-2xl group hover:border-blue-500 transition-all">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] block mb-6">שעת אספקה למערכת</span>
                        <input className="text-5xl md:text-9xl font-black text-blue-600 bg-transparent outline-none w-full italic" defaultValue={order.delivery_time} onBlur={(e) => updateOrder(order.id, { delivery_time: e.target.value })} placeholder="-- : --" />
                      </div>

                      <div className="bg-white p-12 rounded-[4.5rem] border-4 border-slate-100 shadow-2xl group hover:border-slate-900 transition-all">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] block mb-6">נהג משויך / מנוף</span>
                        <input className="text-5xl md:text-9xl font-black text-slate-900 bg-transparent outline-none w-full italic" defaultValue={order.driver_info} onBlur={(e) => updateOrder(order.id, { driver_info: e.target.value })} placeholder="שם הנהג..." />
                      </div>

                      <div className={`p-12 rounded-[4.5rem] border-8 shadow-3xl flex flex-col justify-center transition-all duration-1000 ${isChameleon ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-white'}`}>
                        <div className="flex items-center gap-4 mb-6 text-sm font-black uppercase tracking-[0.5em] opacity-60"><MessageSquare size={35}/> הודעה מהלקוח</div>
                        <p className="text-3xl md:text-6xl font-black italic leading-none tracking-tighter">{order.customer_note || "ממתין להערות"}</p>
                      </div>
                    </div>

                    <div className="bg-white p-16 md:p-24 rounded-[6rem] border-8 border-slate-200 shadow-inner">
                      <div className="text-5xl md:text-[10rem] font-black text-slate-800 leading-[0.8] tracking-tighter whitespace-pre-line italic uppercase">
                        {order.warehouse}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-10 pt-10">
                      <button onClick={() => window.print()} className="flex-1 py-14 bg-slate-900 text-white rounded-[4rem] font-black text-5xl flex items-center justify-center gap-8 hover:bg-blue-600 transition-all shadow-3xl group"><Printer size={60} className="group-hover:animate-bounce"/> הדפסה</button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(order.warehouse)}`)} className="flex-1 py-14 bg-emerald-500 text-white rounded-[4rem] font-black text-5xl flex items-center justify-center gap-8 shadow-3xl"><Share2 size={60}/> WhatsApp</button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        body { background: #F1F5F9; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
}
