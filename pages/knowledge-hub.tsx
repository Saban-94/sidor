'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Bot, Send, Trash2, Edit3, PlusCircle, 
  Wifi, BatteryCharging, Mic, Plus, X, Save, 
  ChevronRight, Sparkles, Search, MessageSquare, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanKnowledgePWA() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'manage'>('simulator');
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'בוס, המוח המאוחד מוכן לבדיקה. שאל אותי כל נוהל מהמאגר.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchKnowledge();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchKnowledge = async () => {
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
    if (data) setKnowledge(data);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, time: now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) }]);
    setLoading(true);

    const res = await fetch('/api/unified-brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, senderPhone: 'admin' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply, time: new Date().toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) }]);
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("בוס, למחוק סופית מהמאגר?")) return;
    await supabase.from('knowledge_base').delete().eq('id', id);
    fetchKnowledge();
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white font-sans overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN | Knowledge PWA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>

      {/* תפריט תחתון PWA */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#111827]/90 backdrop-blur-xl border-t border-white/5 z-[100] flex items-center justify-around px-10">
        <button onClick={() => setActiveTab('simulator')} className={`flex flex-col items-center gap-1 ${activeTab === 'simulator' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <Bot size={24}/> <span className="text-[10px] font-black uppercase">בדיקת מוח</span>
        </button>
        <button onClick={() => setActiveTab('manage')} className={`flex flex-col items-center gap-1 ${activeTab === 'manage' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <Database size={24}/> <span className="text-[10px] font-black uppercase">ניהול מאגר</span>
        </button>
      </nav>

      <main className="flex-1 flex flex-col h-screen relative pb-20">
        <AnimatePresence mode="wait">
          
          {/* תצוגה 1: סימולטור צ'אט דף מלא (בדיקה) */}
          {activeTab === 'simulator' && (
            <motion.div key="sim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center p-4">
               {/* iPhone 15 Pro Wrapper */}
               <div className="relative w-full max-w-[360px] h-[740px] bg-black rounded-[50px] border-[10px] border-[#1E293B] shadow-[0_0_100px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col">
                  {/* Dynamic Island */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"/></div>
                  {/* Status Bar */}
                  <div className="h-12 flex items-center justify-between px-8 pt-2 text-[11px] font-bold"><span>{now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span><div className="flex gap-1.5"><Wifi size={14}/><BatteryCharging size={14} className="text-emerald-500"/></div></div>
                  
                  {/* WhatsApp Body */}
                  <div className="flex-1 flex flex-col bg-[#E4DED5] overflow-hidden">
                     <header className="h-14 bg-[#F0F2F5] border-b border-slate-200 flex items-center gap-3 px-4 shrink-0">
                        <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-emerald-400 shadow-lg"><Bot size={18}/></div>
                        <div><h2 className="font-black text-sm text-slate-900">Saban Brain 🧠</h2><span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic">מסלול ד' פעיל</span></div>
                     </header>
                     
                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://i.postimg.cc/mD3Wf6gL/bg-chat.png')] bg-repeat">
                        {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-3 rounded-xl shadow-sm text-xs font-bold leading-relaxed ${m.role === 'user' ? 'bg-white text-slate-900 rounded-tr-none' : 'bg-[#D9FDD3] text-slate-900 rounded-tl-none'}`}>
                              {m.content}
                              <span className="text-[8px] text-slate-400 mt-1 block text-left uppercase">{m.time}</span>
                            </div>
                          </div>
                        ))}
                        {loading && <div className="text-[10px] font-black text-emerald-600 animate-pulse italic mr-2 uppercase tracking-widest">מעבד תשובה...</div>}
                     </div>

                     <footer className="h-16 bg-[#F0F2F5] flex items-center gap-2 px-3 border-t border-slate-200">
                        <Plus size={20} className="text-slate-500"/>
                        <form onSubmit={handleChat} className="flex-1 relative">
                          <input value={input} onChange={e => setInput(e.target.value)} placeholder="בדוק נוהל..." className="w-full bg-white border-none rounded-full py-2.5 px-5 text-xs font-bold text-slate-900 outline-none shadow-inner" />
                          <button type="submit" className="absolute left-1.5 top-1 bg-emerald-500 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"><Send size={14} className="rotate-180"/></button>
                        </form>
                        <Mic size={20} className="text-slate-500"/>
                     </footer>
                  </div>
               </div>
            </motion.div>
          )}

          {/* תצוגה 2: ניהול מאגר ידע דף מלא (עריכה/מחיקה) */}
          {activeTab === 'manage' && (
            <motion.div key="manage" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <header className="flex justify-between items-center bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md sticky top-0 z-50">
                 <h1 className="text-3xl font-black italic tracking-tighter uppercase">ניהול מאגר</h1>
                 <button onClick={() => setEditingItem({ category: 'חומרי בניין', question: '', answer: '' })} className="bg-emerald-500 text-slate-900 p-3 rounded-2xl shadow-lg shadow-emerald-500/20"><PlusCircle/></button>
              </header>

              <div className="relative group">
                <Search className="absolute right-5 top-5 text-slate-500" size={20}/>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חפש במאגר הידע..." className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pr-14 pl-6 font-bold outline-none focus:bg-white/10 transition-all" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {knowledge.filter(k => k.question.includes(searchTerm)).map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/5 p-8 rounded-[3rem] space-y-4 hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-center">
                       <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">{item.category}</span>
                       <div className="flex gap-2">
                          <button onClick={() => setEditingItem(item)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-emerald-500 hover:text-white transition-all"><Edit3 size={18}/></button>
                          <button onClick={() => deleteItem(item.id)} className="p-2 bg-white/5 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                       </div>
                    </div>
                    <h3 className="text-xl font-black leading-tight tracking-tight">{item.question}</h3>
                    <p className="text-slate-500 font-bold italic border-r-2 border-emerald-500 pr-4">"{item.answer}"</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* עריכה / הוספה Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1E293B] w-full max-w-xl rounded-[3.5rem] p-10 border border-white/10 shadow-2xl space-y-6">
               <div className="flex justify-between items-center"><h2 className="text-2xl font-black italic tracking-tighter">עריכת ידע</h2><button onClick={() => setEditingItem(null)}><X/></button></div>
               <div className="space-y-4">
                  <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full p-5 bg-white/5 rounded-3xl font-bold border-none outline-none text-white"><option value="חומרי בניין">חומרי בניין</option><option value="מכולות">מכולות</option></select>
                  <textarea value={editingItem.question} onChange={e => setEditingItem({...editingItem, question: e.target.value})} placeholder="השאלה..." rows={2} className="w-full p-6 bg-white/5 rounded-3xl font-black border-none outline-none text-white resize-none" />
                  <textarea value={editingItem.answer} onChange={e => setEditingItem({...editingItem, answer: e.target.value})} placeholder="התשובה..." rows={4} className="w-full p-6 bg-white/5 rounded-3xl font-black border-none outline-none text-white resize-none" />
               </div>
               <button onClick={async () => {
                 const { error } = editingItem.id ? await supabase.from('knowledge_base').update(editingItem).eq('id', editingItem.id) : await supabase.from('knowledge_base').insert([editingItem]);
                 if (!error) { setEditingItem(null); fetchKnowledge(); }
               }} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-emerald-500/20">שמור למאגר</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}  useEffect(() => {
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
