'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShoppingBag, Clock, CheckCircle, Package, Eye, Database, Save } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#F4F7F9] overflow-y-auto touch-pan-y pb-20" dir="rtl">
      <header className="bg-white/90 sticky top-0 z-[100] border-b p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-blue-600" />
          <h1 className="font-black text-xl">ח. סבן | ORDERS</h1>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6 overflow-visible">
        <AnimatePresence>
          {orders.map((order) => {
            const isNew = order.status === 'pending';
            const isExpanded = selectedOrderId === order.id;

            return (
              <motion.div layout key={order.id} className="relative p-[2px] rounded-[2rem] overflow-hidden shadow-lg bg-white">
                {isNew && <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 animate-pulse opacity-20" />}
                <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-slate-900 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black italic">#{order.order_number}</div>
                  
                  <div className="flex-1 text-right">
                    <h2 className="text-2xl font-black text-slate-800">{order.product_name}</h2>
                    <div className="text-sm text-slate-400 flex items-center gap-2 mt-1"><Clock size={14}/> {order.order_time}</div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setSelectedOrderId(isExpanded ? null : order.id)} className="p-4 bg-slate-100 rounded-2xl"><Eye /></button>
                    <button onClick={async () => {
                      const next = order.status === 'pending' ? 'completed' : 'pending';
                      await supabase.from('orders').update({ status: next }).eq('id', order.id);
                      fetchOrders();
                    }} className={`p-4 rounded-2xl text-white ${isNew ? 'bg-orange-500' : 'bg-emerald-500'}`}><CheckCircle /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-slate-50 border-t flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-white p-4 rounded-2xl border flex justify-between items-center">
                      <div>
                        <span className="text-[10px] block text-slate-400 font-bold uppercase">מספר הזמנה קומקס</span>
                        {editingComax?.id === order.id ? (
                          <input 
                            autoFocus
                            className="text-xl font-black text-blue-600 outline-none w-full"
                            value={editingComax.value}
                            onChange={(e) => setEditingComax({id: order.id, value: e.target.value})}
                            onBlur={() => saveComaxId(order.id)}
                          />
                        ) : (
                          <div 
                            onClick={() => setEditingComax({id: order.id, value: order.comax_id || ''})}
                            className="text-2xl font-black text-emerald-500 italic cursor-pointer hover:text-blue-500"
                          >
                            {order.comax_id || 'לחץ להקלדה...'}
                          </div>
                        )}
                      </div>
                      {editingComax?.id === order.id && <button onClick={() => saveComaxId(order.id)} className="bg-blue-600 text-white p-2 rounded-lg"><Save size={16}/></button>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                       <div className="p-4 bg-white border rounded-2xl text-sm font-bold"><Package className="inline ml-2 text-blue-500"/> {order.warehouse}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
}
