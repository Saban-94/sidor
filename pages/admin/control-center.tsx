'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Truck, Box, Bot, Send, CheckCircle, 
  Menu, X, Zap, Sun, Moon, Settings, MessageSquare
} from 'lucide-react';

const CONFIG: Record<string, { color: string, bg: string, logo: string }> = {
  'שארק 30': { color: '#3D7AFE', bg: 'bg-blue-50', logo: '/logos/shark30.png' },
  'כראדי 32': { color: '#00C8A5', bg: 'bg-emerald-50', logo: '/logos/karadi32.png' },
  'שי שרון 40': { color: '#FFA33C', bg: 'bg-orange-50', logo: '/logos/shai-sharon.png' },
  'מכולות בשרון': { color: '#7C3AED', bg: 'bg-purple-50', logo: '/logos/container-logo.png' }
};

export default function ControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chat, setChat] = useState<{open: boolean, mode: string, activeOrder: any}>({open: false, mode: 'none', activeOrder: null});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    fetchData();
    const sub = supabase.channel('orders').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
      audioRef.current?.play().catch(() => {});
      fetchData();
    }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('orders').select('*').neq('status', 'completed').order('order_time', { ascending: true });
    setOrders(data || []);
  };

  // פונקציית הקסם: פתיחת AI עם הקשר של הזמנה ספציפית
  const openSmartAI = (order: any) => {
    const mode = order.warehouse === 'מכולות בשרון' ? 'containers' : 'materials';
    setChat({ open: true, mode: mode, activeOrder: order });
    
    // ה-AI מתחיל את השיחה כשהוא מכיר את ההזמנה
    setChatHistory([{ 
      role: 'ai', 
      text: `בוס, אני על הזמנה #${order.order_number} של ${order.client_info}. מה תרצה לעדכן בה?` 
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    const currentOrder = chat.activeOrder;
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);

    // שליחה ל-API עם "הזרקת הקשר" (Context Injection)
    const res = await fetch(chat.mode === 'containers' ? '/api/containers' : '/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: userText, 
        orderContext: {
          id: currentOrder.id,
          client: currentOrder.client_info,
          number: currentOrder.order_number,
          location: currentOrder.location
        }
      })
    });
    const data = await res.json();
    setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
  };

  return (
    <AppLayout>
      <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC] text-slate-900'}`} dir="rtl">
        
        {/* Navbar פרימיום */}
        <nav className={`p-4 sticky top-0 z-50 border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
          <div className="max-w-[1600px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-black tracking-tighter italic">SABAN <span className="text-blue-600">OS</span></h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* כפתור שילוב צבעים */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">R</div>
            </div>
          </div>
        </nav>

        {/* Dashboard Grid - תצוגת מחשב מקצועית */}
        <main className="p-8 max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {orders.map((order) => {
              const config = CONFIG[order.warehouse] || { color: '#64748b', bg: 'bg-slate-100', logo: '/logos/default.png' };
              return (
                <motion.div 
                  key={order.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-[2rem] p-6 border transition-all hover:shadow-2xl ${isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className={`px-4 py-2 rounded-2xl font-black text-xs ${isDarkMode ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      {order.order_time}
                    </div>
                    <img src={config.logo} className="w-10 h-10 object-contain grayscale opacity-70 group-hover:grayscale-0" />
                  </div>

                  <h3 className="text-xl font-black mb-2 leading-tight">{order.client_info}</h3>
                  <div className="flex items-center gap-2 text-xs opacity-50 mb-8"><MapPin size={14}/> {order.location}</div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => supabase.from('orders').update({ status: 'completed' }).eq('id', order.id).then(fetchData)}
                      className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs transition-all"
                    >
                      בוצע ✅
                    </button>
                    <button 
                      onClick={() => openSmartAI(order)}
                      className={`p-4 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white'}`}
                    >
                      <Bot size={20} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </main>

        {/* AI SMART CHAT - מסך מלא במובייל, חלון מעוצב במחשב */}
        <AnimatePresence>
          {chat.open && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 right-0 left-0 lg:left-auto lg:right-10 lg:bottom-10 lg:w-[450px] z-[100] p-4"
            >
              <div className={`flex flex-col h-[80vh] lg:h-[600px] rounded-[2.5rem] shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Bot size={24} className="animate-bounce" />
                    <span className="font-black italic">SMART UPDATE</span>
                  </div>
                  <button onClick={() => setChat({open: false, mode: 'none', activeOrder: null})}><X/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/10">
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm font-bold ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-800 shadow-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 flex gap-2">
                  <input 
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="מה לעדכן בבוס?"
                    className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold outline-none text-slate-900"
                  />
                  <button onClick={sendMessage} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all">
                    <Send size={20} className="rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
