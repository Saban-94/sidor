'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, Package, Bell, 
  Printer, Share2, Eye, Database, Hash, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
        // צלצול התראה - דורש לחיצה ראשונה על המסך כדי לעבוד במובייל
        new Audio('/order-notification.mp3').play().catch(() => {});
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const toggleStatus = async (order: any) => {
    const newStatus = order.status === 'pending' ? 'completed' : 'pending';
    await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    fetchOrders();
  };

  return (
    // min-h-screen ו-overflow-y-auto מאפשרים גלילה חלקה במובייל
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 font-sans overflow-y-auto touch-pan-y" dir="rtl">
      <Head><title>ח. סבן | מוקד הזמנות AI</title></Head>

      {/* Header - sticky ולא fixed כדי לא לחסום גלילה */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl shadow-lg"><ShoppingBag size={24} className="text-white" /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase leading-none">ח. סבן <span className="text-blue-600 italic font-black">SYSTEM</span></h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Order Management</p>
          </div>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2 font-black text-blue-700 text-sm">
          <Bell className="text-blue-600 animate-bounce" size={16} />
          <span>{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      {/* Main - ללא h-screen כדי לאפשר גלילה חופשית */}
      <main className="max-w-5xl mx-auto p-4 py-8 space-y-6">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            const isExpanded = selectedOrderId === order.id;
            
            // חילוץ שם המוצר מהעמודה החדשה או מה-warehouse
            const displayName = order.product_name || order.warehouse?.split('|')[0]?.replace('מק"ט:', '').trim() || 'מוצר מהצ\'אט';

            return (
              <motion.div layout key={order.id} className="relative p-[2px] rounded-[2.5rem] overflow-hidden shadow-lg transition-all active:scale-[0.98]">
                
                {/* אפקט הזיקית המסתובב להזמנות חדשות */}
                {isNew && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-400 animate-spin-slow opacity-70" />
                )}

                <div className="relative bg-white rounded-[2.45rem] overflow-hidden">
                  <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    
                    {/* מזהה הזמנה */}
                    <div className="bg-slate-50 border border-slate-100 w-20 h-20 rounded-3xl flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[8px] font-black text-slate-300">ID</span>
                      <span className="text-2xl font-black italic">#{order.order_number}</span>
                    </div>

                    {/* תוכן ההזמנה */}
                    <div className="flex-1 text-right w-full">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${isNew ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {isNew ? 'ממתין לטיפול' : 'הזמנה טופלה'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {order.order_time}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-tight">
                        {displayName}
                      </h2>
                      <div className="flex flex-wrap gap-3 mt-3 text-[13px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100"><Package size={14} className="text-blue-500"/> {order.warehouse}</span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100"><Phone size={14} className="text-slate-400"/> {order.client_info}</span>
                      </div>
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}
                        className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                      >
                        <Eye size={24} />
                      </button>
                      <button 
                        onClick={() => toggleStatus(order)}
                        className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 ${isNew ? 'bg-orange-500 text-white shadow-orange-100' : 'bg-emerald-500 text-white shadow-emerald-100'}`}
                      >
                        <CheckCircle size={24} />
                      </button>
                    </div>
                  </div>

                  {/* בורגר נפתח - פרטים נוספים */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50 border-t border-slate-100 p-6 space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="text-[9px] font-black text-slate-400 uppercase mb-1">מערכת קומקס / ח. סבן</div>
                              <div className="text-2xl font-black text-slate-900 italic tracking-tighter">
                                {order.comax_id || '---'}
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-sm shadow-lg">
                                <Printer size={16}/> הדפסה
                              </button>
                              <button className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-sm shadow-lg">
                                <Share2 size={16}/> WhatsApp
                              </button>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        body { background: #F4F7F9; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
}
