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
    
    // הגדרת ערוץ Real-time עם עקיפת TypeScript עבור ה-Build
    const channel = supabase.channel('live-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        fetchOrders();
        // שימוש ב-any כדי למנוע את שגיאת Property 'has_new_note' does not exist
        const newData = payload.new as any;
        if (newData && newData.has_new_note) {
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
    try {
      // שליחה ל-API המאובטח (update-order.ts) לעדכון בטוח
      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { ...updates, has_new_note: false } })
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handlePrint = (order: any) => {
    const win = window.open('', '', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <div dir="rtl" style="font-family: sans-serif; padding: 40px; border: 15px solid #f8fafc;">
        <h1 style="font-size: 45px; border-bottom: 8px solid #0f172a; margin-bottom: 20px;">ח. סבן | הזמנה #${order.order_number}</h1>
        <p style="font-size: 22px;"><strong>לקוח:</strong> ${order.client_info}</p>
        <p style="font-size: 22px;"><strong>אספקה:</strong> ${order.delivery_time || 'בתיאום'} | <strong>נהג:</strong> ${order.driver_info || 'לא שויך'}</p>
        <hr style="margin: 30px 0;"/>
        <h2 style="background: #0f172a; color: #fff; padding: 15px; border-radius: 10px;">רשימת מוצרים לליקוט:</h2>
        <pre style="font-size: 28px; font-weight: bold; white-space: pre-wrap; padding: 20px; line-height: 1.4;">${order.warehouse}</pre>
        ${order.customer_note ? `<div style="background: #f0fdf4; border: 4px solid #16a34a; padding: 20px; margin-top: 30px; border-radius: 20px; font-size: 20px;"><strong>הערת לקוח:</strong> ${order.customer_note}</div>` : ''}
      </div>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 italic" dir="rtl">
      <Head><title>SABAN LOGISTICS | מרכז שליטה</title></Head>
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />

      {/* Header יוקרתי רחב */}
      <header className="bg-slate-900 text-white sticky top-0 z-[100] p-6 md:p-10 flex justify-between items-center shadow-2xl border-b-4 border-blue-600">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-[2.5rem] shadow-lg animate-pulse"><ShoppingBag size={35} /></div>
          <div>
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter uppercase leading-none">SABAN <span className="text-blue-400">LOGISTICS</span></h1>
            <p className="text-[12px] text-slate-500 font-bold tracking-[0.5em] uppercase mt-2">Control Center v2.0</p>
          </div>
        </div>
        <div className="bg-slate-800 border-2 border-slate-700 px-10 py-4 rounded-[2.5rem] flex items-center gap-5 shadow-inner">
          <BellRing className="text-emerald-400 animate-bounce" size={28} />
          <span className="text-3xl font-black tracking-tighter text-blue-400">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      <main className="p-4 md:p-12 max-w-[1900px] mx-auto space-y-12">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const isChameleon = order.has_new_note === true; // הזיקית דולקת כשיש הערה מהלקוח

            return (
              <motion.div 
                layout 
                key={order.id} 
                className={`relative rounded-[4rem] overflow-hidden border-4 transition-all duration-1000 ${isChameleon ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_80px_rgba(16,185,129,0.2)]' : 'border-white bg-white shadow-2xl'}`}
              >
                <div className="p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
                  
                  {/* מזהה הזמנה ענק */}
                  <div className={`w-28 h-28 md:w-44 md:h-44 rounded-[3.5rem] flex flex-col items-center justify-center font-black italic shadow-2xl shrink-0 transition-transform hover:scale-105 ${isChameleon ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                    <span className="text-xs opacity-40 uppercase tracking-widest">ID</span>
                    <span className="text-4xl md:text-8xl">#{order.order_number}</span>
                  </div>
                  
                  {/* תוכן ההזמנה */}
                  <div className="flex-1 text-center md:text-right w-full">
                    <div className="flex items-center justify-center md:justify-start gap-5 mb-5">
                       {isChameleon && <span className="bg-emerald-600 text-white text-sm px-6 py-2 rounded-full font-black animate-bounce shadow-2xl">🦎 הערה מהצאט</span>}
                       <span className="text-base font-bold text-slate-400 flex items-center gap-2 bg-white px-5 py-2 rounded-3xl border shadow-sm"><Clock size={20}/> {order.order_time}</span>
                    </div>
                    <h2 className="text-4xl md:text-[9rem] font-black text-slate-900 tracking-tighter leading-none italic uppercase truncate drop-shadow-sm">{order.product_name || "סל מוצרים"}</h2>
                    <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-5">
                       <span className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] text-xl font-black flex items-center gap-4 italic shadow-2xl"><div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"/> {order.client_info}</span>
                    </div>
                  </div>

                  {/* כפתורי צד */}
                  <div className="flex md:flex-col gap-6 shrink-0 z-50">
                    <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className={`p-10 md:p-14 rounded-[3.5rem] md:rounded-[5rem] transition-all shadow-2xl ${expandedId === order.id ? 'bg-blue-600 text-white ring-8 ring-blue-50' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900'}`}><Eye size={55}/></button>
                    <button onClick={() => updateOrder(order.id, { status: 'completed' })} className={`p-10 md:p-14 rounded-[3.5rem] md:rounded-[5rem] text-white shadow-2xl active:scale-95 ${order.status === 'completed' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-orange-500 shadow-orange-200'}`}><CheckCircle size={55}/></button>
                  </div>
                </div>

                {expandedId === order.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-10 md:p-24 bg-slate-50 border-t-8 border-slate-100 space-y-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      
                      {/* שדה שעת אספקה */}
                      <div className="bg-white p-12 rounded-[4.5rem] border-4 border-slate-100 shadow-2xl hover:border-blue-500 transition-all group">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] block mb-6">שעת אספקה מתוכננת</span>
                        <input 
                          className="text-5xl md:text-9xl font-black text-blue-600 bg-transparent outline-none w-full italic" 
                          defaultValue={order.delivery_time} 
                          onBlur={(e) => updateOrder(order.id, { delivery_time: e.target.value })}
                          placeholder="-- : --"
                        />
                      </div>

                      {/* שדה נהג / מנוף */}
                      <div className="bg-white p-12 rounded-[4.5rem] border-4 border-slate-100 shadow-2xl hover:border-slate-900 transition-all group">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] block mb-6">נהג משויך להובלה</span>
                        <input 
                          className="text-5xl md:text-9xl font-black text-slate-900 bg-transparent outline-none w-full italic" 
                          defaultValue={order.driver_info} 
                          onBlur={(e) => updateOrder(order.id, { driver_info: e.target.value })}
                          placeholder="שם הנהג..."
                        />
                      </div>

                      {/* הערת זיקית מהצאט */}
                      <div className={`p-12 rounded-[4.5rem] border-8 shadow-3xl flex flex-col justify-center transition-all duration-1000 ${isChameleon ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-white'}`}>
                        <div className="flex items-center gap-4 mb-6 text-sm font-black uppercase tracking-[0.5em] opacity-60 italic"><MessageSquare size={35}/> הודעה מהלקוח</div>
                        <p className="text-3xl md:text-6xl font-black italic leading-none tracking-tighter">{order.customer_note || "אין עדכונים"}</p>
                      </div>
                    </div>

                    {/* רשימת ליקוט להפצה */}
                    <div className="bg-white p-16 md:p-24 rounded-[6rem] border-8 border-slate-200 shadow-inner relative group">
                      <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Package size={400}/></div>
                      <div className="text-5xl md:text-[10rem] font-black text-slate-800 leading-[0.8] tracking-tighter whitespace-pre-line italic uppercase">
                        {order.warehouse}
                      </div>
                    </div>

                    {/* כפתורי פעולה סופיים */}
                    <div className="flex flex-col sm:flex-row gap-10 pt-10">
                      <button onClick={() => handlePrint(order)} className="flex-1 py-14 bg-slate-900 text-white rounded-[4rem] font-black text-5xl flex items-center justify-center gap-8 hover:bg-blue-600 transition-all shadow-3xl group relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity"/>
                        <Printer size={60} className="group-hover:animate-bounce"/> הדפסה למחסן
                      </button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("ח. סבן - הזמנה #" + order.order_number + " בטיפול:\n" + order.warehouse)}`)} className="flex-1 py-14 bg-emerald-500 text-white rounded-[4rem] font-black text-5xl flex items-center justify-center gap-8 hover:bg-emerald-600 transition-all shadow-3xl">
                        <Share2 size={60}/> WhatsApp
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        body { background: #F8FAFC; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid #F8FAFC; }
      `}</style>
    </div>
  );
}
