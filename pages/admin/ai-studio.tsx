'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, Zap, Database, MessageSquare, 
  Settings, Loader2, Sparkles, ShieldCheck,
  Box, Edit3, Image as ImageIcon, Video, Save, X, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

export default function SabanAIStudio() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ content: '', imageUrl: '', videoUrl: '' });
  const [dbStatus, setDbStatus] = useState({ orders: 0, containers: 0, memory: 0 });
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    fetchStats();
    setMessages([{ 
      role: 'ai', 
      content: `שלום בוס ראמי, סטודיו האימון של SABAN AI מוכן. המוח מחובר לטבלאות בזמן אמת.`,
      imageUrl: '',
      videoUrl: ''
    }]);
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [o, c, m] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact' }).eq('delivery_date', today),
      supabase.from('container_management').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('inventory').select('id', { count: 'exact' })
    ]);
    setDbStatus({ orders: o.count || 0, containers: c.count || 0, memory: m.count || 0 });
  };

  const askAI = async (query: string) => {
    if (!query.trim() || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput(''); setIsTyping(true);

    try {
      const res = await fetch('/api/google-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history: messages.slice(-3) })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.answer,
        imageUrl: data.image || '',
        videoUrl: data.video || ''
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ שגיאה בחיבור למוח.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ 
      content: messages[index].content, 
      imageUrl: messages[index].imageUrl || '', 
      videoUrl: messages[index].videoUrl || '' 
    });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const newMessages = [...messages];
    newMessages[editingIndex] = { ...newMessages[editingIndex], ...editForm };
    setMessages(newMessages);
    setEditingIndex(null);
  };

  return (
    <div className="h-screen bg-[#F0F4F8] flex flex-col lg:flex-row font-sans overflow-hidden text-slate-800" dir="rtl">
      <Head><title>SABAN | AI PRO Studio</title></Head>

      {/* Sidebar - נקי ובהיר */}
      <aside className="w-full lg:w-96 bg-white border-l border-slate-200 p-8 flex flex-col gap-8 shadow-2xl z-20">
        <div className="flex items-center gap-4">
          <img src={SABAN_LOGO} className="w-16 h-16 rounded-[2rem] shadow-xl border-4 border-blue-50" />
          <div>
            <h1 className="font-black text-2xl italic tracking-tighter">STUDIO <span className="text-blue-600">PRO</span></h1>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">High Intelligence</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { label: 'הזמנות פעילות', count: dbStatus.orders, icon: <Zap size={20}/>, color: 'bg-blue-50 text-blue-600' },
            { label: 'מכולות בשטח', count: dbStatus.containers, icon: <Box size={20}/>, color: 'bg-purple-50 text-purple-600' },
            { label: 'מוצרים במלאי', count: dbStatus.memory, icon: <Database size={20}/>, color: 'bg-emerald-50 text-emerald-600' }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.color}`}>{item.icon}</div>
                <span className="text-base font-black">{item.label}</span>
              </div>
              <span className="font-black text-2xl text-slate-700">{item.count}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto p-6 bg-slate-900 rounded-[2rem] text-white">
          <div className="flex items-center gap-2 mb-3 text-blue-400">
            <ShieldCheck size={18} />
            <span className="text-xs font-black uppercase">Core Status</span>
          </div>
          <p className="text-sm font-bold text-slate-400 leading-relaxed">
            המוח פועל על מודל <span className="text-white">Gemini 3.1 Flash</span>. המערכת מוכנה לעריכת תוכן והזרקת מדיה בזמן אמת.
          </p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col relative overflow-hidden">
        <header className="p-5 bg-white/90 backdrop-blur-md border-b flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="font-black text-base uppercase">Live Interaction Node</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`group relative max-w-[90%] lg:max-w-[75%] p-6 rounded-[2.5rem] shadow-lg transition-all ${
                  m.role === 'user' ? 'bg-white text-slate-800' : 'bg-blue-600 text-white shadow-blue-100'
                }`}>
                   {/* כפתור עריכה להודעות AI */}
                   {m.role === 'ai' && (
                     <button 
                      onClick={() => startEdit(i)}
                      className="absolute -right-12 top-2 p-3 bg-white text-slate-400 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:text-blue-600"
                     >
                       <Edit3 size={18} />
                     </button>
                   )}

                   {/* הצגת מדיה */}
                   {m.imageUrl && (
                     <img src={m.imageUrl} className="w-full h-64 object-cover rounded-[1.5rem] mb-4 shadow-inner border-2 border-white/20" />
                   )}
                   {m.videoUrl && (
                     <video src={m.videoUrl} controls className="w-full rounded-[1.5rem] mb-4 shadow-inner" />
                   )}

                   <div className="prose prose-lg max-w-none text-inherit font-black leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Input & Form Area */}
        <footer className="p-8 bg-white border-t shadow-[0_-10px_25px_rgba(0,0,0,0.02)]">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <form 
              onSubmit={(e) => { e.preventDefault(); askAI(input); }}
              className="relative flex items-center gap-4"
            >
              <div className="flex-1 relative">
                <input 
                  value={input} onChange={e => setInput(e.target.value)}
                  placeholder="בוס, מה נבדוק היום?"
                  className="w-full p-6 pr-14 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-blue-500/50 focus:bg-white transition-all font-black text-lg shadow-inner"
                />
                <Sparkles size={24} className="absolute right-5 top-5 text-blue-500 opacity-50" />
              </div>
              <button 
                type="submit" disabled={isTyping}
                className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 active:scale-90 transition-all disabled:opacity-50"
              >
                <Send size={32} className="rotate-180" />
              </button>
            </form>
          </div>
        </footer>

        {/* Modal עריכה להשלמת פרטים */}
        {editingIndex !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b pb-6">
                <h2 className="text-2xl font-black italic">השלמת פרטים ידנית</h2>
                <button onClick={() => setEditingIndex(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 mb-2 block">תוכן ההודעה</label>
                  <textarea 
                    value={editForm.content} 
                    onChange={e => setEditForm({...editForm, content: e.target.value})}
                    className="w-full p-4 bg-slate-50 border rounded-2xl h-32 font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">לינק לתמונה</label>
                    <div className="relative">
                      <input 
                        value={editForm.imageUrl} 
                        onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                        className="w-full p-4 bg-slate-50 border rounded-2xl pl-10 font-bold outline-none focus:border-blue-500"
                        placeholder="https://..."
                      />
                      <ImageIcon className="absolute left-3 top-4 text-slate-400" size={20}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">לינק לוידאו</label>
                    <div className="relative">
                      <input 
                        value={editForm.videoUrl} 
                        onChange={e => setEditForm({...editForm, videoUrl: e.target.value})}
                        className="w-full p-4 bg-slate-50 border rounded-2xl pl-10 font-bold outline-none focus:border-blue-500"
                        placeholder="https://..."
                      />
                      <Video className="absolute left-3 top-4 text-slate-400" size={20}/>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={saveEdit}
                  className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save size={20}/> שמור ועדכן צ'אט
                </button>
                <button 
                  onClick={() => setEditingIndex(null)}
                  className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-lg hover:bg-slate-200"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .prose font-black { font-weight: 900 !important; }
      `}</style>
    </div>
  );
}
