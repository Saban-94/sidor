'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, CornerDownLeft, Sparkles, MapPin, 
  Trash2, Truck, MessageSquare, Eye, Sun, Moon, X, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Supabase Client Setup ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Constants ---
const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

type Message = { id: string; role: 'user' | 'assistant'; content: string; time: string };

export default function MagicChat() {
  const router = useRouter();
  const phone = router.query.phone as string;

  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [view, setView] = useState<'CHAT' | 'DRIVERS' | 'CONTROL'>('DRIVERS');
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const sub = supabase.channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
      
    return () => { 
      clearInterval(timer); 
      sub.unsubscribe(); 
    };
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
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, senderPhone: phone || 'admin' })
      });
      const data = await res.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    if (confirm('למחוק הזמנה מהלוח?')) {
      await supabase.from('orders').delete().eq('id', id);
      fetchOrders();
    }
  };

  const renderOrderInSlot = (driverName: string, timeSlot: string) => {
    const order = orders.find(o => o.driver_name === driverName && o.order_time === timeSlot);
    if (!order) return null;
    
    return (
      <motion.div initial={{opacity:0, scale: 0.9}} animate={{opacity:1, scale: 1}} className="group relative bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex-1 truncate">
            <div className="font-black text-[11px] text-emerald-500 truncate leading-tight">{order.client_info}</div>
            <div className="text-[9px] opacity-60 truncate leading-tight">{order.location}</div>
          </div>
          <button onClick={() => deleteOrder(order.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-all">
            <Trash2 size={12}/>
          </button>
        </div>
      </motion.div>
    );
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen font-sans overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F8FAFC] text-slate-900'}`} dir="rtl">
      
      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-screen w-72 z-50 p-6 flex flex-col gap-8 border-l ${isDarkMode ? 'bg-[#111827] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-black shadow-lg shadow-emerald-500/20"><ShieldCheck size={24}/></div>
          <h1 className="font-black text-xl italic tracking-tighter">SABAN OS</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavBtn active={view === 'CHAT'} onClick={() => setView('CHAT')} icon={<MessageSquare size={18}/>} label="צאט פקודות" />
          <NavBtn active={view === 'DRIVERS'} onClick={() => setView('DRIVERS')} icon={<Truck size={18}/>} label="לוח סידור עבודה" />
          <NavBtn active={view === 'CONTROL'} onClick={() => setView('CONTROL')} icon={<Eye size={18}/>} label="מרכז ניטור" />
        </nav>

        <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition-colors ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}>
            {isDarkMode ? <><Sun size={18} className="text-orange-400"/> יום</> : <><Moon size={18}/> לילה</>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="h-full mr-72 flex flex-col relative transition-all">
        <header className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? 'bg-[#111827]/50 backdrop-blur-md border-white/5' : 'bg-white/80 backdrop-blur-md border-slate-200'}`}>
          <div className="flex flex-col">
            <span className="text-3xl font-mono font-black tracking-tighter uppercase">
              {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Saban Mission Control</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase">Realtime Engine On</div>
          </div>
        </header>

        <section className="flex-1 overflow-hidden p-6">
          {view === 'CHAT' ? (
            <div className="h-full max-w-4xl mx-auto flex flex-col bg-black/10 rounded-[3rem] border border-white/5 overflow-hidden">
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide text-right">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-bold shadow-lg ${m.role === 'user' ? 'bg-emerald-500 text-black' : 'bg-[#1E293B] text-white border border-white/10'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black animate-pulse opacity-50 text-emerald-500">המוח מעבד פקודה...</div>}
               </div>
               <form onSubmit={handleSendMessage} className="p-6 bg-black/20 flex gap-3 border-t border-white/5">
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="כתוב פקודה למוח..." className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all text-white placeholder-white/20 shadow-inner" />
                  <button type="submit" className="bg-emerald-500 text-black p-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-lg active:scale-95 disabled:opacity-50" disabled={loading}><Send size={20}/></button>
               </form>
            </div>
          ) : (
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 scrollbar-hide">
              {['חכמת', 'עלי'].map(driver => (
                <div key={driver} className={`flex flex-col rounded-[3.5rem] border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="p-6 bg-white/5 flex items-center gap-4 border-b border-white/5">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 p-1 bg-slate-800 flex items-center justify-center">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver === 'עלי' ? 'Ali' : 'Hachmat'}`} className="w-full h-full rounded-full" alt={driver} />
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">{driver}</h2>
                  </div>
                  <div className="flex-1 p-6 space-y-2">
                    {TIME_SLOTS.map(slot => (
                      <div key={slot} className="flex items-center gap-4 p-2 rounded-2xl border border-transparent hover:bg-white/5 transition-all group">
                        <span className="w-12 font-mono font-black text-xs opacity-20 group-hover:opacity-100 transition-opacity">{slot}</span>
                        <div className="flex-1">
                          {renderOrderInSlot(driver, slot)}
                        </div>
                      </div>
                    ))}
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
