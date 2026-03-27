import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, app } from '../../lib/firebase';
import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { 
  Send, Bot, User, Moon, Sun, Menu, 
  Terminal, Zap, History, Sparkles, Layout, Database, 
  ChevronLeft, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersonalAI() {
  // משתנה קריטי למניעת שגיאת 418
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // הגנה: רק אחרי שהקומפוננטה נטענה בדפדפן נאשר רינדור
  useEffect(() => {
    setMounted(true);
    
    // טעינת היסטוריה
    const aiChatRef = query(ref(database, 'private_brain/history'), limitToLast(50));
    const unsub = onValue(aiChatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // אם אנחנו עדיין בשרת, נחזיר דף ריק/טוען כדי למנוע הבדלי HTML
  if (!mounted) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const userMsg = input;
    setInput('');
    setIsProcessing(true);

    try {
      await push(ref(database, 'private_brain/history'), {
        role: 'user',
        content: userMsg,
        timestamp: Date.now() // שימוש בזמן מקומי עדיף להצגה מהירה
      });

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, state: 'PRIVATE_ASSISTANT', manualInjection: true })
      });
      const result = await response.json();

      await push(ref(database, 'private_brain/history'), {
        role: 'assistant',
        content: result.reply,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans text-right`} dir="rtl">
      <Head><title>SABAN BRAIN | Private AI</title></Head>

      {/* Sidebar & Main UI כאן (הקוד הקודם שלך) */}
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg"><Zap/></div>
                <h1 className="font-black italic">SABAN BRAIN</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun/> : <Moon/>}</button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`p-4 rounded-3xl text-sm ${m.role === 'user' ? 'bg-[#1e293b]' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                {m.content}
                <div className="text-[9px] opacity-30 mt-2">
                   {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleCommand} className="p-6">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#0f172a] border border-white/10 outline-none"
            placeholder="דבר אלי אחי..." 
          />
        </form>
      </main>
    </div>
  );
}
