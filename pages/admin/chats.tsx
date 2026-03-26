import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
// תיקון: הוספת QrCode לרשימת הייבוא מ-lucide-react
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

  useEffect(() => {
    try {
      const q = query(collection(dbFS, 'customers'), orderBy('lastMessageAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(data);
        setIsServerOnline(true);
      }, (err) => {
        console.error("Firestore error:", err);
        setIsServerOnline(false);
      });
      return () => unsub();
    } catch (e) {
      console.error("Connection failed:", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0B141A] text-slate-200 font-sans antialiased overflow-hidden flex flex-col">
      <Head>
        <title>SABAN HUB | Live Monitor</title>
      </Head>

      {!isServerOnline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0B141A]/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
          <div className="max-w-xs w-full bg-white rounded-[3rem] p-8 text-center shadow-2xl border-4 border-amber-500/20">
            {/* רכיב ה-QrCode כעת מיובא ותקין ל-TypeScript */}
            <QrCode size={48} className="mx-auto text-amber-500 mb-4 animate-bounce" />
            <h2 className="text-slate-900 font-black uppercase tracking-tighter text-xl mb-2">Pipe Broken</h2>
            <p className="text-slate-500 text-[10px] font-bold mb-6 italic leading-relaxed">השרת במשרד ממתין לסינכרון. סרוק את הברקוד כדי לפתוח את הצינור.</p>
            <div className="bg-slate-100 p-4 rounded-3xl border-2 border-dashed border-slate-300 mb-6 aspect-square flex items-center justify-center overflow-hidden">
               <AlertCircle size={40} className="text-slate-300" />
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-[#0B141A] text-white rounded-2xl font-black text-xs uppercase tracking-widest">Retry Connection</button>
          </div>
        </motion.div>
      )}

      {/* שאר הקוד נשאר ללא שינוי... */}
      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar and Main Chat content */}
      </div>
    </div>
  );
}
