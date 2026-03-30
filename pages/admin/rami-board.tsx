'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Truck, Package, MapPin, Phone, RefreshCcw } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RamiOrderBoard() {
  // תיקון קריטי: הגדרת הטיפוס כ-any[] מונעת את שגיאת ה-'never' ב-Build
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

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Truck, Package, MapPin, Phone, RefreshCcw, Bot } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RamiOrderBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders_pending')
        .select('*, customers(name, phone), customer_projects(project_name, address)')
        .eq('status', 'pending_rami')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('rami_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_pending' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const approveOrder = async (id: string) => {
    await supabase.from('orders_pending').update({ status: 'approved' }).eq('id', id);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase">Rami's Board</h1>
          <p className="text-gray-500 font-bold">ניהול הזמנות "המוח המאוחד"</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchOrders} className="p-2 text-gray-400 hover:text-emerald-500">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="bg-emerald-500 text-white px-6 py-2 rounded-2xl font-black">
            {orders.length} ממתינות
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2.5rem] shadow-lg border border-gray-100 flex flex-col overflow-hidden transition-transform hover:scale-[1.01]">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <span className="font-black text-lg">{order.customers?.name || 'לקוח כללי'}</span>
              <span className="text-xs opacity-70">{new Date(order.created_at).toLocaleTimeString('he-IL')}</span>
            </div>

            <div className="p-6 flex-1 space-y-4">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-emerald-500 shrink-0 mt-1" />
                <span className="font-bold text-slate-700">{order.customer_projects?.project_name}: {order.customer_projects?.address}</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">רשימת ציוד</p>
                <ul className="space-y-1">
                  {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="font-medium text-slate-800">{item.product_name || 'מוצר'}</span>
                      <span className="font-black text-emerald-600">x{item.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                  <Truck size={12} /> {order.delivery_type === 'crane' ? 'מנוף' : 'ידני'}
                </div>
                {order.container_action && order.container_action !== 'none' && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold">
                    <Package size={12} /> מכולה: {order.container_action}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-2">
              <button onClick={() => approveOrder(order.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg">אשר ושדר</button>
              <a href={`tel:${order.customers?.phone}`} className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-500"><Phone size={20} /></a>
            </div>
          </div>
        ))}
      </div>

      {!loading && orders.length === 0 && (
        <div className="text-center py-32 opacity-20">
          <Bot size={64} className="mx-auto mb-2" />
          <p className="text-2xl font-black">הלוח נקי</p>
        </div>
      )}
    </div>
  );
}                    </li>
                  )) : <li className="text-xs text-slate-400">אין פריטים</li>}
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
                  <Truck size={14} /> {order.delivery_type === 'crane' ? 'מנוף' : 'ידני'}
                </div>
                {order.container_action && order.container_action !== 'none' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase">
                    <Package size={14} /> {order.container_action}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => approveOrder(order.id)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
              >
                <CheckCircle size={20} /> אשר
              </button>
              <a 
                href={`tel:${order.customers?.phone}`}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {!loading && orders.length === 0 && (
        <div className="text-center py-32 text-slate-300">
           <Bot size={48} className="mx-auto mb-4 opacity-20" />
           <p className="text-xl font-bold">ראמי, הלוח נקי מהזמנות</p>
        </div>
      )}
    </div>
  );
}                      <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 font-black text-emerald-600">
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
