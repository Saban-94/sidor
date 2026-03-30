'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Bot, Send, Trash2, Edit3, PlusCircle, 
  Wifi, BatteryCharging, Plus, X, Save, 
  Search, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SabanKnowledgeHub() {
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

  const fetchKnowledge = async () => {
    const { data } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setKnowledge(data);
  };

  useEffect(() => {
    fetchKnowledge();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const calculateQuality = (q: string, a: string) => {
    if (!q || !a) return 0;
    const score = (q.length > 10 ? 30 : 10) + (a.length > 20 ? 40 : 10) + (q.includes('?') ? 30 : 0);
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
    if (!confirm("בוס, למחוק את הנוהל?")) return;
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
      setMessages(prev => [...prev, { role: 'assistant', content: "שגיאה בחיבור למוח." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-[100] flex items-center justify-around px-4">
        <button onClick={() => setActiveView('hub')} className={`flex flex-col items-center gap-1 flex-1 ${activeView === 'hub' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <BookOpen size={24} /> <span className="text-[10px] font-bold uppercase">מאגר</span>
        </button>
        <button onClick={() => setActiveView('simulator')} className={`flex flex-col items-center gap-1 flex-1 ${activeView === 'simulator' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Bot size={24} /> <span className="text-[10px] font-bold uppercase">המוח</span>
        </button>
        <button onClick={() => setActiveView('add')} className={`flex flex-col items-center gap-1 flex-1 ${activeView === 'add' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <PlusCircle size={24} /> <span className="text-[10px] font-bold uppercase">חדש</span>
        </button>
      </nav>

      <main className="flex-1 relative overflow-hidden pb-20">
        <AnimatePresence mode="wait">
          {activeView === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 h-full overflow-y-auto space-y-6">
              <header className="flex justify-between items-center py-4">
                <h1 className="text-2xl font-black italic uppercase">Knowledge Hub</h1>
                <BookOpen className="text-emerald-500" size={24} />
              </header>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חפש נוהל..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 outline-none focus:ring-1 ring-emerald-500" />
              </div>
              <div className="space-y-4">
                {knowledge.filter(k => k.question.includes(searchTerm) || k.answer.includes(searchTerm)).map(item => (
                  <div key={item.id} className="bg-slate-800/40 border border-white/5 p-6 rounded-[2rem] space-y-3 shadow-lg">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase">{item.category}</span>
                      <div className="flex gap-3 text-slate-500">
                         <Edit3 size={16} className="cursor-pointer" onClick={() => setEditingItem(item)} />
                         <Trash2 size={16} className="cursor-pointer" onClick={() => deleteItem(item.id)} />
                      </div>
                    </div>
                    <h3 className="text-lg font-black">{item.question}</h3>
                    <p className="text-slate-400 text-sm italic border-r-2 border-emerald-500 pr-3">{item.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'simulator' && (
            <motion.div key="sim" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-4">
               <div className="relative w-full max-w-[350px] h-[650px] bg-black rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                  <div className="h-10 flex items-center justify-between px-8 pt-6 text-[10px] font-bold">
                    <span>{now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                    <div className="flex gap-1.5"><Wifi size={12}/><BatteryCharging size={12} className="text-emerald-500"/></div>
                  </div>
                  <div className="flex-1 flex flex-col bg-[#E4DED5] mt-4 overflow-hidden rounded-t-3xl">
                     <header className="h-14 bg-[#F0F2F5] border-b flex items-center gap-3 px-4">
                        <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-emerald-400"><Bot size={18}/></div>
                        <span className="font-black text-sm text-slate-900">המוח של סבן 🧠</span>
                     </header>
                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-repeat" style={{backgroundImage: "url('https://i.postimg.cc/mD3Wf6gL/bg-chat.png')", backgroundSize: 'contain'}}>
                        {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-3 rounded-xl text-xs font-bold ${m.role === 'user' ? 'bg-white text-slate-900' : 'bg-[#D9FDD3] text-slate-900'}`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {loading && <div className="text-[10px] font-black text-emerald-600 animate-pulse uppercase">מעבד...</div>}
                     </div>
                     <footer className="h-16 bg-[#F0F2F5] flex items-center gap-2 px-3 border-t">
                        <Plus size={20} className="text-slate-500"/>
                        <form onSubmit={handleChat} className="flex-1 relative flex">
                          <input value={input} onChange={e => setInput(e.target.value)} placeholder="שאל שאלה..." className="w-full bg-white rounded-full py-2 px-4 text-xs font-bold text-slate-900 outline-none" />
                          <button type="submit" className="absolute left-1 top-1 bg-emerald-500 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center"><Send size={12} className="rotate-180"/></button>
                        </form>
                     </footer>
                  </div>
               </div>
            </motion.div>
          )}

          {activeView === 'add' && (
            <motion.div key="add" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-6 h-full space-y-6">
              <h1 className="text-2xl font-black italic uppercase text-center mt-4">הזרקת ידע</h1>
              <div className="bg-slate-800/40 border border-white/5 p-8 rounded-[2.5rem] shadow-xl space-y-4">
                 <select value={newQA.category} onChange={(e) => setNewQA({...newQA, category: e.target.value})} className="w-full p-4 rounded-xl font-bold bg-slate-900 border-none text-white outline-none">
                   <option value="חומרי בניין">חומרי בניין</option>
                   <option value="מכולות">מכולות</option>
                   <option value="כללי">כללי</option>
                 </select>
                 <textarea value={newQA.question} onChange={(e) => setNewQA({...newQA, question: e.target.value})} placeholder="שאלה/טריגר..." rows={2} className="w-full p-4 rounded-xl font-bold bg-slate-900 border-none text-white outline-none resize-none" />
                 <textarea value={newQA.answer} onChange={(e) => setNewQA({...newQA, answer: e.target.value})} placeholder="תשובה..." rows={4} className="w-full p-4 rounded-xl font-bold bg-slate-900 border-none text-white outline-none resize-none" />
                 <button onClick={handleSave} disabled={loading} className="w-full bg-emerald-500 text-slate-900 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
                   <Save size={20}/> הזרק למאגר
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {editingItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 border border-white/10 shadow-2xl">
             <div className="flex justify-between items-center font-black italic"><h2>עריכה</h2><X className="cursor-pointer" onClick={() => setEditingItem(null)} /></div>
             <div className="space-y-4">
                <input value={editingItem.question} onChange={e => setEditingItem({...editingItem, question: e.target.value})} className="w-full p-4 rounded-xl font-bold bg-white/5 outline-none" />
                <textarea value={editingItem.answer} onChange={e => setEditingItem({...editingItem, answer: e.target.value})} rows={4} className="w-full p-4 rounded-xl font-bold bg-white/5 outline-none resize-none" />
             </div>
             <button onClick={handleUpdate} className="w-full bg-emerald-500 text-slate-900 py-5 rounded-2xl font-black">עדכן</button>
          </div>
        </div>
      )}
    </div>
  );
}
