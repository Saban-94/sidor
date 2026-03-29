'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, MapPin, Send, Truck, User, Sparkles, 
  PlusCircle, X, Calendar, Clock, Share2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanOS_Master() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'CHAT' | 'DRIVERS'>('CHAT');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // טופס דינמי
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ client: '', address: '', branch: '', driver: '', date: '', time: '' });

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    const sub = supabase.channel('orders_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('order_time', { ascending: true });
    if (data) setOrders(data);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, senderPhone: 'admin' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
  };

  const submitManualOrder = async () => {
    await supabase.from('orders').insert([{
      client_info: formData.client,
      location: formData.address,
      source_branch: formData.branch,
      driver_name: formData.driver,
      delivery_date: formData.date || new Date().toISOString().split('T')[0],
      order_time: formData.time || '08:00'
    }]);
    setIsOrderModalOpen(false);
    setStep(1);
  };

  if (!mounted) return null;

  return (
    <div className="h-screen flex bg-[#0B0F1A] text-white font-sans overflow-hidden" dir="rtl">
      
      {/* תפריט צד */}
      <aside className="w-80 bg-[#111827] border-l border-white/5 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-500 p-2 rounded-xl text-black"><ShieldCheck size={24}/></div>
          <h1 className="font-black text-xl tracking-tight">SABAN OS</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavBtn active={view === 'CHAT'} onClick={() => setView('CHAT')} icon={<Sparkles size={18}/>} label="צאט פקודות" />
          <NavBtn active={view === 'DRIVERS'} onClick={() => setView('DRIVERS')} icon={<Truck size={18}/>} label="לוח נהגים" />
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-3">
          <button onClick={() => setIsOrderModalOpen(true)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all">
            <PlusCircle size={20}/> יצירת הזמנה
          </button>
          <button className="w-full bg-[#25D366] p-4 rounded-2xl font-black flex items-center justify-center gap-2"><Share2 size={18}/> דוח בוקר</button>
        </div>
      </aside>

      {/* אזור ראשי */}
      <main className="flex-1 relative flex flex-col">
        
        {view === 'CHAT' ? (
          <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl font-bold ${m.role === 'user' ? 'bg-white/5 border border-white/10' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="בוס, מה להוסיף?" className="w-full bg-[#111827] border border-white/10 p-5 rounded-3xl outline-none focus:border-emerald-500 transition-all text-xl" />
              <button onClick={handleSendMessage} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"><Send/></button>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
            {['חכמת', 'עלי'].map(driver => (
              <div key={driver} className="bg-[#111827] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col">
                <div className="p-6 bg-white/5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-800">
                    <img src={driver === 'עלי' ? 'https://avatar.iran.liara.run/public/job/driver/male' : 'https://avatar.iran.liara.run/public/job/operator/male'} alt={driver} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{driver}</h2>
                    <p className="text-emerald-500 text-sm font-bold">פעיל בדרכים</p>
                  </div>
                </div>
                <div className="p-4 flex-1 space-y-3">
                  {orders.filter(o => o.driver_name === driver).map((o, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-emerald-500/50 transition-all">
                      <div>
                        <p className="font-black text-lg">{o.client_info}</p>
                        <p className="text-sm opacity-50 flex items-center gap-1"><MapPin size={12}/> {o.location}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-emerald-500 font-black">{o.order_time}</p>
                        <p className="text-[10px] opacity-40">{o.delivery_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* טופס דינמי מפוצל */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-[#111827] p-8 rounded-[3rem] border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">הזרקה ללוח</h2>
                <div className="flex gap-1">
                  {[1,2,3,4].map(s => <div key={s} className={`h-1 w-6 rounded-full ${step >= s ? 'bg-emerald-500' : 'bg-white/10'}`}/>)}
                </div>
              </div>

              {step === 1 && <StepView label="שם לקוח" icon={<User/>} value={formData.client} onChange={(v)=>setFormData({...formData, client: v})} onNext={()=>setStep(2)}/>}
              {step === 2 && <StepView label="כתובת אספקה" icon={<MapPin/>} value={formData.address} onChange={(v)=>setFormData({...formData, address: v})} onNext={()=>setStep(3)}/>}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-50 flex items-center gap-1"><Calendar size={12}/> תאריך</label>
                      <input type="date" value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 p-4 rounded-xl border border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-50 flex items-center gap-1"><Clock size={12}/> שעה</label>
                      <input type="time" value={formData.time} onChange={(e)=>setFormData({...formData, time: e.target.value})} className="w-full bg-white/5 p-4 rounded-xl border border-white/10" />
                    </div>
                  </div>
                  <button onClick={()=>setStep(4)} className="w-full py-4 bg-white text-black rounded-2xl font-black">המשך לנהג</button>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="font-bold opacity-50">בחר נהג ומחסן:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['חכמת', 'עלי'].map(d => (
                      <button key={d} onClick={()=>setFormData({...formData, driver: d})} className={`p-4 rounded-xl border font-black ${formData.driver === d ? 'bg-emerald-500 text-black' : 'bg-white/5 border-white/5'}`}>{d}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['התלמיד', 'החרש'].map(b => (
                      <button key={b} onClick={()=>setFormData({...formData, branch: b})} className={`p-4 rounded-xl border font-black ${formData.branch === b ? 'bg-white text-black' : 'bg-white/5 border-white/5'}`}>{b}</button>
                    ))}
                  </div>
                  <button onClick={submitManualOrder} className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-black mt-4">הזרק ללוח 🚀</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepView({ label, icon, value, onChange, onNext }: any) {
  return (
    <div className="space-y-4">
      <label className="font-bold opacity-50 flex items-center gap-2">{icon} {label}</label>
      <input autoFocus value={value} onChange={(e)=>onChange(e.target.value)} onKeyDown={(e)=>e.key === 'Enter' && onNext()} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xl outline-none focus:border-emerald-500" />
      <button onClick={onNext} className="w-full py-4 bg-white text-black rounded-2xl font-black">המשך</button>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:bg-white/5'}`}>{icon} {label}</button>
  );
}
