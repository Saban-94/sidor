'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OrderTracking({ orderId }: any) {
  const [order, setOrder] = useState<any>(null);

  // האזנה לשינויים בזמן אמת מ-Supabase
  useEffect(() => {
    if (!orderId) return;

    const fetchAndSubscribe = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
      setOrder(data);

      const channel = supabase
        .channel(`order-${orderId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, 
        payload => {
          setOrder(payload.new);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    fetchAndSubscribe();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-6 font-sans" dir="rtl">
      {/* מספר הזמנה מהבהב עדין */}
      <motion.div 
        animate={{ opacity: [1, 0.4, 1] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center mb-8"
      >
        <span className="text-emerald-500 text-xs font-black tracking-widest uppercase">מעקב הזמנה פעיל</span>
        <h1 className="text-3xl font-black mt-2">#{orderId}</h1>
      </motion.div>

      <div className="max-w-md mx-auto space-y-6">
        {/* צמתי סטטוס מעוצבים */}
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex justify-between relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-full z-0" />
          <StatusStep active={true} icon={<Clock size={18}/>} label="התקבלה" />
          <StatusStep active={order?.status === 'נערך'} icon={<Package size={18}/>} label="בטיפול ראמי" />
          <StatusStep active={order?.status === 'בדרך'} icon={<Truck size={18}/>} label="בדרך אליך" />
          <StatusStep active={order?.status === 'סופק'} icon={<CheckCircle size={18}/>} label="סופק" />
        </div>

        {/* רשימת הציוד של ח. סבן (אחרי עריכה) */}
        <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400">פירוט ציוד (סופי)</h3>
            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-3 py-1 rounded-full font-black">מעודכן מהמחסן</span>
          </div>

          <div className="space-y-4">
            {order?.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-start border-b border-white/5 pb-3 last:border-0">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{item.name}</span>
                  <span className="text-[10px] text-emerald-500 font-mono tracking-tighter">מק"ט: {item.sku || 'בטיפול'}</span>
                </div>
                <span className="text-emerald-500 font-black">{item.qty} יח'</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
            <MapPin size={16} className="text-slate-500" />
            <p className="text-xs text-slate-400">יעד: <span className="text-white">{order?.address || 'בתיאום טלפוני'}</span></p>
          </div>
        </div>

        <p className="text-center text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">
          Saban OS Real-Time Logistics System
        </p>
      </div>
    </div>
  );
}

function StatusStep({ active, icon, label }: any) {
  return (
    <div className={`flex flex-col items-center gap-3 z-10 ${active ? 'text-emerald-400' : 'text-slate-700'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-emerald-500 text-[#0b141a] shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-[#1a2f3f] text-slate-600'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black">{label}</span>
    </div>
  );
}
