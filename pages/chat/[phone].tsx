'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, MapPin, Send, Truck, User, Sparkles, PlusCircle, 
  X, Calendar, Clock, Share2, Edit2, Trash2, Sun, Moon, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanMasterOS() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    client: '', 
    address: '', 
    branch: '', 
    driver: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '06:00' 
  });

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const sub = supabase.channel('orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { clearInterval(timer); sub.unsubscribe(); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*');
    if (data) setOrders(data);
  };

  const handleSendMessage = async () => {
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'בוס, יש תקלה בחיבור למוח.' }]);
    }
  };

  const deleteOrder = async (id: string) => {
    if (confirm("בוס, למחוק הזמנה?")) {
      await supabase.from('orders').delete().eq('id', id);
    }
  };

  const submitOrder = async () => {
    await supabase.from('orders').insert([{
      client_info: formData.client, 
      location: formData.address, 
      source_branch: formData.branch,
      driver_name: formData.driver, 
      delivery_date: formData.date, 
      order_time: formData.time
    }]);
    setIsOrderModalOpen(false); 
    setStep(1);
    setFormData({ ...formData, client: '', address: '' });
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F3F4F6] text-slate-900'} font-sans overflow-hidden transition-colors duration-500`} dir="rtl">
      
      {/* Sidebar - Control Center */}
      <aside className={`w-96 flex flex-col border-l ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-2xl'} p-6 z-20`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-black shadow-lg shadow-emerald-500/30"><ShieldCheck size={24}/></div>
            <h1 className="font-black text-2xl tracking-tighter">SABAN <span className="text-emerald-500">PRO</span></h1>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            {isDarkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}
          </button>
        </div>

        {/* Brain Chat Interface */}
        <div className={`flex-1 flex flex-col rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
          <div className="p-4 border-b border-white/5 bg-emerald-500/5 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500 animate-pulse"/>
            <span className="text-xs font-black uppercase tracking-widest opacity-70">המוח של ראמי דרוך</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-bold ${m.role === 'user' ? 'bg-white/5 border border-white/10' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 relative">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="פקודה למוח..." 
              className={`w-full p-4 pr-4 pl-12 rounded-2xl outline-none border focus:border-emerald-500 transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`} 
            />
            <button onClick={handleSendMessage} className="absolute left-7 top-1/2 -translate-y-1/2 text-emerald-500">
              <Send size={20}/>
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button onClick={() => setIsOrderModalOpen(true)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20">
            <PlusCircle size={22}/> הוסף הזמנה ידנית
          </button>
          <button className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all">
            <Share2 size={20}/> שיתוף דוח בוקר
          </button>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        
        {/* Digital Clock Header */}
        <header className="flex flex-col items-center mb-10">
          <div className={`px-10 py-4 rounded-full border shadow-2xl mb-2 flex items-center gap-4 ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
            <Clock className="text-emerald-500" size={28}/>
            <span className="text-5xl font-black font-mono tracking-tighter">
              {mounted && currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="opacity-40 font-black uppercase tracking-[0.3em] text-xs">Logistic Master Control</p>
        </header>

        {/* Drivers Board */}
        <div className="flex-1 flex gap-8 overflow-hidden">
          {['חכמת', 'עלי'].map(driver => (
            <div key={driver} className={`flex-1 flex flex-col rounded-[3rem] border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
              
              <div className="p-6 bg-white/5 flex items-center gap-5 border-b border-white/5">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500 p-1 bg-slate-800">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver === 'עלי' ? 'Ali' : 'Hachmat'}`} className="w-full h-full rounded-full" />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter">{driver.toUpperCase()}</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/>
                    <span className="text-emerald-500 font-black text-sm uppercase">Active</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-hide">
                {TIME_SLOTS.map(slot => {
                  const order = orders.find(o => o.driver_name === driver && o.order_time === slot);
                  return (
                    <div key={slot} className={`group flex items-center gap-4 p-3 rounded-2xl transition-all ${order ? 'bg-emerald-500/10 border border-emerald-500/30' : 'opacity-20 hover:opacity-100'}`}>
                      <span className="w-16 font-mono font-black text-lg text-emerald-500">{slot}</span>
                      {order ? (
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="font-black text-lg leading-none">{order.client_info}</p>
                            <p className="text-xs opacity-60 mt-1 flex items-center gap-1"><MapPin size={10}/> {order.location}</p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-white/10 rounded-lg text-emerald-500"><Edit2 size={16}/></button>
                            <button onClick={() => deleteOrder(order.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 border-t border-dashed border-white/10"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Manual Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`w-full max-w-xl p-10 rounded-[4rem] border ${isDarkMode ? 'bg-[#111827] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black italic">הזרקת הזמנה</h2>
                <div className="flex gap-2">
                  {[1,2,3].map(s => <div key={s} className={`h-2 w-10 rounded-full transition-all ${step >= s ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-white/10'}`}/>)}
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 opacity-50 font-black uppercase tracking-widest text-sm"><User size={18}/> שם וכתובת</div>
                  <input placeholder="שם לקוח..." value={formData.client} onChange={(e)=>setFormData({...formData, client: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xl outline-none focus:border-emerald-500 transition-all" />
                  <input placeholder="כתובת אספקה..." value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xl outline-none focus:border-emerald-500 transition-all" />
                  <button onClick={()=>setStep(2)} className="w-full py-6 bg-white text-black rounded-3xl font-black text-xl hover:bg-emerald-500 transition-colors">המשך למועד</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 opacity-50 font-black uppercase tracking-widest text-sm"><Clock size={18}/> מועד אספקה</div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} className="bg-white/5 p-6 rounded-3xl border border-white/10 text-white" />
                    <select value={formData.time} onChange={(e)=>setFormData({...formData, time: e.target.value})} className="bg-[#111827] p-6 rounded-3xl border border-white/10 text-white outline-none">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button onClick={()=>setStep(3)} className="w-full py-6 bg-white text-black rounded-3xl font-black text-xl">המשך לנהג</button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 opacity-50 font-black uppercase tracking-widest text-sm"><Truck size={18}/> שיבוץ נהג</div>
                  <div className="grid grid-cols-2 gap-4">
                    {['חכמת', 'עלי'].map(d => (
                      <button key={d} onClick={()=>setFormData({...formData, driver: d})} className={`p-8 rounded-[2rem] border-2 font-black text-2xl transition-all ${formData.driver === d ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 border-white/10'}`}>{d}</button>
                    ))}
                  </div>
                  <button onClick={submitOrder} className="w-full py-8 bg-emerald-500 text-black rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-500/30 active:scale-95 transition-transform">הזרק ללוח 🚀</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
