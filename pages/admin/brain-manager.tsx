'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Brain, Database, Smartphone, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BrainManager() {
  // State לאימון
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('general');
  const [isTraining, setIsTraining] = useState(false);
  
  // State לסימולטור
  const [simMessages, setSimMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages]);

  // הזרקה ל-DB
  const injectKnowledge = async () => {
    if (!question || !answer) return alert("אחי, תמלא שאלה ותשובה");
    setIsTraining(true);
    const { error } = await supabase.from('ai_training').insert([{ question, answer, category }]);
    setIsTraining(false);
    if (!error) {
      alert("המוח אומן בהצלחה! 🧠✨");
      setQuestion(''); setAnswer('');
    }
  };

  // בדיקה בסימולטור (מול ה-API הקיים שלך)
  const testInSimulator = async () => {
    if (!simInput.trim()) return;
    const userMsg = simInput;
    setSimMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSimInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: 'simulator' })
      });
      const data = await res.json();
      setSimMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', content: "שגיאת תקשורת עם המוח" }]);
    } finally {
      setIsTyping(false);
    }
  };

  // פונקציה לעיבוד טקסט והצגת תמונות מלינקים
  const renderMessage = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+(?:\.jpg|\.png|\.webp|\.jpeg))/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => (
      urlRegex.test(part) ? 
      <img key={i} src={part} alt="media" className="max-w-full rounded-lg my-2 border border-white/10 shadow-lg" /> : 
      <span key={i}>{part}</span>
    ));
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] p-4 font-sans dir-rtl" dir="rtl">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        
        {/* צד שמאל: טופס הזרקת ידע */}
        <div className="bg-[#111b21] rounded-3xl p-6 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl"><Brain className="text-emerald-500" /></div>
            <h2 className="text-2xl font-black italic">הזרקת ידע למוח</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-emerald-500 mb-2 block">מילת מפתח / שאלה</label>
              <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="למשל: שעות פעילות" className="w-full p-4 bg-[#202c33] rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold" />
            </div>

            <div>
              <label className="text-xs font-bold text-emerald-500 mb-2 block">תשובת המוח (כולל לינקים לתמונות)</label>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5} placeholder="הכנס את התשובה שהמוח ייתן..." className="w-full p-4 bg-[#202c33] rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" />
            </div>

            <button onClick={injectKnowledge} disabled={isTraining} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-[#0b141a] rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isTraining ? <RefreshCcw className="animate-spin" /> : <Database size={20} />}
              הזרק לזיכרון
            </button>
          </div>
        </div>

        {/* צד ימין: סימולטור מובייל */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[380px] h-[750px] bg-[#111b21] rounded-[3rem] border-[8px] border-[#202c33] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">
            
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#202c33] rounded-b-2xl z-20" />
            
            {/* Header */}
            <div className="bg-[#202c33] p-6 pt-10 flex items-center gap-3 border-b border-white/5">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-black text-[#111b21]">S</div>
              <div>
                <div className="font-bold text-sm">SABAN AI SIMULATOR</div>
                <div className="text-[10px] text-emerald-500 flex items-center gap-1">🟢 מחובר לזיכרון חיה</div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-cover bg-fixed">
              <div className="absolute inset-0 bg-[#0b141a]/80" />
              <div className="relative z-10">
                {simMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} mb-4`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tr-none' : 'bg-[#005c4b] text-white rounded-tl-none'}`}>
                      {renderMessage(m.content)}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-xs text-emerald-500 animate-pulse">המוח מעבד...</div>}
                <div ref={scrollRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-3 bg-[#111b21] border-t border-white/5 relative z-10">
              <div className="flex gap-2">
                <input value={simInput} onChange={e => setSimInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && testInSimulator()} placeholder="בדוק את המוח..." className="flex-1 bg-[#2a3942] p-3 rounded-xl text-sm outline-none" />
                <button onClick={testInSimulator} className="bg-emerald-500 p-3 rounded-xl text-[#111b21] active:scale-90 transition-all"><Send size={18} /></button>
              </div>
            </div>
          </div>
          <div className="mt-4 text-emerald-500/50 text-xs font-bold tracking-widest flex items-center gap-2">
            <Smartphone size={14} /> LIVE PREVIEW MODE
          </div>
        </div>

      </div>
    </div>
  );
}

const RefreshCcw = ({ className }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
