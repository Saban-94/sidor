'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, ArrowRightLeft, Sun, Moon, Calendar, User, X, Save, Volume2, VolumeX, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const CONTRACTOR_COLORS: Record<string, string> = {
  'שארק 30': 'bg-orange-500',
  'כראדי 32': 'bg-blue-600',
  'שי שרון 40': 'bg-purple-600'
};

export default function SabanUltimateDashboard() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'chat'>('live');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const sirenRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    
    if (typeof window !== 'undefined') {
      sirenRef.current = new Audio('/siren.mp3');
      sirenRef.current.loop = true;
    }

    const channel = supabase.channel('db_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate, activeTab]);

  // שאילתה חכמה - מאזינה לכל הטבלאות עם תיקון פורמט תאריך
  const fetchData = async () => {
    setLoading(true);
    const [y, m, d] = selectedDate.split('-');
    const ilDate = `${d}/${m}/${y}`; // פורמט DD/MM/YYYY שהמוח לעיתים מזריק

    try {
      const [ordersRes, containersRes, transfersRes] = await Promise.all([
        supabase.from('orders').select('*').or(`delivery_date.eq.${selectedDate},delivery_date.eq.${ilDate}`),
        supabase.from('container_management').select('*').or(`start_date.eq.${selectedDate},start_date.eq.${ilDate}`),
        supabase.from('transfers').select('*').or(`transfer_date.eq.${selectedDate},transfer_date.eq.${ilDate}`)
      ]);

      setTruckOrders(ordersRes.data || []);
      setContainerSites(containersRes.data || []);
      setTransfers(transfersRes.data || []);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTime = (dateStr: string, timeStr: string) => {
    // נרמול תאריך לפורמט ISO לצורך חישוב
    let cleanDate = dateStr;
    if (dateStr.includes('/')) {
        const [dd, mm, yyyy] = dateStr.split('/');
        cleanDate = `${yyyy}-${mm}-${dd}`;
    }
    const target = new Date(`${cleanDate}T${timeStr || '08:00'}`);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, h: 0, m: 0, s: 0, urgent: false };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  if (!isMounted) return <div className="h-screen bg-[#0B0F1A]" />;

  return (
    <div className={`flex h-screen w-full transition-all duration-500 font-sans overflow-hidden ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head>
        <title>SABAN OS | LIVE COMMAND</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏗️</text></svg>" />
      </Head>

      {/* Sidebar */}
      <aside className={`hidden lg:flex w-72 flex-col border-l ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="p-8 font-black text-2xl italic tracking-tighter border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg"><LayoutDashboard size={20}/></div>
          <span>SABAN OS</span>
        </div>
        <nav className="flex-1 p-5 space-y-4">
          {[
            { id: 'live', label: 'משימות LIVE', icon: Timer },
            { id: 'sidor', label: 'סידור נהגים', icon: Truck },
            { id: 'containers', label: 'מכולות באתרים', icon: Box },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-5 rounded-[2rem] flex items-center gap-5 transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 font-black shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={24} /> <span className="uppercase text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className={`h-24 flex items-center justify-between px-8 border-b ${isDarkMode ? 'bg-[#0B0F1A]/80 border-white/5' : 'bg-white border-slate-100'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`p-3 rounded-xl font-black text-xs outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} />
             {loading && <RefreshCcw size={18} className="animate-spin text-emerald-500" />}
          </div>
          <div className="font-mono font-black text-3xl text-emerald-500" suppressHydrationWarning>{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide pb-32">
          <AnimatePresence mode="wait">
            
            {/* LIVE VIEW - חומרים ומכולות */}
            {activeTab === 'live' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[
                  ...truckOrders.map(o => ({ ...o, type: 'ORDER', date: o.delivery_date, time: o.order_time, title: o.client_info, sub: o.location, person: o.driver_name })),
                  ...containerSites.map(c => ({ ...c, type: 'CONTAINER', date: c.start_date, time: c.order_time || '08:00', title: c.client_name, sub: c.delivery_address, person: c.contractor_name }))
                ].map(item => {
                  const t = calculateTime(item.date, item.time);
                  return (
                    <div key={item.id} className={`p-8 rounded-[3.5rem] border-2 transition-all shadow-2xl relative group ${t.urgent ? 'bg-red-600 text-white animate-pulse' : (isDarkMode ? 'bg-[#161B2C] border-transparent' : 'bg-white border-slate-100')}`}>
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${item.type === 'CONTAINER' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                           {item.type}
                         </span>
                         <button onClick={() => fetchData()} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                      </div>
                      <h3 className="text-3xl font-black mb-2 tracking-tighter">{item.title}</h3>
                      <div className="flex items-center gap-2 text-sm font-bold opacity-70 mb-8"><MapPin size={16}/> {item.sub}</div>
                      
                      {/* Timer Module */}
                      <div className={`p-6 rounded-[2.5rem] flex items-center justify-between ${t.urgent ? 'bg-white text-red-600' : 'bg-slate-900 text-emerald-400'}`}>
                         <div className="flex items-center gap-3">
                           <Clock size={28}/>
                           <span className="text-4xl font-black font-mono">
                             {t.expired ? "בביצוע" : `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}`}
                           </span>
                         </div>
                         <span className="text-xs font-black uppercase tracking-widest opacity-60">{item.time}</span>
                      </div>

                      <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-8">
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg ${CONTRACTOR_COLORS[item.person] || 'bg-slate-700'}`}>
                           {item.person?.charAt(0)}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase opacity-50">קבלן / נהג</span>
                            <span className="text-lg font-black">{item.person}</span>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* CONTAINERS DASHBOARD - מכולות ולקוחות קיימים */}
            {activeTab === 'containers' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {containerSites.map(site => {
                    const days = Math.floor((now.getTime() - new Date(site.start_date).getTime()) / (1000 * 60 * 60 * 24));
                    const progress = Math.min((days / 10) * 100, 100);
                    return (
                      <div key={site.id} className={`p-8 rounded-[3.5rem] shadow-2xl border ${isDarkMode ? 'bg-[#161B2C] border-transparent' : 'bg-white border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-6">
                           <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-blue-600 text-white">מכולה באתר</span>
                           <span className="text-xs font-black text-slate-500 uppercase">{site.contractor_name}</span>
                        </div>
                        <h3 className="text-3xl font-black mb-2 tracking-tighter">{site.client_name}</h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-8"><MapPin size={16}/> {site.delivery_address}</div>
                        
                        {/* Progress Bar */}
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                           <div className="flex justify-between text-xs font-black mb-3">
                              <span className="opacity-50 uppercase">ימים בשטח</span>
                              <span className="text-blue-500 text-lg font-mono">{days} ימים</span>
                           </div>
                           <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full rounded-full ${days > 8 ? 'bg-red-500' : 'bg-blue-600'}`} />
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
