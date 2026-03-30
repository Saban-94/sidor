'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, MessageSquare, Container, Send, Clock, MapPin, 
  Bot, Truck, Box, RefreshCcw, Edit3, Trash2, Timer, 
  PlusCircle, BookOpen, Lightbulb, Save, X, Sparkles, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanStudioOS() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'studio' | 'chat'>('studio');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State ליצירת שאלה חדשה
  const [newQA, setNewQA] = useState({ category: 'חומרי בניין', question: '', answer: '' });

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
    if (data) setKnowledgeBase(data);
  };

  const saveToKnowledge = async () => {
    if (!newQA.question || !newQA.answer) return alert("בוס, תמלא את כל הפרטים");
    setLoading(true);
    const { error } = await supabase.from('knowledge_base').insert([newQA]);
    if (!error) {
      setNewQA({ category: 'חומרי בניין', question: '', answer: '' });
      fetchKnowledge();
    }
    setLoading(false);
  };

  const deleteKnowledge = async (id: string) => {
    if (!confirm("למחוק את פיסת הידע הזו?")) return;
    await supabase.from('knowledge_base').delete().eq('id', id);
    fetchKnowledge();
  };

  return (
    <div className={`flex h-screen w-full transition-all duration-500 font-sans ${isDarkMode ? 'bg-[#0B0F1A] text-white' : 'bg-[#F4F7FE] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN | STUDIO OS</title></Head>

      {/* Sidebar */}
      <aside className={`w-20 lg:w-72 flex flex-col border-l transition-all ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="p-8 font-black text-2xl italic tracking-tighter border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg"><Sparkles size={20}/></div>
          <span className="hidden lg:block uppercase">SABAN STUDIO</span>
        </div>
        <nav className="flex-1 p-5 space-y-4">
          {[
            { id: 'live', label: 'משימות חיות', icon: Timer },
            { id: 'sidor', label: 'לוח נהגים', icon: Truck },
            { id: 'studio', label: 'סטודיו ידע (ד\')', icon: BookOpen },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={22} /> <span className="hidden lg:block font-black text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {/* סטודיו לכתיבת שאלות וידע (מסלול ד') */}
          {activeTab === 'studio' && (
            <motion.div key="studio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-10 h-full overflow-y-auto space-y-12">
              <header className="space-y-2">
                <h1 className="text-5xl font-black italic tracking-tighter uppercase">SABAN Knowledge Studio</h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">הזרקת בינה מלאכותית למחלקות (מסלול ד')</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* צד ימין: כתיבת ידע חדש */}
                <div className={`lg:col-span-1 p-8 rounded-[3rem] border shadow-2xl h-fit sticky top-0 ${isDarkMode ? 'bg-[#161B2C] border-white/5' : 'bg-white border-slate-100'}`}>
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Lightbulb className="text-emerald-500"/> יצירת ידע חדש</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 mr-4 tracking-widest">מחלקה</label>
                      <select 
                        value={newQA.category}
                        onChange={(e) => setNewQA({...newQA, category: e.target.value})}
                        className={`w-full p-4 rounded-2xl font-bold border-none outline-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
                      >
                        <option value="חומרי בניין">חומרי בניין</option>
                        <option value="מכולות">מכולות</option>
                        <option value="לוגיסטיקה">לוגיסטיקה/סניפים</option>
                        <option value="כללי">כללי/מחירים</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 mr-4 tracking-widest">השאלה / הטריגר</label>
                      <textarea 
                        rows={3}
                        value={newQA.question}
                        onChange={(e) => setNewQA({...newQA, question: e.target.value})}
                        placeholder="למשל: מה עושים כשיש חריגת זמן במכולה?"
                        className={`w-full p-5 rounded-2xl font-bold border-none outline-none resize-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 mr-4 tracking-widest">התשובה המקצועית</label>
                      <textarea 
                        rows={4}
                        value={newQA.answer}
                        onChange={(e) => setNewQA({...newQA, answer: e.target.value})}
                        placeholder="כתוב את התשובה המדויקת שה-AI צריך לספק..."
                        className={`w-full p-5 rounded-2xl font-bold border-none outline-none resize-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
                      />
                    </div>
                    <button 
                      onClick={saveToKnowledge}
                      disabled={loading}
                      className="w-full bg-emerald-500 text-slate-900 py-5 rounded-3xl font-black text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95"
                    >
                      {loading ? 'מזריק ידע...' : <><Save size={20}/> הזרק למאגר</>}
                    </button>
                  </div>
                </div>

                {/* צד שמאל: רשימת ידע קיים */}
                <div className="lg:col-span-2 space-y-6 pb-20">
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><BookOpen className="text-emerald-400"/> מאגר הנתונים הקיים</h3>
                  {knowledgeBase.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      className={`p-8 rounded-[2.5rem] border transition-all relative group ${isDarkMode ? 'bg-[#161B2C] border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${item.category === 'מכולות' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                           {item.category}
                         </span>
                         <button onClick={() => deleteKnowledge(item.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                           <Trash2 size={18}/>
                         </button>
                      </div>
                      <h4 className="text-xl font-black mb-4 tracking-tight leading-snug">{item.question}</h4>
                      <div className={`p-6 rounded-2xl italic font-bold border-r-4 border-emerald-500 ${isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                        "{item.answer}"
                      </div>
                      <div className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">הוזרק בתאריך: {new Date(item.created_at).toLocaleDateString('he-IL')}</div>
                    </motion.div>
                  ))}
                </div>

              </div>
            </motion.div>
          )}

          {/* ... יתר הדפים נשארים כפי שהיו ... */}

        </AnimatePresence>
      </main>
    </div>
  );
}
