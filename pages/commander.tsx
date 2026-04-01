'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { processCommanderCommand } from '../lib/ai-commander-core';
import { Send, Cpu, MessageSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderBoard from '../components/OrderBoard';

// הקפדה על export default כדי לפתור את שגיאת ה-Vercel
export default function CommanderPage() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // אפקט כתיבה מילה אחרי מילה (ממשק AI מתקדם)
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
    }, 70); 
  };

  const handleCommand = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    setAiResponse('');

    try {
      // הפעלת המוח (הזרקה ל-orders / container_management / transfers)
      const response = await processCommanderCommand(currentInput, 'ראמי מסארווה');
      
      if (response && response.msg) {
        typeWriter(response.msg);
      } else {
        typeWriter("בוס, המוח לא החזיר תשובה. בדוק חיבור ל-Database.");
      }
    } catch (err) {
      typeWriter("שגיאה קריטית בעיבוד הפקודה.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] bg-[#F8F9FA] flex overflow-hidden font-sans antialiased" dir="rtl">
        <Head>
          <title>SABAN OS | COMMANDER</title>
        </Head>

        <main className="flex-1 flex flex-col lg:flex-row h-full">
          
          {/* צד ימין: צ'אט המפקד (AI Console) */}
          <section className="w-full lg:w-[420px] border-l border-slate-200 bg-white flex flex-col shadow-2xl z-40">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2 italic font-black tracking-tighter">
                <Cpu className="text-emerald-400" size={20} />
                COMMANDER AI
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              <AnimatePresence>
                {aiResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-slate-900 text-emerald-400 p-5 rounded-[2rem] rounded-tr-none shadow-xl font-bold text-sm leading-relaxed border-r-4 border-emerald-500"
                  >
                    <div className="flex items-center gap-2 mb-2 opacity-50 text-[9px] uppercase font-black"><MessageSquare size={12}/> AI Logic</div>
                    {aiResponse}
                  </motion.div>
                )}
                {isTyping && (
                  <div className="flex gap-2 p-4 justify-center">
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
                  placeholder="פקודה למפקד (הזרקה חופשית)..."
                  className="w-full bg-slate-100 p-5 rounded-[1.5rem] border-none font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                />
                <button onClick={handleCommand} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-emerald-400 rounded-xl shadow-lg active:scale-90 transition-all">
                  <Send size={20} className="rotate-180" />
                </button>
              </div>
            </div>
          </section>

          {/* צד שמאל: לוח סידור עבודה חי */}
          <section className="flex-1 bg-[#F8F9FA] p-6 lg:p-10 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">SABAN <span className="text-emerald-500">OS</span></h1>
                <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-widest">לוח בקרה לוגיסטי - סידור עבודה</p>
              </header>

              <OrderBoard />
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
