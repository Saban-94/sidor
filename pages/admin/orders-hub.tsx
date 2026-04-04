'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, Package, Bell, 
  Menu, Printer, Share2, Edit3, X, Save, Trash2, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // אתחול OneSignal PWA
    if (typeof window !== 'undefined') {
      const OneSignal = (window as any).OneSignal || [];
      OneSignal.push(() => {
        OneSignal.init({
          appId: "YOUR_ONESIGNAL_APP_ID", // שים כאן את ה-ID שלך
          safari_web_id: "YOUR_SAFARI_ID",
          notifyButton: { enable: true },
        });
      });
    }

    fetchOrders();
    const channel = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        new Audio('/order-notification.mp3').play().catch(() => {});
        // שליחת התראה ל-OneSignal (דרך ה-Backend בדרך כלל, כאן זה ה-Hook)
      }
      fetchOrders();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handlePrint = (order: any) => {
    const printContent = `
      <div style="direction:rtl; font-family:Arial; padding:40px; border:2px solid #000;">
        <h1 style="text-align:center;">ח. סבן חומרי בניין בע"מ</h1>
        <hr/>
        <h2>הזמנה רשמית #${order.order_number}</h2>
        <p>תאריך: ${new Date(order.created_at).toLocaleDateString('he-IL')}</p>
        <p><strong>לקוח:</strong> ${order.client_info}</p>
        <p><strong>פריט:</strong> ${order.product_name}</p>
        <p><strong>פרטי מלאי:</strong> ${order.warehouse}</p>
        <br/><br/>
        <p style="text-align:center;">תודה שבחרת ח. סבן!</p>
      </div>
    `;
    const win = window.open('', '', 'width=800,height=600');
    win?.document.write(printContent);
    win?.print();
    win?.close();
  };

  const shareWhatsApp = (order: any) => {
    const text = `*הזמנה חדשה - ח. סבן*\nמספר: ${order.order_number}\nפריט: ${order.product_name}\nכמות: ${order.warehouse}\nלקוח: ${order.client_info}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 font-sans pb-10" dir="rtl">
      <Head><title>SABAN | Control Center</title></Head>

      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl"><ShoppingBag size={24} className="text-white" /></div>
          <h1 className="text-2xl font-black tracking-tighter">ח. סבן <span className="text-blue-600 italic">HUB</span></h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> PWA ACTIVE
           </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6 space-y-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div layout key={order.id} className="relative bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden transition-all hover:shadow-xl">
              
              {/* כותרת הכרטיס */}
              <div className="p-6 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black italic text-xl shadow-lg">
                    #{order.order_number}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{order.product_name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock size={12}/> {order.order_time} | {order.location}
                    </div>
                  </div>
                </div>
                
                {/* המבורגר פנימי דינאמי */}
                <button 
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                  className="p-3 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all"
                >
                  <Menu size={24} />
                </button>
              </div>

              {/* בורגר נפתח - שכבות דינאמיות */}
              <AnimatePresence>
                {selectedOrder?.id === order.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-50 border-t border-slate-100 p-6 space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                          <label className="text-[10px] font-black text-slate-400 block mb-1">פריט/מק"ט</label>
                          <input defaultValue={order.product_name} className="w-full bg-transparent font-bold outline-none text-blue-600" />
                       </div>
                       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                          <label className="text-[10px] font-black text-slate-400 block mb-1">כמות/תיאור</label>
                          <input defaultValue={order.warehouse} className="w-full bg-transparent font-bold outline-none text-emerald-600" />
                       </div>
                       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                          <label className="text-[10px] font-black text-slate-400 block mb-1">לקוח</label>
                          <div className="font-bold truncate text-slate-600">{order.client_info}</div>
                       </div>
                    </div>

                    {/* כפתורי פעולה אומנותיים */}
                    <div className="flex flex-wrap gap-3">
                       <button onClick={() => handlePrint(order)} className="flex-1 min-w-[120px] py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                          <Printer size={18}/> הדפסה
                       </button>
                       <button onClick={() => shareWhatsApp(order)} className="flex-1 min-w-[120px] py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg">
                          <Share2 size={18}/> WhatsApp
                       </button>
                       <button className="flex-1 min-w-[120px] py-4 bg-blue-100 text-blue-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-200 transition-all">
                          <Save size={18}/> שמירה
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;700;800&display=swap');
        body { font-family: 'Assistant', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
