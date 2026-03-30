'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, CornerDownLeft, Sparkles, MapPin, Briefcase, 
  Trash2, Edit2, Clock, Truck, MoreVertical, X
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

// --- Main Component ---
export default function MagicChat() {
  const { phone } = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Setup & Data Fetching
  useEffect(() => {
    setMounted(true);
    fetchOrders();

    // Subscribe to REALTIME orders table changes
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map(o => o.id === payload.new.id ? payload.new : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 3. Functions
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
        body: JSON.stringify({ message: input, senderPhone: phone })
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

  const handleOrderAction = async (orderId: string, action: 'edit' | 'delete' | 'change_driver' | 'change_time', newValue?: any) => {
    if (action === 'delete') {
      if(confirm('למחוק הזמנה זו מהלוח?')) {
        await supabase.from('orders').delete().eq('id', orderId);
      }
    } else if (action === 'change_driver') {
      await supabase.from('orders').update({ driver_name: newValue }).eq('id', orderId);
    }
    // Note: Edit and Change Time would typically open a modal. Added basic structure.
    console.log(`Action: ${action}, Order: ${orderId}, Value: ${newValue}`);
  };

  const renderOrderInSlot = (driverName: string, timeSlot: string) => {
    const order = orders.find(o => o.driver_name === driverName && o.order_time === timeSlot);
    if (!order) return null;
    
    return (
      <motion.div initial={{opacity:0, y: 5}} animate={{opacity:1, y:0}} className="relative group bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold shadow-sm active:scale-95 transition-all">
        <div className="flex justify-between items-start gap-1">
          <div className="flex-1 space-y-0.5">
            <div className="truncate text-slate-950 font-black">{order.client_info}</div>
            <div className="opacity-70 truncate text-slate-600 flex items-center gap-0.5"><MapPin size={10}/>{order.location}</div>
          </div>
          <div className="flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 left-1 bg-slate-50/90 backdrop-blur-sm p-1 rounded-md">
            <button onClick={() => handleOrderAction(order.id, 'delete')} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
            <button onClick={() => handleOrderAction(order.id, 'change_driver', driverName === 'עלי' ? 'חכמת' : 'עלי')} className="text-blue-500 hover:text-blue-700"><Truck size={12}/></button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans" dir="rtl">
      {/* 1. Header (Premium Style) */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"><CornerDownLeft size={20}/></button>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 p-0.5 bg-slate-100">
              <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=saban" className="w-full h-full rounded-full" alt="Saban Bot" />
            </div>
            <div>
              <h1 className="font-black text-xl italic uppercase tracking-tighter">Saban <span className="text-emerald-500">Master</span> OS</h1>
              <span className="text-xs font-mono font-bold text-emerald-600 animate-pulse">Live Server Active</span>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"><X size={20}/></button>
        </div>
      </header>

      {/* 2. Main Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat Section (Left/Top) */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-[2.5rem] shadow-xl border border-slate-100 h-[calc(100vh-120px)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-black text-lg flex items-center gap-2"><Bot className="text-emerald-500"/> שיחה עם המוח</h2>
            <span className="text-xs font-mono font-bold text-slate-400">ערוץ: {phone}</span>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} items-end gap-2.5`}>
                  {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 p-1"><User className="w-full h-full text-slate-500"/></div>}
                  <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-bold shadow-md ${m.role === 'user' ? 'bg-emerald-500 text-black rounded-bl-lg' : 'bg-slate-100 text-slate-950 rounded-br-lg border border-slate-200'}`}>
                    {m.content}
                    <span className="block text-[9px] opacity-40 mt-1 font-mono">{m.time}</span>
                  </div>
                  {m.role === 'assistant' && <div className="w-8 h-8 rounded-full border border-emerald-300 p-0.5 bg-white"><img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=saban" className="w-full h-full rounded-full"/></div>}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-end items-center gap-2 text-slate-400">
                <span className="text-xs font-bold animate-pulse">המוח חושב...</span>
                <Sparkles size={16} className="animate-spin"/>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="כתוב פקודה למוח..." className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl outline-none focus:border-emerald-500 shadow-sm transition-all" />
            <button type="submit" className="bg-emerald-500 text-black p-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50" disabled={loading}><Send size={20}/></button>
          </form>
        </div>

        {/* Driver Schedule (Right/Bottom) */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 h-[calc(100vh-120px)] overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-black text-lg flex items-center gap-2"><Truck className="text-emerald-500"/> לוח סידור עבודה חקוק (Live)</h2>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
            {['חכמת', 'עלי'].map((driver) => (
              <div key={driver} className="flex flex-col rounded-3xl bg-slate-50 border border-slate-200 overflow-hidden shadow-inner">
                <div className="p-3 border-b bg-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 p-0.5 bg-slate-100">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver === 'עלי' ? 'Ali' : 'Hachmat'}`} className="w-full h-full rounded-full" />
                  </div>
                  <h3 className="font-black text-base italic uppercase tracking-tighter text-slate-950">{driver}</h3>
                </div>
                <div className="flex-1 flex flex-col gap-1 p-2 max-h-[calc(100%-60px)] overflow-y-auto pr-1 scrollbar-hide">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot} className="flex items-center gap-2 min-h-[48px] bg-white rounded-xl px-2.5 border border-slate-100">
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-8 text-center">{slot}</span>
                      <div className="flex-1">
                        {renderOrderInSlot(driver, slot)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
