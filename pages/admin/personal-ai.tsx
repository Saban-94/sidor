'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, db } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, BrainCircuit, Zap, ShieldCheck, Volume2, Bot } from 'lucide-react';
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
      const historyRef = ref(database, 'private_brain/history');
      await push(historyRef, { text: commandText, sender: 'user', timestamp: Date.now() });

      if (commandText.includes('הוסף הזמנה')) {
        await addDoc(collection(db, 'orders'), {
          name: 'הזמנה מהמוח',
          project_address: 'טייבה - אתר בנייה',
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
        await push(historyRef, {
          text: "הבנתי בוס, אני מעבד את הנתונים מול המערכת של סבן.",
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
    <div className="h-screen bg-[#020617] text-white font-sans flex overflow-hidden selection:bg-blue-500/30" dir="rtl">
      <Head>
        <title>SABAN BRAIN | CORE</title>
      </Head>

      {/* Sidebar HUD */}
      <aside className="w-80 bg-[#0B1120] border-l border-white/5 flex flex-col p-8 z-[100] shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <BrainCircuit size={28} />
          </div>
          <h1 className="text-xl font-black italic uppercase">SABAN BRAIN</h1>
        </div>

        <div className="space-y-4 flex-1">
          <HUDItem icon={<Zap size={18} className="text-yellow-400"/>} label="מהירות" value="0.1ms" />
          <HUDItem icon={<ShieldCheck size={18} className="text-emerald-400"/>} label="אבטחה" value="ביצועי קצה" />
        </div>

        <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/20">
          <p className="text-[10px] font-black text-blue-400 uppercase mb-1 italic">מנהל מערכת</p>
          <p className="text-lg font-black italic uppercase">RAMI SABAN</p>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Header */}
        <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 bg-[#020617] z-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500">SYSTEM INTERFACE ACTIVE</h3>
          </div>
          <Volume2 size={18} className="text-slate-600" />
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar z-10 pb-40">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] p-5 rounded-[2.5rem] text-base font-black shadow-2xl ${
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
            <div className="text-blue-500 font-black italic text-xs animate-pulse flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" /> מעבד נתונים...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* FIXED INPUT HUD - THE FIX */}
        <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent z-[999] pointer-events-none">
          <form 
            onSubmit={executeBrainCommand}
            className="max-w-4xl mx-auto relative flex items-center pointer-events-auto"
          >
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="בוס, הקלד פקודה לביצוע..." 
              className="w-full bg-[#0B1120] border-2 border-white/10 p-7 pr-10 pl-24 rounded-full text-xl font-black outline-none focus:border-blue-600 focus:ring-8 ring-blue-600/5 transition-all text-white shadow-2xl"
              autoFocus
            />
            <button 
              type="submit"
              disabled={isProcessing}
              className="absolute left-4 bg-blue-600 text-white p-5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              <Send size={24}/>
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

function HUDItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-tighter">{label}</p>
      </div>
      <p className="font-black text-[10px] text-blue-400">{value}</p>
    </div>
  );
}
