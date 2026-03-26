import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Bot, User, Clock, Search, ShieldCheck, MessageCircle } from 'lucide-react';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default function LiveChatMonitor() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת רשימת הלקוחות ששוחחו עם המערכת
  useEffect(() => {
    const q = query(collection(dbFS, 'customers'), orderBy('lastMessageAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
    });
    return () => unsub();
  }, []);

  // טעינת היסטוריית השיחה ללקוח הנבחר
  useEffect(() => {
    if (!activeCustomer) return;
    const q = query(
      collection(dbFS, 'customers', activeCustomer.id, 'chat_history'), 
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });
    return () => unsub();
  }, [activeCustomer]);

  const filteredCustomers = customers.filter(c => 
    c.id.includes(search) || (c.name && c.name.includes(search))
  );

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-sans" dir="rtl">
      <Head><title>SabanOS | מעקב שיחות AI</title></Head>

      {/* רשימת לקוחות */}
      <aside className="w-80 bg-white border-l shadow-lg flex flex-col shrink-0 z-10">
        <header className="p-5 bg-slate-900 text-white flex flex-col gap-1">
          <h1 className="font-black text-xl flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" /> בקרת AI
          </h1>
          <p className="text-xs text-slate-400 font-bold">מעקב שיחות אוטומטיות בלייב</p>
        </header>

        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="חפש מספר לקוח..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 pr-9 pl-4 py-2 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map(c => (
            <div 
              key={c.id} 
              onClick={() => setActiveCustomer(c)}
              className={`p-4 border-b border-slate-50 cursor-pointer flex items-center gap-3 transition-colors ${activeCustomer?.id === c.id ? 'bg-emerald-50 border-r-4 border-r-emerald-500' : 'hover:bg-slate-50 border-r-4 border-r-transparent'}`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 flex justify-center items-center text-slate-500 shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-slate-800 text-sm truncate">{c.name || 'לקוח מזדמן'}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{c.id}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* אזור הצפייה בשיחה */}
      <main className="flex-1 flex flex-col relative bg-[#e5ddd5]" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay' }}>
        {!activeCustomer ? (
          <div className="m-auto flex flex-col items-center gap-4 text-slate-400 opacity-60">
            <MessageCircle size={80} />
            <h2 className="text-xl font-bold">בחר לקוח מהרשימה כדי לצפות בשיחה</h2>
          </div>
        ) : (
          <>
            <header className="bg-white p-4 shadow-sm flex items-center gap-4 shrink-0 z-10">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="font-black text-slate-800">{activeCustomer.name || 'לקוח מזדמן'}</h2>
                <p className="text-xs font-mono text-slate-500">{activeCustomer.id}</p>
              </div>
              <div className="mr-auto bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                AI מטפל בלקוח
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="bg-amber-100 text-amber-800 text-xs font-bold text-center py-2 px-4 rounded-xl shadow-sm w-max mx-auto mb-4">
                השיחות כאן מנוהלות אוטומטית על ידי המוח. זהו מסך מעקב בלבד.
              </div>

              {messages.map((m) => (
                <div key={m.id} className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm relative ${m.type === 'in' ? 'bg-white text-slate-800 rounded-tr-none self-start' : 'bg-[#dcf8c6] text-slate-900 rounded-tl-none self-end'}`}>
                  {/* זיהוי דובר */}
                  <div className={`text-[10px] font-black mb-1 ${m.type === 'in' ? 'text-blue-500' : 'text-emerald-600'}`}>
                    {m.type === 'in' ? 'הלקוח:' : 'ראמי (AI):'}
                  </div>
                  
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  
                  <div className="text-[9px] text-slate-400 mt-2 flex items-center justify-end gap-1">
                    <Clock size={10} />
                    {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : 'עכשיו'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
