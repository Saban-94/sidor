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
    
    const channel = supabase.channel('live-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        // הגנה ל-TypeScript: בדיקה דינמית של השדה
        const newRecord = payload.new as any;
        if (newRecord && newRecord.has_new_note) {
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
      // שליחה ל-API המאובטח לעקיפת חסימות RLS
      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { ...updates, has_new_note: false } })
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handlePrint = (order: any) => {
    const win = window.open('', '', 'width=900,height=700');
    win?.document.write(`
      <div dir="rtl" style="font-family: sans-serif; padding: 40px;">
        <h1 style="border-bottom: 5px solid #000;">ח. סבן | הזמנה #${order.order_number}</h1>
        <p><strong>לקוח:</strong> ${order.client_info}</p>
        <p><strong>אספקה:</strong> ${order.delivery_time || 'בתיאום'} | <strong>נהג:</strong> ${order.driver_info || 'לא שויך'}</p>
        <hr/>
        <pre style="font-size: 22px; font-weight: bold; white-space: pre-wrap;">${order.warehouse}</pre>
      </div>
    `);
    win?.document.close();
    win?.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 italic" dir="rtl">
      <Head><title>SABAN LOGISTICS | CONTROL CENTER</title></Head>
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />

      <header className="bg-slate-900 text-white sticky top-0 z-[100] p-6 md:p-8 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg animate-pulse"><ShoppingBag size={24} /></div>
          <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase">SABAN <span className="text-blue-400">LOGISTICS</span></h1>
        </div>
        <div className="bg-slate-800 border border-slate-700 px-6 py-2 rounded-2xl flex items-center gap-3">
          <BellRing className="text-emerald-400" size={20} />
          <span className="font-black text-xl">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      <main className="p-4 md:p-10 max-w-[1600px] mx-auto space-y-6">
        <AnimatePresence>
          {orders.map((order) => {
            const isChameleon = order.has_new_note === true; // זיקית רק אם יש הערה

            return (
              <motion.div layout key={order.id} className={`relative rounded-[3rem] overflow-hidden border-4 transition-all duration-700 ${isChameleon ? 'border-emerald-500 bg-emerald-50 shadow-2xl' : 'border-white bg-white shadow-xl'}`}>
                
                <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[2.5rem] flex flex-col items-center justify-center font-black italic shadow-2xl shrink-0 ${isChameleon ? 'bg-emerald-500 text-white animate-bounce' : 'bg-slate-900 text-white'}`}>
                    <span className="text-[10px] opacity-40 uppercase tracking-tighter">ID</span>
                    <span className="text-3xl md:text-5xl">#{order.order_number}</span>
                  </div>
                  
                  <div className="flex-1 text-center md:text-right w-full">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                       {isChameleon && <span className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-full font-black animate-pulse shadow-md">🦎 הערה חדשה</span>}
                       <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={14}/> {order.order_time}</span>
                    </div>
                    <h2 className="text-3xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">{order.product_name || "סל מוצרים"}</h2>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-6 md:p-8 rounded-[2rem] bg-slate-100 text-slate-400 hover:bg-slate-200"><Eye size={32}/></button>
                    <button onClick={() => updateOrder(order.id, { status: 'completed' })} className={`p-6 md:p-8 rounded-[2rem] text-white shadow-xl ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'}`}><CheckCircle size={32}/></button>
                  </div>
                </div>

                {expandedId === order.id && (
                  <div className="p-8 md:p-16 bg-slate-50 border-t-4 border-slate-100 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">שעת אספקה</span>
                        <input className="text-3xl font-black text-blue-600 bg-transparent outline-none w-full italic" defaultValue={order.delivery_time} onBlur={(e) => updateOrder(order.id, { delivery_time: e.target.value })} placeholder="--:--" />
                      </div>
                      <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">נהג / מנוף</span>
                        <input className="text-3xl font-black text-slate-900 bg-transparent outline-none w-full italic" defaultValue={order.driver_info} onBlur={(e) => updateOrder(order.id, { driver_info: e.target.value })} placeholder="שם הנהג..." />
                      </div>
                      <div className={`p-8 rounded-[3rem] border-4 shadow-xl flex flex-col justify-center ${isChameleon ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase opacity-60 italic"><MessageSquare size={14}/> הערה מהצאט</div>
                        <p className="text-xl md:text-3xl font-black italic leading-tight">{order.customer_note || "אין הערות"}</p>
                      </div>
                    </div>

                    <div className="bg-white p-12 rounded-[4rem] border-2 border-slate-200 shadow-inner text-4xl md:text-7xl font-black text-slate-800 leading-none tracking-tighter whitespace-pre-line italic uppercase">
                      {order.warehouse}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6">
                      <button onClick={() => handlePrint(order)} className="flex-1 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-2xl"><Printer size={28}/> הדפסה</button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(order.warehouse)}`)} className="flex-1 py-8 bg-emerald-500 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 shadow-2xl"><Share2 size={28}/> WhatsApp</button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        body { background: #f8fafc; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
}
