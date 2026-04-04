'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShoppingBag, Clock, CheckCircle, Package, Eye, Save, Printer, Share2, Truck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => {
      fetchOrders();
      if (p.new && p.new.has_new_note) audioRef.current?.play();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateOrder = async (id: string, updates: any) => {
    await fetch('/api/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates: { ...updates, has_new_note: false } })
    });
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans" dir="rtl">
      <audio ref={audioRef} src="/order-notification.mp3" />
      <header className="max-w-7xl mx-auto mb-10 flex justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
        <h1 className="text-4xl font-black italic tracking-tighter">SABAN <span className="text-blue-400">LOGISTICS</span></h1>
        <div className="bg-blue-600 px-6 py-2 rounded-full font-bold animate-pulse">
           {orders.filter(o => o.status === 'pending').length} פעילות
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {orders.map((order) => {
          const isChameleon = order.has_new_note; // זיקית דולקת כשיש הערה
          
          return (
            <motion.div key={order.id} layout className={`rounded-[3rem] border-4 transition-all duration-700 overflow-hidden ${isChameleon ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)] bg-emerald-50' : 'border-white bg-white shadow-xl'}`}>
              <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className={`w-24 h-24 rounded-[2rem] flex flex-col items-center justify-center font-black italic shadow-lg ${isChameleon ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                  <span className="text-xs opacity-50">ID</span>
                  <span className="text-3xl">#{order.order_number}</span>
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 mb-2">
                    {isChameleon && <span className="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-lg animate-bounce font-black uppercase">🦎 הערת לקוח חדשה</span>}
                    <span className="text-xs font-bold text-slate-400"><Clock size={12} className="inline ml-1"/> {order.order_time}</span>
                  </div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">{order.product_name}</h2>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-6 bg-slate-100 rounded-3xl text-slate-500"><Eye size={32}/></button>
                  <button onClick={() => updateOrder(order.id, { status: 'completed' })} className="p-6 bg-orange-500 rounded-3xl text-white shadow-lg"><CheckCircle size={32}/></button>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="p-10 bg-white border-t-2 border-slate-50 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* שדות ניהול לוגיסטי */}
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <span className="text-xs font-black text-slate-400 block mb-2 uppercase">שעת אספקה</span>
                      <input className="text-2xl font-black text-blue-600 bg-transparent outline-none w-full italic" defaultValue={order.delivery_time} onBlur={(e) => updateOrder(order.id, { delivery_time: e.target.value })} placeholder="12:30..." />
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <span className="text-xs font-black text-slate-400 block mb-2 uppercase">נהג / מנוף</span>
                      <input className="text-2xl font-black text-slate-900 bg-transparent outline-none w-full italic" defaultValue={order.driver_info} onBlur={(e) => updateOrder(order.id, { driver_info: e.target.value })} placeholder="שם הנהג..." />
                    </div>
                    <div className="p-6 bg-emerald-100 rounded-[2rem] border-2 border-emerald-200">
                      <span className="text-xs font-black text-emerald-600 block mb-2 uppercase italic">הערת לקוח (זיקית)</span>
                      <p className="text-lg font-bold text-slate-800 italic">{order.customer_note || "אין הערות"}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 font-black text-2xl text-slate-700 whitespace-pre-line">
                    <Package className="inline ml-3 text-blue-500" size={32}/> {order.warehouse}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
