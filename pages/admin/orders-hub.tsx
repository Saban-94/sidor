'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { ShoppingBag, Clock, CheckCircle, Package, Eye, Database, Save, Printer, Share2, Phone, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingComax, setEditingComax] = useState<{id: string, value: string} | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      fetchOrders();
      new Audio('/order-notification.mp3').play().catch(() => {});
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handleUpdateStatus = async (id: string, current: string) => {
    const next = current === 'pending' ? 'completed' : 'pending';
    await supabase.from('orders').update({ status: next }).eq('id', id);
    fetchOrders();
  };

  const handleSaveComax = async (id: string) => {
    if (!editingComax) return;
    await supabase.from('orders').update({ comax_id: editingComax.value }).eq('id', id);
    setEditingComax(null);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-y-auto touch-pan-y" dir="rtl">
      <Head><title>ח. סבן | CONTROL CENTER</title></Head>

      <header className="bg-slate-900 text-white sticky top-0 z-[100] p-4 md:p-6 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg animate-pulse"><ShoppingBag size={24} /></div>
          <h1 className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-blue-400 font-normal">OS</span></h1>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-sm font-black">{orders.filter(o => o.status === 'pending').length} הזמנות חדשות</span>
        </div>
      </header>

      <main className="p-4 md:p-10 max-w-[1600px] mx-auto space-y-6">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            const isExpanded = expandedId === order.id;

            return (
              <motion.div layout key={order.id} className={`relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border transition-all duration-500 ${isNew ? 'bg-white border-blue-500 shadow-blue-100 shadow-2xl' : 'bg-white/50 border-slate-100 opacity-80 shadow-sm'}`}>
                {/* אפקט הזיקית */}
                {isNew && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-gradient-x" />}
                
                <div className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-slate-900 text-white w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center font-black italic shrink-0 shadow-xl">
                    <span className="text-[10px] opacity-50 uppercase">ID</span>
                    <span className="text-2xl md:text-3xl">#{order.order_number}</span>
                  </div>
                  
                  <div className="flex-1 text-center md:text-right w-full space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                       <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${isNew ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{isNew ? 'חדש' : 'טופל'}</span>
                       <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={14}/> {order.order_time}</span>
                    </div>
                    <h2 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{order.product_name}</h2>
                  </div>

                  <div className="flex gap-3 shrink-0 z-50">
                    <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className={`p-5 md:p-7 rounded-[2rem] transition-all shadow-lg ${isExpanded ? 'bg-blue-600 text-white scale-110' : 'bg-slate-100 text-slate-400 hover:bg-white'}`}><Eye size={32}/></button>
                    <button onClick={() => handleUpdateStatus(order.id, order.status)} className={`p-5 md:p-7 rounded-[2rem] text-white shadow-2xl transition-all active:scale-90 ${isNew ? 'bg-orange-500' : 'bg-emerald-500'}`}><CheckCircle size={32}/></button>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-6 md:p-12 bg-slate-50 border-t border-slate-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* רשימת מוצרים נקייה */}
                      <div className="space-y-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block px-2">רשימת פריטים למחסן</span>
                        <div className="bg-white p-6 rounded-[2rem] shadow-inner border border-slate-200">
                           {order.warehouse?.split('\n').filter((l:any)=>l).map((line:string, i:number)=>(
                             <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 font-black text-slate-700">
                               <Package className="text-blue-500" size={18}/> {line.trim()}
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* קומקס דינמי ופעולות */}
                      <div className="space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={80}/></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">COMAX SYSTEM ID</span>
                           {editingComax?.id === order.id ? (
                             <input autoFocus className="bg-transparent text-4xl font-black text-emerald-400 outline-none w-full italic" value={editingComax.value} onChange={(e)=>setEditingComax({id:order.id, value:e.target.value})} onBlur={()=>handleSaveComax(order.id)} onKeyDown={(e)=>e.key==='Enter'&&handleSaveComax(order.id)}/>
                           ) : (
                             <div onClick={()=>setEditingComax({id:order.id, value:order.comax_id||''})} className="text-5xl font-black text-emerald-400 italic cursor-pointer hover:text-white transition-colors">{order.comax_id || '---'}</div>
                           )}
                           <div className="mt-4 text-[10px] text-slate-500 font-bold italic">לחץ על המספר לעדכון</div>
                        </div>
                        
                        <div className="flex gap-4">
                          <button className="flex-1 py-5 bg-white border border-slate-200 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Printer size={20}/> הדפסה</button>
                          <button className="flex-1 py-5 bg-emerald-500 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg"><Share2 size={20}/> WhatsApp</button>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 border-t pt-4 flex items-center gap-2"><Phone size={14}/> {order.client_info}</div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @keyframes gradient-x { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
        body { background: #F8FAFC; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
}
