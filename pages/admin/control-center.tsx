'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Bot, Send, CheckCircle, 
  Zap, Box, Truck, X, Search, Filter 
} from 'lucide-react';

// קונפיגורציה חזותית לפי מחסן
const DESIGN_CONFIG: Record<string, { color: string, bg: string, logo: string, shadow: string }> = {
  'שארק 30': { color: '#0066FF', bg: 'bg-blue-50', logo: 'https://i.postimg.cc/VvypM8Xw/shark30.png', shadow: 'shadow-blue-200' },
  'כראדי 32': { color: '#10B981', bg: 'bg-emerald-50', logo: 'https://ibb.co/ycwS3z15?raw=true', shadow: 'shadow-emerald-200' },
  'שי שרון 40': { color: '#F59E0B', bg: 'bg-amber-50', logo: 'https://i.postimg.cc/0Q4HvqVj/shai-sharon.png', shadow: 'shadow-amber-200' },
  'מכולות בשרון': { color: '#8B5CF6', bg: 'bg-purple-50', logo: '/logos/container-logo.png', shadow: 'shadow-purple-200' }
};

export default function SabanControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [smartChat, setSmartChat] = useState<{ open: boolean, order: any }>({ open: false, order: null });
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // טעינת צליל הזרקה
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    
    // Real-time Sub
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        audioRef.current?.play().catch(() => {});
        fetchData();
      }).subscribe();

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

  const openAiUpdate = (order: any) => {
    setSmartChat({ open: true, order });
    setChatHistory([{ 
      role: 'ai', 
      text: `בוס, אני מחובר להזמנה #${order.order_number} של ${order.client_info.split('|')[0]}. מה תרצה לעדכן?` 
    }]);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans" dir="rtl">
        
        {/* Header - Saban Premium */}
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-200 p-4 lg:p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Zap size={24} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter">SABAN<span className="text-blue-600">OS</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Live Ops Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200">
             <Clock size={16} className="text-blue-600" />
             <span className="font-black text-sm font-mono">{now.toLocaleTimeString('he-IL', { hour12: false })}</span>
          </div>
        </header>

        {/* Dashboard Grid - תצוגה חכמה לפי מכשיר */}
        <main className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-40">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const timer = getCountdown(order.delivery_date, order.order_time);
              const config = DESIGN_CONFIG[order.warehouse] || { color: '#64748b', bg: 'bg-slate-50', logo: '/logos/default.png', shadow: 'shadow-slate-100' };

              return (
                <motion.div
                  key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 50 }}
                  className={`bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl ${config.shadow} hover:shadow-2xl transition-all group`}
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
                    <span className="text-[10px] font-black uppercase tracking-widest mb-1 block" style={{ color: config.color }}>{order.warehouse}</span>
                    <h3 className="text-xl font-black leading-tight h-14 overflow-hidden">{order.client_info}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mt-2">
                      <MapPin size={14} className="text-blue-500" /> {order.location || 'באיסוף עצמי'}
                    </div>
                  </div>

                  {/* כפתורי פעולה */}
                  <div className="flex gap-2 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => supabase.from('orders').update({ status: 'completed' }).eq('id', order.id).then(fetchData)}
                      className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      בוצע ✅
                    </button>
                    <button 
                      onClick={() => openAiUpdate(order)}
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

        {/* AI SMART UPDATE POPUP (מעוצב למובייל ולמחשב) */}
        <AnimatePresence>
          {smartChat.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSmartChat({open: false, order: null})} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="fixed bottom-0 right-0 left-0 lg:left-auto lg:right-8 lg:bottom-8 lg:w-[450px] z-[110] bg-white rounded-t-[3rem] lg:rounded-[3rem] shadow-3xl overflow-hidden flex flex-col h-[85vh] lg:h-[650px] border border-slate-100"
              >
                <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse"><Bot size={24}/></div>
                    <div>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">Smart Assistant</p>
                      <h4 className="font-black italic">AI Update Center</h4>
                    </div>
                  </div>
                  <button onClick={() => setSmartChat({open: false, order: null})} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`p-5 rounded-[2rem] text-sm font-bold max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-white border border-slate-200 text-slate-800 rounded-tr-none' : 'bg-blue-600 text-white shadow-blue-100 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white border-t border-slate-100 flex gap-2 pb-10 lg:pb-6">
                  <input 
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setChatHistory([...chatHistory, {role:'user', text: input}])}
                    placeholder="מה תרצה לעדכן בהזמנה בוס?"
                    className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                  <button className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 active:scale-90 transition-all"><Send size={20} className="rotate-180"/></button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
