'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Clock, MapPin, Trash2, Box, Truck, User, RefreshCcw, Share2 } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const ACTION_COLORS: any = {
  'הצבה': 'bg-emerald-600 border-emerald-400 shadow-emerald-900/30',
  'החלפה': 'bg-orange-500 border-orange-300 shadow-orange-900/30',
  'הוצאה': 'bg-red-600 border-red-400 shadow-red-900/30'
};

const CONTRACTOR_LOGOS: any = {
  'שארק 30': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIQpXwGW35vBLtTcW2G91P689-5hBuG5ZgzQ&s',
  'כראדי 32': 'https://www.duns100.co.il/Areas/Uploads/companies//e3340ff2-2222-4436-8e2b-ddfdfe49384c.jpg',
  'שי שרון 40': 'https://de.cdn-website.com/a9b6ab84e3184248bab5e2a04153835c/MOBILE/png/695.png'
};

const DRIVER_IMAGES: any = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
};

export default function SabanMasterDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'); 
    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public' }, (payload) => {
        audioRef.current?.play().catch(e => console.log("Audio play blocked", e));
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const [y, m, d] = selectedDate.split('-');
    const ilDate = `${d}/${m}/${y}`;

    const [oRes, cRes, tRes] = await Promise.all([
      supabase.from('orders').select('*').or(`delivery_date.eq.${selectedDate},delivery_date.eq.${ilDate}`).neq('status', 'deleted'),
      supabase.from('container_management').select('*').or(`start_date.eq.${selectedDate},start_date.eq.${ilDate}`).neq('status', 'deleted'),
      supabase.from('transfers').select('*').or(`transfer_date.eq.${selectedDate},transfer_date.eq.${ilDate}`).neq('status', 'deleted')
    ]);

    const combined = [
      ...(oRes.data || []).map(x => ({ ...x, type: 'חומרים', table: 'orders' })),
      ...(cRes.data || []).map(x => ({ ...x, type: 'מכולה', table: 'container_management' })),
      ...(tRes.data || []).map(x => ({ ...x, type: 'העברה', table: 'transfers' }))
    ].sort((a, b) => (a.order_time || a.transfer_time || '').localeCompare(b.order_time || b.transfer_time || ''));

    setOrders(combined);
    setLoading(false);
  };

  const shareTomorrowSchedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('he-IL');
    const isoTomorrow = tomorrow.toISOString().split('T')[0];
    const ilTomorrow = dateStr;

    // שליפת הזמנות למחר מהמערך הנוכחי (או פנייה מחדש ל-DB אם תרצה, פה נסתמך על מה שנטען)
    const tomorrowOrders = orders.filter(o => 
      o.delivery_date === isoTomorrow || o.delivery_date === ilTomorrow ||
      o.start_date === isoTomorrow || o.start_date === ilTomorrow ||
      o.transfer_date === isoTomorrow || o.transfer_date === ilTomorrow
    );

    if (tomorrowOrders.length === 0) {
      alert("בוס, לא מצאתי הזמנות למחר במערך הטעון. וודא שבחרת את התאריך של מחר בלוח.");
      return;
    }

    let message = `📊 *SABAN OS | דוח סידור עבודה ${dateStr}*\n\n`;

    tomorrowOrders.forEach((o, i) => {
      const time = o.order_time || o.transfer_time || '--:--';
      const client = o.client_name || o.client_info || o.to_branch || 'כללי';
      const loc = o.delivery_address || o.location || `מסניף: ${o.from_branch}`;
      const typeIcon = o.type === 'מכולה' ? '🔄' : (o.type === 'העברה' ? '📦' : '🚛');
      const person = o.contractor_name || o.driver_name || 'טרם נקבע';

      message += `${typeIcon} | *${time}* | *${client}*\n`;
      message += `📍 יעד: ${loc}\n`;
      message += `👤 מבצע: *${person}*\n`;
      message += `------------------\n`;
    });

    message += `\n🏗️ *ח.סבן חומרי בנין 1994 בע"מ*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const updateField = async (id: string, table: string, field: string, value: string) => {
    await supabase.from(table).update({ [field]: value }).eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-6 font-sans" dir="rtl">
      <Head><title>SABAN LIVE COMMAND</title></Head>
      
      <header className="flex justify-between items-center mb-10 bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-800 p-3 rounded-xl outline-none border border-white/10" />
          <button 
            onClick={shareTomorrowSchedule}
            className="flex items-center gap-2 bg-[#25D366] text-[#111B21] px-5 py-3 rounded-xl font-black shadow-lg hover:scale-105 transition-all"
          >
            <Share2 size={20} />
            שתף סידור מחר
          </button>
          {loading && <RefreshCcw className="animate-spin text-emerald-500" />}
        </div>
        <div className="flex flex-col items-center">
            <h1 className="text-4xl font-black italic tracking-tighter text-emerald-500">SABAN LIVE OS</h1>
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Real-time Dashboard Powered by Saban AI</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {orders.map(order => {
          const isCont = order.type === 'מכולה';
          const isTrans = order.type === 'העברה';
          const bgClass = isCont ? ACTION_COLORS[order.action_type] : isTrans ? 'bg-indigo-900 border-indigo-400' : 'bg-[#161B2C] border-white/5';
          const person = order.contractor_name || order.driver_name;
          const avatar = isCont ? CONTRACTOR_LOGOS[person] : DRIVER_IMAGES[person];

          return (
            <div key={order.id} className={`p-8 rounded-[3.5rem] border-2 shadow-2xl transition-all relative ${bgClass} hover:scale-[1.02]`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="font-mono text-xs opacity-50">#{order.order_number || 'N/A'}</span>
                  <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase mt-1">
                    {isCont ? order.action_type : order.type}
                  </span>
                </div>
                <button onClick={() => updateField(order.id, order.table, 'status', 'deleted')} className="opacity-40 hover:opacity-100 p-2"><Trash2 size={18}/></button>
              </div>

              <input 
                className="bg-transparent text-3xl font-black outline-none border-b border-transparent focus:border-white/40 w-full mb-2 truncate"
                defaultValue={order.client_name || order.client_info || order.to_branch}
                onBlur={e => updateField(order.id, order.table, isCont ? 'client_name' : (isTrans ? 'to_branch' : 'client_info'), e.target.value)}
              />

              <div className="flex items-center gap-2 mb-8 opacity-70">
                <MapPin size={16}/>
                <input 
                  className="bg-transparent text-sm font-bold outline-none border-b border-transparent focus:border-white/40 w-full"
                  defaultValue={order.delivery_address || order.location || `מהסניף: ${order.from_branch}`}
                  onBlur={e => updateField(order.id, order.table, isCont ? 'delivery_address' : (isTrans ? 'location' : 'location'), e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center bg-black/20 p-5 rounded-[2rem] mb-8">
                <div className="flex items-center gap-3">
                  <Clock size={28}/>
                  <input 
                    type="time" className="bg-transparent text-4xl font-black font-mono outline-none"
                    defaultValue={order.order_time || order.transfer_time}
                    onBlur={e => updateField(order.id, order.table, isCont ? 'order_time' : (isTrans ? 'transfer_time' : 'order_time'), e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <img src={avatar || 'https://i.postimg.cc/Vv4X4X4X/default.png'} className="w-16 h-16 rounded-full border-4 border-white/20 object-cover shadow-xl" alt={person} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black opacity-50 uppercase">מבצע המשימה</span>
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
