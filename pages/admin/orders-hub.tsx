'use client';
import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Package, Eye, Database, 
  Save, Printer, Share2, Phone, X, BellRing, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingComax, setEditingComax] = useState<{id: string, value: string} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchOrders();
    
    // הגדרת ערוץ Real-time עם צלצול
    const channel = supabase.channel('orders-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        if (audioRef.current) {
          audioRef.current.play().catch(() => console.log("במובייל נדרשת לחיצה ראשונה להפעלת סאונד"));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    if (error) console.error("Error fetching:", error.message);
  };

  // שימוש ב-API המאובטח כדי למנוע שגיאת 400
  const secureUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      if (!res.ok) throw new Error("Update failed");
      fetchOrders();
      return true;
    } catch (err) {
      alert("שגיאת תקשורת: וודא שקובץ api/update-order.ts קיים");
      return false;
    }
  };

  const handleUpdateStatus = (order: any) => {
    const nextStatus = order.status === 'pending' ? 'completed' : 'pending';
    secureUpdate(order.id, { status: nextStatus });
  };

  const handleSaveComax = (id: string) => {
    if (!editingComax) return;
    secureUpdate(id, { comax_id: editingComax.value });
    setEditingComax(null);
  };

  const handlePrint = (order: any) => {
    const win = window.open('', '', 'width=900,height=700');
    win?.document.write(`
      <div dir="rtl" style="font-family: 'Assistant', sans-serif; padding: 40px; color: #1e293b;">
        <h1 style="border-bottom: 8px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px;">ח. סבן - פקודת ליקוט #${order.order_number}</h1>
        <div style="font-size: 18px; margin-bottom: 30px; line-height: 1.6;">
          <p><strong>לקוח:</strong> ${order.client_info}</p>
          <p><strong>זמן הזמנה:</strong> ${order.order_time}</p>
          <p><strong>מזהה קומקס:</strong> ${order.comax_id || '---'}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="border: 2px solid #cbd5e1; padding: 15px; text-align: right;">פירוט מוצרים וכמויות</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 2px solid #cbd5e1; padding: 20px; font-size: 22px; font-weight: bold; white-space: pre-wrap;">${order.warehouse}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 50px; text-align: center; font-weight: bold; font-size: 14px; color: #64748b;">
          הופק באמצעות מערכת SABAN OS - ניהול הזמנות חכם
        </div>
      </div>
    `);
    win?.print();
    win?.close();
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 overflow-y-auto touch-pan-y pb-24" dir="rtl">
      <Head><title>SABAN | CONTROL CENTER</title></Head>
      
      {/* אלמנט אודיו נסתר */}
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />

      {/* Header יוקרתי */}
      <header className="bg-slate-900 text-white sticky top-0 z-[100] px-6 py-6 md:px-12 md:py-8 flex justify-between items-center shadow-2xl backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-3 md:p-4 rounded-3xl shadow-2xl shadow-blue-500/20 animate-pulse">
            <ShoppingBag size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">SABAN <span className="text-blue-400 not-italic font-light">OS</span></h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[10px] text-slate-400 font-bold tracking-[0.4em] uppercase">Operations Center</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 px-6 py-3 rounded-[2rem] flex items-center gap-4 shadow-inner">
          <BellRing className="text-blue-400 animate-bounce" size={20} />
          <span className="text-xl font-black">{orders.filter(o => o.status === 'pending').length} חדשות</span>
        </div>
      </header>

      {/* רשימת הזמנות */}
      <main className="p-4 md:p-12 max-w-[1800px] mx-auto space-y-10">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            const isExpanded = expandedId === order.id;

            return (
              <motion.div layout key={order.id} className={`relative rounded-[3rem] md:rounded-[5rem] overflow-hidden border-2 transition-all duration-700 ${isNew ? 'bg-white border-blue-500 shadow-2xl shadow-blue-100' : 'bg-white/70 border-slate-200'}`}>
                
                {/* אפקט הזיקית להזמנה חדשה */}
                {isNew && <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 animate-gradient-x" />}
                
                <div className="p-8 md:p-14 flex flex-col md:flex-row items-center gap-12">
                  
                  {/* ID הזמנה - גדול ודומיננטי */}
                  <div className="bg-slate-900 text-white w-24 h-24 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[4rem] flex flex-col items-center justify-center font-black italic shrink-0 shadow-3xl transform hover:scale-105 transition-transform cursor-pointer">
                    <span className="text-[10px] md:text-sm opacity-40 uppercase tracking-widest">ID ORDER</span>
                    <span className="text-4xl md:text-7xl">#{order.order_number}</span>
                  </div>
                  
                  {/* פרטי הזמנה */}
                  <div className="flex-1 text-center md:text-right w-full space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                       <span className={`text-[12px] font-black px-5 py-2 rounded-full uppercase shadow-lg ${isNew ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                         {isNew ? 'ממתין לביצוע' : 'טופל והופץ'}
                       </span>
                       <span className="text-sm font-bold text-slate-400 bg-white border px-4 py-1.5 rounded-2xl flex items-center gap-2">
                         <Clock size={16} className="text-blue-500"/> {order.order_time}
                       </span>
                    </div>
                    <h2 className="text-3xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                      {order.product_name || "סל מוצרים"}
                    </h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                       <div className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-[1.5rem] text-sm font-bold shadow-xl italic">
                         <Phone size={16} className="text-emerald-400"/> {order.client_info}
                       </div>
                    </div>
                  </div>

                  {/* כפתורי שליטה צדדיים */}
                  <div className="flex md:flex-col gap-4 shrink-0 z-50">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : order.id)} 
                      className={`p-7 md:p-12 rounded-[2.5rem] md:rounded-[4rem] transition-all shadow-2xl active:scale-90 ${isExpanded ? 'bg-blue-600 text-white ring-8 ring-blue-50' : 'bg-slate-100 text-slate-400 hover:bg-white hover:text-blue-600'}`}
                    >
                      {isExpanded ? <X size={48}/> : <Eye size={48}/>}
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(order)} 
                      className={`p-7 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white shadow-2xl transition-all active:scale-95 ${isNew ? 'bg-orange-500 animate-pulse ring-8 ring-orange-50' : 'bg-emerald-500'}`}
                    >
                      <CheckCircle size={48}/>
                    </button>
                  </div>
                </div>

                {/* מגירת הפירוט (עבור מחשב ומובייל) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      className="bg-slate-50 border-t-4 border-slate-100 p-8 md:p-20 space-y-12"
                    >
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        
                        {/* רשימת הליקוט המפורטת */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 px-4">
                            <Package className="text-blue-500" />
                            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">רשימת ליקוט להפצה</span>
                          </div>
                          <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl border-2 border-slate-200 space-y-8">
                             {order.warehouse?.split('\n').filter((l:any)=>l).map((line:string, i:number)=>(
                               <div key={i} className="flex items-start gap-6 py-6 border-b-2 border-slate-50 last:border-0 font-black text-slate-800 text-2xl md:text-5xl leading-tight tracking-tighter">
                                 <ChevronRight className="text-blue-500 mt-2 shrink-0" size={32}/> {line.trim()}
                               </div>
                             ))}
                          </div>
                        </div>

                        {/* קומקס ופעולות */}
                        <div className="space-y-8">
                          <div className="bg-slate-900 p-12 md:p-20 rounded-[4rem] md:rounded-[5rem] text-white shadow-3xl relative overflow-hidden group">
                             <div className="absolute -top-20 -right-20 opacity-10 group-hover:rotate-45 transition-transform duration-1000">
                               <Database size={300}/>
                             </div>
                             <span className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] block mb-8 text-center md:text-right">COMAX ERP IDENTITY</span>
                             
                             {editingComax?.id === order.id ? (
                               <input 
                                autoFocus 
                                className="bg-transparent text-5xl md:text-[10rem] font-black text-emerald-400 outline-none w-full italic border-b-8 border-emerald-400 pb-4 animate-pulse" 
                                value={editingComax?.value || ''} 
                                onChange={(e)=>setEditingComax({id:order.id, value:e.target.value})} 
                                onBlur={()=>handleSaveComax(order.id)} 
                                onKeyDown={(e)=>e.key==='Enter'&&handleSaveComax(order.id)}
                               />
                             ) : (
                               <div 
                                onClick={()=>setEditingComax({id:order.id, value:order.comax_id||''})} 
                                className="text-7xl md:text-[11rem] font-black text-emerald-400 italic cursor-pointer hover:text-white transition-all text-center md:text-right leading-none"
                               >
                                 {order.comax_id || '---'}
                               </div>
                             )}
                             <p className="mt-12 text-sm md:text-lg text-slate-500 font-bold italic text-center md:text-right">לחץ על המספר לעדכון מזהה קומקס (Auto-Save)</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-6">
                            <button onClick={() => handlePrint(order)} className="flex-1 py-10 bg-white border-4 border-slate-200 rounded-[3rem] font-black text-3xl flex items-center justify-center gap-5 hover:bg-slate-900 hover:text-white transition-all shadow-3xl group">
                              <Printer size={36} className="group-hover:animate-bounce"/> הדפסה
                            </button>
                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("ח. סבן - הזמנה ממתינה לליקוט: \n" + order.warehouse)}`)} className="flex-1 py-10 bg-emerald-500 text-white rounded-[3rem] font-black text-3xl flex items-center justify-center gap-5 hover:bg-emerald-600 transition-all shadow-3xl">
                              <Share2 size={36}/> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;400;700;800&display=swap');
        @keyframes gradient-x { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
        body { background: #F1F5F9; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
