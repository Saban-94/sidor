'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Sun, Moon, MessageSquare, Trash2, MapPin, Send, Sparkles, Calendar, Clock, User, X
} from "lucide-react";

// חיבור ל-Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanLiveOS() {
  const [dark, setDark] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ client: '', address: '', branch: '', driver: '', date: new Date().toISOString().split('T')[0], time: '06:00' });

  const timeline = Array.from({ length: 23 }, (_, i) => {
    const hour = 6 + Math.floor(i / 2);
    const min = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${min}`;
  });

  useEffect(() => {
    fetchOrders();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*');
    if (data) setOrders(data);
  };

  const handleSendToBrain = async () => {
    if (!input.trim()) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, senderPhone: 'admin' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
  };

  const deleteOrder = async (id: string) => {
    if (confirm("למחוק הזמנה?")) await supabase.from('orders').delete().eq('id', id);
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

  return (
    <div className={`${dark ? "bg-[#06080F] text-white" : "bg-gray-100 text-gray-900"} font-sans transition-colors duration-500`}>
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar - AI & Control */}
        <aside className="w-80 border-l border-white/10 p-5 flex flex-col bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <ShieldCheck size={24} className="text-black" />
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Saban<span className="text-emerald-500">Live</span></h1>
          </div>

          {/* AI Chat Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            <div className="flex items-center gap-2 opacity-50 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} className="text-emerald-500" /> המוח דרוך
            </div>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} 
                className={`p-3 rounded-2xl text-sm font-bold ${m.role === 'user' ? 'border border-white/10' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
                {m.content}
              </motion.div>
            ))}
          </div>

          <div className="mt-4 relative">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendToBrain()}
              placeholder="פקודה למוח..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all pr-12" />
            <button onClick={handleSendToBrain} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"><Send size={18}/></button>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
              <Plus size={20} /> הזמנה חדשה
            </button>
            <button className="bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 p-4 rounded-2xl font-black flex items-center justify-center gap-2">
              <MessageSquare size={18} /> דוח בוקר
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="mt-6 flex justify-center border-t border-white/5 pt-6">
            <button onClick={() => setDark(!dark)} className="w-16 h-8 bg-white/5 rounded-full flex items-center px-1 border border-white/10">
              <motion.div layout className={`w-6 h-6 rounded-full ${dark ? 'bg-emerald-500' : 'bg-amber-500'} flex items-center justify-center`}>
                {dark ? <Sun size={14} className="text-black"/> : <Moon size={14} className="text-white" />}
              </motion.div>
            </button>
          </div>
        </aside>

        {/* Main Dashboard */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Central Clock */}
          <div className="text-center mb-10">
            <motion.div className="text-7xl font-mono font-black tracking-tighter">
              {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </motion.div>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.5em] mt-2">Logistic Mission Control</p>
          </div>

          {/* Grid: היום ומחר */}
          <div className="grid grid-cols-3 gap-8">
            {["חכמת", "עלי", "מחר"].map((col, idx) => (
              <div key={col} className={`p-6 rounded-[2.5rem] border ${idx === 2 ? "border-amber-500/30 bg-amber-500/5" : "border-white/5 bg-white/5"} backdrop-blur-3xl shadow-2xl`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase">{col}</h2>
                  {idx < 2 ? <Truck size={20} className="text-emerald-500" /> : <Calendar size={20} className="text-amber-500" />}
                </div>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2 scrollbar-hide">
                  {timeline.map((slot) => {
                    const targetDate = idx === 2 ? tomorrow : today;
                    const order = orders.find(o => o.order_time === slot && o.delivery_date === targetDate && (idx === 2 || o.driver_name === col));

                    return (
                      <div key={slot} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${order ? 'bg-emerald-500/10 border-emerald-500/30' : 'opacity-20 border-transparent hover:opacity-50'}`}>
                        <span className="text-xs font-mono font-black text-emerald-500 w-10">{slot}</span>
                        {order ? (
                          <div className="flex-1 flex items-center justify-between">
                            <div>
                              <div className="font-black text-sm">{order.client_info}</div>
                              <div className="flex items-center gap-1 text-[10px] opacity-60"><MapPin size={10} /> {order.location}</div>
                            </div>
                            <button onClick={() => deleteOrder(order.id)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        ) : (
                          <div className="flex-1 border-t border-dashed border-white/5"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modal: טופס הזרקה ידנית */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-[#111827] p-10 rounded-[3rem] border border-white/10 shadow-2xl relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 left-6 text-white/50 hover:text-white"><X/></button>
              <h2 className="text-3xl font-black mb-8 italic">הזרקה ללוח</h2>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full mb-10 overflow-hidden">
                <motion.div animate={{ width: `${(step/3)*100}%` }} className="h-full bg-emerald-500" />
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <input placeholder="שם לקוח..." value={formData.client} onChange={(e)=>setFormData({...formData, client: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-emerald-500" />
                  <input placeholder="כתובת..." value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-emerald-500" />
                  <button onClick={()=>setStep(2)} className="w-full py-5 bg-white text-black rounded-2xl font-black">המשך לזמן</button>
                </div>
              )}
              {/* המשך השלבים (2, 3) כפי שבנינו קודם... */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Truck({ size, className }: any) { return <Truck size={size} className={className} />; }
function ShieldCheck({ size, className }: any) { return <ShieldCheck size={size} className={className} />; }
