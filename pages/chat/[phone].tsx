'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { Send, Bot, MapPin, Phone, MessageSquare, ChevronLeft, Sparkles, Building2 } from 'lucide-react';
import Head from 'next/head';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CustomerProChat() {
  const router = useRouter();
  const { phone } = router.query;
  
  const [customer, setCustomer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

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
    // ניקוי המספר מתווים כמו [ ] או רווחים כדי למנוע שגיאת 406
    const cleanPhone = String(phone).replace(/[\[\]\s]/g, '');

    const { data: cust, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (cust) {
      setCustomer(cust);
      const { data: projs } = await supabase
        .from('customer_projects')
        .select('*')
        .eq('customer_id', cust.id);
      
      setProjects(projs || []);
      
      setMessages([{
        role: 'assistant',
        content: `שלום ${cust.name}, אני היועץ האישי שלך ב-ח. סבן. אני מכיר את הפרויקטים שלך וזמין לכל הזמנה או ייעוץ טכני. מה חסר לך היום באתר?`
      }]);
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/advisor-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: String(phone).replace(/[\[\]\s]/g, ''), 
          message: userMsg,
          chatHistory: newMessages.slice(-10)
        })
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'בוס, יש תקשורת מוגבלת כרגע. נסה לשלוח שוב.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-emerald-100" dir="rtl">
      <Head>
        <title>Saban AI | Premium Support</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* Header מעוצב - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white p-4 pb-6 shadow-2xl rounded-b-[2.5rem] border-b border-emerald-500/30">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3">
                <Bot color="white" size={32} />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse shadow-sm"></span>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter flex items-center gap-2">
                SABAN <span className="text-emerald-400">AI</span>
              </h1>
              <div className="flex items-center gap-1.5 opacity-70">
                <Sparkles size={12} className="text-emerald-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest">מנהל תיק אישי</p>
              </div>
            </div>
          </div>
          <div className="text-left bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <p className="text-[9px] uppercase font-black text-emerald-400 mb-0.5">Welcome Back</p>
            <p className="font-bold text-sm truncate max-w-[100px]">{customer?.name || 'טוען...'}</p>
          </div>
        </div>
      </header>

      {/* אזור השיחה */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pt-8 no-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`relative max-w-[88%] p-4 rounded-[2rem] shadow-xl text-sm font-bold leading-relaxed ${
              m.role === 'user' 
              ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100' 
              : 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tl-none shadow-emerald-200/50'
            }`}>
              {m.content}
              <span className={`absolute bottom-[-18px] text-[9px] font-medium text-slate-400 ${m.role === 'user' ? 'right-2' : 'left-2'}`}>
                {new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end pr-4">
             <div className="flex gap-1.5 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
             </div>
          </div>
        )}
      </main>

      {/* סרגל פרויקטים מהיר - כרטיסיות */}
      <div className="px-4 py-3 bg-white/50 backdrop-blur-sm border-t border-slate-200">
        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 mr-2">הפרויקטים שלך:</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {projects.map(p => (
            <button 
              key={p.id} 
              onClick={() => setInput(`אני צריך חומר ל${p.project_name}`)}
              className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border border-slate-200 shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95 group"
            >
              <Building2 size={14} className="text-slate-400 group-hover:text-emerald-500" />
              {p.project_name}
            </button>
          ))}
        </div>
      </div>

      {/* Input - "Floating" Style */}
      <footer className="p-4 bg-white border-t border-slate-100 pb-10">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="relative flex-1 group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב כאן מה חסר לאתר..."
              disabled={loading}
              className="w-full bg-slate-100 rounded-[2rem] py-5 px-6 pr-14 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner border border-transparent focus:border-emerald-100"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              <MessageSquare size={20} />
            </div>
          </div>
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-emerald-600 disabled:bg-slate-300 transition-all active:scale-90 shadow-xl shadow-slate-200"
          >
            <Send size={24} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
