'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, Send, Clock, MapPin, 
  Bot, Truck, Box, RefreshCcw, Trash2, 
  Timer, Sun, Moon, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function SabanUltimateControlCenter() {
  // פתרון לשגיאת Hydration - רינדור רק אחרי טעינה בצד לקוח
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'chat'>('live');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const channel = supabase.channel('db_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();
      
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate]);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerSites(c || []);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  if (!mounted) return null; // מונע שגיאת React #418

  return (
    <div className={`flex h-screen w-full transition-all duration-700 font-sans overflow-hidden ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      <Head>
        <title>SABAN OS | Command Center</title>
        {/* תיקון ה-Meta המיושן */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex w-80 flex-col transition-all border-l ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/70 border-slate-200'} backdrop-blur-2xl z-50`}>
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-emerald-600">OS</span></h1>
            <p className="text-[10px] font-bold opacity-40 uppercase">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'live', label: 'משימות LIVE', icon: Timer },
            { id: 'sidor', label: 'סידור נהגים', icon: Truck },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-5 rounded-3xl flex items-center gap-5 transition-all ${activeTab === item.id ? 'bg-white text-emerald-600 font-black shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={22} /> <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 shrink-0 flex items-center justify-between px-8 border-b bg-white/50 backdrop-blur-md border-slate-200">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-3 rounded-2xl font-black text-xs border border-slate-200 outline-none shadow-sm" />
          <div className="font-mono font-black text-3xl text-emerald-600 italic">
            {now.toLocaleTimeString('he-IL')}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 pb-32">
          <AnimatePresence mode="wait">
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {truckOrders.map(order => {
                  const t = calculateTime(`${order.delivery_date}T${order.order_time}`);
                  return (
                    <div key={order.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white shadow-lg relative group">
                      <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-emerald-600 mb-6 inline-block">ORDER</span>
                      <h3 className="text-3xl font-black mb-2 tracking-tighter leading-tight">{order.client_info}</h3>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-10"><MapPin size={14}/> {order.location}</div>
                      
                      <div className={`p-6 rounded-[2.5rem] flex items-center justify-between ${t.expired ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-emerald-400'}`}>
                        <div className="flex items-center gap-4">
                          <Clock size={24}/>
                          <span className="text-3xl font-black font-mono">
                            {!t.expired ? `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : "בוצע"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-8">
                        <img 
                          src={DRIVERS.find(d => d.name === order.driver_name)?.img || 'https://i.postimg.cc/T34X4BqB/rami-avatar.jpg'} 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://i.postimg.cc/mD8zQcby/rami.jpg'; }}
                        />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">נהג מבצע</span>
                          <p className="text-lg font-black">{order.driver_name}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
