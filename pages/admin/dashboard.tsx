'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Clock, MapPin, Trash2, Box, Truck, User, RefreshCcw } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const ACTION_COLORS: any = {
  'הצבה': 'bg-emerald-600 border-emerald-400 shadow-emerald-900/30',
  'החלפה': 'bg-orange-500 border-orange-300 shadow-orange-900/30',
  'הוצאה': 'bg-red-600 border-red-400 shadow-red-900/30'
};

const CONTRACTOR_LOGOS: any = {
  'שארק 30': 'https://i.postimg.cc/pT45M6bV/orange-digger.png',
  'כראדי 32': 'https://i.postimg.cc/6q4T874M/blue-truck.png',
  'שי שרון 40': 'https://i.postimg.cc/Y95fMv6z/purple-digger.png'
};

const DRIVER_IMAGES: any = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
};

export default function SabanMasterDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const [y, m, d] = selectedDate.split('-');
    const ilDate = `${d}/${m}/${y}`;

    const [oRes, cRes, tRes] = await Promise.all([
      supabase.from('orders').select('*').or(`delivery_date.eq.${selectedDate},delivery_date.eq.${ilDate}`),
      supabase.from('container_management').select('*').or(`start_date.eq.${selectedDate},start_date.eq.${ilDate}`),
      supabase.from('transfers').select('*').or(`transfer_date.eq.${selectedDate},transfer_date.eq.${ilDate}`)
    ]);

    setOrders([
      ...(oRes.data || []).map(x => ({ ...x, type: 'חומרים', table: 'orders' })),
      ...(cRes.data || []).map(x => ({ ...x, type: 'מכולה', table: 'container_management' })),
      ...(tRes.data || []).map(x => ({ ...x, type: 'העברה', table: 'transfers' }))
    ].sort((a,b) => (a.order_time || '').localeCompare(b.order_time || '')));
    
    setLoading(false);
  };

  const updateField = async (id: string, table: string, field: string, value: string) => {
    await supabase.from(table).update({ [field]: value }).eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-6 font-sans" dir="rtl">
      <Head><title>SABAN LIVE COMMAND</title></Head>
      
      <header className="flex justify-between items-center mb-10 bg-white/5 p-6 rounded-[2rem] border border-white/5">
        <div className="flex items-center gap-4">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-800 p-3 rounded-xl outline-none" />
          {loading && <RefreshCcw className="animate-spin text-emerald-500" />}
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-emerald-500">SABAN LIVE OS</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {orders.map(order => {
          const isCont = order.type === 'מכולה';
          const bgClass = isCont ? ACTION_COLORS[order.action_type] : 'bg-[#161B2C] border-white/5';
          const person = order.contractor_name || order.driver_name;
          const avatar = isCont ? CONTRACTOR_LOGOS[person] : DRIVER_IMAGES[person];

          return (
            <div key={order.id} className={`p-8 rounded-[3.5rem] border-2 shadow-2xl transition-all relative ${bgClass}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="font-mono text-xs opacity-50">#{order.order_number}</span>
                  <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase mt-1">
                    {isCont ? order.action_type : order.type}
                  </span>
                </div>
                <button onClick={() => updateField(order.id, order.table, 'status', 'deleted')} className="opacity-40 hover:opacity-100"><Trash2 size={18}/></button>
              </div>

              {/* עריכה ישירה: שם לקוח */}
              <input 
                className="bg-transparent text-3xl font-black outline-none border-b border-transparent focus:border-white/40 w-full mb-2"
                defaultValue={order.client_name || order.client_info || order.to_branch}
                onBlur={e => updateField(order.id, order.table, isCont ? 'client_name' : 'client_info', e.target.value)}
              />

              {/* עריכה ישירה: כתובת */}
              <div className="flex items-center gap-2 mb-8 opacity-70">
                <MapPin size={16}/>
                <input 
                  className="bg-transparent text-sm font-bold outline-none border-b border-transparent focus:border-white/40 w-full"
                  defaultValue={order.delivery_address || order.location || 'העברה פנימית'}
                  onBlur={e => updateField(order.id, order.table, isCont ? 'delivery_address' : 'location', e.target.value)}
                />
              </div>

              {/* זמן ועריכה */}
              <div className="flex justify-between items-center bg-black/20 p-5 rounded-[2rem] mb-8">
                <div className="flex items-center gap-3">
                  <Clock size={28}/>
                  <input 
                    type="time" className="bg-transparent text-4xl font-black font-mono outline-none"
                    defaultValue={order.order_time || order.transfer_time}
                    onBlur={e => updateField(order.id, order.table, isCont ? 'order_time' : 'order_time', e.target.value)}
                  />
                </div>
              </div>

              {/* לוגו מבצע */}
              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <img src={avatar || 'https://i.postimg.cc/Vv4X4X4X/default.png'} className="w-16 h-16 rounded-full border-4 border-white/20 object-cover shadow-xl" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black opacity-50">מבצע</span>
                  <span className="text-xl font-black">{person}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
