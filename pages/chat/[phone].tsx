'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Menu, X, MapPin, Sun, Moon, MessageSquare, Send, 
  Truck, Construction, User, Sparkles, Share2, PlusCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function RamiAssistant_V3() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'CHAT' | 'DRIVERS' | 'CONTROL'>('CHAT');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  
  // States לטופס דינמי
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({ client: '', address: '', branch: '', driver: '' });

  useEffect(() => {
    setMounted(true);
    fetchData();
    const channel = supabase.channel('realtime-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const calculateProgress = () => (formStep / 4) * 100;

  const handleManualSubmit = async () => {
    const { error } = await supabase.from('orders').insert([{
      client_info: formData.client,
      location: formData.address,
      source_branch: formData.branch,
      driver_name: formData.driver,
      order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      delivery_date: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
      setShowOrderModal(false);
      setFormStep(1);
      setFormData({ client: '', address: '', branch: '', driver: '' });
      alert("בוס, ההזמנה הוזרקה ללוח! 🚀");
    }
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex overflow-hidden ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      
      {/* תפריט צד */}
      <aside className={`w-72 p-6 flex flex-col border-l ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-500 p-2 rounded-xl text-black"><ShieldCheck size={24}/></div>
          <h1 className="font-black text-lg">העוזר של ראמי</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavBtn active={view === 'CHAT'} onClick={() => setView('CHAT')} icon={<MessageSquare size={18}/>} label="צאט פקודות" />
          <NavBtn active={view === 'DRIVERS'} onClick={() => setView('DRIVERS')} icon={<Truck size={18}/>} label="לוח סידור" />
        </nav>

        {/* כפתורים תחתונים - הזרקה ידנית מעל דוח בוקר */}
        <div className="flex flex-col gap-3 mt-auto">
          <button 
            onClick={() => setShowOrderModal(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle size={20}/> יצירת הזמנה חדשה
          </button>
          
          <button className="w-full bg-[#25D366] text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2">
            <Share2 size={18}/> שיתוף דוח בוקר
          </button>
        </div>
      </aside>

      {/* אזור תוכן */}
      <main className="flex-1 overflow-hidden relative">
        {view === 'CHAT' ? (
           <div className="h-full p-10 flex flex-col items-center justify-center opacity-50">
             <Sparkles size={48} className="mb-4 text-emerald-500"/>
             <p className="font-black">בוס, המוח דרוך. דבר אלי בצאט או פתח טופס.</p>
           </div>
        ) : (
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto h-full">
            {['חכמת', 'עלי'].map(driver => (
              <div key={driver} className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white'}`}>
                <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-emerald-500"><Truck/> {driver}</h3>
                <div className="space-y-3">
                  {orders.filter(o => o.driver_name === driver).map((o, i) => (
                    <div key={i} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex justify-between">
                      <div><p className="font-bold">{o.client_info}</p><p className="text-xs opacity-60">{o.location}</p></div>
                      <span className="text-emerald-500 font-black">{o.order_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* מודל טופס דינמי - ויזארד שלבים */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`w-full max-w-lg p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-[#111827] border-white/10 text-white' : 'bg-white text-slate-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic">הזרקה ידנית ללוח</h2>
                <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-white/5 rounded-full"><X/></button>
              </div>

              {/* פס התקדמות */}
              <div className="w-full h-2 bg-white/5 rounded-full mb-8 overflow-hidden">
                <motion.div animate={{ width: `${calculateProgress()}%` }} className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"/>
              </div>

              <div className="space-y-6">
                {formStep === 1 && (
                  <StepView label="מי הלקוח?" icon={<User/>} value={formData.client} onChange={(v) => setFormData({...formData, client: v})} onNext={() => setFormStep(2)}/>
                )}
                {formStep === 2 && (
                  <StepView label="לאן מובילים?" icon={<MapPin/>} value={formData.address} onChange={(v) => setFormData({...formData, address: v})} onNext={() => setFormStep(3)}/>
                )}
                {formStep === 3 && (
                  <div className="space-y-4">
                    <p className="font-bold opacity-60">מאיזה מחסן?</p>
                    <div className="grid grid-cols-2 gap-4">
                      {['התלמיד', 'החרש'].map(b => (
                        <button key={b} onClick={() => {setFormData({...formData, branch: b}); setFormStep(4);}} className={`p-4 rounded-2xl border font-black transition-all ${formData.branch === b ? 'bg-emerald-500 text-black' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>{b}</button>
                      ))}
                    </div>
                  </div>
                )}
                {formStep === 4 && (
                  <div className="space-y-4">
                    <p className="font-bold opacity-60">מי הנהג?</p>
                    <div className="grid grid-cols-2 gap-4">
                      {['חכמת', 'עלי'].map(d => (
                        <button key={d} onClick={() => {setFormData({...formData, driver: d});}} className={`p-4 rounded-2xl border font-black transition-all ${formData.driver === d ? 'bg-emerald-500 text-black' : 'bg-white/5 border-white/5'}`}>{d}</button>
                      ))}
                    </div>
                    {formData.driver && (
                      <button onClick={handleManualSubmit} className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-black mt-6 shadow-xl shadow-emerald-500/30">בוצע, הזרק ללוח! 🚀</button>
                    )}
                  </div>
                )}
              </div>
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
      <p className="font-bold opacity-60 flex items-center gap-2">{icon} {label}</p>
      <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && value && onNext()} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-emerald-500 transition-all text-xl" />
      {value && <button onClick={onNext} className="w-full py-4 bg-white text-black rounded-2xl font-black">המשך</button>}
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 translate-x-[-4px]' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>{icon} {label}</button>
  );
}
