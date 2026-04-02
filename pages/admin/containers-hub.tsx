'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Bot, Send, CheckCircle, 
  Zap, Box, Truck, X, User
} from 'lucide-react';

// קונפיגורציה חזותית לפי מחסן - לינקים מעודכנים
const DESIGN_CONFIG: Record<string, { color: string, bg: string, logo: string, shadow: string }> = {
  'שארק 30': { color: '#0066FF', bg: 'bg-blue-50', logo: 'https://i.postimg.cc/VvypM8Xw/shark30.png', shadow: 'shadow-blue-200' },
  'כראדי 32': { color: '#10B981', bg: 'bg-emerald-50', logo: 'https://i.postimg.cc/mD8pW8Bf/karadi32.png', shadow: 'shadow-emerald-200' },
  'שי שרון 40': { color: '#F59E0B', bg: 'bg-amber-50', logo: 'https://i.postimg.cc/0Q4HvqVj/shai-sharon.png', shadow: 'shadow-amber-200' },
  'מכולות בשרון': { color: '#8B5CF6', bg: 'bg-purple-50', logo: '/logos/container-logo.png', shadow: 'shadow-purple-200' }
};

// תמונות נהגים
const DRIVER_IMAGES: Record<string, string> = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
};

export default function SabanControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [smartChat, setSmartChat] = useState<{ open: boolean, order: any }>({ open: false, order: null });
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('orders')
      .select('*')
      .neq('status', 'completed')
      .order('order_time', { ascending: true });
    setOrders(data || []);
  };

  const getCountdown = (date: string, time: string) => {
    const target = new Date(`${date.replace(/-/g, '/')} ${time}`);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { text: "בביצוע", urgent: false };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { 
      text: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
      urgent: diff < 3600000 
    };
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20" dir="rtl">
        
        {/* Header - Saban OS */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={20} className="text-white fill-current" />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter">SABAN<span className="text-blue-600">OS</span></h1>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 font-black text-sm font-mono">
             {now.toLocaleTimeString('he-IL', { hour12: false })}
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const timer = getCountdown(order.delivery_date, order.order_time);
              const config = DESIGN_CONFIG[order.warehouse] || { color: '#64748b', bg: 'bg-slate-50', logo: '', shadow: 'shadow-slate-100' };
              const driverImg = DRIVER_IMAGES[order.driver_name];

              return (
                <motion.div
                  key={order.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl ${config.shadow} transition-all`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${config.bg}`}>
                      <img src={config.logo} className="w-10 h-10 object-contain" alt="wh" />
                    </div>
                    <div className={`px-4 py-2 rounded-2xl font-mono text-sm font-black ${timer.urgent ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-900 text-white'}`}>
                      {timer.text}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-black leading-tight mb-2 h-14 overflow-hidden">{order.client_info}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <MapPin size={14} className="text-blue-500" /> {order.location || 'באיסוף עצמי'}
                    </div>
                  </div>

                  {/* נהג מבצע - תמונת פרופיל */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-6">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-200">
                      {driverImg ? (
                        <img src={driverImg} className="w-full h-full object-cover" alt="driver" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20}/></div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none">נהג מבצע</p>
                      <p className="text-sm font-black text-slate-800 italic">{order.driver_name || 'טרם שובץ'}</p>
                    </div>
                  </div>

                  {/* כפתורי פעולה */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => supabase.from('orders').update({ status: 'completed' }).eq('id', order.id).then(fetchData)}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      בוצע ✅
                    </button>
                    <button 
                      onClick={() => setSmartChat({ open: true, order })}
                      className="p-4 bg-slate-100 text-blue-600 rounded-[1.5rem] hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <Bot size={22} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </main>

        {/* AI Chat Popup (PWA Style) */}
        <AnimatePresence>
          {smartChat.open && (
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed inset-0 lg:inset-auto lg:right-6 lg:bottom-6 lg:w-[450px] z-[100] bg-white lg:rounded-[2.5rem] flex flex-col shadow-3xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Bot size={24}/>
                  <span className="font-black italic">SMART UPDATE</span>
                </div>
                <button onClick={() => setSmartChat({ open: false, order: null })} className="p-2 bg-white/20 rounded-full"><X/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4 min-h-[300px]">
                {/* כאן תבוא היסטוריית הצאט */}
                <div className="bg-blue-600 text-white p-4 rounded-[2rem] rounded-tl-none text-sm font-bold shadow-lg">
                  בוס, מה תרצה לעדכן בהזמנה של {smartChat.order?.client_info.split('|')[0]}?
                </div>
              </div>
              <div className="p-6 bg-white border-t flex gap-2 pb-10 lg:pb-6">
                <input placeholder="פקודה למוח..." className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold outline-none"/>
                <button className="p-4 bg-blue-600 text-white rounded-2xl"><Send size={20}/></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
