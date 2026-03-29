'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { 
  Send, Bot, User, Zap, Settings, Moon, Sun, Menu, 
  ShieldCheck, BrainCircuit, Sparkles, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanPersonalAI() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // הגנה קריטית ל-TypeScript ול-Build של Vercel
    if (!database) return;

    try {
      const aiChatRef = query(ref(database, 'private_brain/history'), limitToLast(50));
      const unsub = onValue(aiChatRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
        }
      });

      return () => unsub();
    } catch (error) {
      console.error("Firebase AI Chat Error:", error);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !database) return;

    const newMessage = {
      text: input,
      sender: 'user',
      timestamp: Date.now()
    };

    const historyRef = ref(database, 'private_brain/history');
    await push(historyRef, newMessage);
    setInput('');
    setIsTyping(true);

    // סימולציית תגובת AI (כאן יחובר Gemini בהמשך)
    setTimeout(async () => {
      await push(historyRef, {
        text: "בוס, אני מעבד את הבקשה שלך. תן לי רגע לבדוק בנתונים של סבן 94...",
        sender: 'ai',
        timestamp: Date.now()
      });
      setIsTyping(false);
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN AI | המוח האישי</title>
      </Head>

      {/* Sidebar - AI Navigation */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col p-8 z-30 shadow-sm">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
            <BrainCircuit size={24} className="text-white"/>
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">Saban <span className="text-blue-600">AI</span></h1>
        </div>

        <div className="flex-1 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">כלים חכמים</p>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-blue-50 text-blue-600 font-black transition-all">
            <Sparkles size={20}/> עוזר אישי
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all">
            <ShieldCheck size={20}/> ניהול זיכרון
          </button>
        </div>

        <div className="mt-auto p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
            <p className="text-xs font-black text-slate-500 uppercase">מערכת פעילה</p>
          </div>
          <p className="text-sm font-bold">המוח של רמי מסונכרן</p>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col relative bg-white">
        <header className="h-20 px-10 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <Bot size={20}/>
            </div>
            <div>
              <h3 className="font-black text-lg leading-none">העוזר האישי של סבן</h3>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mt-1">מחובר ל-Saban Data</p>
            </div>
          </div>
          <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
            <Settings size={20}/>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[70%] p-5 rounded-[2rem] text-sm font-bold shadow-sm ${
                msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-end italic text-slate-400 text-xs font-bold animate-pulse">
              ה-AI חושב על פתרון...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <footer className="p-8 bg-white">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="בוס, מה תרצה לבצע בסידור היום?" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-5 pr-8 pl-20 rounded-[2rem] font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
            />
            <button 
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl"
            >
              <Send size={20}/>
            </button>
          </form>
          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest mt-4">
            Saban OS v2.0 - Powered by Premium Intelligence
          </p>
        </footer>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
