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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        fetchOrders();
        // בדיקת הערה חדשה עם הגנה ל-Build
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
    // עדכון דרך ה-API המאובטח
    await fetch('/api/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates: { ...updates, has_new_note: false } })
    });
    fetchOrders();
  };

  const handlePrint = (order: any) => {
    const win = window.open('', '', 'width=900,height=700');
    win?.document.write(`
      <div dir="rtl" style="font-family: sans-serif; padding: 40px; border: 10px solid #f1f5f9;">
        <h1 style="font-size: 40px; border-bottom: 5px solid #000;">ח. סבן | פקודת ליקוט #${order.order_number}</h1>
        <p style="font-size: 20px;"><strong>לקוח:</strong> ${order.client_info}</p>
        <p style="font-size: 20px;"><strong>אספקה:</strong> ${order.delivery_time || 'בתיאום'} | <strong>נהג:</strong> ${order.driver_info || 'טרם שויך'}</p>
        <hr/>
        <h2 style="background: #000; color: #fff; padding: 10px;">רשימת מוצרים:</h2>
        <pre style="font-size: 24px; font-weight: bold; white-space: pre-wrap;">${order.warehouse}</pre>
        ${order.customer_note ? `<div style="background: #ecfdf5; border: 2px solid #10b981; padding: 15px; margin-top: 20px;"><strong>הערת לקוח:</strong> ${order.customer_note}</div>` : ''}
      </div>
    `);
    win?.document.close();
    win?.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-y-auto pb-24 italic" dir="rtl">
      <Head><title>SABAN LOGISTICS | CONTROL CENTER</title></Head>
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />

      <header className="bg-slate-900 text-white sticky top-0 z-[100] p-6 md:p-10 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg animate-pulse"><ShoppingBag size={30} /></div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">SABAN <span className="text-blue-400">OS</span></h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase mt-2 italic">Logistics Management System</p>
          </div>
        </div>
        <div className="bg-slate-800 border-2 border-slate-700 px-8 py-3 rounded-[2rem] flex items-center gap-4">
          <BellRing className="text-emerald-400 animate-bounce" size={24} />
          <span className="text-2xl font-black tracking-tighter">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      <main className="p-4 md:p-12 max-w-[1800px] mx-auto space-y-10">
        <AnimatePresence>
          {orders.map((order) => {
            const isChameleon = order.has_new_note; // זיקית דולקת כשיש הערה מהלקוח

            return (
              <motion.div layout key={order.id} className={`relative rounded-[3.5rem] overflow-hidden border-4 transition-all duration-700 ${isChameleon ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_60px_rgba(16,185,129,0.2)]' : 'border-white bg-white shadow-2xl'}`}>
                
                <div className="p-8 md:p-14 flex flex-col md:flex-row items-center gap-10">
                  {/* מזהה הזמנה */}
                  <div className={`w-24 h-24 md:w-36 md:h-36 rounded-[3rem] flex flex-col items-center justify-center font-black italic shadow-2xl shrink-0 ${isChameleon ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                    <span className="text-xs opacity-40 uppercase">ID</span>
                    <span className="text-3xl md:text-6xl">#{order.order_number}</span>
                  </div>
                  
                  {/* תוכן מרכזי */}
                  <div className="flex-1 text-center md:text-right w-full">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                       {isChameleon && <span className="bg-emerald-600 text-white text-xs px-4 py-1.5 rounded-full font-black animate-bounce shadow-lg shadow-emerald-200">🦎 הערה חדשה מהלקוח</span>}
                       <span className="text-sm font-bold text-slate-400 flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-xl"><Clock size={16}/> {order.order_time}</span>
                    </div>
                    <h2 className="text-3xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none italic uppercase truncate">{order.product_name || "סל מוצרים"}</h2>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                       <span className="bg-slate-900 text-white px-5 py-2 rounded-2xl text-sm font-black flex items-center gap-2 italic"><Phone size={16} className="text-emerald-400"/> {order.client_info}</span>
                    </div>
                  </div>

                  {/* כפתורי שליטה */}
                  <div className="flex md:flex-col gap-4 z-50">
                    <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className={`p-8 md:p-12 rounded-[3rem] transition-all shadow-xl ${expandedId === order.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}><Eye size={40}/></button>
                    <button onClick={() => updateOrder(order.id, { status: 'completed' })} className={`p-8 md:p-12 rounded-[3rem] text-white shadow-xl active:scale-95 ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'}`}><CheckCircle size={40}/></button>
                  </div>
                </div>

                {expandedId === order.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-8 md:p-20 bg-slate-50 border-t-8 border-slate-100 space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      
                      {/* שדה שעת אספקה - המוח קורא את זה */}
                      <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-xl group hover:border-blue-400 transition-all">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">שעת אספקה למערכת</span>
                        <input 
                          className="text-4xl md:text-6xl font-black text-blue-600 bg-transparent outline-none w-full italic" 
                          defaultValue={order.delivery_time} 
                          onBlur={(e) => updateOrder(order.id, { delivery_time: e.target.value })}
                          placeholder="-- : --"
                        />
                      </div>

                      {/* שדה נהג - המוח קורא את זה */}
                      <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-xl group hover:border-slate-900 transition-all">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">נהג משויך / מנוף</span>
                        <input 
                          className="text-4xl md:text-6xl font-black text-slate-900 bg-transparent outline-none w-full italic" 
                          defaultValue={order.driver_info} 
                          onBlur={(e) => updateOrder(order.id, { driver_info: e.target.value })}
                          placeholder="שם הנהג..."
                        />
                      </div>

                      {/* הערת לקוח - זיקית */}
                      <div className={`p-10 rounded-[3.5rem] border-4 shadow-2xl flex flex-col justify-center transition-all duration-700 ${isChameleon ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}>
                        <div className="flex items-center gap-3 mb-4 text-xs font-black uppercase tracking-[0.3em] opacity-60"><MessageSquare size={20}/> הערה מהצאט</div>
                        <p className="text-2xl md:text-4xl font-black italic leading-tight tracking-tighter">{order.customer_note || "אין הערות חדשות"}</p>
                      </div>
                    </div>

                    {/* רשימת הליקוט */}
                    <div className="bg-white p-12 md:p-20 rounded-[5rem] border-4 border-slate-200 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Package size={300}/></div>
                      <div className="text-4xl md:text-7xl font-black text-slate-800 leading-none tracking-tighter whitespace-pre-line italic">
                        {order.warehouse}
                      </div>
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="flex flex-col sm:flex-row gap-8 pt-8">
                      <button onClick={() => handlePrint(order)} className="flex-1 py-10 bg-slate-900 text-white rounded-[3rem] font-black text-3xl flex items-center justify-center gap-5 hover:bg-blue-600 transition-all shadow-3xl group"><Printer size={40} className="group-hover:animate-bounce"/> הדפסה למחסן</button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("ח. סבן - הזמנה #" + order.order_number + ":\n" + order.warehouse)}`)} className="flex-1 py-10 bg-emerald-500 text-white rounded-[3rem] font-black text-3xl flex items-center justify-center gap-5 hover:bg-emerald-600 transition-all shadow-3xl"><Share2 size={40}/> WhatsApp</button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        body { background: #f8fafc; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
