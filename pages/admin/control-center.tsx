'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, Truck, Box, Bot, Send, CheckCircle, 
  Menu, X, Bell, Zap, Monitor, Smartphone, MessageSquare 
} from 'lucide-react';
import OneSignal from 'react-onesignal';

// --- הגדרות עיצוב ---
const CONFIG: Record<string, { color: string, bg: string, logo: string }> = {
  'שארק 30': { color: '#3D7AFE', bg: 'bg-blue-50', logo: '/logos/shark30.png' },
  'כראדי 32': { color: '#00C8A5', bg: 'bg-emerald-50', logo: '/logos/karadi32.png' },
  'שי שרון 40': { color: '#FFA33C', bg: 'bg-orange-50', logo: '/logos/shai-sharon.png' },
  'מכולות בשרון': { color: '#7C3AED', bg: 'bg-purple-50', logo: '/logos/container-logo.png' }
};

export default function ControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState<{open: boolean, mode: string, initialMsg?: string}>({open: false, mode: 'none'});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // זיהוי מכשיר
    setIsMobile(window.innerWidth < 1024);
    
    // אתחול OneSignal
    OneSignal.init({ appId: "YOUR_ONESIGNAL_APP_ID", allowLocalhostAsSecureOrigin: true });

    // טעינת סאונד הזרקה
    audioRef.current = new Audio('/sounds/injection.mp3');

    fetchData();
    const sub = supabase.channel('live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
      audioRef.current?.play();
      fetchData();
    }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('orders').select('*').neq('status', 'completed').order('order_time', { ascending: true });
    setOrders(data || []);
  };

  const completeOrder = async (id: string) => {
    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', id);
    if (!error) fetchData();
  };

  const openAiUpdate = (order: any) => {
    const mode = order.warehouse === 'מכולות בשרון' ? 'containers' : 'materials';
    setChatConfig({
      open: true,
      mode: mode,
      initialMsg: `אני מכיר את הזמנה ${order.order_number} של ${order.client_info}. מה תרצה לעדכן בה?`
    });
    setChatHistory([{ role: 'ai', text: `הבנתי בוס, אני על הזמנה #${order.order_number} של ${order.client_info}. מה תרצה לשנות?` }]);
  };

  const handleSend = async () => {
    const res = await fetch(chatConfig.mode === 'containers' ? '/api/containers' : '/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, orderContext: chatConfig.initialMsg })
    });
    const data = await res.json();
    setChatHistory([...chatHistory, {role: 'user', text: input}, {role: 'ai', text: data.reply}]);
    setInput('');
  };

  return (
    <AppLayout>
      <div className={`min-h-screen ${isMobile ? 'bg-slate-50' : 'bg-[#0F172A] text-white'} font-sans`} dir="rtl">
        
        {/* Navbar מודרני עם המבורגר */}
        <nav className="p-4 bg-white/10 backdrop-blur-md border-b border-white/10 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-blue-500">PRO</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-[10px] font-bold opacity-50 uppercase tracking-widest">System Status: Active</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-bold text-xs">R</span>
            </div>
          </div>
        </nav>

        {/* תפריט המבורגר POPUP */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed inset-0 bg-slate-900/95 z-[100] p-10 flex flex-col gap-8"
            >
              <button onClick={() => setIsMenuOpen(false)} className="self-start p-4 bg-white/10 rounded-full"><X/></button>
              <div className="space-y-6">
                <p className="text-4xl font-black hover:text-blue-500 cursor-pointer transition-all">לוח משימות</p>
                <p className="text-4xl font-black hover:text-emerald-500 cursor-pointer transition-all">ניהול מכולות</p>
                <p className="text-4xl font-black hover:text-purple-500 cursor-pointer transition-all">הגדרות OneSignal</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* לוח המשימות - ריספונסיבי (Grid למחשב, List לנייד) */}
        <main className={`p-6 ${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'}`}>
          {orders.map((order) => {
            const config = CONFIG[order.warehouse] || { color: '#475569', bg: 'bg-slate-800', logo: '/logos/default.png' };
            return (
              <motion.div 
                key={order.id} layout
                className={`group relative overflow-hidden rounded-[2rem] p-6 transition-all ${isMobile ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <img src={config.logo} className="w-12 h-12 object-contain" />
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-500/20 text-blue-400 mb-1">#{order.order_number}</span>
                    <span className="text-xs font-mono font-bold opacity-60">{order.order_time}</span>
                  </div>
                </div>

                <h3 className="text-lg font-black leading-tight mb-2">{order.client_info}</h3>
                <div className="flex items-center gap-2 text-xs opacity-60 mb-6"><MapPin size={14}/> {order.location}</div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => completeOrder(order.id)}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                  >
                    בוצע ✅
                  </button>
                  <button 
                    onClick={() => openAiUpdate(order)}
                    className="p-3 bg-white/10 text-blue-400 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-xl"
                  >
                    <Bot size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </main>

        {/* AI Update Popup - חלון צא'ט חכם */}
        <AnimatePresence>
          {chatConfig.open && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
            >
              <div className="bg-white text-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Zap className="animate-pulse" />
                    <span className="font-black italic uppercase">AI Smart Update</span>
                  </div>
                  <button onClick={() => setChatConfig({open: false, mode: 'none'})}><X/></button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`p-4 rounded-3xl text-sm font-bold ${m.role === 'user' ? 'bg-slate-200' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white border-t flex gap-2">
                  <input 
                    value={input} onChange={e => setInput(e.target.value)} 
                    placeholder="מה תרצה לעדכן בבוס?"
                    className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold outline-none"
                  />
                  <button onClick={handleSend} className="p-4 bg-slate-900 text-white rounded-2xl"><Send size={20}/></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
