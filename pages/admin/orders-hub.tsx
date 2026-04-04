'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, 
  Package, Bell, MapPin, ChevronLeft, ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    // מאזין לשינויים בטבלה בזמן אמת
    const channel = supabase
      .channel('realtime:orders')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders' 
      }, (payload) => {
        console.log('הזמנה חדשה הגיעה!', payload.new);
        setOrders(prev => [payload.new, ...prev]);
        
        // הפעלת צלצול התראה (הקובץ קיים ב-public שלך)
        const audio = new Audio('/order-notification.mp3');
        audio.play().catch(e => console.log("Audio play failed:", e));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) fetchOrders();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20" dir="rtl">
      <Head><title>SABAN | Orders Hub 2026</title></Head>

      {/* Header יוקרתי בהיר */}
      <header className="bg-white border-b border-slate-200 px-8 py-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
              <ShoppingBag size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                SABAN <span className="text-blue-600">ORDERS</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> מחובר למוח ה-AI בזמן אמת
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Bell size={20} className="text-blue-600 animate-bounce" />
              <span className="font-black text-2xl">
                {orders.filter(o => o.status === 'pending').length}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">הזמנות חדשות</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="space-y-8">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={order.id}
                className={`group bg-white border-2 p-8 rounded-[3.5rem] shadow-sm transition-all flex flex-col md:flex-row items-center gap-8 ${
                  order.status === 'pending' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-50 hover:shadow-xl'
                }`}
              >
                {/* מספר הזמנה וזמן */}
                <div className="flex flex-col items-center justify-center bg-slate-900 text-white w-24 h-24 rounded-[2rem] shrink-0 shadow-xl">
                  <span className="text-[10px] font-black opacity-50 uppercase tracking-tighter">Order</span>
                  <span className="text-3xl font-black italic">#{order.order_number}</span>
                </div>

                {/* תוכן ההזמנה */}
                <div className="flex-1 w-full text-center md:text-right space-y-4">
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest italic">
                      {order.location}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={14} /> {order.order_time} | {new Date(order.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>

                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                    {order.warehouse?.split('|')[0] || 'מוצר לא מזוהה'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <Package className="text-slate-400" size={20} />
                      <span className="text-xl font-black text-slate-700">
                        {order.warehouse?.split('|')[1] || 'כמות לא צוינה'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <Phone className="text-slate-400" size={20} />
                      <span className="text-lg font-bold text-slate-700 leading-none">
                        {order.client_info || 'מידע לקוח חסר'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* כפתורי פעולה ענקיים */}
                <div className="flex flex-row md:flex-col gap-3 shrink-0">
                  {order.status === 'pending' ? (
                    <button 
                      onClick={() => updateStatus(order.id, 'processing')}
                      className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
                    >
                      <CheckCircle size={24} /> טפל כעת
                    </button>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-600 px-10 py-5 rounded-[2rem] font-black text-xl border border-emerald-100 flex items-center gap-3">
                      <CheckCircle size={24} /> בטיפול
                    </div>
                  )}
                  
                  <button className="p-5 bg-slate-50 rounded-[2rem] text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 shadow-sm border border-slate-100">
                    <ExternalLink size={28} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {orders.length === 0 && !loading && (
            <div className="text-center py-40 opacity-20">
              <ShoppingBag size={120} className="mx-auto mb-6" />
              <h2 className="text-3xl font-black italic uppercase tracking-widest">ממתין להזמנות חדשות...</h2>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;700;800&display=swap');
        body { font-family: 'Assistant', sans-serif; background: #F8FAFC; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}
