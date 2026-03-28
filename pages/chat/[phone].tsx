'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UserCheck, BarChart3, Settings, Menu, X, 
  PlusCircle, LayoutGrid, Briefcase, Lock, MapPin, 
  Sun, Moon, MessageSquare, Send, Bell, Eye, Truck, Construction
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CRM_DIMENSIONS = { desktop: 300, mobile: 320 };

export default function SabanOS_Final() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState<'CONTROL' | 'DRIVERS'>('CONTROL');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // דאטה חי מהשרת
  const [logs, setLogs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    window.addEventListener('resize', handleResize);

    // סנכרון חי: מלשינון (Logs) והזמנות
    fetchData();
    const ordersSub = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchData)
      .subscribe();

    return () => {
      window.removeEventListener('resize', handleResize);
      ordersSub.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('order_time', { ascending: true });
    const { data: custs } = await supabase.from('customers').select('*').order('last_seen', { ascending: false });
    if (ords) setOrders(ords);
    if (custs) setLogs(custs);
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-500/30 transition-all duration-500 ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F8FAFC] text-slate-900'}`} dir="rtl">
      
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside style={{ width: CRM_DIMENSIONS.desktop }} className={`fixed top-0 right-0 h-screen z-40 p-8 flex flex-col gap-10 border-l transition-all ${isDarkMode ? 'bg-[#111827] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
          <LogoSection isDarkMode={isDarkMode}/>
          <nav className="flex flex-col gap-3">
            <NavBtn active={view === 'CONTROL'} onClick={() => setView('CONTROL')} icon={<Eye size={20}/>} label="מלשינון בקרה" />
            <NavBtn active={view === 'DRIVERS'} onClick={() => setView('DRIVERS')} icon={<Truck size={20}/>} label="ניהול נהגים" />
          </nav>
          <div className="mt-auto opacity-50 text-[10px] font-mono tracking-tighter">SABAN OS v4.0 • STABLE MODE</div>
        </aside>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobile && showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex">
            <motion.aside initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} className="bg-[#111827] w-80 h-full p-8 flex flex-col gap-8 shadow-2xl">
              <button onClick={() => setShowMenu(false)} className="p-2 self-start bg-white/5 rounded-xl"><X/></button>
              <LogoSection isDarkMode={true}/>
              <nav className="flex flex-col gap-4">
                <NavBtn active={view === 'CONTROL'} onClick={() => {setView('CONTROL'); setShowMenu(false);}} icon={<Eye/>} label="מלשינון בקרה" />
                <NavBtn active={view === 'DRIVERS'} onClick={() => {setView('DRIVERS'); setShowMenu(false);}} icon={<Truck/>} label="ניהול נהגים" />
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <main style={{ paddingRight: isMobile ? 16 : CRM_DIMENSIONS.desktop + 32, paddingLeft: 16, paddingTop: 100 }} className="pb-10 transition-all">
        
        {/* Top Floating Header */}
        <header className={`fixed top-4 left-4 z-50 flex items-center justify-between p-4 rounded-3xl border transition-all backdrop-blur-xl ${isDarkMode ? 'bg-[#1F2937]/80 border-white/10' : 'bg-white/80 border-slate-200 shadow-xl'}`} style={{ width: isMobile ? 'calc(100% - 32px)' : `calc(100% - ${CRM_DIMENSIONS.desktop + 64}px)` }}>
           <div className="flex items-center gap-4 text-emerald-500 font-black uppercase text-sm tracking-tighter">
             {isMobile && <button onClick={() => setShowMenu(true)} className="p-2 bg-emerald-500/10 rounded-xl"><Menu size={20}/></button>}
             <ShieldCheck/> {view === 'CONTROL' ? 'Live Surveillance' : 'Driver Logistics'}
           </div>
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl bg-white/5">{isDarkMode ? <Sun className="text-orange-400"/> : <Moon/>}</button>
        </header>

        {/* View Switcher */}
        <div className="max-w-6xl mx-auto">
          {view === 'CONTROL' ? (
            <div className="grid grid-cols-1 gap-6">
               <h2 className="text-2xl font-black mb-4">📢 המלשינון: פעילות משתמשים בזמן אמת</h2>
               <div className="grid grid-cols-1 gap-4">
                 {logs.map((log, i) => (
                   <div key={i} className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500">{log.name[0]}</div>
                           <div>
                              <div className="font-black text-lg">{log.name}</div>
                              <div className="text-xs opacity-50 font-mono">{log.phone} | נצפה לאחרונה: {new Date(log.last_seen).toLocaleTimeString('he-IL')}</div>
                           </div>
                        </div>
                        <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Connected</div>
                      </div>
                      <div className="mt-4 p-4 bg-black/20 rounded-2xl font-mono text-[11px] border border-white/5 opacity-80 italic">
                         "בוס, השיחה האחרונה הייתה לגבי {log.hobbies || 'בירור מלאי כללי'}. המוח ענה לפי ה-DNA."
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* טבלת חכמת - מנוף */}
              <DriverTable 
                name="חכמת" 
                img="https://api.dicebear.com/7.x/avataaars/svg?seed=Hakmat"
                specs="משאית מנוף | זרוע 10 מטר | הנפה טלסקופית"
                icon={<Construction className="text-orange-400"/>}
                orders={orders.filter(o => o.driver_name === 'חכמת')}
                isDarkMode={isDarkMode}
              />

              {/* טבלת עלי - ידני */}
              <DriverTable 
                name="עלי" 
                img="https://api.dicebear.com/7.x/avataaars/svg?seed=Ali"
                specs="משאית ללא מנוף | פריקה ידנית בלבד"
                icon={<Truck className="text-blue-400"/>}
                orders={orders.filter(o => o.driver_name === 'עלי')}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// קומפוננטות עזר חכמות

function DriverTable({ name, img, specs, icon, orders, isDarkMode }: any) {
  return (
    <div className={`rounded-[3rem] overflow-hidden border shadow-2xl transition-all ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-l from-transparent to-white/5">
        <div className="flex items-center gap-6">
          <img src={img} className="w-20 h-20 rounded-[2rem] border-4 border-emerald-500 shadow-2xl bg-white" alt={name}/>
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-2">{icon} {name}</h3>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">{specs}</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-black/20 text-[10px] font-black uppercase tracking-widest opacity-50">
            <tr>
              <th className="p-6">זמן</th>
              <th className="p-6">לקוח / הזמנה</th>
              <th className="p-6">יעד</th>
              <th className="p-6">סניף</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.length > 0 ? orders.map((o: any, i: number) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="p-6 font-black text-emerald-500">{o.order_time}</td>
                <td className="p-6 font-bold">{o.client_info}</td>
                <td className="p-6"><div className="flex items-center gap-2 opacity-70"><MapPin size={14}/> {o.location}</div></td>
                <td className="p-6 text-xs font-mono opacity-50">{o.source_branch}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-10 text-center opacity-30 font-black uppercase tracking-widest text-xs">אין הזמנות רשומות לנהג זה</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] font-black text-sm transition-all group ${active ? 'bg-emerald-500 text-black shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
      <span className={active ? 'text-black' : 'text-emerald-500'}>{icon}</span> {label}
    </button>
  );
}

function LogoSection({ isDarkMode }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-emerald-500 text-black p-3 rounded-2xl shadow-xl"><ShieldCheck size={28}/></div>
      <div>
        <h1 className={`text-2xl font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Saban</h1>
        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Intelligence Core</p>
      </div>
    </div>
  );
}
