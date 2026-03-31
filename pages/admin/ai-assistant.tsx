'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, Send, Calendar, RefreshCcw, MapPin, Clock, MessageSquare, Share2, Sun, Moon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const WA_BG = "bg-[#111b21]";
const WA_PANEL = "bg-[#202c33]";
const WA_TEXT = "text-[#e9edef]";

export default function SabanAIAssistant() {
  const [activeView, setActiveView] = useState<'chat' | 'live'>('chat');
  const [isOpen, setIsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    fetchLiveOrders();
    return () => clearTimeout(timer);
  }, []);

  const fetchLiveOrders = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today);
    const { data: c } = await supabase.from('container_management').select('*').eq('start_date', today);
    setOrders([...(o || []), ...(c || [])]);
  };

  const shareTomorrowSchedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('he-IL');
    const isoTomorrow = tomorrow.toISOString().split('T')[0];
    
    const tomorrowOrders = orders.filter(o => (o.delivery_date === isoTomorrow) || (o.start_date === isoTomorrow));

    if (tomorrowOrders.length === 0) {
      alert("אין הזמנות למחר בסידור.");
      return;
    }

    let message = `📊 *SABAN OS | סידור עבודה ${dateStr}*\n\n`;
    tomorrowOrders.forEach((order, index) => {
      const isContainer = order.order_number?.toString().startsWith('62');
      message += `${isContainer ? '🔄' : '🚛'} | *${order.order_time || '--:--'}* | *${order.client_name || order.client_info}*\n`;
      message += `📍 יעד: ${order.delivery_address || order.location}\n`;
      if (order.driver_name) message += `👤 נהג: ${order.driver_name}\n`;
      message += `------------------\n`;
    });
    message += `\n🏗️ *ח.סבן חומרי בנין 1994 בע"מ*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (e) { setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור." }]); }
    finally { setLoading(false); }
  };

  return (
    <div className={`h-screen ${isDarkMode ? WA_BG : 'bg-gray-100'} ${isDarkMode ? WA_TEXT : 'text-gray-900'} flex flex-col font-sans overflow-hidden`} dir="rtl">
      <Head><title>SABAN | AI OS</title></Head>

      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className={`fixed inset-0 ${WA_BG} z-[100] flex items-center justify-center`}>
            <motion.img initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={SABAN_LOGO} className="w-48 h-48 rounded-3xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`h-16 flex items-center justify-between px-6 ${isDarkMode ? WA_PANEL : 'bg-white shadow'} z-50`}>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2"><Menu size={28} /></button>
        <span className="font-black text-[#00a884]">SABAN OS</span>
        <div className="w-9 h-9 rounded-full bg-[#00a884]/10 flex items-center justify-center text-[#00a884] font-black">{orders.length}</div>
      </header>

      <div className="fixed left-4 bottom-24 flex flex-col gap-3 z-50">
        <motion.button whileTap={{ scale: 0.9 }} onClick={shareTomorrowSchedule} className="w-12 h-12 bg-[#25d366] text-white rounded-full flex items-center justify-center shadow-2xl"><Share2 size={22} /></motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-12 ${isDarkMode ? 'bg-white text-black' : 'bg-gray-800 text-white'} rounded-full flex items-center justify-center shadow-2xl`}>
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </motion.button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? (isDarkMode ? 'bg-[#202c33]' : 'bg-white border') : 'bg-[#005c4b] text-white'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <RefreshCcw className="animate-spin text-[#00a884] mx-auto" />}
      </main>

      <footer className={`fixed bottom-0 left-0 right-0 p-4 ${isDarkMode ? WA_BG : 'bg-gray-100'}`}>
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="דבר איתי בוס..." className={`w-full p-4 rounded-full ${isDarkMode ? WA_PANEL : 'bg-white border'} outline-none focus:ring-1 focus:ring-[#00a884]`} />
          <button type="submit" className="absolute left-2 top-2 w-10 h-10 bg-[#00a884] text-white rounded-full flex items-center justify-center"><Send size={18} className="rotate-180" /></button>
        </form>
      </footer>
    </div>
  );
}
