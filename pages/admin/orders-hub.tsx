'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, 
  Package, Bell, Hash, Database, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('realtime:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
        // צלצול התראה על כל שינוי/הזמנה חדשה
        new Audio('/order-notification.mp3').play().catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans pb-20" dir="rtl">
      <Head><title>ח.סבן | מוקד הזמנות AI</title></Head>

      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-8 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-2xl">
              <ShoppingBag size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                ח. סבן <span className="text-blue-600 italic font-black">חומרי בניין</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> מחובר למערכת קומקס אונליין
              </p>
            </div>
          </div>
          <div className="bg-blue-50 px-6 py-2 rounded-2xl border border-blue-100 flex items-center gap-3">
             <Bell className="text-blue-600 animate-bounce" size={20} />
             <span className="text-2xl font-black text-blue-700">{orders.filter(o => o.status === 'pending').length}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-8 space-y-8">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            // חילוץ שם פריט משדה warehouse
            const productName = order.warehouse?.split('|')[0]?.replace('מק"ט:', '').trim() || 'מוצר חדש מהצאט';
            const productQty = order.warehouse?.split('|')[1]?.trim() || 'כמות: 1';

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={order.id}
                className="relative p-[3px] rounded-[3rem] overflow-hidden shadow-xl"
              >
                {/* אפקט הזיקית המסתובב - רק להזמנות חדשות */}
                {isNew && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-400 animate-spin-slow opacity-70" />
                )}

                <div className={`relative bg-white rounded-[2.9rem] p-8 flex flex-col md:flex-row items-center gap-8 ${isNew ? 'animate-gentle-pulse' : ''}`}>
                  
                  {/* מזהה הזמנה פנימי */}
                  <div className="bg-slate-50 border border-slate-100 w-24 h-24 rounded-[2rem] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID</span>
                    <span className="text-3xl font-black italic text-slate-800">#{order.order_number}</span>
                  </div>

                  {/* פרטי הזמנה */}
                  <div className="flex-1 w-full text-right">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-lg shadow-sm italic uppercase tracking-widest">
                        {order.location || "צ'אט AI"}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={14}/> {order.order_time}
                      </span>
                    </div>
                    
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                      {productName}
                    </h2>

                    <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                      <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <Package size={16} className="text-blue-500" /> {productQty}
                      </span>
                      <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <Phone size={16} className="text-slate-400" /> {order.client_info}
                      </span>
                    </div>
                  </div>

                  {/* שדה קומקס - זהות ח.סבן */}
                  <div className="w-full md:w-64 bg-slate-900 rounded-[2.5rem] p-6 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Comax System ID</div>
                    <div className="text-3xl font-black text-emerald-400 italic tracking-tighter drop-shadow-md">
                      {order.comax_id || '---'}
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-slate-400 italic">ח.סבן חומרי בנין</div>
                  </div>

                  {/* כפתור פעולה */}
                  <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-[2rem] shadow-xl transition-all active:scale-90 shrink-0">
                    <CheckCircle size={32} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.99); }
        }
        .animate-gentle-pulse { animation: gentle-pulse 3s ease-in-out infinite; }
        body { background: #FDFDFD; font-family: 'Assistant', sans-serif; }
      `}</style>
    </div>
  );
}
