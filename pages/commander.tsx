'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
// ייבוא המוח של המפקד - וודא שהקובץ קיים בנתיב הזה
import { processCommanderCommand } from '../lib/ai-commander-core';
import { 
  Send, Zap, Package, Truck, Box, 
  Cpu, MessageSquare, LayoutDashboard, Settings, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderBoard from '../components/OrderBoard';

export default function CommanderPro() {
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'warehouse' | 'containers'>('all');

  // אפקט כתיבה מילה אחרי מילה
  const typeWriter = (text: string) => {
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
    }, 80); 
  };

  const handleCommand = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    setAiResponse('');

    try {
      // הפעלת לוגיקת המוח
      const response = await processCommanderCommand(currentInput, 'ראמי מסארווה');
      
      if (response && response.msg) {
        typeWriter(response.msg);
      } else {
        typeWriter("בוס, המוח לא החזיר תשובה תקינה.");
      }
    } catch (err) {
      console.error(err);
      typeWriter("שגיאה בתקשורת עם המוח. בדוק לוגים.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] bg-[#F8F9FA] flex overflow-hidden font-sans antialiased" dir="rtl">
        <Head>
          <title>SABAN OS | COMMAND CENTER</title>
          <meta name="mobile-web-app-capable" content="yes" />
        </Head>

        {/* תפריט המבורגר צדי */}
        <nav className="w-20 lg:w-24 bg-slate-900 flex flex-col items-center py-8 gap-8 border-l border-slate-800 z-50">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer">
            <Cpu className="text-white" size={24} />
          </div>
          <div className="flex flex-col gap-6">
            <button onClick={() => setActiveTab('all')} className={`p-3 rounded-2xl transition-all ${activeTab === 'all' ? 'bg-white/10 text-emerald-400' : 'text-slate-500 hover:text-white'}`}><LayoutDashboard size={24} /></button>
            <button onClick={() => setActiveTab('warehouse')} className={`p-3 rounded-2xl transition-all ${activeTab === 'warehouse' ? 'bg-white/10 text-emerald-400' : 'text-slate-500 hover:text-white'}`}><Package size={24} /></button>
            <button onClick={() => setActiveTab('containers')} className={`p-3 rounded-2xl transition-all ${activeTab === 'containers' ? 'bg-white/10 text-emerald-400' : 'text-slate-500 hover:text-white'}`}><Box size={24} /></button>
          </div>
          <div className="mt-auto">
            <Settings className="text-slate-600 hover:text-white cursor-pointer" />
          </div>
        </nav>

        {/* חדר בקרה מרכזי */}
        <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
          
          {/* צ'אט מפקד (AI Commander) */}
          <section className="w-full lg:w-[450px] border-l border-slate-200 bg-white flex flex-col shadow-2xl z-40">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-black text-slate-900 italic text-lg uppercase tracking-tighter">AI Commander</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-emerald-600 uppercase">Live Hub</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              <AnimatePresence>
                {aiResponse && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="bg-slate-900 text-emerald-400 p-6 rounded-[2.5rem] rounded-tr-none shadow-2xl font-bold text-sm leading-relaxed border-r-4 border-emerald-500 relative"
                  >
                    <div className="flex items-center gap-2 mb-3 opacity-50 text-[9px] uppercase font-black tracking-[0.2em]"><MessageSquare size={14}/> Logic Trace</div>
                    {aiResponse}
                    <div className="absolute -bottom-2 -left-2 bg-emerald-500 text-white p-1 rounded-lg"><Zap size={12} /></div>
                  </motion.div>
                )}
                {isTyping && (
                  <div className="flex gap-2 p-4 justify-center">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
              <div className="relative group">
                <input 
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                  placeholder="פקודה חופשית (למשל: הובלה לחכמת...)"
                  className="w-full bg-slate-100 p-6 pr-14 rounded-[2rem] border-none font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner placeholder:text-slate-400"
                />
                <button onClick={handleCommand} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-slate-900 text-emerald-400 rounded-2xl shadow-xl active:scale-90 transition-all">
                  <Send size={22} className="rotate-180" />
                </button>
              </div>
            </div>
          </section>

          {/* לוח סידור ויזואלי */}
          <section className="flex-1 bg-[#F8F9FA] p-6 lg:p-10 overflow-y-auto scrollbar-hide relative">
            <div className="max-w-7xl mx-auto">
              <header className="flex justify-between items-end mb-12">
                <div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">SABAN <span className="text-emerald-500 underline decoration-4 underline-offset-8">OS</span></h1>
                  <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-[0.4em]">Integrated Logistics Control Center</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Active Sync</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xl font-black text-slate-900 italic uppercase">Connected</span>
                      </div>
                   </div>
                </div>
              </header>

              {/* לוח הזמנות חכמות */}
              <OrderBoard />
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
