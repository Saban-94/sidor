'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, MapPin, Phone, MessageSquare, 
  Sparkles, Building2, Camera, Image as ImageIcon, 
  X, Loader2 
} from 'lucide-react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CustomerProChat() {
  const router = useRouter();
  const { phone } = router.query;
  
  const [customer, setCustomer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phone) {
      loadCustomerContext();
    }
  }, [phone]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  async function loadCustomerContext() {
    const cleanPhone = String(phone).replace(/[\[\]\s]/g, '');
    const { data: cust } = await supabase
      .from('customers')
      .select('*, customer_projects(*)')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (cust) {
      setCustomer(cust);
      setProjects(cust.customer_projects || []);
      setMessages([{
        role: 'assistant',
        content: `שלום ${cust.name}, אני היועץ האישי שלך ב-ח. סבן. אני מחובר לפרויקטים שלך בזמן אמת. מה חסר לך היום באתר?`
      }]);
    }
  }

  // פונקציית צילום/העלאת תמונה
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

    const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) return;

    setIsUploading(true);
    // כאן תבוא לוגיקת העלאה ל-Supabase Storage או שליחה ל-Vision API
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: '📸 שלחתי תמונה של השטח לניתוח...' 
      }]);
      setIsUploading(false);
      // פנייה למוח לניתוח התמונה
      askAI("ניתוח תמונה משטח העבודה");
    }, 1500);
  };

  const askAI = async (query) => {
    if (query.trim() || loading) return;
    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setLoading(true);
    setInput('');

    try {
      const response = await fetch('/api/advisor-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: String(phone).replace(/[\[\]\s]/g, ''), 
          message: query,
          chatHistory: newMessages.slice(-10)
        })
      });
      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'אחי, יש תקלה קלה בתקשורת. נסה שוב.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F1F5F9] font-sans overflow-hidden" dir="rtl">
      <Head>
        <title>Saban AI | Premium Support</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* Header מעוצב */}
      <header className="z-50 bg-slate-900 text-white p-5 shadow-2xl rounded-b-[2rem] border-b-2 border-emerald-500/50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Bot color="white" size={28} />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight">SABAN <span className="text-emerald-400">AI</span></h1>
              <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={10} /> מנהל תיק אישי
              </p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
             <p className="text-[10px] text-emerald-400 font-bold">לקוח VIP</p>
             <p className="font-bold text-xs truncate max-w-[80px]">{customer?.name || 'טוען...'}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pt-6 no-scrollbar">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm text-sm font-bold leading-relaxed ${
              m.role === 'user' 
              ? 'bg-white text-slate-800 rounded-tr-none border border-slate-200' 
              : 'bg-slate-900 text-white rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-end"><Loader2 className="animate-spin text-emerald-500" /></div>
        )}
      </main>

      {/* Quick Project Tabs */}
      <div className="px-4 py-2 bg-white/60 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {projects.map(p => (
            <button key={p.id} onClick={() => setInput(`עדכון לגבי ${p.project_name}`)} className="bg-white border border-slate-200 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-2">
              <Building2 size={14} className="text-emerald-500" /> {p.project_name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar המעוצב עם כפתור המצלמה */}
      <footer className="p-4 bg-white border-t border-slate-100 pb-8">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          
          <div className="relative flex-1">
            {/* כפתור מצלמה מוטמע בשורת הקלט */}
            <button 
              onClick={handleCameraClick}
              disabled={isUploading}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-90"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={20} />}
            </button>

            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && askAI(input)}
              placeholder="מה לשלוח לאתר אחי?"
              className="w-full bg-slate-100 rounded-full py-4 px-6 pl-14 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none"
            />
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
            />
          </div>

          <button 
            onClick={() => askAI(input)}
            className="bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
          >
            <Send size={24} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
