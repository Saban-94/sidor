'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, CheckCircle2, Truck, HardHat, 
  Package, MapPin, History, Trash2, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CustomerProChat() {
  const router = useRouter();
  const { phone } = router.query;
  
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'שלום בוס, כאן המוח של ח. סבן. אני מנהל התיק האישי שלך. איזה פרויקט מקדמים היום?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // שליפת נתוני לקוח וקונטקסט
  const fetchData = async () => {
    if (!phone) return;
    
    // 1. נתוני לקוח
    const { data: cust } = await supabase.from('customers').select('*').eq('phone', phone).single();
    if (cust) setCustomer(cust);

    // 2. פרויקטים פעילים
    const { data: proj } = await supabase.from('customer_projects').select('*').eq('customer_phone', phone);
    if (proj) setProjects(proj);

    // 3. הזמנות אחרונות
    const { data: orders } = await supabase.from('orders_pending')
      .select('*, customer_projects(project_name)')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(3);
    if (orders) setRecentOrders(orders);
  };

  useEffect(() => { fetchData(); }, [phone]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          message: userMsg, 
          history: messages.slice(-6) // שולחים רק היסטוריה קרובה לביצועים
        })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      
      if (data.status === 'order_sent') {
        fetchData(); // רענון רשימת ההזמנות אם הוזרקה הזמנה
      }
    } catch (error) {
      console.error("Brain Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9] font-sans antialiased text-slate-900" dir="rtl">
      <Head>
        <title>Saban AI | מנהל תיק אישי</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* Header הייטקי נקי */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-lg tracking-tight">SABAN <span className="text-emerald-600 italic">BRAIN</span></h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Manager AI</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-xs font-black text-slate-400">{customer?.name || 'לקוח VIP'}</span>
           <span className="text-[9px] text-slate-300">{phone}</span>
        </div>
      </header>

      {/* אזור תוכן מרכזי */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        
        {/* ווידג'ט פרויקטים מהיר */}
        {projects.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {projects.map(p => (
              <div key={p.id} className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2 whitespace-nowrap">
                <MapPin size={14} className="text-emerald-500"/>
                <span className="text-xs font-bold text-slate-600">{p.project_name}</span>
              </div>
            ))}
          </div>
        )}

        {/* בועות שיחה */}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-[2rem] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100' 
                  : 'bg-emerald-600 text-white rounded-tl-none shadow-emerald-100'
              }`}>
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-emerald-600/10 p-4 rounded-[2rem] rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* היסטוריית הזמנות בתוך הצאט */}
        {recentOrders.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
              <History size={12}/> הזמנות אחרונות בטיפול
            </h4>
            <div className="space-y-2">
              {recentOrders.map(order => (
                <div key={order.id} className="bg-white/50 border border-white p-3 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{order.customer_projects?.project_name}</p>
                    <p className="text-[10px] text-slate-500">{new Date(order.created_at).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">בטיפול ראמי</span>
                    <ChevronRight size={14} className="text-slate-300"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input ברמה הכי גבוהה */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-200">
        <div className="max-w-md mx-auto relative flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-3xl flex items-center px-4 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 transition-all shadow-inner">
            <Package size={18} className="text-slate-400 mr-1"/>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="בוס, מה להזמין?"
              className="flex-1 bg-transparent border-none outline-none p-3 text-sm font-bold text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white p-4 rounded-full shadow-lg transition-all active:scale-90 flex-shrink-0"
          >
            <Send size={20} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
