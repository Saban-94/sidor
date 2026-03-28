'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { 
  Users, BrainCircuit, Menu, X, ExternalLink, 
  Trash2, Search, Zap, ShieldCheck, MoreVertical, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול (וודא שה-ENV שלך מוגדר בורסל)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function MasterAdmin() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'CRM' | 'DNA'>('CRM');
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // האזנה לנתונים בזמן אמת
  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('lastSeen', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Firebase Error:", error));

    return () => unsub();
  }, []);

  const copyMagicLink = (phone: string) => {
    const link = `https://sidor.vercel.app/chat/${phone}`;
    navigator.clipboard.writeText(link);
    alert("לינק קסם הועתק!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header מותאם למובייל */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="font-bold tracking-tight text-slate-800">SABAN Control</span>
        </div>
        
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* תפריט המבורגר בנייד */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed inset-0 bg-white z-40 pt-20 px-6 space-y-4"
          >
            <button onClick={() => { setActiveTab('CRM'); setIsMenuOpen(false); }} className={`w-full p-4 rounded-xl text-right font-bold ${activeTab === 'CRM' ? 'bg-emerald-50 text-emerald-600' : ''}`}>ניהול לקוחות</button>
            <button onClick={() => { setActiveTab('DNA'); setIsMenuOpen(false); }} className={`w-full p-4 rounded-xl text-right font-bold ${activeTab === 'DNA' ? 'bg-emerald-50 text-emerald-600' : ''}`}>הגדרות בוט (DNA)</button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {activeTab === 'CRM' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <h1 className="text-2xl font-black text-slate-800">מאגר לקוחות</h1>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" placeholder="חיפוש לפי שם או טלפון..." 
                  className="bg-white border border-slate-200 rounded-xl py-2 pr-10 pl-4 w-full md:w-64 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* טבלת ניהול - Desktop & Card View למובייל */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="hidden md:grid grid-cols-5 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <div className="col-span-2">לקוח</div>
                <div>סטטוס</div>
                <div>לינק קסם</div>
                <div>פעולות</div>
              </div>

              <div className="divide-y divide-slate-100">
                {customers.filter(c => c.phone?.includes(search) || c.name?.includes(search)).map((customer) => (
                  <div key={customer.id} className="flex flex-col md:grid md:grid-cols-5 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                    <div className="col-span-2 flex items-center gap-3 w-full">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">{customer.name?.[0] || 'U'}</div>
                      <div>
                        <div className="font-bold text-slate-800">{customer.name || 'לקוח חדש'}</div>
                        <div className="text-xs text-slate-400 font-mono">{customer.phone}</div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto">
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-black uppercase">Active</span>
                    </div>

                    <div className="w-full md:w-auto">
                      <button 
                        onClick={() => copyMagicLink(customer.phone)}
                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Copy size={14} /> העתק לינק
                      </button>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><ExternalLink size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
