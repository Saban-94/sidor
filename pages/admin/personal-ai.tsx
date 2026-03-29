'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, db } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Send, Bot, Zap, Sparkles, BrainCircuit, ShieldCheck, 
  Terminal, Volume2, Command
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

    // משיכת היסטוריית פקודות מהמוח
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

  // פונקציית הליבה: ביצוע פקודה חכמה (הוסף הזמנה)
  const executeBrainCommand = async (text: string) => {
    if (!db || !database) return;

    setIsProcessing(true);
    
    try {
      // 1. רישום הפקודה ב-RTDB
      const historyRef = ref(database, 'private_brain/history');
      await push(historyRef, { text, sender: 'user', timestamp: Date.now() });

      // 2. פנייה ל-AI Logic (שמנתח אם זו הזמנה, עדכון נהג או שאילתה)
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, context: 'saban_94_logistics' })
      });

      const result = await response.json();

      // 3. אם זו פקודת "הוסף הזמנה" - ביצוע הזרקה ישירה ל-Firestore
      if (text.includes('הוסף הזמנה') || result.action === 'CREATE_ORDER') {
        const orderData = result.data || {
          name: 'לקוח מהמוח',
          project_address: 'זיהוי כתובת אוטומטי',
          status: 'pending'
        };

        await addDoc(collection(db, 'orders'), {
          ...orderData,
          created_at: serverTimestamp(),
          source: 'AI_ASSISTANT'
        });

        // השמעת אישור קולי
        playSuccessTone();

        await push(historyRef, {
          text: `בוס, הפקודה בוצעה. הזמנה חדשה הוזרקה ללוח הנהגים בזמן אמת.`,
          sender: 'ai',
          timestamp: Date.now(),
          actionLink: '/admin/dashboard'
        });
      } else {
        // תשובה כללית של העוזר
        await push(historyRef, {
          text: result.reply || "הבנתי, בוס. אני מעבד את הנתונים.",
          sender: 'ai',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error("Brain Execution Error:", error);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  const playSuccessTone = () => {
    const audio = new Audio('/order-notification.mp3');
    audio.play().catch(() => {});
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN BRAIN | המוח המבצע</title>
      </Head>

      {/* Side HUD */}
      <aside className="w-96 bg-[#0B1120] border-l border-white/5 flex flex-col p-10 z-30 shadow-2xl">
        <div className="flex items-center gap-4 mb-16">
          <div className="bg-blue-600 p-4 rounded-[2rem] shadow-[0_0_30px_rgba(37,99,235,0.4)] animate-pulse">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Saban <span className="text-blue-500">Brain</span></h1>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] mt-2">EXECUTOR CORE V2</p>
          </div>
        </div>

        <div className="space-y-6">
          <HUDItem icon={<Zap className="text-yellow-400"/>} label="מהירות תגובה" value="0.4ms" />
          <HUDItem icon={<ShieldCheck className="text-emerald-400"/>} label="סטטוס אבטחה" value="מוצפן" />
          <HUDItem icon={<Command className="text-blue-400"/>} label="פקודות פעילות" value="12" />
        </div>

        <div className="mt-auto p-8 bg-blue-600/5 rounded-[3rem] border border-blue-500/20 text-center">
          <p className="text-xs font-black text-blue-400 uppercase mb-3">מחובר כעת</p>
          <p className="text-xl font-black italic">ראמי סבן</p>
        </div>
      </aside>

      {/* Main Terminal Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <header className="h-24 px-12 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            <h3 className="font-black text-lg tracking-tight uppercase">ממשק פקודות ישיר</h3>
          </div>
          <div className="flex gap-4">
            <button className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
              <Volume2 size={20}/>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar relative z-10">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[60%] p-6 rounded-[2.5rem] text-lg font-black shadow-2xl ${
                  msg.sender === 'user' 
                  ? 'bg-white text-slate-900 rounded-tr-none' 
                  : 'bg-blue-600 text-white rounded-tl-none border border-blue-400/30'
                }`}>
                  {msg.text}
                  {msg.actionLink && (
                    <button className="mt-4 block w-full py-3 bg-black/20 rounded-xl text-xs uppercase tracking-widest hover:bg-black/40 transition-all">
                      פתח לוח בקרה
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="flex justify-end items-center gap-3 text-blue-400 font-black italic animate-pulse">
              <Terminal size={16} /> המוח מעבד פקודה...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input HUD */}
        <footer className="p-12">
          <form 
            onSubmit={(e) => { e.preventDefault(); executeBrainCommand(input); }} 
            className="max-w-5xl mx-auto relative group"
          >
            <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="בוס, תן לי פקודה (למשל: הוסף הזמנה למשה בטייבה)..." 
              className="w-full bg-[#0B1120] border-2 border-white/5 p-8 pr-10 pl-24 rounded-[3rem] text-xl font-black outline-none focus:border-blue-600 transition-all relative z-10"
            />
            <button 
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-6 rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl z-20"
            >
              <Send size={24}/>
            </button>
          </form>
        </footer>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function HUDItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/5 rounded-[2rem] border border-white/5">
      <div className="flex items-center gap-4">
        {icon}
        <p className="text-xs font-black text-slate-500 uppercase tracking-tighter">{label}</p>
      </div>
      <p className="font-black text-sm">{value}</p>
    </div>
  );
}
