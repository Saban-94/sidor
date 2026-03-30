'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'head';
import { createClient } from '@supabase/supabase-js';
import { 
  Box, Truck, RefreshCcw, Trash2, Calendar, MapPin, 
  User, Bot, Send, AlertTriangle, CheckCircle2, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ContainerOS() {
  const [mounted, setMounted] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchActiveSites();
    
    // מאזין Realtime להזרקות מהמוח
    const sub = supabase.channel('container_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchActiveSites)
      .subscribe();
      
    return () => { sub.unsubscribe(); };
  }, []);

  const fetchActiveSites = async () => {
    const { data } = await supabase
      .from('container_management')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });
    if (data) setSites(data);
  };

  const calculateDays = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans flex flex-col lg:flex-row overflow-hidden" dir="rtl">
      <Head><title>SABAN | Container Control</title></Head>

      {/* לוח ניהול אתרים (שמאל ב-Desktop, עליון במובייל) */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">ניהול אתרי מכולות</h1>
            <p className="text-sm text-slate-500 font-bold">פיקוח מלאי וזמני שכירות בזמן אמת</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
             <span className="text-xs font-black text-slate-400 uppercase block">סה"כ אתרים</span>
             <span className="text-2xl font-mono font-black">{sites.length}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {sites.map((site) => {
              const days = calculateDays(site.start_date);
              const isUrgent = days >= 9;
              
              return (
                <motion.div 
                  key={site.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white rounded-[2.5rem] border-2 p-6 shadow-xl transition-all ${isUrgent ? 'border-red-500 shadow-red-100' : 'border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {site.action_type === 'PLACEMENT' ? <Box size={24}/> : <RefreshCcw size={24}/>}
                    </div>
                    <div className="text-left font-mono text-xs font-black opacity-30">#{site.id.slice(0,4)}</div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{site.client_name}</h3>
                    <div className="flex items-center gap-1 text-slate-500 font-bold text-sm">
                      <MapPin size={14}/> {site.delivery_address}
                    </div>
                  </div>

                  {/* פרוגרס בר 10 ימים */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className={isUrgent ? 'text-red-500' : 'text-slate-400'}>זמן שכירות: {days}/10 ימים</span>
                      <span>{Math.min(Math.max(days * 10, 0), 100)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(days * 10, 100)}%` }}
                        className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black opacity-40 uppercase">קבלן מבצע</span>
                      <span className="text-xs font-bold">{site.contractor_name}</span>
                    </div>
                    <div className="flex gap-2">
                       <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><Clock size={16}/></button>
                       <button onClick={async () => await supabase.from('container_management').update({is_active: false}).eq('id', site.id)} className="p-2 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* צ'אט פקודות (ימין ב-Desktop, קבוע בתחתית במובייל) */}
      <aside className="w-full lg:w-[400px] bg-slate-900 flex flex-col border-r border-white/10 shadow-2xl z-30">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-xl"><Bot size={20} className="text-slate-900"/></div>
          <h2 className="text-white font-black italic uppercase tracking-tighter">Container Brain</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-lg ${m.role === 'user' ? 'bg-white text-slate-900 rounded-tr-none' : 'bg-emerald-500 text-slate-900 rounded-tl-none'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase mr-2">המפקח מעבד נתונים...</div>}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="פקודה חדשה (למשל: החלפה לאבי לוי)"
            className="flex-1 bg-white/10 border border-white/10 p-4 rounded-2xl text-white text-sm outline-none focus:border-emerald-500 transition-all"
          />
          <button type="submit" className="bg-emerald-500 text-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-emerald-400 transition-all shadow-lg active:scale-95">
            <Send size={20} className="transform rotate-180"/>
          </button>
        </form>
      </aside>
    </div>
  );
}
