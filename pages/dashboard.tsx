'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, ChevronRight, Box, RefreshCcw, History, Edit3, Trash2, 
  Timer, CheckCircle, User, Bell // הוספתי User וכל מה שצריך
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanUltimateOS() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'history' | 'chat'>('live');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [allOrders, setAllOrders] = useState<any[]>([]);
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
    
    const channel = supabase.channel('realtime_all').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchData = async () => {
    const { data: c } = await supabase.from('container_management').select('*');
    const { data: t } = await supabase.from('orders').select('*');
    
    const unified = [
      ...(c || []).map(item => ({ ...item, type: 'CONTAINER', mainTitle: item.client_name, subTitle: item.delivery_address, target: `${item.start_date}T${item.order_time || '08:00'}`, person: item.contractor_name })),
      ...(t || []).map(item => ({ ...item, type: 'TRUCK', mainTitle: item.client_info, subTitle: item.location, target: `${item.delivery_date}T${item.order_time}`, person: item.driver_name }))
    ];
    setAllOrders(unified);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true, text: "בוצע" };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  const deleteItem = async (id: string, type: string) => {
    if (!confirm("בוס, למחוק סופית?")) return;
    const table = type === 'CONTAINER' ? 'container_management' : 'orders';
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.reply.includes('בוצע')) {
        audioRef.current?.play();
        fetchData();
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN | COMMAND CENTER</title></Head>

      <motion.aside animate={{ width: isSidebarOpen ? 280 : 85 }} className="bg-[#1A1C23] text-white flex flex-col z-50 shrink-0">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg"><Truck size={24} className="text-slate-900"/></div>
          {isSidebarOpen && <span className="font-black text-2xl italic tracking-tighter">SABAN OS</span>}
        </div>
        <nav className="flex-1 p-5 space-y-3">
          {[
            { id: 'live', label: 'משימות להיום', icon: Timer },
            { id: 'sidor', label: 'סידור נהגים', icon: Truck },
            { id: 'containers', label: 'ניהול מכולות', icon: Box },
            { id: 'history', label: 'ארכיון', icon: History },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 font-black shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={24} /> {isSidebarOpen && <span className="text-base uppercase">{item.label}</span>}
            </button>
          ))}
        </nav>
      </motion.aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <AnimatePresence mode="wait">
          
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-10 h-full overflow-y-auto space-y-10">
              <header className="flex justify-between items-end">
                <h1 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase">משימות להיום</h1>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 font-mono font-black text-xl text-emerald-600">
                    {now.toLocaleTimeString('he-IL')}
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {allOrders.filter(o => !calculateTime(o.target).expired).map(order => {
                  const t = calculateTime(order.target);
                  return (
                    <motion.div 
                      key={order.id} 
                      animate={t.urgent ? { scale: [1, 1.01, 1], borderColor: "#f59e0b" } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`bg-white p-8 rounded-[3rem] border-2 transition-all relative group shadow-sm ${t.urgent ? 'border-amber-500' : 'border-transparent hover:shadow-2xl'}`}
                    >
                      <div className="flex justify-between">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.type === 'CONTAINER' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          {order.type === 'CONTAINER' ? 'מכולה' : 'הובלה'}
                        </span>
                        <button onClick={() => deleteItem(order.id, order.type)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                      </div>
                      
                      <h2 className="text-3xl font-black text-slate-900 mt-6 leading-none">{order.mainTitle}</h2>
                      <div className="flex items-center gap-2 text-slate-400 font-bold mt-3 text-sm italic"><MapPin size={16} className="text-emerald-500"/> {order.subTitle}</div>

                      <div className={`mt-8 p-6 rounded-[2rem] flex items-center justify-between ${t.urgent ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-900 text-emerald-400 shadow-xl'}`}>
                        <div className="flex items-center gap-3">
                          <Clock size={28}/>
                          <span className="text-4xl font-black font-mono">
                            {`${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.urgent ? 'דחוף!' : 'יעד'}</span>
                      </div>
                      
                      <div className="mt-6 flex items-center gap-4 px-2 border-t border-slate-50 pt-4">
                        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase"><User size={14}/> {order.person}</div>
                        <div className="text-slate-400 font-black text-[10px] uppercase ml-auto">{order.order_time}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-white">
               <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-emerald-500/20"><Bot className="text-emerald-400"/></div>
                    <span className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter">Unified Brain Supervisor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Live</span>
                  </div>
               </header>
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-8 bg-[#F8F9FB] scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] p-8 rounded-[3rem] text-base font-black shadow-2xl leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.5em] italic">Thinking...</div>}
               </div>
               <footer className="p-10 bg-white border-t border-slate-100">
                  <form onSubmit={handleChat} className="max-w-5xl mx-auto relative group">
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב פקודה להזרקה או שאלה..." className="w-full bg-slate-100 border-none rounded-[2.5rem] py-8 px-12 pr-24 text-xl font-black outline-none focus:bg-white shadow-inner transition-all" />
                    <button type="submit" className="absolute left-4 top-4 bg-slate-900 text-emerald-400 w-16 h-16 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-90"><Send size={28} className="rotate-180"/></button>
                  </form>
               </footer>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 h-full overflow-y-auto">
              <h1 className="text-4xl font-black text-slate-900 mb-10 italic uppercase tracking-tighter">ארכיון פעילות</h1>
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                 <table className="w-full text-right">
                   <thead className="bg-[#1A1C23] text-white text-[10px] font-black uppercase tracking-[0.3em]">
                     <tr>
                       <th className="p-8">לקוח</th>
                       <th className="p-8">כתובת</th>
                       <th className="p-8">סוג</th>
                       <th className="p-8">זמן</th>
                       <th className="p-8">סטטוס</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {allOrders.filter(o => calculateTime(o.target).expired).map(o => (
                       <tr key={o.id} className="hover:bg-slate-50 transition-all font-bold">
                         <td className="p-8 text-slate-900 text-xl">{o.mainTitle}</td>
                         <td className="p-8 text-slate-400 text-sm italic">{o.subTitle}</td>
                         <td className="p-8"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] uppercase font-black">{o.type}</span></td>
                         <td className="p-8 text-slate-400 text-sm">{o.target.replace('T', ' ')}</td>
                         <td className="p-8 text-emerald-500"><CheckCircle size={24}/></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
