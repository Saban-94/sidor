'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { ShoppingBag, Clock, CheckCircle, Phone, Package, Bell, Printer, Share2, Eye, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      fetchOrders();
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
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 font-sans overflow-y-auto" dir="rtl">
      <Head><title>ח. סבן | Orders Hub</title></Head>

      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl shadow-lg"><ShoppingBag size={24} className="text-white" /></div>
          <h1 className="text-xl font-black tracking-tighter">ח. סבן <span className="text-blue-600 italic">SYSTEM</span></h1>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2 font-black text-blue-700">
          <Bell className="animate-bounce" size={16} /> {orders.filter(o => o.status === 'pending').length}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8 space-y-8">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            const isExpanded = selectedOrderId === order.id;

            return (
              <motion.div layout key={order.id} className="relative p-[2px] rounded-[2.5rem] overflow-hidden shadow-xl">
                {isNew && <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-400 animate-spin-slow opacity-70" />}
                
                <div className="relative bg-white rounded-[2.45rem] overflow-hidden p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    
                    {/* סטטוס וזמן */}
                    <div className="flex-1 text-right w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${isNew ? 'bg-orange-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                          {isNew ? 'ממתין לטיפול' : 'הזמנה טופלה'}
                        </span>
                        <span className="text-[11px] font-black text-slate-400 flex items-center gap-1"><Clock size={14}/> {order.order_time}</span>
                      </div>

                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 italic leading-none">
                        {order.product_name}
                      </h2>

                      {/* רשימת מוצרים נקייה */}
                      <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {order.warehouse?.split('\n').map((item: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <Package size={16} className="text-blue-500 mt-1 shrink-0" />
                            <span className="text-[15px] font-black text-slate-700 leading-tight">{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* פרטי לקוח */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
                        <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[12px] font-black flex items-center gap-2 italic">
                          <Phone size={14} className="text-emerald-400"/> {order.client_info}
                        </span>
                      </div>
                    </div>

                    {/* כפתורי פעולה - מוגדרים עם Z-INDEX גבוה */}
                    <div className="flex md:flex-col items-center gap-3 shrink-0 z-50">
                      <button 
                        onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}
                        className={`p-5 rounded-2xl transition-all shadow-md ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        <Eye size={28} />
                      </button>
                      <button 
                        onClick={() => toggleStatus(order)}
                        className={`p-5 rounded-2xl shadow-xl transition-all active:scale-90 ${isNew ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}
                      >
                        <CheckCircle size={28} />
                      </button>
                    </div>
                  </div>

                  {/* בורגר נפתח - הדפסה ושיתוף */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-slate-50 border-t border-slate-100 p-6 flex gap-4">
                        <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg"><Printer size={18}/> הדפסה</button>
                        <button className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg"><Share2 size={18}/> WhatsApp</button>
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
