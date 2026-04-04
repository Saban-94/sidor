'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Clock, CheckCircle, Package, Eye, Database, Save, Printer, Share2, Phone 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function OrdersHub() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingComax, setEditingComax] = useState<{id: string, value: string} | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const saveComaxId = async (id: string) => {
    if (!editingComax) return;
    await supabase.from('orders').update({ comax_id: editingComax.value }).eq('id', id);
    setEditingComax(null);
    fetchOrders();
  };

  const toggleStatus = async (order: any) => {
    const next = order.status === 'pending' ? 'completed' : 'pending';
    await supabase.from('orders').update({ status: next }).eq('id', order.id);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] overflow-y-auto touch-pan-y pb-20" dir="rtl">
      <Head><title>ח. סבן | ORDERS HUB</title></Head>

      <header className="bg-white/95 sticky top-0 z-[100] border-b p-4 flex justify-between items-center shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-2 rounded-xl"><ShoppingBag size={20} className="text-white" /></div>
          <h1 className="font-black text-xl tracking-tighter">ח. סבן <span className="text-blue-600">SYSTEM</span></h1>
        </div>
        <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-black text-sm">
          {orders.filter(o => o.status === 'pending').length} חדשות
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            const isExpanded = selectedOrderId === order.id;

            return (
              <motion.div layout key={order.id} className="relative rounded-[2.5rem] overflow-hidden shadow-lg bg-white border border-slate-100">
                {isNew && <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 animate-pulse opacity-5" />}
                
                <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black italic shadow-lg shrink-0">#{order.order_number}</div>
                  
                  <div className="flex-1 text-right w-full">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isNew ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                         {isNew ? 'ממתין' : 'טופל'}
                       </span>
                       <span className="text-[10px] text-slate-400 font-bold"><Clock size={10} className="inline ml-1"/>{order.order_time}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 leading-none">{order.product_name || "סל מוצרים"}</h2>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSelectedOrderId(isExpanded ? null : order.id)} className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}><Eye size={22}/></button>
                    <button onClick={() => toggleStatus(order)} className={`p-4 rounded-2xl text-white shadow-lg active:scale-95 ${isNew ? 'bg-orange-500' : 'bg-emerald-500'}`}><CheckCircle size={22}/></button>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-slate-50 border-t space-y-6">
                    {/* רשימת מוצרים נקייה */}
                    <div className="grid grid-cols-1 gap-2">
                      {order.warehouse?.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 text-sm font-black text-slate-700">
                          <Package size={14} className="text-blue-500"/> {line.replace(/SAVE_ORDER_DB:[\w:-]+/g, "").trim()}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* שדה קומקס דינמי להקלדה */}
                      <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-200 flex justify-between items-center group hover:border-blue-400 transition-all">
                        <div className="flex-1">
                          <span className="text-[9px] block text-slate-400 font-black uppercase tracking-widest">מספר הזמנה קומקס</span>
                          {editingComax?.id === order.id ? (
                            <input 
                              autoFocus
                              className="text-xl font-black text-blue-600 outline-none w-full bg-transparent"
                              value={editingComax?.value || ''}
                              onChange={(e) => setEditingComax({id: order.id, value: e.target.value})}
                              onBlur={() => saveComaxId(order.id)}
                              onKeyDown={(e) => e.key === 'Enter' && saveComaxId(order.id)}
                            />
                          ) : (
                            <div 
                              onClick={() => setEditingComax({id: order.id, value: order.comax_id || ''})}
                              className="text-2xl font-black text-emerald-500 italic cursor-pointer hover:text-blue-600 transition-colors"
                            >
                              {order.comax_id || 'הקש מספר...'}
                            </div>
                          )}
                        </div>
                        {editingComax?.id === order.id ? <Save className="text-blue-600 animate-pulse" size={20}/> : <Database className="text-slate-200 group-hover:text-blue-400" size={20}/>}
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-xs"><Printer size={16}/> הדפסה</button>
                        <button className="flex-1 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-xs"><Share2 size={16}/> WhatsApp</button>
                      </div>
                    </div>
                    
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Phone size={12}/> {order.client_info}</div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        body { background: #F4F7F9; font-family: 'Assistant', sans-serif; -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
}
