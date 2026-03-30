import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Truck, Package, MapPin, Phone } from 'lucide-react';

export default function RamiOrderBoard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    // Realtime - עדכון אוטומטי כשנכנסת הזמנה
    const subscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_pending' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders_pending')
      .select('*, customers(name, phone), customer_projects(project_name, address)')
      .eq('status', 'pending_rami')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  const approveOrder = async (orderId) => {
    const { error } = await supabase
      .from('orders_pending')
      .update({ status: 'approved' })
      .eq('id', orderId);
    if (!error) fetchOrders();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 dir-rtl text-right" dir="rtl">
      <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border-r-4 border-emerald-500">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">לוח הזמנות - ראמי</h1>
          <p className="text-slate-500">הזמנות חדשות מהמוח המאוחד 🧠</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold">
          {orders.length} ממתינות
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="bg-slate-800 text-white p-4 flex justify-between">
              <span className="font-bold">{order.customers?.name}</span>
              <span className="text-sm opacity-80">{new Date(order.created_at).toLocaleTimeString()}</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={18} className="text-emerald-500" />
                <span className="font-medium">{order.customer_projects?.project_name} - {order.customer_projects?.address}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300">
                <h3 className="text-sm font-bold text-slate-500 mb-2">רשימת מוצרים:</h3>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-slate-800">
                      <span>{item.product_name}</span>
                      <span className="font-bold">x {item.qty} {item.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 text-sm font-medium">
                <div className="flex items-center gap-1 text-blue-600">
                  <Truck size={16} /> {order.delivery_type === 'crane' ? 'מנוף' : 'ידני'}
                </div>
                {order.container_action !== 'none' && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Package size={16} /> מכולה: {order.container_action}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <button 
                onClick={() => approveOrder(order.id)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={20} /> אשר ושדר לסידור
              </button>
              <button className="p-3 bg-white border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100">
                <Phone size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {orders.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-xl">אין הזמנות חדשות כרגע...</p>
        </div>
      )}
    </div>
  );
}
