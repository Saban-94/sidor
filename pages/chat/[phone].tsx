'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UserCheck, BarChart3, Settings, Menu, X, 
  PlusCircle, LayoutGrid, Briefcase, Lock, MapPin, 
  Sun, Moon, MessageSquare, Send, Bell, Eye, Truck, Construction, User, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CRM_DIMENSIONS = { desktop: 280, mobile: 320 };

export default function SabanOS_MasterChat() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState<'CHAT' | 'CONTROL' | 'DRIVERS'>('CHAT'); // צאט הוא ברירת המחדל
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // States לניהול מידע
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // טעינת הודעות ראשונית (דימוי DNA)
    setMessages([{ role: 'assistant', content: 'שלום ראמי, המוח מחובר. מחכה לפקודות שלך לניהול ח.סבן.' }]);

    fetchData();
    const channel = supabase.channel('realtime-saban')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchData)
      .subscribe();

    return () => {
      window.removeEventListener('resize', handleResize);
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchData = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('order_time', { ascending: false });
    const { data: custs } = await supabase.from('customers').select('*').order('last_seen', { ascending: false });
    if (ords) setOrders(ords);
    if (custs) setLogs(custs);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    // כאן המקום להוסיף לוגיקה של זיהוי פקודות (למשל: "הובלה לחכמת...")
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'הפקודה התקבלה. המערכת מעבדת ומעדכנת את טבלאות הנהגים.' }]);
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen font-sans overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside style={{ width: CRM_DIMENSIONS.desktop }} className={`fixed top-0 right-0 h-screen z-40 p-6 flex flex-col gap-8 border-l ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
          <LogoSection isDarkMode={isDarkMode}/>
          <nav className="flex flex-col gap-2">
            <NavBtn active={view === 'CHAT'} onClick={() => setView('CHAT')} icon={<MessageSquare size={18}/>} label="צאט המוח (ראמי)" />
            <NavBtn active={view === 'CONTROL'} onClick={() => setView('CONTROL')} icon={<Eye size={18}/>} label="מלשינון בקרה" />
            <NavBtn active={view === 'DRIVERS'} onClick={() => setView('DRIVERS')} icon={<Truck size={18}/>} label="ניהול נהגים" />
          </nav>
          <div className="mt-auto p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-[9px] font-mono text-emerald-500">
             SYSTEM: SABAN-AI-V4<br/>STATUS: CONNECTED<br/>USER: RAMI MSARWH
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main style={{ paddingRight: isMobile ? 0 : CRM_DIMENSIONS.desktop }} className="h-full flex flex-col relative transition-all">
        
        {/* Top Header */}
        <header className={`h-16 flex items-center justify-between px-6 border-b z-30 ${isDarkMode ? 'bg-[#111827]/80 backdrop-blur-md border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            {isMobile && <button onClick={() => setShowMenu(true)} className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Menu size={20}/></button>}
            <h2 className="font-black text-sm uppercase tracking-widest text-emerald-500">
                {view === 'CHAT' ? 'Saban Intelligence Chat' : view === 'CONTROL' ? 'Surveillance' : 'Driver Logistics'}
            </h2>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            {isDarkMode ? <Sun size={20} className="text-orange-400"/> : <Moon size={20}/>}
          </button>
        </header>

        {/* View Switcher Content */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* VIEW: CHAT (The Core) */}
          {view === 'CHAT' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto w-full p-4">
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-hide">
                {messages.map((m, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm shadow-sm ${m.role === 'user' ? (isDarkMode ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-emerald-500 text-white rounded-tr-sm') : (isDarkMode ? 'bg-[#1E293B] text-slate-200 rounded-tl-sm border border-white/5' : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100')}`}>
                      <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-black uppercase">
                        {m.role === 'user' ? <User size={12}/> : <Sparkles size={12}/>}
                        {m.role === 'user' ? 'Rami' : 'Saban Brain'}
                      </div>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 mb-4">
                <div className={`relative flex items-center p-2 rounded-[2.5rem] border shadow-2xl transition-all ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}>
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="כתוב פקודה למוח (למשל: הובלה לחכמת...)" className="flex-1 bg-transparent px-6 py-3 text-sm focus:outline-none" />
                  <button type="submit" className="bg-emerald-500 text-black p-3 rounded-full hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"><Send size={18}/></button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: CONTROL (The Logs) */}
          {view === 'CONTROL' && (
            <div className="h-full overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
               <h3 className="text-xl font-black text-emerald-500 uppercase tracking-tighter">📢 המלשינון: מי מחובר עכשיו?</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {logs.map((log, i) => (
                   <div key={i} className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500">{log.name[0]}</div>
                           <span className="font-bold">{log.name}</span>
                         </div>
                         <span className="text-[10px] font-mono opacity-40">{new Date(log.last_seen).toLocaleTimeString()}</span>
                      </div>
                      <div className="p-3 bg-black/20 rounded-xl text-[11px] font-mono opacity-70 italic border border-white/5">
                        {log.hobbies || "שיחה פעילה עם המוח..."}
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* VIEW: DRIVERS (The Tables) */}
          {view === 'DRIVERS' && (
            <div className="h-full overflow-y-auto p-6 space-y-10 max-w-6xl mx-auto">
              <DriverTable 
                name="חכמת" img="https://api.dicebear.com/7.x/avataaars/svg?seed=Hakmat" specs="משאית מנוף • הנפה 10 מטר" icon={<Construction className="text-orange-500"/>}
                orders={orders.filter(o => o.driver_name === 'חכמת')} isDarkMode={isDarkMode}
              />
              <DriverTable 
                name="עלי" img="https://api.dicebear.com/7.x/avataaars/svg?seed=Ali" specs="משאית ללא מנוף • פריקה ידנית" icon={<Truck className="text-blue-500"/>}
                orders={orders.filter(o => o.driver_name === 'עלי')} isDarkMode={isDarkMode}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// קומפוננטות עזר
function DriverTable({ name, img, specs, icon, orders, isDarkMode }: any) {
  return (
    <div className={`rounded-[2rem] overflow-hidden border shadow-xl ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
        <img src={img} className="w-14 h-14 rounded-2xl border-2 border-emerald-500 bg-white" alt={name}/>
        <div>
          <h4 className="text-xl font-black flex items-center gap-2">{icon} {name}</h4>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{specs}</p>
        </div>
      </div>
      <table className="w-full text-right text-xs">
        <thead className="opacity-40 font-black uppercase tracking-tighter bg-black/20">
          <tr><th className="p-4">זמן</th><th className="p-4">פרטי הזמנה</th><th className="p-4">מיקום</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map((o: any, i: number) => (
            <tr key={i} className="hover:bg-white/5"><td className="p-4 font-bold text-emerald-500">{o.order_time}</td><td className="p-4">{o.client_info}</td><td className="p-4 opacity-60"><MapPin size={12} className="inline ml-1"/>{o.location}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 translate-x-[-4px]' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}

function LogoSection({ isDarkMode }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-emerald-500 text-black p-2.5 rounded-xl shadow-lg"><ShieldCheck size={24}/></div>
      <div>
        <h1 className={`text-lg font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Saban</h1>
        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em]">Core Brain</p>
      </div>
    </div>
  );
}
