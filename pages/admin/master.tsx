'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, db, app } from '../../lib/firebase';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, BrainCircuit, Zap, ShieldCheck } from 'lucide-react';

export default function SabanMasterCore() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // מלשינון אגרסיבי - רץ מיד
  useEffect(() => {
    console.log("🚀 Saban Master Core: Initializing...");
    setMounted(true);

    const checkInteractions = () => {
      if (typeof window === 'undefined') return;
      
      console.log("🔍 בודק חסימות מסך...");
      const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      const bottomEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 60);
      
      console.log("אלמנט במרכז:", centerEl?.tagName, centerEl?.className);
      console.log("אלמנט מעל שדה הטקסט:", bottomEl?.tagName, bottomEl?.className);

      // אם יש אלמנט שחוסם את הכל, נכריח אותו להיות שקוף למגע
      if (centerEl && !centerEl.contains(document.querySelector('.master-input'))) {
        console.warn("⚠️ חוסם פוטנציאלי זוהה, משחרר נעילה...");
        (centerEl as HTMLElement).style.pointerEvents = 'none';
      }
    };

    const timer = setTimeout(checkInteractions, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!database) return;
    const historyRef = query(ref(database, 'private_brain/history'), limitToLast(20));
    const unsub = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      }
    });
    return () => unsub();
  }, []);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📩 ניסיון שליחת פקודה:", input);
    
    if (!input.trim() || !database || !db) {
      console.error("❌ חסר חיבור למסד נתונים או קלט ריק");
      return;
    }

    try {
      const historyRef = ref(database, 'private_brain/history');
      await push(historyRef, { text: input, sender: 'user', timestamp: Date.now() });
      
      if (input.includes('הוסף הזמנה')) {
        await addDoc(collection(db, 'orders'), {
          name: 'פקודה מהמרכז',
          project_address: 'טייבה',
          status: 'pending',
          created_at: serverTimestamp()
        });
      }
      setInput('');
    } catch (err) {
      console.error("❌ שגיאה בביצוע פקודה:", err);
    }
  };

  if (!mounted) return <div className="bg-black h-screen text-white p-10 font-black">טוען ליבה...</div>;

  return (
    <div className="fixed inset-0 bg-[#020617] text-white flex flex-col overflow-hidden" style={{ zIndex: 1 }}>
      <Head>
        <title>SABAN MASTER CORE</title>
      </Head>

      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center px-8 bg-[#0B1120] shrink-0 relative z-50">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-blue-500 animate-pulse" />
          <h1 className="font-black italic tracking-tighter">SABAN MASTER CORE</h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#020617] relative z-10 pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`p-4 rounded-2xl font-bold max-w-[80%] ${msg.sender === 'user' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Box - מבנה הכי פשוט למניעת נעילה */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-md border-t border-white/10" style={{ zIndex: 9999 }}>
        <form onSubmit={handleCommand} className="max-w-4xl mx-auto flex gap-4 pointer-events-auto">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="בוס, הקלד כאן פקודה..."
            className="master-input flex-1 bg-white/5 border border-white/20 p-5 rounded-xl text-xl font-black text-white outline-none focus:border-blue-500"
            style={{ pointerEvents: 'auto' }}
          />
          <button 
            type="submit"
            className="bg-blue-600 px-8 py-5 rounded-xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            style={{ pointerEvents: 'auto' }}
          >
            שלח
          </button>
        </form>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}</style>
    </div>
  );
}
