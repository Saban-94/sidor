'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Menu, X, Bot, Send, 
  CheckCircle, Bell, Sun, Moon, Zap, ChevronLeft
} from 'lucide-react';

// קונפיגורציית עיצוב למחסנים ולוגואים
const CONFIG: Record<string, { color: string, bg: string, logo: string }> = {
  'שארק 30': { color: '#3D7AFE', bg: 'bg-blue-50', logo: '/logos/shark30.png' },
  'כראדי 32': { color: '#00C8A5', bg: 'bg-emerald-50', logo: '/logos/karadi32.png' },
  'שי שרון 40': { color: '#FFA33C', bg: 'bg-orange-50', logo: '/logos/shai-sharon.png' },
  'מכולות בשרון': { color: '#7C3AED', bg: 'bg-purple-50', logo: '/logos/container-logo.png' }
};

export default function ControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chat, setChat] = useState<{open: boolean, order: any}>({open: false, order: null});

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setNow(new Date()), 1000);
    const sub = supabase.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'completed').order('order_time', { ascending: true });
    setOrders(data || []);
  };

  // חישוב טיימר דינמי
  const getTimer = (date: string, time: string) => {
    const target = new Date(`${date.replace(/-/g, '/')} ${time}`);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { text: "בוצע/חלף", urgent: false, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { 
      text: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
      urgent: diff < 3600000,
      expired: false
    };
  };

  return (
    <AppLayout>
      <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F4F7FA] text-slate-900'}`} dir="rtl">
        
        {/* Navbar עם המבורגר מתקדם */}
        <nav className={`sticky top-0 z-[60] p-4 border-b backdrop-blur-xl ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">Saban<span className="text-blue-600">OS</span></h1>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-2xl bg-blue-600/10 text-blue-600">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </nav>

        {/* תפריט המבורגר POPUP (Mobile Optimized) */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 right-0 h-full w-[80%] max-w-sm z-[110] p-8 shadow-2xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
              >
                <div className="flex justify-between items-center mb-12">
                  <span className="font-black text-blue-600 italic">MENU</span>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-900"><X/></button>
                </div>
                <div className="space-y-8">
                  {['לוח משימות', 'ניהול מכולות', 'דוחות יומיים', 'הגדרות מערכת'].map((item, i) => (
                    <motion.p 
                      key={i} whileTap={{ scale: 0.9 }}
                      className="text-2xl font-black hover:text-blue-600 cursor-pointer transition-all flex items-center gap-4"
                    >
                      <ChevronLeft size={20} className="text-blue-600" /> {item}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* רשימת כרטיסים */}
        <main className="p-4 space-y-4 max-w-lg mx-auto pb-32 pt-4">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const timer = getTimer(order.delivery_date, order.order_time);
              const config = CONFIG[order.warehouse] || { color: '#64748b', bg: 'bg-slate-50', logo: '/logos/default.png' };

              return (
                <motion.div
                  key={order.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative overflow-hidden rounded-[2.5rem] p-6 border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${config.bg}`}>
                        <img src={config.logo} className="w-8 h-8 object-contain" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase" style={{ color: config.color }}>{order.warehouse}</p>
                        <h3 className="font-bold text-lg leading-tight">{order.client_info}</h3>
                      </div>
                    </div>
                    {/* טיימר מעוצב */}
                    <div className={`px-4 py-2 rounded-2xl font-mono text-sm font-black shadow-inner ${timer.urgent && !timer.expired ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-100 text-slate-900'}`}>
                      {timer.text}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs opacity-50 mb-6">
                    <MapPin size={14} className="text-blue-500" /> {order.location || 'כתובת לא צוינה'}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => supabase.from('orders').update({ status: 'completed' }).eq('id', order.id).then(fetchData)}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      בוצע ✅
                    </button>
                    <button 
                      onClick={() => setChat({open: true, order})}
                      className={`p-4 rounded-[1.5rem] transition-all ${isDarkMode ? 'bg-white/5 text-blue-400' : 'bg-slate-100 text-slate-400'}`}
                    >
                      <Bot size={20} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </main>
      </div>
    </AppLayout>
  );
}
