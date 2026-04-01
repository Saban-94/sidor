'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Send, Zap, Package, Truck, Box, 
  Search, Bell, Cpu, MessageSquare, 
  ChevronLeft, LayoutDashboard, History, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommanderPro() {
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'warehouse' | 'containers'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
    const sub = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  };

  // אפקט כתיבה מילה אחרי מילה
  const typeWriter = (text: string) => {
    setIsTyping(false);
    setAiResponse('');
    const words = text.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        setAiResponse((prev) => prev + (i === 0 ? '' : ' ') + words[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 150); // מהירות כתיבה
  };

  const handleCommand = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // סימולציה של חשיבה
    setTimeout(() => {
      typeWriter(`קיבלתי בוס. מבצע הזרקה של הזמנה ל-${currentInput.split(' ')[0]} בסידור למחר. הנתונים עודכנו בטבלה.`);
    }, 1500);
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'warehouse') return !o.is_container;
    if (activeTab === 'containers') return o.is_container;
    return true;
  });

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] bg-[#F8F9FA] flex overflow-hidden font-sans antialiased" dir="rtl">
        <Head>
          <title>SABAN OS | CONTROL CENTER</title>
        </Head>

        {/* Side Menu - Hamburger Style */}
        <nav className="w-20 lg:w-24 bg-slate-900 flex flex-col items-center py-8 gap-8 border-l border-slate-800 z-50">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer transition-transform active:scale-90">
            <Cpu className="text-white" size={24} />
          </div>
          <div className="flex flex-col gap-6">
            <button onClick={() => setActiveTab('all')} className={`p-3 rounded-2xl transition-all ${activeTab === 'all' ? 'bg-white/10 text-emerald-400' : 'text-slate-500 hover:text-white'}`}><LayoutDashboard size={24} /></button>
            <button onClick={() => setActiveTab('warehouse')} className={`p-3 rounded-2xl transition-all ${activeTab === 'warehouse' ? 'bg-white/10 text-emerald-400' : 'text-slate-500 hover:text-white'}`}><Package size={24} /></button>
            <button onClick={() => setActiveTab('containers')} className={`p-3 rounded-2xl transition-all ${activeTab === 'containers' ? 'bg-white/10 text-emerald-400' : 'text-slate-500 hover:text-white'}`}><Box size={24} /></button>
          </div>
          <div className="mt-auto flex flex-col gap-6">
            <Settings className="text-slate-600 hover:text-white cursor-pointer" />
          </div>
        </nav>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col lg:flex-row h-full">
          
          {/* Right Section: AI Chat Commander */}
          <section className="w-full lg:w-[400px] border-l border-slate-200 bg-white flex flex-col shadow-xl z-40">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-900 italic text-lg uppercase tracking-tighter">AI Commander</h2>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              <AnimatePresence>
                {aiResponse && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 text-emerald-400 p-5 rounded-[2rem] rounded-tr-none shadow-xl font-bold text-sm leading-relaxed border-r-4 border-emerald-500">
                    <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] uppercase font-black tracking-widest"><MessageSquare size={12}/> AI Logic Output</div>
                    {aiResponse}
                  </motion.div>
                )}
                {isTyping && (
                  <div className="flex gap-2 p-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative group">
                <input 
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                  placeholder="פקודה למפקד..."
                  className="w-full bg-slate-100 p-5 rounded-[1.5rem] border-none font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner placeholder:text-slate-400"
                />
                <button onClick={handleCommand} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-emerald-400 rounded-xl shadow-lg active:scale-90 transition-all">
                  <Send size={20} className="rotate-180" />
                </button>
              </div>
            </div>
          </section>

          {/* Left Section: Visual Dashboard */}
          <section className="flex-1 bg-[#F8F9FA] p-6 lg:p-10 overflow-y-auto scrollbar-hide">
            <div className="max-w-6xl mx-auto">
              <header className="flex justify-between items-end mb-10">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">סידור עבודה <span className="text-emerald-500">LIVE</span></h1>
                  <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">ניהול הזמנות ולוגיסטיקה ח. סבן</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase">הזמנות</span>
                    <span className="text-2xl font-black text-slate-900">{orders.length}</span>
                  </div>
                  <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg shadow-emerald-500/20 text-white flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-black opacity-60 uppercase">מכולות</span>
                    <span className="text-2xl font-black">12</span>
                  </div>
                </div>
              </header>

              {/* Grid System */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredOrders.map((order, i) => (
                    <motion.div 
                      layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      key={order.id}
                      className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 w-2 h-full ${order.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                          {order.is_container ? <Box className="text-slate-400 group-hover:text-emerald-600" /> : <Truck className="text-slate-400 group-hover:text-emerald-600" />}
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {order.status === 'approved' ? 'מאושר' : 'ממתין'}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{order.customer_name || 'לקוח ללא שם'}</h3>
                      <p className="text-slate-400 font-bold text-xs mb-6 flex items-center gap-2"><History size={14} /> הזמנה #{order.order_number || order.id.slice(0,5)}</p>

                      <div className="space-y-3 border-t border-slate-50 pt-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">מחסן:</span>
                          <span className="text-slate-900 font-black italic">{order.warehouse || 'ראשי'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">שעה:</span>
                          <span className="text-slate-900 font-black">{order.delivery_time || '--:--'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">נהג:</span>
                          <span className="text-emerald-600 font-black uppercase">חכמת</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
