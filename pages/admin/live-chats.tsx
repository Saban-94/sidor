import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';
import { 
  Bot, 
  User, 
  Clock, 
  Search, 
  ShieldCheck, 
  MessageCircle, 
  QrCode, 
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase בטוח
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
  const [isServerOnline, setIsServerOnline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת רשימת לקוחות עם טיפול בשגיאות
  useEffect(() => {
    try {
      const q = query(collection(dbFS, 'customers'), orderBy('lastMessageAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(data);
      }, (err) => {
        console.error("Snapshot error:", err);
        setIsServerOnline(false);
      });
      return () => unsub();
    } catch (e) {
      console.error("Connection failed:", e);
    }
  }, []);

  // גלילה אוטומטית למטה בהודעות חדשות
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#0B141A] text-slate-200 font-sans antialiased overflow-hidden flex flex-col">
      <Head>
        <title>SABAN HUB | Live Monitor</title>
      </Head>

      {/* Overlay למקרה שהשרת לא מחובר (Pipe Broken) */}
      {!isServerOnline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0B141A]/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
          <div className="max-w-xs w-full bg-white rounded-[3rem] p-8 text-center shadow-2xl">
            <QrCode size={48} className="mx-auto text-amber-500 mb-4 animate-bounce" />
            <h2 className="text-slate-900 font-black uppercase text-xl mb-2">Pipe Broken</h2>
            <p className="text-slate-500 text-[10px] font-bold mb-6 italic">השרת במשרד ממתין לסינכרון. סרוק כדי לפתוח את הצינור.</p>
            <div className="bg-slate-100 p-4 rounded-3xl border-2 border-dashed border-slate-300 mb-6 aspect-square flex items-center justify-center">
              <AlertCircle size={40} className="text-slate-300" />
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-[#0B141A] text-white rounded-2xl font-black text-xs uppercase tracking-widest">Retry Connection</button>
          </div>
        </motion.div>
      )}

      {/* Main UI */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-white/5 flex flex-col bg-[#111B21]">
          <header className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black italic tracking-tighter text-white">SABAN <span className="text-emerald-500">HUB</span></h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-500/50 font-bold">Live AI Monitor</p>
              </div>
            </div>
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש לקוח או טלפון..."
                className="w-full bg-[#202C33] border-none rounded-xl py-3 pr-11 pl-4 text-xs focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {customers.filter(c => c.id.includes(search) || c.name?.includes(search)).map((customer) => (
              <div 
                key={customer.id}
                onClick={() => setActiveCustomer(customer)}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-white/[0.02] ${activeCustomer?.id === customer.id ? 'bg-[#2A3942]' : 'hover:bg-[#202C33]'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-black text-slate-400 border border-white/10">
                    {customer.name?.charAt(0) || <User size={20} />}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111B21] rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold truncate text-slate-100">{customer.name || customer.id}</h3>
                    <span className="text-[9px] opacity-40 font-medium">12:45</span>
                  </div>
                  <p className="text-xs opacity-40 truncate font-medium italic">מעבד בקשה ב-AI...</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-[#0B141A] relative">
          {activeCustomer ? (
            <>
              <header className="p-4 bg-[#202C33] flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-sm text-white">{activeCustomer.name || activeCustomer.id}</h2>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">AI Agent Active</p>
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                 <div className="bg-amber-100/10 text-amber-500 text-[10px] font-black uppercase tracking-tighter text-center py-2 px-6 rounded-full border border-amber-500/20 w-max mx-auto mb-8">
                   Monitoring Mode Only - System Managed by AI
                 </div>
                 {/* הודעות לדוגמה - כאן תחבר את ה-Messages Collection שלך */}
                 <div className="self-start max-w-[80%] bg-[#202C33] p-4 rounded-2xl rounded-tr-none text-sm">
                    <p>שלום, אני צריך הצעת מחיר לבלוק 20.</p>
                    <div className="text-[9px] opacity-30 mt-2 text-left">12:44</div>
                 </div>
                 <div className="self-end max-w-[80%] bg-emerald-600 p-4 rounded-2xl rounded-tl-none text-sm text-white shadow-xl shadow-emerald-900/20">
                    <p>אהלן אחי, בכיף. בודק לך מחיר מעודכן במערכת לבלוק 20. רגע אחד...</p>
                    <div className="text-[9px] opacity-70 mt-2 text-right flex items-center justify-end gap-1">
                      12:45 <CheckCheck size={12} />
                    </div>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <MessageCircle size={64} className="mb-4" />
              <p className="font-black italic uppercase tracking-[0.3em]">Select a pipeline to monitor</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
