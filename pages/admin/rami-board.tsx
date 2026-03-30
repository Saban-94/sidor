'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Truck, Package, MapPin, Phone, RefreshCcw } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RamiOrderBoard() {
  // הגדרת ה-State עם any[] כדי למנוע שגיאת TypeScript ב-Build
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders_pending')
        .select(`
          *,
          customers (name, phone),
          customer_projects (project_name, address)
        `)
        .eq('status', 'pending_rami')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // האזנה לשינויים בזמן אמת
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders_pending' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const approveOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders_pending')
      .update({ status: 'approved' })
      .eq('id', orderId);
    
    if (!error) {
      fetchOrders();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Rami's Board</h1>
          <p className="text-slate-500 font-bold">ניהול הזמנות "המוח המאוחד"</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchOrders} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="bg-emerald-500 text-white px-6 py-2 rounded-2xl font-black shadow-lg shadow-emerald-200">
            {orders.length} ממתינות
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <span className="font-black text-lg">{order.customers?.name || 'לקוח מזדמן'}</span>
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg opacity-80">
                {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="p-6 flex-1 space-y-4">
              <div className="flex items-start gap-3 text-slate-700">
                <MapPin size={20} className="text-emerald-500 shrink-0 mt-1" />
                <div>
                  <p className="font-black leading-tight">{order.customer_projects?.project_name || 'פרויקט כללי'}</p>
                  <p className="text-xs text-slate-500">{order.customer_projects?.address || 'כתובת לא הוזנה'}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">רשימת ציוד</h3>
                <ul className="space-y-2">
                  {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800">{item.product_name || item.name}</span>
                      <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 font-black text-emerald-600">
                        x{item.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
                  <Truck size={14} /> {order.delivery_type === 'crane' ? 'מנוף' : 'פריקה ידנית'}
                </div>
                {order.container_action && order.container_action !== 'none' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase">
                    <Package size={14} /> מכולה: {order.container_action}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => approveOrder(order.id)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100"
              >
                <CheckCircle size={20} /> אשר ושדר לסידור
              </button>
              <a 
                href={`tel:${order.customers?.phone}`}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && !loading && (
        <div className="text-center py-32">
          <div className="bg-white inline-block p-8 rounded-[3rem] shadow-sm border border-slate-100">
             <Bot size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold text-xl">ראמי, אין הזמנות חדשות כרגע</p>
          </div>
        </div>
      )}
    </div>
  );
}
