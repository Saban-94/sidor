'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, 
  Clock, User, MapPin, CheckCircle2, BellRing, Bot,
  Truck, ChevronRight, Menu, X, PlusCircle, Box, RefreshCcw, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// נתונים קבועים - נהגים עם תמונות
const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

// יצירת TIME_SLOTS בהפרשים של חצי שעה
const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanUnifiedOS() {
  const [activeTab, setActiveTab] = useState<'sidor' | 'containers' | 'chat'>('sidor');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    // יצירת אלמנט האודיו פעם אחת
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/order-notification.mp3');
    }
    // מאזין לשינויים ב-Realtime משתי הטבלאות
    const channel = supabase.channel('global_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  // גלילה אוטומטית בצ'אט
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchData = async () => {
    // שליפת נתונים משתי הטבלאות
    const { data: containers } = await supabase.from('container_management').select('*').eq('is_active', true).order('start_date', { ascending: true });
    const { data: trucks } = await supabase.from('orders').select('*').order('order_time', { ascending: true });
    
    if (containers) setContainerSites(containers);
    if (trucks) setTruckOrders(trucks);
  };

  // פונקציית עזר לחישוב ימים מאז הצבה (למכולות)
  const calculateDaysSincePlacement = (startDate: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // פונקציית עזר לשליפת הזמנת נהג לפי משבצת זמן
  const getOrderForDriverSlot = (driverName: string, timeSlot: string) => {
    return truckOrders.find(order => 
      order.driver_name === driverName && 
      order.order_time === timeSlot
    );
  };

  // פונקציית שליחת הודעה למוח המאוחד
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, senderPhone: 'admin' })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // אם המוח ביצע הזרקה מוצלחת (CONTAINER או ORDER)
      if (data.reply.includes('בוצע') || data.reply.includes('DATA_START')) {
        audioRef.current?.play().catch(e => console.log("Audio failed", e));
        fetchData(); // עדכון הנתונים בלוחות
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7FE] font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN | Unified Control Center</title></Head>

      {/* תפריט צד (Sidebar) */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="h-full bg-slate-900 text-white flex flex-col relative z-50 shadow-2xl shrink-0"
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 bg-emerald-500 rounded-xl"><LayoutDashboard size={20} className="text-slate-900" /></div>
          {isSidebarOpen && <span className="font-black italic text-lg tracking-tighter uppercase">SABAN OS</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: 'sidor', label: 'סידור הזמנות', icon: MessageSquare },
            { id: 'containers', label: 'ניהול מכולות', icon: Container },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-bold">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute -left-3 top-20 bg-emerald-500 text-slate-900 p-1 rounded-full border-4 border-[#F4F7FE] z-50">
          <ChevronRight size={14} className={isSidebarOpen ? 'rotate-180' : ''} />
        </button>
      </motion.aside>

      {/* תוכן מרכזי */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* דף סידור הזמנות - לוח שעות נהגים */}
          {activeTab === 'sidor' && (
            <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide bg-slate-50/50">
              {DRIVERS.map(driver => (
                <div key={driver.name} className="space-y-6">
                  <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5">
                    <img src={driver.img} className="w-16 h-16 rounded-full border-4 border-emerald-500 object-cover shadow-xl" />
                    <h3 className="font-black text-slate-900 text-2xl tracking-tighter">{driver.name} - לוח שעות</h3>
                    <Bell size={20} className="mr-auto text-emerald-500"/>
                  </div>
                  
                  <div className="space-y-3 px-4">
                    {TIME_SLOTS.map(slot => {
                      const order = getOrderForDriverSlot(driver.name, slot);
                      return (
                        <div key={slot} className="flex items-center gap-6 min-h-[50px] group">
                          <span className="text-[10px] font-black font-mono w-10 text-slate-300 group-hover:text-emerald-500 transition-colors uppercase">{slot}</span>
                          <div className={`flex-1 rounded-2xl p-4 flex items-center gap-4 transition-all ${order ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'border-b border-slate-100 italic text-[10px] text-slate-300 font-bold uppercase tracking-widest'}`}>
                            {order ? (
                              <>
                                <Truck size={16} className="text-slate-900/30"/>
                                <span className="font-black text-sm">{order.client_info}</span>
                                <span className="text-[10px] font-bold opacity-70">{order.location} | {order.source_branch}</span>
                                <CheckCircle2 size={16} className="mr-auto text-slate-900/50"/>
                              </>
                            ) : (
                              "זמין לשיבוץ"
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* דף ניהול מכולות - עם פס התקדמות דינמי */}
          {activeTab === 'containers' && (
            <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-8 overflow-y-auto bg-slate-50">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                 {containerSites.map(site => {
                    const days = calculateDaysSincePlacement(site.start_date);
                    const progressPercentage = Math.min((days / 10) * 100, 100);
                    const isUrgent = days >= 9;

                    return (
                      <motion.div whileHover={{ y: -5 }} key={site.id} className="bg-white p-7 rounded-[3rem] border-2 border-transparent shadow-2xl hover:shadow-emerald-500/10 transition-all group relative overflow-hidden">
                         <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-emerald-500 text-slate-900 rounded-[1.5rem] shadow-lg shadow-emerald-500/20">
                               {site.action_type === 'PLACEMENT' ? <Box size={22}/> : <RefreshCcw size={22}/>}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-widest">{site.contractor_name}</span>
                         </div>
                         
                         <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors tracking-tighter">{site.client_name}</h3>
                         <div className="flex items-center gap-1 text-slate-500 text-xs font-bold mt-2"><MapPin size={14} className="text-emerald-500"/> {site.delivery_address}</div>
                         
                         {/* פס התקדמות דינמי */}
                         <div className="mt-8 space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase">
                             <span className={isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-400'}>התקדמות הצבה: {days}/10 ימים</span>
                             <span className="font-mono text-emerald-500">{Math.round(progressPercentage)}%</span>
                           </div>
                           <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-500 ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} 
                               style={{ width: `${progressPercentage}%` }} 
                             />
                           </div>
                         </div>
                      </motion.div>
                    );
                 })}
               </div>
            </motion.div>
          )}

          {/* דף צ'אט מלא - המוח המאוחד (Saban Unified Brain) */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col bg-white overflow-hidden shadow-inner">
              <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/10"><Bot size={20} className="text-emerald-400"/></div>
                    <span className="font-black text-lg text-slate-900 uppercase tracking-tighter">Saban Unified Brain</span>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              </header>
              
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide bg-slate-50">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] px-6 py-5 rounded-[2rem] text-sm font-bold shadow-xl leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-emerald-500/5'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.3em] mr-2">Syncing...</div>}
              </div>

              <footer className="p-6 bg-white border-t border-slate-100">
                  <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                    <input 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder="שלח פקודה (מכולה / הזמנה)..." 
                      className="w-full bg-slate-100 border-2 border-transparent rounded-[2rem] py-5 px-7 pr-20 text-sm font-bold outline-none transition-all focus:border-emerald-500/20 focus:bg-white" 
                    />
                    <button type="submit" className="absolute left-3 top-2.5 bg-slate-900 text-emerald-400 w-12 h-12 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95">
                      <Send size={18} className="transform rotate-180" />
                    </button>
                  </form>
              </footer>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
