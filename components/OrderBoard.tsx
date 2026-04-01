import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Package, Clock, User, ArrowLeftRight } from 'lucide-react';

export default function OrderBoard() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders(data || []);
    };
    fetch();
    const sub = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetch).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto scrollbar-hide pr-2">
      {orders.map((order, i) => (
        <motion.div 
          layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          key={order.id}
          className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group"
        >
          <div className={`absolute top-0 right-0 w-2 h-full ${order.status === 'מוכן להעמסה' ? 'bg-emerald-500' : 'bg-blue-400'}`} />
          
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md uppercase tracking-widest">ID: {order.id}</span>
            <div className="flex items-center gap-1 text-emerald-600 font-black text-xs italic">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> {order.status}
            </div>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">{order.customer_name}</h3>
          
          <div className="grid grid-cols-2 gap-3 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
              <Clock size={14} /> <span className="text-[11px] font-bold">{order.delivery_time}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
              <Package size={14} /> <span className="text-[11px] font-bold">{order.order_number || 'ממתין...'}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
