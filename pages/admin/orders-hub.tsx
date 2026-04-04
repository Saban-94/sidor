'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, Package, Bell, 
  Menu, Printer, Share2, Eye, X, Save, Trash2, Smartphone, AlertCircle
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

  const handlePrint = (order: any) => {
    const win = window.open('', '', 'width=800,height=600');
    win?.document.write(`
      <div dir="rtl" style="font-family: sans-serif; padding: 40px; border: 5px solid #000;">
        <h1 style="text-align: center; font-size: 40px;">ח. סבן חומרי בניין</h1>
        <hr/>
        <h2>הזמנה רשמית #${order.order_number}</h2>
        <p><strong>תאריך:</strong> 4.4.2026</p>
        <p><strong>לקוח:</strong> ${order.client_info}</p>
        <p><strong>פריט:</strong> ${order.product_name || 'מוצר מצאט AI'}</p>
        <p><strong>פרטי מלאי:</strong> ${order.warehouse}</p>
        <h3 style="text-align: center; margin-top: 50px;">תודה שבחרת ח. סבן!</h3>
      </div>
    `);
    win?.print();
    win?.close();
  };

  const shareWhatsApp = (order: any) => {
    const text = `*הזמנה חדשה - ח. סבן*\nמספר: ${order.order_number}\nפריט: ${order.product_name}\n${order.warehouse}\n${order.client_info}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 font-sans pb-10" dir="rtl">
      <Head><title>SABAN | ניהול הזמנות AI</title></Head>

      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl"><ShoppingBag size={24} className="text-white" /></div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">ח. סבן <span className="text-blue-600 italic">SYSTEM</span></h1>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2">
          <Bell className="text-blue-600 animate-bounce" size={18} />
          <span className="text-lg font-black text-blue-700">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 mt-6 space-y-6">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            const isSelected = selectedOrderId === order.id;

            return (
              <motion.div layout key={order.id} className="relative p-[2px] rounded-[2.5rem] overflow-hidden shadow-lg transition-all hover:shadow-2xl">
                
                {/* אפקט הזיקית המסתובב - מופיע רק בהמתנה */}
                {isNew && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-400 animate-spin-slow opacity-60" />
                )}

                <div className="relative bg-white rounded-[2.45rem] overflow-hidden">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                    
                    {/* מזהה הזמנה */}
                    <div className="bg-slate-50 border border-slate-100 w-20 h-20 rounded-3xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-slate-300">ID</span>
                      <span className="text-2xl font-black italic">#{order.order_number}</span>
                    </div>

                    {/* תוכן הזמנה */}
                    <div className="flex-1 text-right w-full">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${isNew ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {isNew ? 'ממתין לטיפול' : 'הזמנה טופלה'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {order.order_time}</span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                        {order.product_name || 'מוצר מצאט AI'}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><Package size={16} className="text-blue-500"/> {order.warehouse}</span>
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><Phone size={16} className="text-slate-400"/> {order.client_info}</span>
                      </div>
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => setSelectedOrderId(isSelected ? null : order.id)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Eye size={24} />
                      </button>
                      <button onClick={() => toggleStatus(order)} className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 ${isNew ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        <CheckCircle size={24} />
                      </button>
                    </div>
                  </div>

                  {/* המבורגר שכבות נפתח (פרטי הזמנה) */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50 border-t border-slate-100 p-8 pt-4 space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">סטטוס תפעולי</label>
                              <div className={`p-4 rounded-2xl font-black flex items-center gap-3 border-2 ${isNew ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                 {isNew ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
                                 {isNew ? 'ממתין לטיפול של ח. סבן' : 'הזמנה נסגרה בהצלחה'}
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">פעולות מהירות</label>
                              <div className="flex gap-3">
                                <button onClick={() => handlePrint(order)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                                  <Printer size={18}/> הדפסה
                                </button>
                                <button onClick={() => shareWhatsApp(order)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg">
                                  <Share2 size={18}/> WhatsApp
                                </button>
                              </div>
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
        body { background: #F4F7F9; font-family: 'Assistant', sans-serif; }
      `}</style>
    </div>
  );
}
