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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// נתוני נהגים קבועים
const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanOSMasterControl() {
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
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const sirenRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    
    // אתחול סירנה
    if (typeof window !== 'undefined') {
      sirenRef.current = new Audio('/siren.mp3'); // וודא שיש לך קובץ siren.mp3 בתיקיית public
      sirenRef.current.loop = true;
    }
    
    const channel = supabase.channel('db_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // לוגיקת צלצול דחופה
  useEffect(() => {
    if (!isMounted || isMuted || !sirenRef.current) return;
    
    const hasUrgentOrder = [
      ...truckOrders.map(t => `${t.delivery_date}T${t.order_time}`),
      ...containerSites.map(c => `${c.start_date}T${c.order_time || '08:00'}`),
      ...transfers.map(tr => `${tr.transfer_date}T${tr.transfer_time}`)
    ].some(target => {
      const diff = new Date(target).getTime() - now.getTime();
      return diff > 0 && diff < 3600000; // פחות משעה
    });

    if (hasUrgentOrder && !isSirenPlaying) {
      sirenRef.current.play().catch(() => {});
      setIsSirenPlaying(true);
    } else if (!hasUrgentOrder && isSirenPlaying) {
      sirenRef.current.pause();
      sirenRef.current.currentTime = 0;
      setIsSirenPlaying(false);
    }
  }, [now, truckOrders, containerSites, transfers, isMuted, isSirenPlaying, isMounted]);

  const fetchData = async () => {
    setLoading(true);
    const [y, m, d] = selectedDate.split('-');
    const ilDate = `${d}/${m}/${y}`;

    try {
      const [{ data: o }, { data: c }, { data: tr }] = await Promise.all([
        supabase.from('orders').select('*').or(`delivery_date.eq.${selectedDate},delivery_date.eq.${ilDate}`).order('order_time', { ascending: true }),
        supabase.from('container_management').select('*').eq('is_active', true).order('start_date', { ascending: true }),
        supabase.from('transfers').select('*').eq('transfer_date', selectedDate).order('transfer_time', { ascending: true })
      ]);
      
      setTruckOrders(o || []);
      setContainerSites(c || []);
      setTransfers(tr || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true, h: 0, m: 0, s: 0, urgent: false };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  const deleteItem = async (id: string, table: string) => {
    if (!confirm("בוס, למחוק סופית?")) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const toggleMute = () => {
    if (!sirenRef.current) return;
    if (isMuted) {
      sirenRef.current.play().catch(() => {});
      setIsMuted(false);
    } else {
      sirenRef.current.pause();
      setIsMuted(true);
    }
  };

  if (!isMounted) return <div className="h-screen bg-[#0B0F1A]" />;

  return (
    <div className={`flex h-screen w-full transition-all duration-500 font-sans overflow-hidden ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head>
        <title>SABAN OS | MASTER COMMAND</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏗️</text></svg>" />
      </Head>

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex w-72 flex-col border-l transition-all ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="p-8 font-black text-2xl italic tracking-tighter border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg"><LayoutDashboard size={20}/></div>
          <span>SABAN OS</span>
        </div>
        <nav className="flex-1 p-5 space-y-4">
          {[
            { id: 'live', label: 'משימות LIVE', icon: Timer },
            { id: 'sidor', label: 'סידור נהגים', icon: Truck },
            { id: 'containers', label: 'דשבורד מכולות', icon: Box },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-5 rounded-[2rem] flex items-center gap-5 transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 font-black shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={24} /> <span className="uppercase text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-10 flex items-center gap-4 text-slate-400 hover:text-emerald-500 transition-colors">
          {isDarkMode ? <Sun size={24}/> : <Moon size={24}/>} <span className="font-black uppercase text-xs">שינוי עיצוב</span>
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 h-20 z-[100] flex items-center justify-around border-t transition-colors ${isDarkMode ? 'bg-[#111827]/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'}`}>
        {[
          { id: 'live', icon: Timer, label: 'משימות' },
          { id: 'sidor', icon: Truck, label: 'נהגים' },
          { id: 'containers', icon: Box, label: 'מכולות' },
          { id: 'chat', icon: Bot, label: 'AI' }
        ].map(btn => (
          <button key={btn.id} onClick={() => setActiveTab(btn.id as any)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === btn.id ? 'text-emerald-500' : 'text-slate-400'}`}>
            <btn.icon size={22} /> <span className="text-[10px] font-black uppercase tracking-tighter">{btn.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        
        {/* Header קבוע */}
        <header className={`h-24 shrink-0 flex items-center justify-between px-8 border-b ${isDarkMode ? 'bg-[#0B0F1A]/80 border-white/5' : 'bg-white border-slate-100'} backdrop-blur-md relative z-10`}>
          <div className="flex items-center gap-4">
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`p-3 rounded-xl font-black text-xs outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} suppressHydrationWarning />
             {loading && <RefreshCcw size={18} className="animate-spin text-emerald-500" />}
             
             {/* כפתור השתק סירנה - מופיע רק כשיש אזעקה */}
             {isSirenPlaying && (
               <button onClick={toggleMute} className="flex items-center gap-2 p-3 px-5 rounded-full bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50 hover:bg-red-700 transition-all">
                 {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                 <span className="text-xs font-black uppercase tracking-widest">השתק צלצול</span>
               </button>
             )}
          </div>
          <div className="font-mono font-black text-2xl lg:text-4xl text-emerald-500" suppressHydrationWarning>
            {isMounted ? now.toLocaleTimeString('he-IL') : '--:--:--'}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* דף משימות LIVE - עם התרעות צבע וצלצול */}
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                {[
                  ...truckOrders.map(t => ({ id: t.id, type: 'ORDER', title: t.client_info || 'לקוח', sub: t.location || 'כתובת', target: `${t.delivery_date}T${t.order_time || '08:00'}`, person: t.driver_name, time: t.order_time })),
                  ...containerSites.map(c => ({ id: c.id, type: 'CONTAINER', title: c.client_name || 'מכולה', sub: c.delivery_address || 'כתובת', target: `${c.start_date}T${c.order_time || '08:00'}`, person: c.contractor_name, time: c.order_time })),
                  ...transfers.map(tr => ({ id: tr.id, type: 'TRANSFER', title: `העברה: ${tr.to_branch}`, sub: `מ-${tr.from_branch}`, target: `${tr.transfer_date}T${tr.transfer_time}`, person: tr.driver_name, time: tr.transfer_time }))
                ].filter(o => !calculateTime(o.target).expired).map(order => {
                  const t = calculateTime(order.target);
                  
                  return (
                    <div key={order.id} className={`p-8 rounded-[3.5rem] border-2 transition-all relative group shadow-2xl ${t.urgent ? 'bg-red-600 text-white border-transparent animate-pulse shadow-red-500/30' : (isDarkMode ? 'bg-[#161B2C] border-transparent' : 'bg-white border-slate-100')}`}>
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${t.urgent ? 'bg-white/20' : (order.type === 'TRANSFER' ? 'bg-indigo-600' : (order.type === 'CONTAINER' ? 'bg-emerald-600' : 'bg-slate-700'))}`}>
                           {order.type}
                         </span>
                         <button onClick={() => deleteItem(order.id, order.type === 'CONTAINER' ? 'container_management' : (order.type === 'TRANSFER' ? 'transfers' : 'orders'))} className={`p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all ${t.urgent ? 'text-white hover:bg-white/10' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'}`}><Trash2 size={20}/></button>
                      </div>
                      <h3 className="text-3xl font-black mb-3 tracking-tighter leading-none">{order.title}</h3>
                      <div className={`flex items-center gap-2 font-bold text-sm mb-10 ${t.urgent ? 'text-white/80' : 'text-slate-500'}`}><MapPin size={16}/> {order.sub}</div>
                      
                      <div className={`p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl ${t.urgent ? 'bg-white text-red-600 shadow-red-900/20' : 'bg-slate-900 text-emerald-400'}`}>
                         <div className="flex items-center gap-4">
                           <Clock size={32}/>
                           <span className="text-4xl font-black font-mono" suppressHydrationWarning>
                             {isMounted && !t.expired ? `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : "00:00"}
                           </span>
                         </div>
                         <span className={`text-[12px] font-black uppercase tracking-widest ${t.urgent ? 'text-red-600/80' : 'text-emerald-400/80'}`}>{order.time || '08:00'}</span>
                      </div>

                      <div className={`mt-8 flex items-center gap-5 border-t pt-8 ${t.urgent ? 'border-white/10' : 'border-white/5'}`}>
                         {DRIVERS.find(d => d.name === order.person) ? (
                           <img src={DRIVERS.find(d => d.name === order.person)?.img} className={`w-16 h-16 rounded-full border-4 object-cover ${t.urgent ? 'border-white' : 'border-emerald-500'}`} alt={order.person} />
                         ) : (
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${t.urgent ? 'bg-white/10' : 'bg-white/5'}`}><User size={28}/></div>
                         )}
                         <div className="flex flex-col">
                            <span className={`text-xs font-bold uppercase ${t.urgent ? 'text-white/70' : 'text-slate-500'}`}>נהג מבצע</span>
                            <span className="text-xl font-black">{order.person || 'לא שובץ'}</span>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* סידור נהגים (ללא שינוי) */}
            {activeTab === 'sidor' && (
              <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 pb-20">
                {DRIVERS.map(driver => (
                  <div key={driver.name} className="space-y-8">
                    <div className="flex items-center gap-6 bg-white p-6 rounded-[3rem] shadow-xl border-b-4 border-emerald-500">
                      <img src={driver.img} className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" alt={driver.name}/>
                      <div><h3 className="text-4xl font-black text-slate-900 tracking-tighter">{driver.name} - לו"ז יומי</h3></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 px-4">
                      {TIME_SLOTS.map(slot => {
                        const order = truckOrders.find(o => o.driver_name === driver.name && o.order_time === slot);
                        return (
                          <div key={slot} className="flex items-center gap-8 group">
                            <span className="text-sm font-black font-mono text-slate-400 w-14">{slot}</span>
                            <div className={`flex-1 p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${order ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'bg-white border border-slate-100 text-slate-300 font-black italic'}`}>
                              {order ? (
                                <div className="flex flex-col"><span className="font-black text-2xl tracking-tight">{order.client_info}</span><span className="text-xs font-bold opacity-70">{order.location}</span></div>
                              ) : "זמין לשיבוץ"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* דשבורד מכולות משודרג - דשבורד לקוחות קיימים באתרים */}
            {activeTab === 'containers' && (
              <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
                
                {/* Header דשבורד מכולות */}
                <div className={`p-8 rounded-[2.5rem] ${isDarkMode ? 'bg-[#111827]' : 'bg-white shadow-xl'}`}>
                  <div className="flex items-center gap-5 mb-6">
                    <div className="p-4 rounded-2xl bg-emerald-500 text-slate-900"><Building2 size={32}/></div>
                    <h2 className="text-4xl font-black tracking-tighter">דשבורד לקוחות מכולות באתרים</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><p className="text-5xl font-black text-emerald-500">{containerSites.length}</p><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">מכולות בשטח</p></div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><p className="text-5xl font-black text-orange-500">{containerSites.filter(s => s.status === 'pending_pickup').length}</p><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">ממתינות לפינוי</p></div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><p className="text-5xl font-black text-blue-500">{containerSites.filter(s => s.status === 'delivered').length}</p><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">פעילות</p></div>
                  </div>
                </div>

                {/* כרטיסי לקוחות קיימים */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {containerSites.map(site => {
                    const daysInField = Math.floor((now.getTime() - new Date(site.start_date).getTime()) / (1000 * 60 * 60 * 24));
                    const progress = Math.min((daysInField / 10) * 100, 100); // ברירת מחדל של 10 ימים למכולה
                    
                    return (
                      <div key={site.id} className={`p-8 rounded-[3.5rem] border group transition-all relative ${isDarkMode ? 'bg-[#161B2C] border-transparent' : 'bg-white border-slate-100 shadow-2xl'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${site.status === 'pending_pickup' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {site.status === 'pending_pickup' ? 'ממתין לפינוי' : 'פעיל באתר'}
                          </span>
                          <button onClick={() => deleteItem(site.id, 'container_management')} className="p-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20}/></button>
                        </div>
                        
                        <h3 className="text-3xl font-black mb-2 leading-none tracking-tight">{site.client_name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-8"><MapPin size={16}/> {site.delivery_address}</div>
                        
                        {/* פס התקדמות ימים בשטח */}
                        <div className="mt-8 space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5">
                          <div className="flex justify-between items-center text-sm font-black">
                            <span className="text-slate-400">ימים בשטח (מתוך 10)</span>
                            <span className="text-emerald-500 text-lg font-mono">{daysInField} יום</span>
                          </div>
                          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden relative">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${daysInField > 8 ? 'bg-red-500' : 'bg-blue-500'}`} />
                          </div>
                        </div>

                        <div className="mt-8 flex items-center gap-5 border-t border-white/5 pt-8 text-slate-500 font-bold text-sm">
                           <Calendar size={18} className="text-blue-500" />
                           <span>תאריך הצבה: <span className="text-slate-900 font-black" suppressHydrationWarning>{new Date(site.start_date).toLocaleDateString('he-IL')}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* צ'אט AI (ללא שינוי) */}
            {activeTab === 'chat' && (
              <motion.div key="chat" className="flex-1 flex flex-col bg-transparent overflow-hidden h-full">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 scroll-smooth pb-40">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] lg:max-w-[70%] p-8 rounded-[3rem] text-lg font-black shadow-2xl ${m.role === 'user' ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-900 text-white') : 'bg-emerald-500 text-slate-900'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-xs font-black text-emerald-500 animate-pulse uppercase pr-4">המעבד חושב...</div>}
                </div>
                <footer className="fixed lg:static bottom-24 left-6 right-6 lg:p-10">
                  <form onSubmit={e => { e.preventDefault(); /* ... */ }} className="max-w-5xl mx-auto relative group">
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב פקודה (הזמנה חדשה)..." className={`w-full p-8 px-12 rounded-[3rem] text-xl font-black outline-none transition-all shadow-2xl ${isDarkMode ? 'bg-[#1E293B] text-white border border-white/5' : 'bg-white text-slate-900 border border-slate-100'}`} />
                    <button type="submit" className="absolute left-4 top-4 bg-emerald-500 text-slate-900 w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"><Send size={28} className="rotate-180"/></button>
                  </form>
                </footer>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
