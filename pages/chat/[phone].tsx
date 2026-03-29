'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Menu, X, PlusCircle, LayoutGrid, 
  Briefcase, Lock, MapPin, Sun, Moon, MessageSquare, Send, 
  Eye, Truck, Construction, User, Sparkles, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function RamiAssistant_Final() {
  const router = useRouter();
  const { phone } = router.query;
  const cleanPhone = typeof phone === 'string' ? phone.replace(/[\[\]]/g, '') : '972508860896';

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState<'CHAT' | 'DRIVERS' | 'CONTROL'>('CHAT');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // טעינת הודעות פתיחה מהזיכרון
    setMessages([{ role: 'assistant', content: 'בוס, העוזר של ראמי מחובר ל-DNA. איך אני יכול לשרת אותך?' }]);

    fetchData();
    const channel = supabase.channel('realtime-saban')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();

    return () => {
      window.removeEventListener('resize', handleResize);
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const fetchData = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('order_time', { ascending: true });
    const { data: custs } = await supabase.from('customers').select('*').order('last_seen', { ascending: false });
    if (ords) setOrders(ords);
    if (custs) setLogs(custs);
  };

  // --- הלב של המערכת: חיבור למוח (Gemini API) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      // פנייה ל-API המוח עם ה-DNA והקונטקסט
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          senderPhone: cleanPhone, 
          name: 'ראמי',
          context: 'LOGISTICS_FLOW' // מסמן למוח לעבוד לפי עץ השאלות
        })
      });
      
      const data = await res.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }

      // אם המוח ביצע שינוי ב-DB (הזרקת הזמנה), הטבלאות יתעדכנו אוטומטית דרך ה-Realtime
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'בוס, המוח לא זמין כרגע. בדוק חיבור ל-API.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const shareReport = () => {
    let text = "📋 *דוח בוקר - ח.סבן*\n\n";
    ['חכמת', 'עלי'].forEach(d => {
      const dOrders = orders.filter(o => o.driver_name === d);
      if (dOrders.length > 0) {
        text += `*${d}:*\n` + dOrders.map(o => `⏰ ${o.order_time} | 👤 ${o.client_info} | 📍 ${o.location}`).join('\n') + '\n\n';
      }
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-all ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      
      {/* תפריט המבורגר / צד */}
      <AnimatePresence>
        {(showMenu || !isMobile) && (
          <motion.aside initial={isMobile ? { x: 300 } : false} animate={{ x: 0 }} exit={{ x: 300 }} className={`fixed lg:static inset-y-0 right-0 z-50 w-72 p-6 flex flex-col gap-6 border-l ${isDarkMode ? 'bg-[#111827] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-3"><div className="bg-emerald-500 p-2 rounded-xl text-black"><ShieldCheck size={24}/></div><h1 className="font-black text-lg">העוזר של ראמי</h1></div>
               {isMobile && <button onClick={() => setShowMenu(false)}><X/></button>}
            </div>
            <nav className="flex flex-col gap-2">
              <NavBtn active={view === 'CHAT'} onClick={() => {setView('CHAT'); setShowMenu(false);}} icon={<MessageSquare size={18}/>} label="צאט פקודות" />
              <NavBtn active={view === 'DRIVERS'} onClick={() => {setView('DRIVERS'); setShowMenu(false);}} icon={<Truck size={18}/>} label="לוח סידור" />
              <NavBtn active={view === 'CONTROL'} onClick={() => {setView('CONTROL'); setShowMenu(false);}} icon={<Eye size={18}/>} label="מרכז ניטור" />
            </nav>
            <button onClick={shareReport} className="mt-auto bg-[#25D366] text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Share2 size={18}/> שיתוף דוח בוקר</button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* אזור ראשי */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 flex items-center justify-between px-6 border-b ${isDarkMode ? 'bg-[#111827]/80 backdrop-blur-md border-white/5' : 'bg-white/80 backdrop-blur-md border-slate-200'}`}>
          <div className="flex items-center gap-3">
            {isMobile && <button onClick={() => setShowMenu(true)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Menu/></button>}
            <span className="font-black text-xs uppercase text-emerald-500 tracking-widest">{view === 'CHAT' ? 'Saban Intelligence' : 'Logistics Master'}</span>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-white/5">{isDarkMode ? <Sun className="text-orange-400"/> : <Moon/>}</button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {view === 'CHAT' ? (
            <div className="h-full flex flex-col max-w-4xl mx-auto p-4">
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm shadow-sm ${m.role === 'user' ? (isDarkMode ? 'bg-emerald-600 rounded-tr-sm' : 'bg-emerald-500 text-white rounded-tr-sm') : (isDarkMode ? 'bg-[#1E293B] rounded-tl-sm border border-white/5' : 'bg-white rounded-tl-sm border border-slate-100')}`}>
                       <div className="text-[9px] font-black uppercase mb-1 opacity-50 flex items-center gap-1">{m.role === 'user' ? <User size={10}/> : <Sparkles size={10}/>} {m.role === 'user' ? 'ראמי' : 'העוזר'}</div>
                       {m.content}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-emerald-500 text-[10px] font-black animate-pulse">העוזר מעבד פקודה...</div>}
              </div>
              <form onSubmit={handleSendMessage} className="p-4"><div className={`flex items-center p-2 rounded-[2.5rem] border ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="הוסף הזמנה..." className="flex-1 bg-transparent px-6 py-3 outline-none"/><button type="submit" className="bg-emerald-500 text-black p-3 rounded-full"><Send size={18}/></button></div></form>
            </div>
          ) : view === 'DRIVERS' ? (
            <div className="h-full overflow-y-auto p-6 space-y-8 max-w-5xl mx-auto">
               <DriverBlock name="חכמת" img="https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg" specs="מנוף 10 מטר" orders={orders.filter(o => o.driver_name === 'חכמת')} isDarkMode={isDarkMode}/>
               <DriverBlock name="עלי" img="https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg" specs="פריקה ידנית" orders={orders.filter(o => o.driver_name === 'עלי')} isDarkMode={isDarkMode}/>
            </div>
          ) : (
            <div className="p-6">מרכז ניטור: {logs.length} משתמשים נצפו לאחרונה.</div>
          )}
        </div>
      </main>
    </div>
  );
}

function DriverBlock({ name, img, specs, orders, isDarkMode }: any) {
  return (
    <div className={`rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-[#111827] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'}`}>
       <div className="p-5 flex items-center gap-4 border-b border-white/5">
          <img src={img} className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500"/>
          <div><h4 className="font-black text-lg">{name}</h4><p className="text-[10px] text-emerald-500 font-bold uppercase">{specs}</p></div>
       </div>
       <table className="w-full text-right text-xs">
          <thead className="bg-black/10 opacity-40 font-black"><tr><th className="p-4">זמן</th><th className="p-4">לקוח</th><th className="p-4">יעד</th></tr></thead>
          <tbody className="divide-y divide-white/5">
             {orders.map((o: any, i: number) => (<tr key={i}><td className="p-4 font-black text-emerald-500">{o.order_time}</td><td className="p-4">{o.client_info}</td><td className="p-4 opacity-70"><MapPin size={10} className="inline ml-1"/>{o.location}</td></tr>))}
          </tbody>
       </table>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 translate-x-[-4px]' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>{icon} {label}</button>
  );
}
