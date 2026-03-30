'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Search, PlusCircle, MessageSquare, 
  Database, Lightbulb, Trash2, Save, X, Bot, Zap, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanKnowledgeHub() {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newQA, setNewQA] = useState({ category: 'כללי', question: '', answer: '' });
  
  // נתונים חיים מהשטח (לשליפה מהירה)
  const [stats, setStats] = useState({ containers: 0, orders: 0, transfers: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // שליפת מאגר ידע
    const { data: qa } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
    // שליפת סטטיסטיקה חיה מהטבלאות
    const { count: c } = await supabase.from('container_management').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: o } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('delivery_date', new Date().toISOString().split('T')[0]);
    
    if (qa) setKnowledge(qa);
    setStats({ containers: c || 0, orders: o || 0, transfers: 0 });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newQA.question || !newQA.answer) return;
    const { error } = await supabase.from('knowledge_base').insert([newQA]);
    if (!error) {
      setNewQA({ category: 'כללי', question: '', answer: '' });
      setShowAdd(false);
      fetchData();
    }
  };

  const filteredKnowledge = knowledge.filter(k => 
    k.question.includes(searchTerm) || k.answer.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans p-6 lg:p-12 pb-32" dir="rtl">
      
      {/* Header & Stats */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-lg text-slate-900 shadow-lg shadow-emerald-500/20"><BookOpen size={20}/></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Saban Intelligence</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">Knowledge Hub</h1>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/5 border border-white/5 p-4 px-6 rounded-3xl backdrop-blur-md">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1">מכולות פעילות</div>
            <div className="text-2xl font-black text-emerald-500">{stats.containers}</div>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 px-6 rounded-3xl backdrop-blur-md">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1">הזמנות להיום</div>
            <div className="text-2xl font-black text-blue-500">{stats.orders}</div>
          </div>
        </div>
      </header>

      {/* Search & Actions */}
      <div className="max-w-6xl mx-auto mb-10 flex gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute right-5 top-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20}/>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש נוהל, מחיר או מידע בסידור..." 
            className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pr-14 pl-6 font-bold outline-none focus:bg-white/10 focus:border-emerald-500 transition-all shadow-2xl"
          />
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-emerald-500 text-slate-900 px-8 rounded-[2rem] font-black flex items-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
        >
          <PlusCircle size={20}/> <span className="hidden md:block">הוסף נוהל</span>
        </button>
      </div>

      {/* Knowledge Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {filteredKnowledge.map((item) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/5 p-8 rounded-[3rem] hover:bg-white/[0.07] transition-all group relative overflow-hidden shadow-xl"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  {item.category}
                </span>
                <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight leading-snug">{item.question}</h3>
              <div className="flex gap-4">
                <div className="w-1 bg-emerald-500 rounded-full shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <p className="text-slate-400 font-bold leading-relaxed italic text-lg">"{item.answer}"</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add QA Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#1E293B] w-full max-w-xl rounded-[3.5rem] p-10 border border-white/10 shadow-2xl space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black italic tracking-tighter">הזרקת ידע חדש</h2>
                  <button onClick={() => setShowAdd(false)} className="p-2 text-slate-500 hover:text-white"><X/></button>
               </div>
               <div className="space-y-4">
                  <select 
                    value={newQA.category}
                    onChange={e => setNewQA({...newQA, category: e.target.value})}
                    className="w-full p-5 bg-white/5 rounded-3xl font-bold border-none outline-none text-white focus:ring-2 ring-emerald-500/20"
                  >
                    <option value="חומרי בניין">חומרי בניין</option>
                    <option value="מכולות">מכולות</option>
                    <option value="כללי">כללי</option>
                  </select>
                  <textarea 
                    placeholder="השאלה..." 
                    rows={3}
                    className="w-full p-6 bg-white/5 rounded-3xl font-black border-none outline-none text-white placeholder:text-slate-600 resize-none"
                    value={newQA.question}
                    onChange={e => setNewQA({...newQA, question: e.target.value})}
                  />
                  <textarea 
                    placeholder="התשובה המקצועית..." 
                    rows={5}
                    className="w-full p-6 bg-white/5 rounded-3xl font-black border-none outline-none text-white placeholder:text-slate-600 resize-none"
                    value={newQA.answer}
                    onChange={e => setNewQA({...newQA, answer: e.target.value})}
                  />
               </div>
               <button onClick={handleSave} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">הזרק למאגר</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Brain Helper */}
      <div className="fixed bottom-10 left-10 hidden lg:block">
        <div className="bg-emerald-500 text-slate-900 p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-bounce">
           <Bot size={32}/>
           <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase">המוח המאוחד</span>
             <span className="text-sm font-black italic">אני לומד את התשובות שלך בזמן אמת!</span>
           </div>
        </div>
      </div>

    </div>
  );
}

// פונקציית מחיקה (להוסיף ב-Dashboard הראשי אם צריך)
const deleteItem = async (id: string) => {
  if (confirm("למחוק?")) {
    await supabase.from('knowledge_base').delete().eq('id', id);
    window.location.reload();
  }
};
