'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, 
  Package, Bell, Hash, Database, ExternalLink 
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
          new Audio('/order-notification.mp3').play().catch(() => {});
        } else {
          fetchOrders();
        }
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
      <Head><title>H.SABAN | Real-time Orders Hub</title></Head>

      {/* Header מקצועי - ח. סבן חומרי בניין */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-xl">
              <ShoppingBag size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">
                ח. סבן <span className="text-blue-600 italic">חומרי בניין</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> מערכת ניהול הזמנות אונליין
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-blue-50 px-5 py-2 rounded-xl border border-blue-100">
              <span className="text-xs font-bold text-blue-400 block uppercase">ממתין לטיפול</span>
              <span className="text-2xl font-black text-blue-700">{orders.filter(o => o.status === 'pending').length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-8">
        <div className="grid gap-8">
          <AnimatePresence>
            {orders.map((order) => {
              const isNew = order.status === 'pending';
              const productParts = order.warehouse?.split('|') || [];
              const productName = productParts[0]?.replace('מק"ט:', '').trim() || 'מוצר כללי';
              const productQty = productParts[1]?.trim() || 'כמות: 1';

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order.id}
                  className="relative group p-[2px] rounded-[2.5rem] overflow-hidden transition-all shadow-lg hover:shadow-2xl"
                >
                  {/* אפקט הזיקית המסתובב והמהבהב */}
                  {isNew && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-spin-slow opacity-80" />
                  )}
                  
                  <div className={`relative bg-white rounded-[2.4rem] p-8 flex flex-col md:flex-row items-center gap-8 ${isNew ? 'animate-pulse-subtle' : ''}`}>
                    
                    {/* סטטוס ומזהה */}
                    <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 w-28 h-28 rounded-3xl shrink-0">
                      <Hash size={20} className="text-slate-300 mb-1" />
                      <span className="text-2xl font-black text-slate-800 italic">#{order.order_number}</span>
                    </div>

                    {/* תוכן ההזמנה */}
                    <div className="flex-1 w-full text-right space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase italic tracking-tighter">
                          {order.location || 'צאט AI'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={14} /> {order.order_time}
                        </span>
                      </div>

                      <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        {productName}
                      </h2>

                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100/50">
                          <Package size={18} className="text-blue-500" />
                          <span className="font-black text-blue-700">{productQty}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-600 font-bold">
                          <Phone size={18} />
                          <span>{order.client_info}</span>
                        </div>
                      </div>
                    </div>

                    {/* שדה מספר הזמנה קומקס - זהות ח.סבן */}
                    <div className="w-full md:w-64 bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-center items-center gap-2 shadow-inner">
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <Database size={12} /> מערכת קומקס
                      </div>
                      <div className="text-3xl font-black italic text-emerald-400 tracking-tighter">
                        {order.comax_id || 'במתנה...'}
                      </div>
                      <span className="text-[9px] font-medium text-slate-500 italic">ח.סבן חומרי בנין בע"מ</span>
                    </div>

                    {/* פעולה */}
                    <div className="shrink-0">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-3xl transition-all shadow-lg active:scale-90">
                        <CheckCircle size={32} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.98; transform: scale(0.995); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        body { background-color: #FDFDFD; font-family: 'Assistant', sans-serif; }
      `}</style>
    </div>
  );
}
