'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { Send, Bot, Package, MapPin, Truck, Phone, X, CheckCircle } from 'lucide-react';
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

  // טעינת הקונטקסט של הלקוח בכניסה
  useEffect(() => {
    if (phone) {
      loadCustomerData();
    }
  }, [phone]);

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function loadCustomerData() {
    const { data: cust } = await supabase.from('customers').select('*').eq('phone', phone).single();
    if (cust) {
      setCustomer(cust);
      const { data: projs } = await supabase.from('customer_projects').select('*').eq('customer_id', cust.id);
      setProjects(projs || []);
      
      setMessages([{
        role: 'assistant',
        content: `אהלן ${cust.name}, יועץ המכירות של ח. סבן כאן. במה אפשר לעזור היום?`
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
          phone, 
          message: userMsg,
          chatHistory: newMessages.slice(-6) // שולחים רק את 6 ההודעות האחרונות לקונטקסט
        })
      });

      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
      
      // אם ההזמנה הוזרקה בהצלחה, אפשר להוסיף אפקט ויזואלי
      if (data.orderConfirmed) {
        // כאן אפשר להוסיף קונפטי או הודעה מיוחדת
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'מצטער בוס, המוח שלי קצת עייף. נסה שוב?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9]" dir="rtl">
      <Head>
        <title>SABAN Advisor | יועץ אישי</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* Header יוקרתי */}
      <header className="bg-slate-900 text-white p-5 shadow-xl flex justify-between items-center rounded-b-[2.5rem] shrink-0 border-b-4 border-emerald-500">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-pulse">
            <Bot color="white" size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter italic">SABAN ADVISOR</h1>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Expert Consulting</p>
          </div>
        </div>
        <div className="text-left bg-white/10 p-2 rounded-xl border border-white/10">
           <span className="block text-[9px] uppercase opacity-60 font-black">Client Name</span>
           <span className="block font-bold text-xs">{customer?.name || 'טוען...'}</span>
        </div>
      </header>

      {/* אזור השיחה */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-bottom-2'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-md text-sm font-bold leading-relaxed ${
              m.role === 'user' 
              ? 'bg-white text-slate-800 rounded-tr-none border border-slate-200' 
              : 'bg-emerald-600 text-white rounded-tl-none shadow-emerald-200'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end items-center gap-2 pr-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">חושב...</span>
          </div>
        )}
      </main>

      {/* פרויקטים לבחירה מהירה */}
      {projects.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50 border-t border-slate-200">
          {projects.map(p => (
            <button 
              key={p.id} 
              onClick={() => setInput(`הזמנה ל${p.project_name}`)}
              className="bg-white text-slate-700 px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap border border-slate-300 shadow-sm hover:border-emerald-500 transition-all active:scale-95"
            >
              📍 {p.project_name}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <footer className="p-4 bg-white border-t border-slate-200 pb-10">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="בוס, מה חסר לך באתר?"
            disabled={loading}
            className="w-full bg-slate-100 rounded-full py-4 px-6 pr-14 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="absolute left-2 bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-600 disabled:bg-slate-300 transition-all active:scale-90 shadow-lg"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
