'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, Truck, Box, Bot, Bell, 
  MessageSquare, Zap, ChevronLeft, Send 
} from 'lucide-react';

// קבועים לעיצוב מחסנים
const WAREHOUSE_CONFIG: Record<string, { color: string, bg: string, logo: string }> = {
  'שארק 30': { color: '#3D7AFE', bg: 'bg-blue-50', logo: '/logos/shark30.png' },
  'כראדי 32': { color: '#00C8A5', bg: 'bg-emerald-50', logo: '/logos/karadi32.png' },
  'שי שרון 40': { color: '#FFA33C', bg: 'bg-orange-50', logo: '/logos/shai-sharon.png' },
  'מכולות בשרון': { color: '#7C3AED', bg: 'bg-purple-50', logo: '/logos/container-logo.png' }
};

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function ControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [chatMode, setChatMode] = useState<'none' | 'containers' | 'materials'>('none');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    const sub = supabase.channel('live_ops').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe();
    return () => { clearInterval(t); supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted').order('order_time', { ascending: true });
    setOrders(data || []);
  };

  const calculateCountdown = (date: string, time: string) => {
    const target = new Date(`${date.replace(/-/g, '/')} ${time}`);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { text: "בביצוע/חלף", urgent: false, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { 
      text: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
      urgent: diff < 3600000,
      expired: false
    };
  };

  const sendToAI = async () => {
    if (!chatInput.trim()) return;
    const endpoint = chatMode === 'containers' ? '/api/containers' : '/api/gemini';
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, senderPhone: 'admin' })
    });
    const data = await res.json();
    setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col lg:flex-row font-sans antialiased" dir="rtl">
        
        {/* צד ימין: לוח משימות LIVE */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Saban <span className="text-blue-600">OS</span></h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Control Center</span>
              </div>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-slate-100 text-center">
              <p className="text-2xl font-black text-blue-600 font-mono">{now.toLocaleTimeString('he-IL')}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date().toLocaleDateString('he-IL')}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {orders.map((order) => {
                const timer = calculateCountdown(order.delivery_date, order.order_time);
                const config = WAREHOUSE_CONFIG[order.warehouse] || { color: '#ccc', bg: 'bg-slate-50', logo: '/logos/default.png' };
                const driver = DRIVERS.find(d => d.name === order.driver_name);

                return (
                  <motion.div
                    key={order.id} layout
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-2xl transition-all relative overflow-hidden"
                  >
                    {/* באנר מחסן עליון */}
                    <div className={`absolute top-0 left-0 right-0 h-2`} style={{ backgroundColor: config.color }} />
                    
                    <div className="flex justify-between items-start mb-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${config.bg}`}>
                          <img src={config.logo} className="w-8 h-8 object-contain" alt="warehouse" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-tighter" style={{ color: config.color }}>{order.warehouse}</span>
                          <h3 className="text-xl font-black text-slate-900 leading-none">{order.client_info}</h3>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full font-mono text-lg font-black ${timer.urgent && !timer.expired ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-50 text-slate-900'}`}>
                        {timer.text}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <MapPin size={16} className="text-blue-500" /> {order.location}
                      </div>
                    </div>

                    {/* נהג מבצע */}
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <img src={driver?.img || '/rami-avatar.jpg'} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Driver Assigned</span>
                        <p className="text-sm font-black text-slate-800 italic">{order.driver_name}</p>
                      </div>
                      <div className="mr-auto">
                        <Zap size={18} className={timer.expired ? 'text-slate-300' : 'text-yellow-400 animate-pulse'} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </main>

        {/* צד שמאל: חמ"ל AI (צא'ט מוסתר) */}
        <aside className="w-full lg:w-[450px] bg-white border-r border-slate-200 flex flex-col shadow-2xl z-50">
          
          {/* בורר מצבי צא'ט */}
          <div className="p-6 border-b border-slate-100 flex gap-3 bg-slate-950">
            <button 
              onClick={() => { setChatMode('materials'); setChatHistory([]); }}
              className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] transition-all ${chatMode === 'materials' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500'}`}
            >
              <Truck size={16} /> חומרי בניין
            </button>
            <button 
              onClick={() => { setChatMode('containers'); setChatHistory([]); }}
              className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] transition-all ${chatMode === 'containers' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-500'}`}
            >
              <Box size={16} /> מכולות בשרון
            </button>
          </div>

          {/* גוף הצא'ט */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {chatMode === 'none' ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <Bot size={64} className="mb-4" />
                <p className="font-black italic uppercase tracking-widest text-slate-900 text-sm">בחר מוח AI להזרקה</p>
              </div>
            ) : (
              <AnimatePresence>
                {chatHistory.map((msg, i) => (
                  <motion.div 
                    key={i} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-[2rem] font-bold text-xs leading-relaxed ${msg.role === 'user' ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-900 text-blue-400 rounded-tr-none shadow-xl'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* קלט צא'ט */}
          {chatMode !== 'none' && (
            <div className="p-6 border-t border-slate-100 bg-white">
              <div className="relative group">
                <input 
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
                  placeholder={`פקודה למוח ${chatMode === 'containers' ? 'המכולות' : 'החומרים'}...`}
                  className="w-full bg-slate-100 p-5 rounded-[1.5rem] border-none font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
                <button onClick={sendToAI} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-blue-400 rounded-xl shadow-lg active:scale-90 transition-all">
                  <Send size={20} className="rotate-180" />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
