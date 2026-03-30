'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, MapPin, Send, Truck, User, Sparkles, PlusCircle, 
  X, Calendar, Clock, Share2, Edit2, Trash2, Sun, Moon, 
  MessageSquare, Eye, Construction, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanMasterOS() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [view, setView] = useState<'CHAT' | 'DRIVERS' | 'CONTROL'>('DRIVERS');
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const sub = supabase.channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { clearInterval(timer); sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('order_time', { ascending: true });
    if (data) setOrders(data);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'בוס, יש תקלה בתקשורת.' }]);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen font-sans overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 right-0 h-screen w-72 z-50 p-6 flex flex-col gap-8 border-l ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-black shadow-lg"><ShieldCheck size={24}/></div>
          <h1 className="font-black text-xl italic tracking-tighter">SABAN OS</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavBtn active={view === 'CHAT'} onClick={() => setView('CHAT')} icon={<MessageSquare size={18}/>} label="צאט פקודות" />
          <NavBtn active={view === 'DRIVERS'} onClick={() => setView('DRIVERS')} icon={<Truck size={18}/>} label="לוח סידור עבודה" />
          <NavBtn active={view === 'CONTROL'} onClick={() => setView('CONTROL')} icon={<Eye size={18}/>} label="מרכז ניטור" />
        </nav>

        <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
          <button onClick={() => setIsOrderModalOpen(true)} className="w-full bg-emerald-500 text-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
            <PlusCircle size={20}/> הזמנה ידנית
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl flex items-center justify-center gap-2 border ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}>
            {isDarkMode ? <><Sun size={18} className="text-orange-400"/> מצב יום</> : <><Moon size={18}/> מצב לילה</>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="h-full mr-72 flex flex-col relative transition-all">
        {/* Top Header */}
        <header className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? 'bg-[#111827]/50 backdrop-blur-md border-white/5' : 'bg-white/80 backdrop-blur-md border-slate-200'}`}>
          <div className="flex flex-col">
            <span className="text-3xl font-mono font-black tracking-tighter">
              {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Logistic Control</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-xs font-black animate-pulse border border-emerald-500/20">LIVE SERVER ACTIVE</div>
          </div>
        </header>

        <section className="flex-1 overflow-hidden p-6">
          {view === 'CHAT' && (
            <div className="h-full max-w-4xl mx-auto flex flex-col bg-black/10 rounded-[3rem] border border-white/5 overflow-hidden">
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                  {messages.map((m, i) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-bold shadow-lg ${m.role === 'user' ? 'bg-emerald-500 text-black' : 'bg-[#1E293B] text-white border border-white/10'}`}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
               </div>
               <form onSubmit={handleSendMessage} className="p-6 bg-black/20 flex gap-3">
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="כתוב פקודה למוח..." className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all" />
                  <button type="submit" className="bg-emerald-500 text-black p-4 rounded-2xl hover:bg-emerald-400 transition-all"><Send size={20}/></button>
               </form>
            </div>
          )}

          {view === 'DRIVERS' && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 scrollbar-hide">
              {['חכמת', 'עלי'].map(driver => (
                <div key={driver} className={`flex flex-col rounded-[3.5rem] border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="p-6 bg-white/5 flex items-center gap-4 border-b border-white/5">
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-1 bg-slate-800">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver === 'עלי' ? 'Ali' : 'Hachmat'}`} className="w-full h-full rounded-full" alt={driver} />
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter">{driver.toUpperCase()}</h2>
                  </div>
                  <div className="flex-1 p-6 space-y-2">
                    {TIME_SLOTS.map(slot => {
                      const order = orders.find(o => o.driver_name === driver && o.order_time === slot);
                      return (
                        <div key={slot} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${order ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-lg' : 'opacity-20 hover:opacity-50'}`}>
                          <span className="w-12 font-mono font-black text-xs text-emerald-500">{slot}</span>
                          {order ? (
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-black text-sm">{order.client_info}</span>
                              <span className="text-[10px] opacity-60"><MapPin size={10} className="inline ml-1"/>{order.location}</span>
                            </div>
                          ) : <div className="flex-1 border-t border-dashed border-white/10"></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 translate-x-[-5px]' : 'text-slate-400 hover:bg-white/5'}`}>
      {icon} {label}
    </button>
  );
}
