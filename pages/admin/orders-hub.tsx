'use client';
import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Package, Eye, 
  Printer, Share2, Truck, MessageSquare, BellRing, User, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('mobile-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        fetchOrders();
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
    const res = await fetch('/api/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates: { ...updates, has_new_note: false } })
    });
    if (res.ok) fetchOrders();
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col overflow-hidden italic" dir="rtl">
      <Head>
        <title>SABAN OS | MOBILE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />

      {/* Header קומפקטי למובייל */}
      <header className="bg-slate-900 text-white p-4 md:p-6 flex justify-between items-center shadow-xl z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><ShoppingBag size={20} /></div>
          <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase italic">SABAN <span className="text-blue-400">OS</span></h1>
        </div>
        <div className="bg-slate-800 px-4 py-1.5 rounded-full flex items-center gap-3 border border-slate-700">
          <BellRing className="text-emerald-400 animate-pulse" size={16} />
          <span className="text-lg font-black">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      {/* רשימה גוללת - כאן התיקון המרכזי */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 touch-pan-y custom-scroll">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const isChameleon = order.has_new_note === true;
            const isExpanded = expandedId === order.id;

            return (
              <motion.div 
                layout 
                key={order.id} 
                className={`rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${isChameleon ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-white bg-white shadow-md'}`}
              >
                <div className="p-5 flex items-center gap-4">
                  {/* מזהה הזמנה קטן למובייל */}
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black italic shrink-0 shadow-lg ${isChameleon ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                    <span className="text-[14px]">#{order.order_number}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                       {isChameleon && <span className="bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-bounce uppercase">🦎 הערה</span>}
                       <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {order.order_time}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tighter truncate leading-tight uppercase">
                      {order.product_name || "סל מוצרים"}
                    </h2>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Eye size={20}/></button>
                    <button onClick={() => updateOrder(order.id, { status: 'completed' })} className={`p-3 rounded-xl text-white ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'}`}><CheckCircle size={20}/></button>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-slate-50 border-t-2 border-slate-100 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {/* שדות מובייל */}
                      <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">שעת אספקה</span>
                        <input className="text-xl font-black text-blue-600 bg-transparent outline-none w-full" defaultValue={order.delivery_time} onBlur={(e) => updateOrder(order.id, { delivery_time: e.target.value })} placeholder="--:--" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">נהג משויך</span>
                        <input className="text-xl font-black text-slate-900 bg-transparent outline-none w-full" defaultValue={order.driver_info} onBlur={(e) => updateOrder(order.id, { driver_info: e.target.value })} placeholder="שם הנהג..." />
                      </div>
                      {order.customer_note && (
                        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg">
                          <span className="text-[9px] font-black opacity-60 uppercase block mb-1">הערת לקוח</span>
                          <p className="font-bold text-sm italic">{order.customer_note}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-inner">
                      <div className="text-2xl font-black text-slate-800 leading-tight whitespace-pre-line italic uppercase tracking-tighter">
                        {order.warehouse}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(order.warehouse)}`)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95"><Share2 size={20}/> WhatsApp</button>
                      <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg"><Printer size={20}/></button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        body { margin: 0; padding: 0; overflow: hidden; height: 100vh; font-family: 'Assistant', sans-serif; }
        .custom-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
        input, button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
