'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Send, Bot, Calendar, RefreshCcw, User, MapPin, Clock, MessageSquare, Timer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const WA_BG = "bg-[#111b21]";
const WA_PANEL = "bg-[#202c33]";
const WA_GREEN = "bg-[#00a884]";
const WA_TEXT = "text-[#e9edef]";
const WA_SUB = "text-[#8696a0]";

const STATUS_MAP: any = {
  'approved': { label: 'מאושר', color: 'bg-[#00a884]' },
  'pending': { label: 'ממתין להעמסה', color: 'bg-[#f1c40f] text-[#111b21]' },
  'rejected': { label: 'נדחתה', color: 'bg-[#ea0038]' }
};

const QUICK_QUERIES = [
  { label: "כמות הזמנות היום", icon: "📊" },
  { label: "מצב מכולות בסידור", icon: "🏗️" },
  { label: "העברות בין סניפים", icon: "🔄" },
  { label: "סטטוס שארק 30", icon: "🦈" },
  { label: "שעות פעילות סניפים", icon: "🕒" },
  { label: "חיפוש לקוח מהיר", icon: "🔍" },
  { label: "דוח סיכום יומי", icon: "📋" },
  { label: "מכולות לפינוי", icon: "🗑️" }
];

const getCountdown = (orderTime: string) => {
  if (!orderTime) return null;
  const [h, m] = orderTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "בביצוע";
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours > 0 ? hours + 'ש ' : ''}${mins} דק'`;
};

// רכיב הודעה עם אפקט הקלדה
const TypedMessage = ({ content, role }: { content: string, role: 'user' | 'ai' }) => {
  if (role === 'user') return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, alt, ...props }) => {
            if (alt === 'Saban') {
              return <img {...props} alt={alt} className="w-8 h-8 rounded-full inline-block mt-2 border-2 border-white shadow-md bg-white" />;
            }
            return <img {...props} className="rounded-xl max-w-full h-auto my-2 shadow-sm" />;
          },
          table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table {...props} className="border-collapse border border-white/20 w-full text-xs text-white" /></div>,
          th: ({ node, ...props }) => <th {...props} className="border border-white/20 bg-white/10 p-1 text-right" />,
          td: ({ node, ...props }) => <td {...props} className="border border-white/20 p-1 text-right" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </motion.div>
  );
};

export default function SabanAIAssistant() {
  const [activeView, setActiveView] = useState<'chat' | 'live'>('chat');
  const [isOpen, setIsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const playNotificationSound = () => {
    const audio = new Audio('/order-notification.mp3');
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 60000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  // גלילה חלקה משופרת
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, loading]);

  const fetchLiveOrders = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted');
    const { data: c } = await supabase.from('container_management').select('*').eq('start_date', today).neq('status', 'deleted');
    setOrders([...(o || []), ...(c || [])].sort((a,b) => (a.order_time || '').localeCompare(b.order_time || '')));
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      playNotificationSound();
    } catch (e) { 
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור למערכת." }]); 
    } finally { setLoading(false); }
  };

  return (
    <div className={`
      min-h-screen w-full flex flex-col font-sans relative overflow-hidden
      bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] 
      bg-center bg-no-repeat bg-cover bg-fixed
      ${WA_TEXT} scroll-smooth
    `} dir="rtl">
      
      <div className="absolute inset-0 bg-[#0b141a]/65 z-0" />

      <Head><title>SABAN | AI Companion</title></Head>

      <div className="relative z-10 flex flex-col h-screen">
        <AnimatePresence>
          {showSplash && (
            <motion.div exit={{ opacity: 0 }} className={`fixed inset-0 ${WA_BG} z-[100] flex items-center justify-center`}>
              <motion.img 
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                src={SABAN_LOGO} className="w-48 h-48 rounded-3xl object-cover shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <header className={`h-16 flex items-center justify-between px-6 ${WA_PANEL} border-b border-white/5 z-50 shadow-md backdrop-blur-md bg-opacity-80`}>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><Menu size={28} /></button>
          <div className="flex items-center gap-3">
              <img src={SABAN_LOGO} className="w-9 h-9 rounded-full object-cover border border-[#00a884]/30 shadow-md" />
              <span className="font-black text-lg tracking-tighter uppercase text-[#00a884]">SABAN {activeView === 'chat' ? 'AI' : 'LIVE'}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#00a884]/10 flex items-center justify-center text-[#00a884] font-black border border-[#00a884]/20">
            {orders.length}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-40 scroll-smooth custom-scrollbar">
          {activeView === 'chat' ? (
            <>
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.role === 'user' ? -20 : 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[88%] p-4 rounded-2xl font-bold shadow-lg relative ${m.role === 'user' ? 'bg-[#202c33] border border-white/5 rounded-tr-none' : 'bg-[#005c4b] text-[#e9edef] rounded-tl-none border border-emerald-400/20'}`}>
                    <TypedMessage content={m.content} role={m.role} />
                  </div>
                </motion.div>
              ))}
              
              {/* אפקט חשיבה - Thinking */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                  <div className="bg-[#005c4b] p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-2 bg-white rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2 h-2 bg-white rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => {
                const countdown = getCountdown(order.order_time);
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={order.id} 
                    className={`p-6 rounded-2xl ${WA_PANEL} border-r-4 border-[#00a884] shadow-lg`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${STATUS_MAP[order.status]?.color || 'bg-slate-700'}`}>{STATUS_MAP[order.status]?.label || order.status}</span>
                      <span className={`${WA_SUB} font-mono text-[10px]`}>#{order.order_number || 'N/A'}</span>
                    </div>
                    <h3 className="text-xl font-black">{order.client_name || order.client_info}</h3>
                    <div className={`${WA_SUB} text-xs flex items-center gap-1 mb-4`}><MapPin size={12}/> {order.delivery_address || order.location}</div>
                    <div className="flex justify-between items-center bg-[#111b21]/50 p-4 rounded-xl">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[#00a884] font-black text-xl italic"><Clock size={18}/> {order.order_time}</div>
                        {countdown && <div className="text-[10px] font-black text-amber-500 italic font-mono">בעוד {countdown}</div>}
                      </div>
                      <span className="text-xs font-bold opacity-70 border-r border-white/10 pr-3">{order.contractor_name || order.driver_name}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          <div ref={scrollRef} className="h-2" />
        </main>

        {activeView === 'chat' && (
          <footer className={`fixed bottom-0 left-0 right-0 p-4 pb-6 bg-[#111b21] bg-opacity-90 backdrop-blur-lg z-40 border-t border-white/5`}>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar max-w-full">
              {QUICK_QUERIES.map((q, i) => (
                <button key={i} onClick={() => askAI(q)} className={`whitespace-nowrap px-5 py-2 ${WA_PANEL} rounded-full text-[11px] font-bold border border-white/5 hover:bg-[#2a3942] active:scale-95 transition-all`}>{q}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative flex gap-2">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="כתוב הודעה למוח..." 
                className={`flex-1 p-4 rounded-2xl ${WA_PANEL} border-none outline-none focus:ring-1 focus:ring-[#00a884] font-bold text-white placeholder:opacity-40 transition-shadow shadow-inner`} 
              />
              <button 
                type="submit" 
                disabled={loading}
                className="w-14 h-14 bg-[#00a884] hover:bg-[#00c99e] text-[#111b21] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
              >
                <Send size={22} className="rotate-180" />
              </button>
            </form>
          </footer>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 168, 132, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        main { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
