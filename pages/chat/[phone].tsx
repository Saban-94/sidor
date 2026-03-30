'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js'; // הוספה: Supabase
import { Send, Bot, User, Calculator, ArrowLeft, PackageSearch, MapPin, Truck, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- אתחול Firebase ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

// --- אתחול Supabase ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- קבועים ללוח השעות ---
const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function MagicChat() {
  const router = useRouter();
  const { phone } = router.query;

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]); // הוספה: הזמנות מ-Supabase
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // 1. טעינת פרופיל איש הקשר (Firebase)
  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString();
    const docRef = doc(dbFS, "customers", cleanPhone);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({ id: cleanPhone, name: "אורח", relation: "לקוח כללי" });
      }
    });
    return () => unsubscribe();
  }, [phone]);

  // 2. טעינת היסטוריית צ'אט (Firebase)
  useEffect(() => {
    if (!phone) return;
    const q = query(collection(dbFS, "customers", phone.toString(), "chat_history"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
    });
    return () => unsubscribe();
  }, [phone]);

  // 3. שליפת הזמנות בזמן אמת (Supabase) - כאן אבי לוי יופיע!
  useEffect(() => {
    const fetchOrders = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('orders').select('*').eq('delivery_date', today);
      if (data) setOrders(data);
    };

    fetchOrders();

    const channel = supabase.channel('orders_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !profile || isLoading) return;
    const userMsg = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: userMsg, type: 'in', timestamp: serverTimestamp()
      });

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: profile.id })
      });
      
      const data = await response.json();
      const attachedProducts = data.products || [];

      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: data.reply || "שגיאה בתקשורת",
        type: 'out',
        attachedProducts,
        timestamp: serverTimestamp()
      });
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  // פונקציית רינדור הזמנה בלוח
  const renderOrderInSlot = (driver: string, slot: string) => {
    const order = orders.find(o => o.driver_name === driver && o.order_time === slot);
    if (!order) return null;
    return (
      <div className="bg-emerald-500 text-black p-2 rounded-xl text-[10px] font-black shadow-sm flex justify-between items-center animate-in fade-in zoom-in">
        <div className="truncate flex-1">
          <div>{order.client_info}</div>
          <div className="opacity-60">{order.location}</div>
        </div>
        <button onClick={async () => await supabase.from('orders').delete().eq('id', order.id)} className="p-1 hover:bg-black/10 rounded">
          <Trash2 size={12}/>
        </button>
      </div>
    );
  };

  if (!mounted || !profile) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-slate-400 italic">SABAN OS LOADING...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN OS | {profile.name}</title></Head>

      {/* צד ימין: לוח נהגים (Desktop) / תצוגה משולבת */}
      <aside className="hidden lg:flex w-96 flex-col bg-white border-l border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex items-center gap-3">
          <Truck size={24} className="text-emerald-400" />
          <h2 className="font-black italic uppercase">לוח נהגים חי</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {['חכמת', 'עלי'].map(driver => (
            <div key={driver} className="space-y-3">
              <h3 className="bg-slate-100 p-2 rounded-xl text-center font-black text-xs text-slate-500 uppercase tracking-tighter">{driver}</h3>
              <div className="space-y-1">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="flex items-center gap-3 min-h-[40px] px-2 border-b border-slate-50 group transition-all">
                    <span className="text-[9px] font-mono font-bold opacity-30 group-hover:opacity-100">{slot}</span>
                    <div className="flex-1">{renderOrderInSlot(driver, slot)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* מרכז: הצ'אט */}
      <div className="flex-1 flex flex-col relative h-full">
        <header className="h-[70px] bg-white border-b border-slate-100 p-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Bot size={20} className="text-white"/></div>
             <div>
               <h1 className="font-black text-sm leading-tight text-slate-900">העוזר של ראמי</h1>
               <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">מחובר • {profile.name}</span>
             </div>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col max-w-[80%] ${m.type === 'in' ? 'self-end' : 'self-start'}`}>
              <div className={`p-4 text-sm font-bold shadow-sm ${m.type === 'in' ? 'bg-slate-900 text-white rounded-3xl rounded-tr-none' : 'bg-white text-slate-800 rounded-3xl rounded-tl-none border border-slate-100'}`}>
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                <div className="text-[9px] mt-2 opacity-30 text-left font-mono">
                  {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                </div>
              </div>
            </div>
          ))}
        </main>

        <footer className="p-4 bg-white border-t border-slate-100 pb-8 md:pb-4">
          <div className="flex items-center gap-3 max-w-3xl mx-auto bg-slate-50 p-2 rounded-[2rem] border border-slate-200">
            <input 
              type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב פקודה ללוח או שאל על מוצר..."
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none font-bold"
            />
            <button onClick={handleSend} className="bg-slate-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><Send size={18} className="transform rotate-180" /></button>
          </div>
        </footer>
      </div>
    </div>
  );
}
