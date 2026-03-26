import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
// תיקון קריטי: הוספת QrCode לייבוא
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
  const [search, setSearch] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // מאזין ללקוחות בזמן אמת
  useEffect(() => {
    try {
      const q = query(collection(dbFS, 'customers'), orderBy('lastMessageAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(data);
        setIsServerOnline(true);
      }, (err) => {
        console.error("Firestore monitor error:", err);
        setIsServerOnline(false);
      });
      return () => unsub();
    } catch (e) {
      console.error("Monitor connection failed:", e);
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

      <AnimatePresence>
        {!isServerOnline && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0B141A]/90 backdrop-blur-md z-50 flex items-center justify-center p-8"
          >
            <div className="max-w-xs w-full bg-white rounded-[3rem] p-8 text-center shadow-2xl border-4 border-amber-500/20">
              {/* רכיב ה-QrCode כעת מיובא ותקין */}
              <QrCode size={48} className="mx-auto text-amber-500 mb-4 animate-bounce" />
              <h2 className="text-slate-900 font-black uppercase tracking-tighter text-xl mb-2 text-right">Pipe Broken</h2>
              <p className="text-slate-500 text-[10px] font-bold mb-6 italic leading-relaxed text-right">
                השרת במשרד ממתין לסינכרון. סרוק את הברקוד כדי לפתוח את הצינור.
              </p>
              <div className="bg-slate-100 p-4 rounded-3xl border-2 border-dashed border-slate-300 mb-6 aspect-square flex items-center justify-center overflow-hidden">
                 <AlertCircle size={40} className="text-slate-300 opacity-20" />
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
        <aside className="w-80 border-r border-white/5 flex flex-col bg-[#111B21]">
          <header className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                <Bot size={20} />
              </div>
              <h1 className="text-lg font-black italic tracking-tighter">SABAN <span className="text-emerald-500">HUB</span></h1>
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

          <div className="flex-1 overflow-y-auto">
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
                  <h3 className="text-sm font-bold truncate text-slate-100">{customer.name || customer.id}</h3>
                  <p className="text-[10px] text-emerald-500 font-bold italic tracking-tighter uppercase">AI Agent Active</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#0B141A]">
          {activeCustomer ? (
            <>
              <header className="p-4 bg-[#202C33] flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20 text-right">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-right">
                    <h2 className="font-black text-sm text-white">{activeCustomer.name || activeCustomer.id}</h2>
                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Gemini Pipeline</p>
                  </div>
                </div>
              </header>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-right">
                 <div className="bg-amber-100/5 text-amber-500 text-[10px] font-black uppercase tracking-widest text-center py-2 px-6 rounded-full border border-amber-500/10 w-max mx-auto mb-8">
                   Monitoring Only - System Managed by AI
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10">
              <MessageCircle size={80} className="mb-4 text-white" />
              <p className="font-black italic uppercase tracking-[0.4em] text-white">Select Pipeline</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
