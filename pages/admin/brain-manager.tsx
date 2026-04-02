'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Brain, Database, Smartphone, RefreshCcw, LayoutGrid } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BrainManager() {
  const [activeTab, setActiveTab] = useState<'inject' | 'simulator'>('inject');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [simMessages, setSimMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages]);

  const injectKnowledge = async () => {
    if (!question || !answer) return alert("אחי, תמלא את כל השדות");
    setIsTraining(true);
    const { error } = await supabase.from('ai_training').insert([{ question, answer, category: 'manual' }]);
    setIsTraining(false);
    if (!error) {
      alert("המוח אומן! 🧠");
      setQuestion(''); setAnswer('');
    }
  };

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
      setSimMessages(prev => [...prev, { role: 'ai', content: "שגיאה בחיבור למוח" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+(?:\.jpg|\.png|\.webp|\.jpeg))/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => (
      urlRegex.test(part) ? 
      <img key={i} src={part} alt="media" className="max-w-full rounded-lg my-2 border border-white/10" /> : 
      <span key={i}>{part}</span>
    ));
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] font-sans flex flex-col" dir="rtl">
      
      {/* Header & Tabs Selection */}
      <div className="p-4 bg-[#111b21] border-b border-white/5 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="text-emerald-500" size={24} />
            <h1 className="text-lg font-black uppercase tracking-tighter italic">Brain Control</h1>
          </div>
          <div className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">V 2.0</div>
        </div>

        <div className="flex p-1 bg-[#202c33] rounded-xl">
          <button 
            onClick={() => setActiveTab('inject')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inject' ? 'bg-emerald-500 text-[#0b141a]' : 'text-[#8696a0]'}`}
          >
            <Database size={16} /> הזרקת ידע
          </button>
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'simulator' ? 'bg-emerald-500 text-[#0b141a]' : 'text-[#8696a0]'}`}
          >
            <Smartphone size={16} /> סימולטור
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20 p-4">
        
        {/* Tab 1: Inject Knowledge */}
        {activeTab === 'inject' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-5 border border-white/5 shadow-xl">
              <label className="text-xs font-bold text-emerald-400 mb-2 block uppercase tracking-widest">מילת מפתח (שאלה)</label>
              <input 
                value={question} 
                onChange={e => setQuestion(e.target.value)} 
                placeholder="למשל: מייל ראמי" 
                className="w-full p-4 bg-[#202c33] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 mb-4 font-bold"
              />

              <label className="text-xs font-bold text-emerald-400 mb-2 block uppercase tracking-widest">תשובת המוח</label>
              <textarea 
                value={answer} 
                onChange={e => setAnswer(e.target.value)} 
                rows={6} 
                placeholder="הכנס כאן את התשובה המדויקת..." 
                className="w-full p-4 bg-[#202c33] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
              />

              <button 
                onClick={injectKnowledge} 
                disabled={isTraining}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-[#0b141a] rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2"
              >
                {isTraining ? <RefreshCcw className="animate-spin" /> : <Database size={20} />}
                {isTraining ? 'מעדכן DB...' : 'הזרק למוח'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Simulator */}
        {activeTab === 'simulator' && (
          <div className="max-w-[400px] mx-auto h-[70vh] flex flex-col bg-[#111b21] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="bg-[#202c33] p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-[#111b21] font-bold text-xs">S</div>
              <div className="text-xs font-bold uppercase tracking-tighter">Saban AI Simulator</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a]">
              {simMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${m.role === 'user' ? 'bg-[#202c33] rounded-tr-none' : 'bg-[#005c4b] rounded-tl-none'}`}>
                    {renderMessage(m.content)}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-emerald-500 text-[10px] animate-pulse">המוח מקליד...</div>}
              <div ref={scrollRef} />
            </div>

            <div className="p-3 bg-[#111b21] border-t border-white/5 flex gap-2">
              <input 
                value={simInput} 
                onChange={e => setSimInput(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && testInSimulator()}
                placeholder="כתוב משהו..." 
                className="flex-1 bg-[#2a3942] p-3 rounded-xl text-xs outline-none" 
              />
              <button onClick={testInSimulator} className="bg-emerald-500 p-3 rounded-xl text-[#111b21] active:scale-90 transition-all">
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Label Overlay */}
      <div className="fixed bottom-0 left-0 right-0 p-2 text-center text-[10px] text-[#8696a0] bg-[#0b141a]/90 backdrop-blur-md">
        © 2026 SABAN OS | BRAIN CONTROL SYSTEM
      </div>
    </div>
  );
}
