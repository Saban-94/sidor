'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Bot, Send, Trash2, Edit3, PlusCircle, 
  Wifi, BatteryCharging, Plus, X, Save, 
  Search, Star, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// חיבור ל-Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SabanKnowledgeHub() {
  // States
  const [activeView, setActiveView] = useState<'hub' | 'simulator' | 'add'>('hub');
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "בוס, המוח המאוחד מחובר. שאל אותי על סידור, מכולות או נהלים." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQA, setNewQA] = useState({ category: 'חומרי בניין', question: '', answer: '' });
  const [now, setNow] = useState(new Date());

  const scrollRef = useRef<HTMLDivElement>(null);

  // שליפת נתונים מהמאגר
  const fetchKnowledge = async () => {
    const { data } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setKnowledge(data);
  };

  // אפקט ראשוני
  useEffect(() => {
    fetchKnowledge();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // גלילה אוטומטית בצ'אט
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // חישוב איכות תוכן
  const calculateQuality = (q: string, a: string) => {
    if (!q || !a) return 0;
    const score = (q.length > 10 ? 30 : 10) + (a.length > 20 ? 40 : 10) + (q.includes('?') ? 30 : 0);
    return Math.min(score, 100);
  };

  // פונקציות טיפול (Handlers)
  const handleSave = async () => {
    if (!newQA.question || !newQA.answer) return;
    setLoading(true);
    const { error } = await supabase.from('knowledge_base').insert([newQA]);
    if (!error) {
      setNewQA({ category: 'חומרי בניין', question: '', answer: '' });
      setActiveView('hub');
      fetchKnowledge();
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    const { error } = await supabase
      .from('knowledge_base')
      .update({
        category: editingItem.category,
        question: editingItem.question,
        answer: editingItem.answer
      })
      .eq('id', editingItem.id);
    if (!error) {
      setEditingItem(null);
      fetchKnowledge();
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("בוס, למחוק את הנוהל מהמערכת?")) return;
    await supabase.from('knowledge_base').delete().eq('id', id);
    fetchKnowledge();
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "שגיאה בחיבור למוח המרכזי." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN | Knowledge Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>

      {/* Navigation Bar - Bottom Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 z-[100] flex items-center justify-around px-4 pb-safe">
        <button onClick={() => setActiveView('hub')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeView === 'hub' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <BookOpen size={24} /> <span className="text-[10px] font-bold uppercase">מאגר</span>
        </button>
        <button onClick={() => setActiveView('simulator')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeView === 'simulator' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <Bot size={24} /> <span className="text-[10px] font-bold uppercase">המוח</span>
        </button>
        <button onClick={() => setActiveView('add')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeView === 'add' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <PlusCircle size={24} /> <span className="text-[10px] font-bold uppercase">הזרקה</span>
        </button>
      </nav>

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* View: Hub */}
          {activeView === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 h-full overflow-y-auto pb-24 scrollbar-hide space-y-6">
              <header className="flex justify-between items-center py-4">
                <h1 className="text-3xl font-black tracking-tighter italic">KNOWLEDGE HUB</h1>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><BookOpen size={20}/></div>
              </header>

              <div className="relative group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="חפש נוהל או שאלה..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 font-medium outline-none focus:ring-2 ring-emerald-500/50 transition-all"
                />
              </div>

              <div className="space-y-4">
                {knowledge.filter(k => k.question.includes(searchTerm) || k.answer.includes(searchTerm)).map(item => (
                  <div key={item.id} className="bg-slate-800/40 border border-white/5 p-6 rounded-[2.5rem] relative group hover:border-emerald-500/30 transition-all shadow-xl">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wider">{item.category}</span>
                      <div className="flex gap-3 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity">
                         <Edit3 size={16} className="cursor-pointer hover:text-emerald-400" onClick={() => setEditingItem(item)} />
                         <Trash2 size={16} className="cursor-pointer hover:text-red-500" onClick={() => deleteItem(item.id)} />
                      </div>
                    </div>
                    <h3 className="text-lg font-black mb-2 text-slate-100">{item.question}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed border-r-2 border-emerald-500/50 pr-3 italic">{item.answer}</p>
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-amber-500/80 uppercase">
                      <Star size={10} fill="currentColor"/> רמת דיוק: {calculateQuality(item.question, item.answer)}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* View: Simulator (WhatsApp Style) */}
          {activeView === 'simulator' && (
            <motion.div key="sim" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-4 bg-slate-950">
               <div className="relative w-full max-w-[360px] h-[700px] bg-black rounded-[3.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-[110] flex items-center justify-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-2" />
                  </div>
                  
                  {/* iOS Status Bar */}
                  <div className="h-12 flex items-center justify-between px-8 pt-4 text-[11px] font-bold text-white z-50">
                    <span>{now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                    <div className="flex gap-1.5"><Wifi size={14}/><BatteryCharging size={14} className="text-emerald-500"/></div>
                  </div>

                  <div className="flex-1 flex flex-col bg-[#E4DED5] mt-2 overflow-hidden rounded-t-[2.5rem]">
                     <header className="h-16 bg-[#F0F2F5] border-b border-slate-300 flex items-center gap-3 px-5 shadow-sm">
                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-emerald-400 shadow-lg"><Bot size={20}/></div>
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-slate-900">המוח של סבן 🧠</span>
                          <span className="text-[10px] text-emerald-600 font-bold">מחובר לסידור עבודה</span>
                        </div>
                     </header>

                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://i.postimg.cc/mD3Wf6gL/bg-chat.png')] bg-contain">
                        {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-xs font-bold leading-tight ${m.role === 'user' ? 'bg-white text-slate-800 rounded-tr-none' : 'bg-[#D9FDD3] text-slate-900 rounded-tl-none'}`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {loading && (
                          <div className="flex justify-end"><div className="bg-[#D9FDD3] px-4 py-2 rounded-2xl text-[10px] font-black animate-pulse uppercase">חושב...</div></div>
                        )}
                     </div>

                     <footer className="h-20 bg-[#F0F2F5] flex items-center gap-2 px-4 border-t border-slate-300 pb-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><Plus size={24}/></div>
                        <form onSubmit={handleChat} className="flex-1 relative flex items-center">
                          <input 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            placeholder="שאל כל דבר..." 
                            className="w-full bg-white rounded-full py-3 px-5 text-sm font-bold text-slate-900 outline-none shadow-sm border-none"
                          />
                          <button type="submit" className="absolute left-1.5 bg-emerald-500 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                            <Send size={16} className="rotate-180"/>
                          </button>
                        </form>
                     </footer>
                  </div>
               </div>
            </motion.div>
          )}

          {/* View: Add New */}
          {activeView === 'add' && (
            <motion.div key="add" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-6 h-full overflow-y-auto pb-24 space-y-6">
              <header className="text-center py-6">
                <h1 className="text-3xl font-black italic tracking-tighter">INJECT DATA</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">הזרקת מידע למוח הארגוני</p>
              </header>

              <div className="bg-slate-800/40 border border-white/5 p-8 rounded-[3rem] shadow-2xl space-y-5">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase mr-2 text-emerald-500">קטגוריה</label>
                   <select value={newQA.category} onChange={(e) => setNewQA({...newQA, category: e.target.value})} className="w-full p-4 rounded-2xl font-bold bg-slate-900 border-none outline-none text-white appearance-none">
                     <option value="חומרי בניין">חומרי בניין</option>
                     <option value="מכולות">מכולות</option>
                     <option value="כללי/משרד">כללי / משרד</option>
                   </select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase mr-2 text-emerald-500">שאלה / טריגר</label>
                   <textarea value={newQA.question} onChange={(e) => setNewQA({...newQA, question: e.target.value})} placeholder="מה המשתמש ישאל?" rows={2} className="w-full p-4 rounded-2xl font-bold bg-slate-900 border-none outline-none text-white resize-none focus:ring-2 ring-emerald-500/30" />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase mr-2 text-emerald-500">תשובה מקצועית</label>
                   <textarea value={newQA.answer} onChange={(e) => setNewQA({...newQA, answer: e.target.value})} placeholder="מה התשובה המדויקת?" rows={5} className="w-full p-4 rounded-2xl font-bold bg-slate-900 border-none outline-none text-white resize-none focus:ring-2 ring-emerald-500/30" />
                 </div>

                 <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black uppercase text-slate-500">מדד איכות המידע:</span>
                    <span className={`text-sm font-black ${calculateQuality(newQA.question, newQA.answer) > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{calculateQuality(newQA.question, newQA.answer)}%</span>
                 </div>

                 <button onClick={handleSave} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-500/10">
                   <Save size={24}/> הזרק למאגר
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
            <div className="bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 border border-white/10 shadow-2xl space-y-6">
               <div className="flex justify-between items-center border-b border-white/5 pb-4">
                 <h2 className="text-xl font-black italic">עריכת רשומת ידע</h2>
                 <X className="cursor-pointer text-slate-500" onClick={() => setEditingItem(null)} />
               </div>
               <div className="space-y-4">
                  <input value={editingItem.question} onChange={e => setEditingItem({...editingItem, question: e.target.value})} className="w-full p-4 rounded-2xl font-bold bg-white/5 border-none outline-none focus:ring-2 ring-emerald-500/30" />
                  <textarea value={editingItem.answer} onChange={e => setEditingItem({...editingItem, answer: e.target.value})} rows={4} className="w-full p-4 rounded-2xl font-bold bg-white/5 border-none outline-none resize-none focus:ring-2 ring-emerald-500/30" />
               </div>
               <div className="flex gap-3 pt-2">
                 <button onClick={() => setEditingItem(null)} className="flex-1 bg-white/5 py-5 rounded-2xl font-black hover:bg-white/10 transition-colors uppercase text-[12px]">ביטול</button>
                 <button onClick={handleUpdate} className="flex-[2] bg-emerald-500 text-slate-900 py-5 rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">עדכן עכשיו</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}  };

  useEffect(() => {
    fetchKnowledge();
    const t = setInterval(() => setNow(new Date()), 1000);
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/order-notification.mp3');
    }
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const calculateQuality = (q: string, a: string) => {
    if (!q || !a) return 0;
    const qLen = q.trim().split(/\s+/).length;
    const aLen = a.trim().split(/\s+/).length;
    let score = 0;
    if (qLen >= 3) score += 30;
    if (aLen >= 5) score += 40;
    if (/[?]|איך|כמה|מתי/.test(q)) score += 30;
    return Math.min(score, 100);
  };

  const handleSave = async () => {
    if (!newQA.question || !newQA.answer) return;
    setLoading(true);
    const { error } = await supabase.from('knowledge_base').insert([newQA]);
    if (!error) {
      setNewQA({ category: 'חומרי בניין', question: '', answer: '' });
      setActiveView('hub');
      fetchKnowledge();
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    const { error } = await supabase.from('knowledge_base').update({
      category: editingItem.category,
      question: editingItem.question,
      answer: editingItem.answer
    }).eq('id', editingItem.id);
    if (!error) {
      setEditingItem(null);
      fetchKnowledge();
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("בוס, למחוק סופית מהמאגר?")) return;
    await supabase.from('knowledge_base').delete().eq('id', id);
    fetchKnowledge();
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; 
    setInput('');
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: msg, time: timeStr }]);
    setLoading(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply, 
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
      }]);
      if (data.reply.includes('בוצע')) audioRef.current?.play().catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-hidden flex flex-col" dir="rtl">
      <Head>
        <title>SABAN Hub | Knowledge PWA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>

      <main className="flex-1 relative overflow-hidden pb-20">
        <AnimatePresence mode="wait">
          
          {/* דף 1: מאגר השאלות */}
          {activeView === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full overflow-y-auto space-y-6">
              <header className="flex justify-between items-center bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                <h1 className="text-3xl font-black italic uppercase">Knowledge Hub</h1>
                <BookOpen className="text-emerald-500" size={24} />
              </header>
              
              <div className="relative">
                <Search className="absolute right-5 top-5 text-slate-500" size={20} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חפש נוהל..." className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-6 pr-14 font-bold outline-none" />
              </div>

              <div className="grid grid-cols-1 gap-4 pb-10">
                {knowledge.filter(k => k.question.includes(searchTerm) || k.answer.includes(searchTerm)).map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/5 p-8 rounded-[3rem] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase">{item.category}</span>
                      <div className="flex gap-2 text-slate-400">
                         <Edit3 size={18} className="cursor-pointer hover:text-emerald-400" onClick={() => setEditingItem(item)} />
                         <Trash2 size={18} className="cursor-pointer hover:text-red-500" onClick={() => deleteItem(item.id)} />
                      </div>
                    </div>
                    <h3 className="text-xl font-black leading-tight">{item.question}</h3>
                    <p className="text-slate-400 italic border-r-2 border-emerald-500 pr-4">{item.answer}</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-amber-400 pt-2">
                      <Star size={12}/> איכות: {calculateQuality(item.question, item.answer)}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* דף 2: סימולטור אייפון */}
          {activeView === 'simulator' && (
            <motion.div key="sim" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-4 bg-[#0F172A]">
               <div className="relative w-full max-w-[350px] h-[700px] bg-black rounded-[50px] border-[10px] border-slate-800 shadow-2xl overflow-hidden flex flex-col scale-95 md:scale-100">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"/>
                  </div>
                  <div className="h-12 flex items-center justify-between px-8 pt-6 text-[10px] font-bold">
                    <span>{now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                    <div className="flex gap-1.5"><Wifi size={14}/><BatteryCharging size={14} className="text-emerald-500"/></div>
                  </div>
                  <div className="flex-1 flex flex-col bg-[#E4DED5] overflow-hidden mt-4">
                     <header className="h-14 bg-[#F0F2F5] border-b border-slate-200 flex items-center gap-3 px-4">
                        <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-emerald-400"><Bot size={18}/></div>
                        <h2 className="font-black text-sm text-slate-900">Saban Brain 🧠</h2>
                     </header>
                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://i.postimg.cc/mD3Wf6gL/bg-chat.png')]">
                        {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-3 rounded-xl shadow-sm text-xs font-bold ${m.role === 'user' ? 'bg-white text-slate-900 rounded-tr-none' : 'bg-[#D9FDD3] text-slate-900 rounded-tl-none'}`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {loading && <div className="p-2 text-[10px] font-black text-emerald-600 animate-pulse uppercase">מעבד...</div>}
                     </div>
                     <footer className="h-16 bg-[#F0F2F5] flex items-center gap-2 px-3 border-t">
                        <Plus size={20} className="text-slate-500"/>
                        <form onSubmit={handleChat} className="flex-1 relative">
                          <input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל נוהל..." className="w-full bg-white rounded-full py-2 px-4 text-xs font-bold text-slate-900 outline-none" />
                          <button type="submit" className="absolute left-1 top-1 bg-emerald-500 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center active:scale-95"><Send size={12} className="rotate-180"/></button>
                        </form>
                     </footer>
                  </div>
               </div>
            </motion.div>
          )}

          {/* דף 3: הוספת נוהל */}
          {activeView === 'add' && (
            <motion.div key="add" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-6 h-full overflow-y-auto space-y-6">
              <h1 className="text-3xl font-black italic uppercase text-center mt-6">הזרקת ידע חדש</h1>
              <div className="space-y-4 bg-white/5 p-8 rounded-[3rem] border border-white/5">
                 <select value={newQA.category} onChange={(e) => setNewQA({...newQA, category: e.target.value})} className="w-full p-5 rounded-2xl font-bold bg-[#1E293B] border-none outline-none text-white">
                   <option value="חומרי בניין">חומרי בניין</option>
                   <option value="מכולות">מכולות</option>
                 </select>
                 <textarea value={newQA.question} onChange={(e) => setNewQA({...newQA, question: e.target.value})} placeholder="השאלה..." rows={2} className="w-full p-5 rounded-2xl font-bold bg-[#1E293B] border-none outline-none text-white resize-none" />
                 <textarea value={newQA.answer} onChange={(e) => setNewQA({...newQA, answer: e.target.value})} placeholder="התשובה המקצועית..." rows={4} className="w-full p-5 rounded-2xl font-bold bg-[#1E293B] border-none outline-none text-white resize-none" />
                 <div className="flex justify-between items-center text-xs font-black uppercase text-slate-500">
                    <span>מדד איכות</span>
                    <span className={calculateQuality(newQA.question, newQA.answer) > 70 ? 'text-emerald-500' : 'text-amber-500'}>{calculateQuality(newQA.question, newQA.answer)}%</span>
                 </div>
                 <button onClick={handleSave} disabled={loading} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 active:scale-95">
                   <Save size={20}/> הזרק למאגר
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* תפריט תחתון */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#1E293B]/90 backdrop-blur-xl border-t border-white/10 z-[100] flex items-center justify-around px-6">
        <button onClick={() => setActiveView('hub')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'hub' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <BookOpen size={24} /> <span className="text-[10px] font-black uppercase tracking-tighter">מאגר</span>
        </button>
        <button onClick={() => setActiveView('simulator')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'simulator' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <Bot size={24} /> <span className="text-[10px] font-black uppercase tracking-tighter">בדיקה</span>
        </button>
        <button onClick={() => setActiveView('add')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'add' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <PlusCircle size={24} /> <span className="text-[10px] font-black uppercase tracking-tighter">חדש</span>
        </button>
      </nav>
    </div>
  );
}
