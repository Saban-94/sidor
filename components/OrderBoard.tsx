'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, User, MapPin, Phone, Truck, Box } from 'lucide-react';

export default function OrderBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // האזנה לשינויים בזמן אמת בטבלה
    const channel = supabase
      .channel('orders-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    // שליפה של כל השדות - וודא ששמות אלו קיימים ב-DB שלך
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  if (loading && orders.length === 0) return <div className="p-10 text-center animate-pulse font-black text-slate-400">טוען סידור עבודה...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-2 overflow-y-auto max-h-[80vh] scrollbar-hide">
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            key={order.id}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all"
          >
            {/* פס סטטוס צדדי */}
            <div className={`absolute top-0 right-0 w-2 h-full ${order.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                {order.is_container ? <Box className="text-slate-400 group-hover:text-emerald-600" /> : <Truck className="text-slate-400 group-hover:text-emerald-600" />}
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.status === 'approved' ? 'מאושר' : 'ממתין'}
              </span>
            </div>

            {/* פרטי לקוח */}
            <h3 className="text-xl font-black text-slate-900 mb-1 truncate">
              {order.customer_name || "לקוח כללי"}
            </h3>
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold mb-4">
               <MapPin size={12} /> {order.address || "ללא כתובת"}
            </div>

            {/* גוף הכרטיס - נתונים טכניים */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                  <Clock size={14} /> שעה:
                </div>
                <span className="text-slate-900 font-black">{order.delivery_time || "--:--"}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                  <Package size={14} /> מחסן:
                </div>
                <span className="text-slate-900 font-black italic">{order.warehouse || "ראשי"}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                  <User size={14} /> איש קשר:
                </div>
                <span className="text-slate-900 font-black">{order.contact_name || "—"}</span>
              </div>
            </div>

            {/* פרטים טכניים (הזרקה חופשית) */}
            {order.details && (
              <div className="mt-4 p-3 bg-slate-900 rounded-2xl text-[11px] text-emerald-400 font-mono leading-tight">
                <p className="opacity-50 mb-1 uppercase font-black text-[9px]">פרטי הזמנה:</p>
                {order.details}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
