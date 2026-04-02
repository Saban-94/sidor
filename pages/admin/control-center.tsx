'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Truck, Box, Bot, Send, CheckCircle, 
  Menu, X, Zap, MessageSquare, Loader2
} from 'lucide-react';

// עיצוב מחסנים ולוגואים
const CONFIG: Record<string, { color: string, bg: string, logo: string }> = {
  'שארק 30': { color: '#3D7AFE', bg: 'bg-blue-900/20', logo: '/logos/shark30.png' },
  'כראדי 32': { color: '#00C8A5', bg: 'bg-emerald-900/20', logo: '/logos/karadi32.png' },
  'שי שרון 40': { color: '#FFA33C', bg: 'bg-orange-900/20', logo: '/logos/shai-sharon.png' },
  'מכולות בשרון': { color: '#7C3AED', bg: 'bg-purple-900/20', logo: '/logos/container-logo.png' }
};

export default function ControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chat, setChat] = useState<{open: boolean, mode: string, title: string}>({open: false, mode: 'none', title: ''});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // פתרון צלצול: טעינת סאונד מלינק חיצוני יציב או מקומי
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    fetchData();
    
    // האזנה לשינויים בזמן אמת
    const sub = supabase.channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          audioRef.current?.play().catch(() => console.log("בלאגן בסאונד - דפדפן חסם"));
        }
        fetchData();
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('orders').select('*').neq('status', 'completed').order('order_time', { ascending: true });
    setOrders(data || []);
  };

  // כפתור בוצע - פתרון חסימה
  const handleComplete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); // מונע מהקליק "לברוח" לאלמנטים אחרים
    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', id);
    if (!error) fetchData();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    const endpoint = chat.mode === 'containers' ? '/api/containers' : '/api/gemini';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, senderPhone: 'admin' })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "בוס, המוח בשיפוצים. נסה שוב." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-blue-500/30" dir="rtl">
        
        {/* Navbar */}
        <nav className="p-5 bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
              <Menu size={24} className="text-blue-400" />
            </button>
            <h1 className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-blue-500">SYSTEM</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Online</span>
          </div>
        </nav>

        {/* Dashboard Grid */}
        <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-40">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const config = CONFIG[order.warehouse] || { color: '#475569', bg: 'bg-slate-800', logo: '/logos/default.png' };
              return (
                <motion.div 
                  key={order.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-[#111] border border-white/5 rounded-[2.5rem] p-6 hover:border-blue-500/50 transition-all shadow-2xl relative group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${config.bg}`}>
                      <img src={config.logo} className="w-10 h-10 object-contain" />
                    </div>
                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                      {order.order_time}
                    </span>
                  </div>

                  <h3 className="text-xl font-black mb-2 text-white leading-tight">{order.client_info}</h3>
                  <div className="flex items-center gap-2 text-xs opacity-50 mb-8"><MapPin size={14} className="text-blue-500"/> {order.location}</div>

                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => handleComplete(e, order.id)}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                      בוצע ✅
                    </button>
                    <button 
                      onClick={() => setChat({open: true, mode: order.warehouse === 'מכולות בשרון' ? 'containers' : 'materials', title: order.client_info})}
                      className="p-4 bg-white/5 text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl border border-white/5"
                    >
                      <Bot size={20} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </main>

        {/* AI FULL-SCREEN CHAT (Mobile Optimization) */}
        <AnimatePresence>
          {chat.open && (
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-0 z-[100] bg-black flex flex-col"
            >
              <div className="p-6 bg-[#111] border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                    <Zap size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Smart Assistant</p>
                    <h2 className="text-sm font-black truncate max-w-[200px]">{chat.title}</h2>
                  </div>
                </div>
                <button onClick={() => {setChat({open: false, mode: 'none', title: ''}); setChatHistory([]);}} className="p-3 bg-white/5 rounded-full"><X/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-5 rounded-[2rem] text-sm font-bold max-w-[90%] leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-[#1a1a1a] text-slate-200 border border-white/5'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1a1a1a] p-4 rounded-full flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-[#111] border-t border-white/10 pb-10">
                <div className="flex gap-3 bg-white/5 p-2 rounded-[2rem] border border-white/10 focus-within:border-blue-500 transition-all">
                  <input 
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="מה לעדכן בבוס?"
                    className="flex-1 bg-transparent p-4 text-sm font-bold outline-none"
                  />
                  <button onClick={sendMessage} className="p-4 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 active:scale-90 transition-all">
                    <Send size={20} className="rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Menu Buttons (Bottom) */}
        <footer className="fixed bottom-6 left-6 right-6 flex gap-4 z-40">
          <button 
            onClick={() => setChat({open: true, mode: 'materials', title: 'חומרי בניין'})}
            className="flex-1 py-5 bg-blue-600 rounded-[2rem] font-black text-xs shadow-[0_20px_40px_rgba(37,99,235,0.3)] border border-blue-400/20 active:scale-95 transition-all"
          >
            🤖 חומרי בניין
          </button>
          <button 
            onClick={() => setChat({open: true, mode: 'containers', title: 'מכולות בשרון'})}
            className="flex-1 py-5 bg-purple-600 rounded-[2rem] font-black text-xs shadow-[0_20px_40px_rgba(124,58,237,0.3)] border border-purple-400/20 active:scale-95 transition-all"
          >
            🚛 מכולות בשרון
          </button>
        </footer>
      </div>
    </AppLayout>
  );
}
