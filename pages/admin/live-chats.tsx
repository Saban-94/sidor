import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
// תיקון: הוספת QrCode ו-Scan לרשימת הייבוא מ-lucide-react
import { 
  Bot, 
  User, 
  Clock, 
  Search, 
  ShieldCheck, 
  MessageCircle, 
  QrCode, 
  AlertCircle,
  CheckCheck,
  Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase בטוח מתוך משתני הסביבה
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
  const [search, setSearch] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // מאזין ללקוחות בזמן אמת מה-Pipeline
  useEffect(() => {
    try {
      const q = query(collection(dbFS, 'customers'), orderBy('lastMessageAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(data);
        setIsServerOnline(true);
      }, (err) => {
        console.error("[Monitor] Firestore error:", err);
        setIsServerOnline(false);
      });
      return () => unsub();
    } catch (e) {
      console.error("[Monitor] Connection failed:", e);
      setIsServerOnline(false);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeCustomer]);

  return (
    <div className="min-h-screen bg-[#0B141A] text-slate-200 font-sans antialiased overflow-hidden flex flex-col">
      <Head>
        <title>SABAN HUB | Live Monitor</title>
      </Head>

      {/* Overlay הגנה: מופעל כשה-Bridge מנותק */}
      <AnimatePresence>
        {!isServerOnline && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0B141A]/90 backdrop-blur-md z-50 flex items-center justify-center p-8 text-right"
          >
            <div className="max-w-xs w-full bg-white rounded-[3rem] p-8 text-center shadow-2xl border-4 border-amber-500/20">
              <QrCode size={48} className="mx-auto text-amber-500 mb-4 animate-bounce" />
              <h2 className="text-slate-900 font-black uppercase tracking-tighter text-xl mb-2">Pipe Broken</h2>
              <p className="text-slate-500 text-[10px] font-bold mb-6 italic leading-relaxed">
                השרת במשרד ממתין לסינכרון. סרוק את הברקוד כדי לפתוח את הצינור.
              </p>
              <div className="bg-slate-100 p-4 rounded-3xl border-2 border-dashed border-slate-300 mb-6 aspect-square flex items-center justify-center overflow-hidden">
                 <Scan size={40} className="text-slate-300 opacity-50" />
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-4 bg-[#0B141A] text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              >
                Retry Connection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - רשימת לקוחות */}
        <aside className="w-80 border-l border-white/5 flex flex-col bg-[#111B21]">
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
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש לקוח..."
                className="w-full bg-[#202C33] border-none rounded-xl py-3 pr-11 pl-4 text-xs focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-right"
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
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-black text-slate-400 border border-white/10 shrink-0">
                  {customer.name?.charAt(0) || <User size={20} />}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[9px] opacity-40 font-medium tracking-tighter">LIVE</span>
                    <h3 className="text-sm font-bold truncate text-slate-100">{customer.name || customer.id}</h3>
                  </div>
                  <p className="text-[10px] text-emerald-500 font-bold italic truncate uppercase tracking-tighter">AI Agent Active</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Area - מסך הניטור */}
        <main className="flex-1 flex flex-col bg-[#0B141A] relative">
          {activeCustomer ? (
            <>
              <header className="p-4 bg-[#202C33] flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 animate-pulse">
                   AI מטפל בלקוח
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <h2 className="font-black text-sm text-white">{activeCustomer.name || activeCustomer.id}</h2>
                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Gemini Pipeline Active</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck size={20} />
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-right">
                 <div className="bg-amber-100/5 text-amber-500 text-[10px] font-black uppercase tracking-widest text-center py-2 px-6 rounded-full border border-amber-500/10 w-max mx-auto mb-8">
                   מסך מעקב בלבד - המערכת מנוהלת אוטומטית
                 </div>
                 {/* כאן תשתלב רשימת ההודעות מהקולקשן הרלוונטי */}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10">
              <MessageCircle size={80} className="mb-4" />
              <p className="font-black italic uppercase tracking-[0.4em] text-sm text-center leading-relaxed">
                Select Client to<br/>Audit Conversations
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
