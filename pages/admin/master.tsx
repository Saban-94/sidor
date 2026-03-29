'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, db } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, BrainCircuit, Zap, ShieldCheck, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanBrainMaster() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log("--- בדיקת חסימות ממשק (Saban Master Debug) ---");
        // שימוש ב-Type Casting כדי למנוע שגיאת Build
        const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 50) as HTMLElement;
        
        if (el) {
          console.log("האלמנט שנמצא כרגע מעל ה-Input הוא:", el.tagName, el.className);
          
          if (!el.classList.contains('input-core')) {
            console.warn("⚠️ אזהרה: אלמנט חוסם זוהה!");
            el.style.border = "4px solid red"; 
            el.style.pointerEvents = "none"; // משחרר את החסימה בזמן אמת
          }
        }
      }, 3000);
    }

    if (!database) return;
    const aiChatRef = query(ref(database, 'private_brain/history'), limitToLast(30));
    const unsub = onValue(aiChatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
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
          name: 'הזמנה מהמוח המרכזי',
          project_address: 'טייבה - אתר בנייה',
          status: 'pending',
          created_at: serverTimestamp(),
          source: 'MASTER_CORE'
        });
        await push(historyRef, { text: "בוס, הפקודה בוצעה. הזרקתי הזמנה ללוח.", sender: 'ai', timestamp: Date.now() });
      }
    } catch (error) {
      console.error("Master Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-[#020617] text-white font-sans flex overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN MASTER | CORE</title>
      </Head>

      {/* Sidebar HUD */}
      <aside className="w-80 bg-[#0B1120] border-l border-white/5 flex flex-col p-8 z-[100] relative">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <BrainCircuit size={28} />
          </div>
          <h1 className="text-xl font-black italic">SABAN MASTER</h1>
        </div>
        <div className="space-y-4 flex-1">
          <HUDItem icon={<Zap size={18} className="text-yellow-400"/>} label="סטטוס" value="MASTER ACTIVE" />
          <HUDItem icon={<ShieldCheck size={18} className="text-emerald-400"/>} label="ליבה" value="V2.0.1" />
        </div>
      </aside>

      {/* Main Terminal */}
      <div className="relative flex-1 flex flex-col h-full min-w-0">
        <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 bg-[#020617] z-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <h3 className="font-black text-xs text-slate-500 uppercase">DIRECT COMMAND MODE</h3>
          </div>
        </header>

        {/* Stream */}
        <div className="flex-1 overflow-y-auto p-10 space-y-6 pb-48 z-10 custom-scrollbar">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-6 rounded-[2.5rem] text-base font-black shadow-2xl ${msg.sender === 'user' ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Input HUD - Fixed & Highest Z-Index */}
        <div className="fixed bottom-0 right-80 left-0 p-10 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent z-[9999] pointer-events-none">
          <form onSubmit={executeBrainCommand} className="max-w-4xl mx-auto relative pointer-events-auto">
            <input 
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="בוס, תן פקודה לביצוע..." 
              className="input-core w-full bg-[#0B1120] border-2 border-white/20 p-8 rounded-full text-xl font-black outline-none focus:border-blue-600 text-white shadow-2xl relative z-[10000]"
              autoFocus
            />
            <button 
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-5 rounded-full z-[10001] cursor-pointer shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Send size={28}/>
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}

function HUDItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3">{icon}<p className="text-[10px] font-black text-slate-500 uppercase">{label}</p></div>
      <p className="font-black text-[10px] text-blue-400">{value}</p>
    </div>
  );
}
