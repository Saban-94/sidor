'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { Send, Bot, Package, MapPin, Truck, CheckCircle, Info } from 'lucide-react';
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
  const [cart, setCart] = useState<any[]>([]); // סל קניות וירטואלי שהמוח מעדכן

  useEffect(() => {
    if (phone) {
      loadCustomerContext();
    }
  }, [phone]);

  async function loadCustomerContext() {
    // 1. שליפת פרטי לקוח
    const { data: cust } = await supabase.from('customers').select('*').eq('phone', phone).single();
    if (cust) {
      setCustomer(cust);
      // 2. שליפת הפרויקטים שלו
      const { data: projs } = await supabase.from('customer_projects').select('*').eq('customer_id', cust.id);
      setProjects(projs || []);
      
      // הודעת פתיחה אישית
      setMessages([{
        role: 'assistant',
        content: `אהלן ${cust.name}, המוח המאוחד של ח. סבן כאן. אני רואה שאנחנו עובדים כרגע על ${projs?.length || 0} פרויקטים. איפה חסר לך חומר היום?`
      }]);
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    // כאן תבוא הקריאה ל-API של המוח החדש (היועץ)
    // המוח ינתח את ההודעה, יעדכן את ה-Cart במידת הצורך ויענה
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]" dir="rtl">
      <Head>
        <title>ח. סבן - יועץ אישי</title>
      </Head>

      {/* Header יוקרתי ללקוח */}
      <header className="bg-slate-900 text-white p-5 shadow-2xl flex justify-between items-center rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot color="white" size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight">SABAN ADVISOR</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest text-left">Professional Consulting</p>
          </div>
        </div>
        <div className="text-left">
           <span className="block text-xs opacity-60">לקוח VIP</span>
           <span className="block font-bold text-sm">{customer?.name}</span>
        </div>
      </header>

      {/* אזור הצ'אט */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm text-sm font-bold ${
              m.role === 'user' 
              ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100' 
              : 'bg-emerald-600 text-white rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
      </main>

      {/* "הסל החכם" - מוצג כשהמוח מזהה מוצרים */}
      {cart.length > 0 && (
        <div className="mx-4 mb-2 p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-lg animate-in slide-in-from-bottom">
           <div className="flex items-center gap-2 mb-2 border-b pb-1">
              <Package size={16} className="text-emerald-500" />
              <span className="text-xs font-black uppercase">טיוטת הזמנה לבדיקה:</span>
           </div>
           {/* רשימת מוצרים בסל */}
           <button className="w-full bg-emerald-500 text-white py-2 rounded-xl font-black text-sm mt-2">אשר ושדר לראמי ✅</button>
        </div>
      )}

      {/* פרויקטים לבחירה מהירה */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {projects.map(p => (
          <button key={p.id} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap border border-slate-300">
            📍 {p.project_name}
          </button>
        ))}
      </div>

      {/* Input */}
      <footer className="p-4 bg-white border-t border-slate-100 pb-8">
        <div className="relative flex items-center">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="בוס, מה אתה צריך לאתר?"
            className="w-full bg-slate-100 rounded-full py-4 px-6 pr-14 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute left-2 bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
