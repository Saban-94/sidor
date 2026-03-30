'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Search, PlusCircle, MessageSquare, 
  Database, Lightbulb, Trash2, Save, X, Bot, Zap, 
  Wifi, BatteryCharging, Mic, Plus, Send, Menu, Star, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanMobileKnowledgeHub() {
  const [activeView, setActiveView] = useState<'hub' | 'simulator' | 'add'>('hub');
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [newQA, setNewQA] = useState({ category: 'חומרי בניין', question: '', answer: '' });
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'בוס, אני מחובר לסימולטור (מסלול ד\'). שאל אותי שאלה מהמאגר!' }
  ]);
  const [input, setInput] = useState('');
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    if (typeof window !== 'undefined') audioRef.current = new Audio('/order-notification.mp3');
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
    if (data) setKnowledge(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newQA.question || !newQA.answer) return;
    setLoading(true);
    const { error } = await supabase.from('knowledge_base').insert([newQA]);
    if (!error) {
      setNewQA({ category: 'חומרי בניין', question: '', answer: '' });
      setActiveView('hub');
      fetchData();
    }
    setLoading(false);
  };

  const calculateQuality = (q: string, a: string) => {
    const qLen = q.split(' ').length;
    const aLen = a.split(' ').length;
    let score = 0;
    if (qLen >= 3) score += 30; // שאלה מפורטת
    if (aLen >= 5) score += 40; // תשובה מפורטת
    if (q.includes('?') || q.includes('מה') || q.includes('איך')) score += 30; // מילות שאלה
    return Math.min(score, 100);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, time: now.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) }]);
    setLoading(true);

    const res = await fetch('/api/unified-brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, senderPhone: 'admin' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply, time: new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) }]);
    setLoading(false);
    if (data.reply.includes('בוצע')) audioRef.current?.play().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN Hub | Mobile Elite</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>

      {/* תפריט תחתון קבוע (NavBar) - חוויית אפליקציה */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#1E293B]/90 backdrop-blur-xl border-t border-white/10 z-[100] flex items-center justify-around px-6">
        {[
          { id: 'hub', icon: BookOpen, label: 'מאגר ידע' },
          { id: 'simulator', icon: Bot, label: 'סימולטור ד\'' },
          { id: 'add', icon: PlusCircle, label: 'הוסף נוהל' },
        ].map((btn) => (
          <button 
            key={btn.id} 
            onClick={() => setActiveView(btn.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeView === btn.id ? 'text-emerald-400 scale-110' : 'text-slate-400'}`}
          >
            <btn.icon size={24} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{btn.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 flex flex-col relative overflow-hidden pb-24">
        <AnimatePresence mode="wait">
          
          {/* דף 1: מאגר הידע (Knowledge Hub) - דף מלא */}
          {activeView === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 h-full overflow-y-auto space-y-8 scrollbar-hide">
              <header className="flex justify-between items-center bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg text-slate-900 shadow-lg shadow-emerald-500/20"><BookOpen size={20}/></div>
                  <h1 className="text-3xl font-black italic tracking-tighter uppercase">Knowledge Hub</h1>
                </div>
              </header>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חפש נוהל או שאלה..." 
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-6 font-bold outline-none focus:bg-white/10 focus:border-emerald-500 transition-all"
              />
              {knowledge.filter(k => k.question.includes(searchTerm)).map(item => {
                const quality = calculateQuality(item.question, item.answer);
                return (
                  <div key={item.id} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] space-y-4">
                    <div className="flex justify-between items-center">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${item.category === 'מכולות' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{item.category}</span>
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-400"><Star size={12}/> {quality}% איכות</div>
                    </div>
                    <h3 className="text-2xl font-black leading-snug tracking-tighter">{item.question}</h3>
                    <p className="text-slate-400 font-bold leading-relaxed italic border-r-4 border-emerald-500 pr-4">"{item.answer}"</p>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* דף 2: סימולטור אייפון (במרכז דף מלא) */}
          {activeView === 'simulator' && (
            <motion.div key="simulator" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 flex-1 flex flex-col items-center justify-center bg-[#0F172A]">
               <h2 className="text-3xl font-black italic tracking-tighter mb-8 uppercase text-emerald-500">iPhone 15 Pro Simulator</h2>
               <div className="relative w-[340px] h-[720px] bg-slate-950 rounded-[50px] border-[12px] border-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden scale-90 md:scale-100">
                  {/* Dynamic Island */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center px-3"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /></div>
                  {/* iPhone Status Bar */}
                  <header className="h-12 flex items-center justify-between px-8 pt-1 text-white font-mono text-xs z-40 relative"><span>{now.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span><div className="flex items-center gap-1.5"><Wifi size={14}/><BatteryCharging size={14} className="text-emerald-400"/></div></header>
                  {/* WhatsApp UI */}
                  <div className="flex-1 flex flex-col h-[calc(100%-48px)] bg-[#E4DED5] overflow-hidden" dir="rtl">
                     <header className="h-14 bg-[#F0F2F5] border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-30 relative"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-emerald-400"><Bot size={18}/></div><h2 className="font-black text-base text-slate-900 leading-tight">Saban Brain 🧠</h2></div></header>
                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://i.postimg.cc/mD3Wf6gL/bg-chat.png')] bg-repeat">
                        {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] p-3.5 py-2 rounded-2xl shadow-md relative leading-relaxed ${m.role === 'user' ? 'bg-white text-slate-900 rounded-tr-none' : 'bg-[#D9FDD3] text-slate-900 rounded-tl-none'}`}><p className="text-xs font-bold">{m.content}</p></div></div>
                        ))}
                     </div>
                     <footer className="h-16 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-2 px-3 shrink-0 z-30 relative">
                        <Plus size={20} className="text-slate-500"/>
                        <form onSubmit={handleChat} className="flex-1 relative"><input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל שאלה מהמאגר..." className="w-full bg-white border border-slate-200 rounded-full py-3 px-5 text-xs font-bold text-slate-900 outline-none" /><button type="submit" className="absolute left-2 top-1.5 bg-emerald-500 text-slate-900 w-9 h-9 rounded-full flex items-center justify-center active:scale-90"><Send size={16} className="rotate-180"/></button></form>
                        <Mic size={20} className="text-slate-500"/>
                     </footer>
                  </div>
               </div>
            </motion.div>
          )}

          {/* דף 3: הוספת נוהל חדש (בנייה) - דף מלא */}
          {activeView === 'add' && (
            <motion.div key="add" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 h-full overflow-y-auto space-y-8 scrollbar-hide">
              <header className="flex justify-between items-center bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg text-slate-900 shadow-lg shadow-emerald-500/20"><PlusCircle size={20}/></div>
                  <h1 className="text-3xl font-black italic tracking-tighter uppercase">יצירת ידע חדש</h1>
                </div>
              </header>
              <div className="space-y-5 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 mr-4 tracking-widest">מחלקה</label>
                 <select value={newQA.category} onChange={(e) => setNewQA({...newQA, category: e.target.value})} className="w-full p-5 rounded-2xl font-bold bg-white/5 border border-white/10 outline-none"><option value="חומרי בניין">חומרי בניין</option><option value="מכולות">מכולות</option></select></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 mr-4 tracking-widest">השאלה / הטריגר</label>
                 <textarea value={newQA.question} onChange={(e) => setNewQA({...newQA, question: e.target.value})} placeholder="למשל: מה הנוהל להעברה בין סניפים?" rows={3} className="w-full p-5 rounded-2xl font-bold bg-white/5 border border-white/10 outline-none resize-none"></textarea></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 mr-4 tracking-widest">התשובה המקצועית</label>
                 <textarea value={newQA.answer} onChange={(e) => setNewQA({...newQA, answer: e.target.value})} placeholder="כתוב את התשובה שה-AI צריך לספק..." rows={5} className="w-full p-5 rounded-2xl font-bold bg-white/5 border border-white/10 outline-none resize-none"></textarea></div>
                 
                 {/* מדד איכות */}
                 <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                    <span>מדד איכות המידע</span>
                    <span className={`font-mono text-base ${calculateQuality(newQA.question, newQA.answer) > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{calculateQuality(newQA.question, newQA.answer)}%</span>
                 </div>
                 
                 <button onClick={handleSave} disabled={loading} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
                    {loading ? 'מזריק ידע...' : <><Save size={20}/> הזרק למאגר</>}
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
