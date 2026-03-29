'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, db } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Send, Bot, Zap, BrainCircuit, ShieldCheck, 
  Terminal, Volume2, Command, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanBrainCore() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!database) return;

    const aiChatRef = query(ref(database, 'private_brain/history'), limitToLast(30));
    const unsub = onValue(aiChatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const executeBrainCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !db || !database || isProcessing) return;

    const commandText = input;
    setInput('');
    setIsProcessing(true);
    
    try {
      // 1. רישום ב-RTDB
      const historyRef = ref(database, 'private_brain/history');
      await push(historyRef, { text: commandText, sender: 'user', timestamp: Date.now() });

      // 2. בדיקה אם זו פקודת "הוסף הזמנה"
      if (commandText.includes('הוסף הזמנה')) {
        await addDoc(collection(db, 'orders'), {
          name: 'הזמנה מהמוח',
          project_address: 'כתובת זיהוי אוטומטי',
          status: 'pending',
          created_at: serverTimestamp(),
          source: 'BRAIN_COMMAND'
        });

        await push(historyRef, {
          text: "בוס, הפקודה בוצעה. ההזמנה הוזרקה ללוח הנהגים בהצלחה.",
          sender: 'ai',
          timestamp: Date.now()
        });
      } else {
        // תשובה כללית
        await push(historyRef, {
          text: "הבנתי בוס, אני בודק את זה מול המערכת של סבן.",
          sender: 'ai',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error("Brain Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="h-screen bg-[#020617] text-white font-sans flex overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN BRAIN | המוח המבצע</title>
      </Head>

      {/* Sidebar HUD */}
      <aside className="w-80 bg-[#0B1120] border-l border-white/5 flex flex-col p-8 z-20 shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] animate-pulse">
            <BrainCircuit size={28} />
          </div>
          <h1 className="text-xl font-black tracking-tighter italic">SABAN BRAIN</h1>
        </div>

        <div className="space-y-4">
          <HUDItem icon={<Zap size={18} className="text-yellow-400"/>} label="מהירות" value="0.2ms" />
          <HUDItem icon={<ShieldCheck size={18} className="text-emerald-400"/>} label="אבטחה" value="מוצפן" />
        </div>

        <div className="mt-auto p-6 bg-blue-600/5 rounded-3xl border border-blue-500/20">
          <p className="text-[10px] font-black text-blue-400 uppercase mb-1">מנהל</p>
          <p className="text-lg font-black italic">ראמי סבן</p>
        </div>
      </aside>

      {/* Main Terminal Area */}
      <main className="flex-1 flex flex-col relative z-10">
        <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">COMMAND INTERFACE</h3>
          </div>
          <Volume2 size={18} className="text-slate-500" />
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[70%] p-5 rounded-[2rem] text-sm font-black shadow-xl ${
                  msg.sender === 'user' 
                  ? 'bg-white text-slate-900 rounded-tr-none' 
                  : 'bg-blue-600 text-white rounded-tl-none border border-blue-400/30'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="text-blue-400 font-black italic text-xs animate-pulse">
              המוח מעבד נתונים...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Field - FIXED Z-INDEX & ACTION */}
        <div className="p-10 bg-gradient-to-t from-[#020617] to-transparent relative z-50">
          <form 
            onSubmit={executeBrainCommand}
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="בוס, תן לי פקודה..." 
              className="w-full bg-[#0B1120] border-2 border-white/10 p-6 pr-8 pl-20 rounded-full text-lg font-black outline-none focus:border-blue-600 focus:ring-4 ring-blue-600/10 transition-all text-white"
              autoFocus
            />
            <button 
              type="submit"
              disabled={isProcessing}
              className="absolute left-3 bg-blue-600 text-white p-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              <Send size={24}/>
            </button>
          </form>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function HUDItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-[10px] font-black text-slate-500 uppercase italic">{label}</p>
      </div>
      <p className="font-black text-xs">{value}</p>
    </div>
  );
}
