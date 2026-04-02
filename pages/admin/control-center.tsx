'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, Truck, Box, Bot, Send, 
  CheckCircle, X, MessageSquare, Zap, ChevronUp 
} from 'lucide-react';

// --- הגדרות עיצוב למחסנים ---
const CONFIG: Record<string, { color: string, bg: string, logo: string }> = {
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
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    const sub = supabase.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe();
    return () => { clearInterval(t); supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'completed').order('order_time', { ascending: true });
    setOrders(data || []);
  };

  const completeOrder = async (id: string) => {
    await supabase.from('orders').update({ status: 'completed' }).eq('id', id);
    fetchData();
  };

  const calculateCountdown = (date: string, time: string) => {
    const target = new Date(`${date.replace(/-/g, '/')} ${time}`);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { text: "חלף", urgent: false };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { text: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, urgent: diff < 3600000 };
  };

  const handleAISend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    const currentMode = chatMode;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    const res = await fetch(currentMode === 'containers' ? '/api/containers' : '/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, senderPhone: 'admin' })
    });
    const data = await res.json();
    setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AppLayout>
      <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden" dir="rtl">
        
        {/* Header קבוע */}
        <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-20">
          <h1 className="text-xl font-black italic">SABAN<span className="text-blue-600">OS</span></h1>
          <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-mono">
            {now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </header>

        {/* אזור גלילה של כרטיסים */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const timer = calculateCountdown(order.delivery_date, order.order_time);
              const config = CONFIG[order.warehouse] || { color: '#64748b', bg: 'bg-slate-50', logo: '/logos/default.png' };
              const driver = DRIVERS.find(d => d.name === order.driver_name);

              return (
                <motion.div
                  key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 100 }}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <img src={config.logo} className="w-10 h-10 object-contain" />
                      <div>
                        <p className="text-[10px] font-black uppercase" style={{ color: config.color }}>{order.warehouse}</p>
                        <h3 className="font-bold text-slate-900 leading-tight">{order.client_info}</h3>
                      </div>
                    </div>
                    <div className={`text-xs font-black px-2 py-1 rounded-lg ${timer.urgent ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                      {timer.text}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-4">
                    <MapPin size={14} /> {order.location}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100">
                      <img src={driver?.img || '/logos/admin.png'} className="w-8 h-8 rounded-full border-2 border-white" />
                      <span className="text-xs font-bold">{order.driver_name}</span>
                    </div>
                    <button 
                      onClick={() => completeOrder(order.id)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      בוצע ✅
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </main>

        {/* --- תפריט כפתורי AI בתחתית (Sticky Footer) --- */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col gap-3 z-50">
          
          {/* חלונית צא'ט צפה (נפתחת רק כשלוחצים על כפתור) */}
          <AnimatePresence>
            {chatMode !== 'none' && (
              <motion.div 
                initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
                className="bg-white border rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
              >
                <div className={`p-4 flex justify-between items-center text-white ${chatMode === 'containers' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  <span className="font-black text-sm">{chatMode === 'containers' ? '🤖 מוח מכולות' : '🤖 מוח חומרי בניין'}</span>
                  <button onClick={() => setChatMode('none')}><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[200px]">
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-bold ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 bg-white flex gap-2">
                  <input 
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAISend()}
                    placeholder="כתוב פקודה..."
                    className="flex-1 bg-slate-100 p-3 rounded-xl text-sm outline-none font-bold"
                  />
                  <button onClick={handleAISend} className="p-3 bg-slate-900 text-white rounded-xl"><Send size={18}/></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* שני הכפתורים הראשיים */}
          <div className="flex gap-3">
            <button 
              onClick={() => { setChatMode('materials'); setChatHistory([]); }}
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              <Truck size={18} /> חומרי בניין
            </button>
            <button 
              onClick={() => { setChatMode('containers'); setChatHistory([]); }}
              className="flex-1 bg-purple-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              <Box size={18} /> מכולות בשרון
            </button>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
