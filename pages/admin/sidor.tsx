'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, db } from '../../lib/firebase';
import { ref, onValue, push, set, update } from 'firebase/database';
import { 
  collection, query, onSnapshot, doc, 
  addDoc, serverTimestamp, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Users, BrainCircuit, Save, Search, CheckCircle2, 
  Smartphone, Plus, Edit2, Trash2, Activity, Send, 
  Zap, ShieldCheck, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CRMMasterSync() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'rules'>('customers');

  // סנכרון מלא מול Firestore (לקוחות)
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomers(docs);
    });
    return () => unsubscribe();
  }, []);

  // סנכרון מלא מול Realtime Database (חוקי מוח ופקודות)
  useEffect(() => {
    if (!database) return;
    const rulesRef = ref(database, 'system_rules');
    const unsubscribe = onValue(rulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRules(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleQuickAdd = async (type: 'customer' | 'rule') => {
    setIsSyncing(true);
    try {
      if (type === 'customer') {
        await addDoc(collection(db, 'customers'), {
          name: 'לקוח חדש',
          phone: '050-0000000',
          status: 'active',
          created_at: serverTimestamp()
        });
      } else {
        const newRuleRef = push(ref(database, 'system_rules'));
        await set(newRuleRef, {
          title: 'חוק הפצה חדש',
          logic: 'אם הזמנה > X בצע Y',
          active: true,
          updatedAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN CRM | SYNC MASTER</title>
      </Head>

      {/* Sidebar - Control HUD */}
      <aside className="w-80 bg-[#0B1120] border-l border-white/5 flex flex-col p-8 z-20 shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg animate-pulse">
            <Database size={24} />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter">CRM SYNC</h1>
        </div>

        <nav className="space-y-2">
          <TabButton 
            active={activeTab === 'customers'} 
            onClick={() => setActiveTab('customers')}
            icon={<Users size={18}/>} 
            label="ניהול לקוחות" 
          />
          <TabButton 
            active={activeTab === 'rules'} 
            onClick={() => setActiveTab('rules')}
            icon={<BrainCircuit size={18}/>} 
            label="חוקי המוח" 
          />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Zap size={14} />
              <span className="text-[10px] font-black uppercase">סנכרון פעיל</span>
            </div>
            <p className="text-xs font-bold text-slate-400 italic text-center">מחובר ל-Firebase & Supabase</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="חפש לקוח, חוק או פקודה..."
                className="w-full bg-white/5 border border-white/10 p-3 pr-12 rounded-xl outline-none focus:border-blue-600 transition-all font-bold"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            onClick={() => handleQuickAdd(activeTab === 'customers' ? 'customer' : 'rule')}
            className="mr-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={20} />
            {activeTab === 'customers' ? 'הוסף לקוח' : 'חוק חדש'}
          </button>
        </header>

        {/* Dynamic Grid */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeTab === 'customers' ? (
                customers.filter(c => c.name?.includes(searchTerm)).map(customer => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))
              ) : (
                rules.map(rule => (
                  <RuleCard key={rule.id} rule={rule} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function CustomerCard({ customer }: any) {
  return (
    <div className="bg-[#0B1120] border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all group shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/5 p-3 rounded-2xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
          <Smartphone size={20} />
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 hover:text-emerald-400"><Edit2 size={16}/></button>
          <button className="p-2 hover:text-red-400"><Trash2 size={16}/></button>
        </div>
      </div>
      <h3 className="text-lg font-black mb-1">{customer.name}</h3>
      <p className="text-slate-500 font-bold text-sm mb-4">{customer.phone}</p>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
        <CheckCircle2 size={12} /> פעיל במערכת
      </div>
    </div>
  );
}

function RuleCard({ rule }: any) {
  return (
    <div className="bg-[#0B1120] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
      <h3 className="text-md font-black mb-2 text-blue-400">{rule.title}</h3>
      <p className="text-xs text-slate-400 font-bold leading-relaxed mb-4">{rule.logic}</p>
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-slate-500">ID: {rule.id.slice(-4)}</span>
        <div className={`w-2 h-2 rounded-full ${rule.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
