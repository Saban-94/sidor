'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Clock, MapPin, Bot, Send, CheckCircle, 
  Menu, X, Zap, Calendar, AlertCircle, ChevronRight
} from 'lucide-react';

export default function ContainersHub() {
  const [containers, setContainers] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chat, setChat] = useState<{open: boolean, activeContainer: any}>({open: false, activeContainer: null});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    fetchContainers();
    const sub = supabase.channel('containers_live').on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchContainers).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchContainers = async () => {
    const { data } = await supabase.from('container_management')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });
    setContainers(data || []);
  };

  // חישוב ימי שכירות ופס התקדמות (עד 10 ימים)
  const getRentalProgress = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const percentage = Math.min((diffDays / 10) * 100, 100);
    return { days: diffDays, percent: percentage, isOverdue: diffDays > 10 };
  };

  const openSmartChat = (container: any) => {
    setChat({ open: true, activeContainer: container });
    setChatHistory([{ role: 'ai', text: `בוס, אני מחובר למכולה ב${container.delivery_address} (${container.client_name}). מה הפעולה שנבצע?` }]);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F0F4F8] text-slate-900 font-sans overflow-hidden flex flex-col" dir="rtl">
        
        {/* Navbar - Glass Design */}
        <nav className="sticky top-0 z-[60] bg-white/70 backdrop-blur-md border-b border-white/20 p-4 lg:p-6 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white shadow-sm rounded-2xl hover:scale-105 transition-all text-blue-600">
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-blue-600">CONTAINERS</span></h1>
          </div>
          <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-2xl font-black text-xs shadow-lg shadow-blue-200">
            <Box size={16} /> <span>{containers.length} מכולות בשטח</span>
          </div>
        </nav>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
          <AnimatePresence>
            {containers.map((c) => {
              const { days, percent, isOverdue } = getRentalProgress(c.start_date);
              return (
                <motion.div 
                  key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-lg border border-white/40 rounded-[2.5rem] p-6 shadow-xl hover:shadow-2xl transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 font-black text-xs">
                      {c.contractor_name}
                    </div>
                    {isOverdue && <div className="bg-red-100 text-red-600 p-2 rounded-full animate-pulse"><AlertCircle size={18}/></div>}
                  </div>

                  <h3 className="text-xl font-black mb-1 truncate">{c.client_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-6">
                    <MapPin size={14} className="text-blue-500" /> {c.delivery_address}
                  </div>

                  {/* Rental Progress Bar */}
                  <div className="space-y-2 mb-8">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span>ימי שכירות: {days}/10</span>
                      <span className={isOverdue ? 'text-red-600' : 'text-blue-600'}>{Math.round(percent)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                        className={`h-full rounded-full ${isOverdue ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-blue-600 shadow-[0_0_10px_#2563eb]'}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => openSmartChat(c)}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <Bot size={18} /> ניהול AI
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </main>

        {/* AI SMART CHAT - FULL SCREEN MOBILE / SIDEBAR DESKTOP */}
        <AnimatePresence>
          {chat.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChat({open: false, activeContainer: null})} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="fixed bottom-0 right-0 left-0 lg:left-auto lg:right-6 lg:bottom-6 lg:w-[450px] z-[110] bg-white rounded-t-[3rem] lg:rounded-[3rem] shadow-3xl overflow-hidden flex flex-col h-[90vh] lg:h-[700px] border border-white/20"
              >
                <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse"><Bot size={24}/></div>
                    <div>
                      <p className="text-[10px] font-bold opacity-70 uppercase leading-none">Smart Management</p>
                      <h4 className="font-black italic">SABAN AI CORE</h4>
                    </div>
                  </div>
                  <button onClick={() => setChat({open: false, activeContainer: null})} className="p-2 bg-white/10 rounded-full"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`p-5 rounded-[2rem] text-sm font-bold max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-white text-slate-800 rounded-tr-none' : 'bg-blue-600 text-white shadow-blue-100 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white border-t flex gap-2 pb-10">
                  <input 
                    value={input} onChange={e => setInput(e.target.value)}
                    placeholder="מה תרצה לעשות בבוס?"
                    className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm font-bold outline-none"
                  />
                  <button className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90"><Send size={20}/></button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sidebar Menu Popup */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]" />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-[110] p-8 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-12">
                  <span className="font-black italic text-blue-600">SABAN OS</span>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
                </div>
                <div className="space-y-6">
                  {['לוח בקרה LIVE', 'ניהול מכולות', 'צ\'אט סבן AI', 'הגדרות מערכת'].map((t, i) => (
                    <div key={i} className="text-2xl font-black hover:text-blue-600 cursor-pointer flex items-center gap-4 transition-all">
                      <ChevronRight size={24} className="text-blue-600"/> {t}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
