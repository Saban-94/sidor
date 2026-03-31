'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, ArrowRightLeft, Sun, Moon, Calendar, User, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// נתוני נהגים קבועים
const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

// דאטה ולינקים לתמונות/לוגואים של קבלני מכולות
const CONTRACTOR_DATA: Record<string, { color: string, img: string }> = {
  'שארק 30': { 
    color: 'bg-orange-500', 
    img: 'https://i.postimg.cc/pT45M6bV/orange-digger.png' // לינק זמני ללוגו/תמונה
  },
  'כראדי 32': { 
    color: 'bg-blue-600', 
    img: 'https://i.postimg.cc/6q4T874M/blue-truck.png' // לינק זמני ללוגו/תמונה
  },
  'שי שרון 40': { 
    color: 'bg-purple-600', 
    img: 'https://i.postimg.cc/Y95fMv6z/purple-digger.png' // לינק זמני ללוגו/תמונה
  }
};

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanUltimateControlCenter() {
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    if (typeof window !== 'undefined') audioRef.current = new Audio('/order-notification.mp3');
    const channel = supabase.channel('db_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: tr } = await supabase.from('transfers').select('*').eq('transfer_date', selectedDate);
    
    setTruckOrders(o || []);
    setContainerSites(c || []);
    setTransfers(tr || []);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.reply.includes('בוצע')) {
        audioRef.current?.play().catch(() => {});
        fetchData();
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const deleteItem = async (id: string, table: string) => {
    if (!confirm("בוס, למחוק סופית?")) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  return (
    <div className={`flex h-screen w-full transition-all duration-500 font-sans overflow-hidden ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head>
        <title>SABAN OS | MASTER</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
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
            { id: 'containers', label: 'מכולות', icon: Box },
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
        <header className={`h-24 shrink-0 flex items-center justify-between px-8 border-b ${isDarkMode ? 'bg-[#0B0F1A]/80 border-white/5' : 'bg-white border-slate-100'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`p-3 rounded-xl font-black text-xs outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} />
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="lg:hidden p-3 rounded-xl bg-emerald-500/10 text-emerald-500">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
          </div>
          <div className="font-mono font-black text-2xl lg:text-4xl text-emerald-500">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* לוח LIVE מאוחד - עיצוב ייעודי למכולות וחומרים */}
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[
                  ...truckOrders.map(t => ({ ...t, type: 'ORDER', title: t.client_info, sub: t.location, target: `${t.delivery_date}T${t.order_time}`, person: t.driver_name })),
                  ...containerSites.map(c => ({ ...c, type: 'CONTAINER', title: c.client_name, sub: c.delivery_address, target: `${c.start_date}T${c.order_time || '08:00'}`, person: c.contractor_name })),
                  ...transfers.map(tr => ({ ...tr, type: 'TRANSFER', title: `העברה: ${tr.to_branch}`, sub: `מ-${tr.from_branch}`, target: `${tr.transfer_date}T${tr.transfer_time}`, person: tr.driver_name }))
                ].filter(o => !calculateTime(o.target).expired).map(order => {
                  const t = calculateTime(order.target);
                  const isContainer = order.type === 'CONTAINER';
                  const contractorInfo = CONTRACTOR_DATA[order.person];

                  return (
                    <div key={order.id} className={`p-8 rounded-[3.5rem] border-2 transition-all relative group shadow-2xl ${isDarkMode ? 'bg-[#161B2C]' : 'bg-white border-slate-100'} ${t.urgent ? 'border-amber-500 animate-pulse shadow-amber-500/20' : 'border-transparent'}`}>
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${order.type === 'TRANSFER' ? 'bg-indigo-600' : (isContainer ? (contractorInfo?.color || 'bg-emerald-600') : 'bg-slate-700')}`}>
                           {order.type}
                         </span>
                         <button onClick={() => deleteItem(order.id, isContainer ? 'container_management' : (order.type === 'TRANSFER' ? 'transfers' : 'orders'))} className="p-3 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                      </div>
                      <h3 className="text-3xl lg:text-4xl font-black tracking-tighter leading-none mb-3">{order.title}</h3>
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm italic mb-10"><MapPin size={16} className="text-emerald-500"/> {order.sub}</div>
                      
                      {/* מודול זמן/אייקון בעיצוב דינמי */}
                      <div className={`p-6 lg:p-8 rounded-[2.5rem] flex items-center justify-between ${t.urgent ? 'bg-amber-500 text-white shadow-amber-500/40' : (isDarkMode ? 'bg-slate-900 text-emerald-400 shadow-xl' : (isContainer ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-emerald-400'))}`}>
                         {isContainer ? (
                           // עיצוב מכולה: אייקון גדול במקום טיימר
                           <div className="flex items-center gap-6">
                             <div className={`p-4 rounded-full ${contractorInfo?.color || 'bg-emerald-500'} text-white`}>
                               <Box size={36} />
                             </div>
                             <span className="text-2xl font-black tracking-tight">הצבת מכולה</span>
                           </div>
                         ) : (
                           // עיצוב חומרים: טיימר רגיל
                           <div className="flex items-center gap-4">
                             <Clock size={32}/>
                             <span className="text-4xl lg:text-5xl font-black font-mono">
                               {!t.expired ? `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : "00:00"}
                             </span>
                           </div>
                         )}
                         <span className={`text-[10px] font-black uppercase tracking-widest ${isContainer ? 'opacity-60' : ''}`}>{order.order_time || order.transfer_time}</span>
                      </div>

                      {/* מודול מבצע משימה - עיצוב דינמי נהג/קבלן */}
                      <div className={`mt-8 flex items-center gap-5 border-t ${isContainer ? 'border-transparent' : 'border-white/5'} pt-8 ${isContainer ? (contractorInfo?.color + ' p-6 rounded-3xl text-white shadow-lg') : ''}`}>
                         {isContainer ? (
                           // תמונת קבלן (לוגו)
                           <img src={contractorInfo?.img || 'https://i.postimg.cc/Vv4X4X4X/default-avatar.png'} className={`w-16 h-16 rounded-full border-4 ${isDarkMode ? 'border-white/20' : 'border-white'} object-cover shadow-2xl`} />
                         ) : (
                           // תמונת נהג
                           DRIVERS.find(d => d.name === order.person) ? (
                             <img src={DRIVERS.find(d => d.name === order.person)?.img} className="w-16 h-16 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" />
                           ) : (
                             <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/10"><User size={28}/></div>
                           )
                         )}
                         <div className="flex flex-col">
                           <span className={`text-[10px] font-black ${isContainer ? 'text-white/80' : 'text-slate-500'} uppercase tracking-widest`}>
                             {isContainer ? 'קבלן מבצע' : 'מבצע המשימה'}
                           </span>
                           <span className="text-xl font-black">{order.person}</span>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* לוח סידור נהגים (חומרים בלבד) */}
            {activeTab === 'sidor' && (
              <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                {DRIVERS.map(driver => (
                  <div key={driver.name} className="space-y-8">
                    <div className="flex items-center gap-6 bg-white p-6 rounded-[3rem] shadow-xl border-b-4 border-emerald-500">
                      <img src={driver.img} className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover shadow-2xl" />
                      <div>
                        <h3 className="text-4xl font-black italic tracking-tighter text-slate-900">{driver.name} - לוח שעות</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 px-4">
                      {TIME_SLOTS.map(slot => {
                        const order = truckOrders.find(o => o.driver_name === driver.name && o.order_time === slot);
                        return (
                          <div key={slot} className="flex items-center gap-8 group">
                            <span className="text-sm font-black font-mono text-slate-400 w-14">{slot}</span>
                            <div className={`flex-1 p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${order ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'bg-white border border-slate-100 text-slate-300 font-black italic uppercase text-base'}`}>
                              {order ? (
                                <div className="flex flex-col"><span className="font-black text-2xl">{order.client_info}</span><span className="text-xs font-bold opacity-70">{order.location}</span></div>
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

            {/* ניהול מכולות (דף ייעודי) */}
            {activeTab === 'containers' && (
              <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {containerSites.map(site => {
                  const days = Math.floor(Math.abs(new Date().getTime() - new Date(site.start_date).getTime()) / (1000 * 60 * 60 * 24));
                  const contractorInfo = CONTRACTOR_DATA[site.contractor_name];
                  return (
                    <div key={site.id} className="bg-white p-8 rounded-[3.5rem] shadow-2xl relative border border-slate-100 overflow-hidden group">
                       <img src={contractorInfo?.img || 'https://i.postimg.cc/Vv4X4X4X/default-avatar.png'} className="absolute -left-10 -bottom-10 w-48 h-48 object-cover opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110" />
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl text-white shadow-lg ${contractorInfo?.color || 'bg-emerald-500'}`}><Box size={24}/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{site.contractor_name}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 relative z-10">{site.client_name}</h3>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-sm relative z-10"><MapPin size={16}/> {site.delivery_address}</div>
                      <div className="mt-8 space-y-2 relative z-10">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><span>ימים בשטח: {days}/10</span></div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${contractorInfo?.color || 'bg-emerald-500'} rounded-full`} style={{ width: `${Math.min((days/10)*100, 100)}%` }} /></div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* צ'אט AI */}
            {activeTab === 'chat' && (
              <motion.div key="chat" className="flex-1 flex flex-col bg-transparent overflow-hidden h-full">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 scroll-smooth scrollbar-hide pb-40">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] lg:max-w-[70%] p-8 rounded-[3rem] text-lg font-black shadow-2xl ${m.role === 'user' ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-900 text-white') : 'bg-emerald-500 text-slate-900'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.5em] italic mr-4">חושב...</div>}
                </div>
                <footer className="fixed lg:static bottom-24 left-6 right-6 lg:p-10">
                  <form onSubmit={handleChat} className="max-w-5xl mx-auto relative group">
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="הזמן הובלה/מכולה/העברה..." className={`w-full p-8 px-12 pr-28 rounded-[3rem] text-xl font-black outline-none transition-all shadow-2xl ${isDarkMode ? 'bg-[#1E293B] text-white border border-white/5' : 'bg-white text-slate-900 border border-slate-100'}`} />
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
