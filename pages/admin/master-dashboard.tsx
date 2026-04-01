'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
// שימוש בנתיב אבסולוטי המוגדר ב-tsconfig.json שלך למניעת שגיאות ניווט
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, Send, Clock, MapPin, Bot, Truck, Box, 
  Timer, Activity, CheckCheck, AlertCircle, ArrowRightLeft, Warehouse,
  RefreshCcw, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function SabanUltimateControlCenter() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'containers' | 'chat'>('containers');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // הגנה ל-Build: אם supabase לא קיים, אל תמשיך ללוגיקה
    if (!supabase) return;

    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const channel = supabase.channel('db_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();

    return () => { 
      clearInterval(t); 
      if (channel) channel.unsubscribe(); 
    };
  }, [selectedDate]);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
      const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
      const { data: tr } = await supabase.from('transfers').select('*').eq('transfer_date', selectedDate);
      setTruckOrders(o || []);
      setContainerSites(c || []);
      setTransfers(tr || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const navigateToChat = (query: string) => {
    audioRef.current?.play().catch(() => {});
    setActiveTab('chat');
    handleChatCommand(null, query);
  };

  const handleChatCommand = async (e: React.FormEvent | null, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const cmd = forcedQuery || input;
    if (!cmd.trim() || loading) return;
    
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: cmd }]);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cmd, sender_name: 'ראמי' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer || data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'בוס, תקלה בחיבור למוח.' }]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN OS | Container Management</title></Head>

      <aside className="hidden lg:flex w-80 flex-col bg-white border-l border-slate-200 z-50 shadow-2xl">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg"><Activity size={20} /></div>
          <h1 className="text-xl font-black italic tracking-tighter">SABAN OS</h1>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'live', label: 'הזמנות LIVE', icon: Timer }, 
            { id: 'containers', label: 'מכולות', icon: Box }, 
            { id: 'chat', label: 'AI Supervisor', icon: Bot }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white font-black shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <item.icon size={20} /> <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מחסן מכולות וניהול</p>
          <div className="space-y-2">
            {[
              { name: 'שארק 30', count: containerSites.filter(c => c.contractor_name === 'שארק 30').length, color: 'bg-emerald-100 text-emerald-700' },
              { name: 'כראדי 32', count: containerSites.filter(c => c.contractor_name === 'כראדי 32').length, color: 'bg-blue-100 text-blue-700' },
              { name: 'שי שרון 40', count: containerSites.filter(c => c.contractor_name === 'שי שרון 40').length, color: 'bg-orange-100 text-orange-700' }
            ].map(con => (
              <button key={con.name} onClick={() => navigateToChat(`מי הן המכולות של ${con.name} בשטח?`)} className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition-all">
                <div className="flex items-center gap-2"><Warehouse size={14} className="text-slate-400"/><span className="text-xs font-bold">{con.name}</span></div>
                <span className={`${con.color} text-[10px] px-2 py-0.5 rounded-full font-black`}>{con.count} מכולות</span>
              </button>
            ))}
            <button onClick={() => navigateToChat(`מה מצב העברות בין סניפים היום?`)} className="w-full flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md">
                <div className="flex items-center gap-2"><ArrowRightLeft size={14}/><span className="text-xs font-bold uppercase tracking-tighter">העברות סניפים</span></div>
                <span className="text-[10px] font-black opacity-60">{transfers.length} משימות</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200">
           <div className="flex items-center gap-3">
              <Box size={24} className="text-emerald-600" />
              <h2 className="text-xl font-black italic uppercase tracking-tighter">ניהול מכולות <span className="text-slate-400">/ SABAN OS</span></h2>
           </div>
           <div className="font-mono font-black text-2xl text-emerald-600 tracking-tighter">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'containers' && (
              <motion.div key="containers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {containerSites.map(site => {
                  const days = calculateDays(site.start_date);
                  const isUrgent = days >= 9;
                  const progress = Math.min((days / 10) * 100, 100);

                  return (
                    <motion.div 
                      key={site.id} 
                      animate={isUrgent ? { scale: [1, 1.01, 1], borderColor: ['#f1f5f9', '#ef4444', '#f1f5f9'] } : {}} 
                      transition={isUrgent ? { repeat: Infinity, duration: 2 } : {}}
                      className={`p-6 rounded-[2.5rem] bg-white border-2 shadow-xl relative overflow-hidden group ${isUrgent ? 'border-red-500' : 'border-slate-50'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${isUrgent ? 'bg-red-500' : 'bg-blue-600'}`}>
                          {site.action_type || 'מכולה'}
                        </span>
                        <div className="text-[10px] font-black text-slate-300">#{site.id?.slice(0,5)}</div>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">{site.client_name}</h3>
                      <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12} className="text-emerald-500"/> {site.delivery_address}</p>
                      
                      <div className="space-y-2 mb-6">
                         <div className="flex justify-between items-end">
                            <span className={`text-xl font-black font-mono ${isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                               {days} / 10 ימים
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{isUrgent ? 'נא להחליף/לפנות' : 'זמן הצבה בשטח'}</span>
                         </div>
                         <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`} />
                         </div>
                      </div>

                      <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-500 shadow-inner"><Warehouse size={18}/></div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-400 uppercase">קבלן אחראי</span>
                           <span className="text-sm font-black text-slate-800">{site.contractor_name}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-w-5xl mx-auto">
                <div className="p-5 bg-slate-900 text-emerald-500 border-b border-white/5 flex items-center gap-3">
                  <Bot size={22} className="animate-pulse" />
                  <span className="font-black text-sm uppercase tracking-widest italic">SABAN OS AI Supervisor</span>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-5 rounded-[2.2rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-emerald-600 text-white rounded-tl-none'}`}>{m.content}</div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.5em] italic">המוח מנתח את בקשת הבוס...</div>}
                </div>
                <form onSubmit={handleChatCommand} className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                   <input value={input} onChange={e => setInput(e.target.value)} placeholder="הקלד פקודה למוח..." className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-bold shadow-inner" />
                   <button type="submit" className="bg-emerald-600 text-white w-14 h-14 rounded-2xl shadow-xl active:scale-90 transition-all flex items-center justify-center"><Send size={20} className="rotate-180"/></button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
