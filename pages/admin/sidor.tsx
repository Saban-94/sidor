'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, db } from '../../lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { 
  collection, query, onSnapshot, addDoc, 
  serverTimestamp, orderBy 
} from 'firebase/firestore';
import { 
  Users, BrainCircuit, Search, CheckCircle2, 
  Smartphone, Plus, Edit2, Trash2, Zap, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanSidorMaster() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'rules'>('customers');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // סנכרון Firestore (לקוחות)
    if (db) {
      const q = query(collection(db, 'customers'), orderBy('created_at', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomers(docs);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    // סנכרון Realtime Database (חוקי מערכת)
    if (database) {
      const rulesRef = ref(database, 'system_rules');
      const unsubscribe = onValue(rulesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRules(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleQuickAdd = async (type: 'customer' | 'rule') => {
    setIsSyncing(true);
    try {
      if (type === 'customer' && db) {
        await addDoc(collection(db, 'customers'), {
          name: 'לקוח חדש',
          phone: '050-0000000',
          status: 'active',
          created_at: serverTimestamp()
        });
      } else if (type === 'rule' && database) {
        const newRuleRef = push(ref(database, 'system_rules'));
        await set(newRuleRef, {
          title: 'חוק הפצה חדש',
          logic: 'בצע פעולה אוטומטית',
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN OS | SIDOR MASTER</title>
      </Head>

      {/* Sidebar HUD */}
      <aside className="w-80 bg-[#0B1120] border-l border-white/5 flex flex-col p-8 z-20 shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg animate-pulse">
            <Database size={24} />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-blue-500">OS</span></h1>
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

        <div className="mt-auto p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
            <Zap size={14} className="animate-bounce" />
            <span className="text-[10px] font-black uppercase italic">Live Sync Active</span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/[0.02]">
        <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
          <div className="relative w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              placeholder="חיפוש מהיר..."
              className="w-full bg-white/5 border border-white/10 p-3 pr-12 rounded-xl outline-none focus:border-blue-600 font-bold transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => handleQuickAdd(activeTab === 'customers' ? 'customer' : 'rule')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-xl shadow-blue-600/20"
          >
            <Plus size={20} />
            {activeTab === 'customers' ? 'לקוח חדש' : 'חוק חדש'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeTab === 'customers' ? (
                customers.filter(c => c.name?.includes(searchTerm)).map(customer => (
                  <div key={customer.id} className="bg-[#0B1120] border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all shadow-xl">
                    <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
                      <Smartphone size={20} />
                    </div>
                    <h3 className="text-lg font-black">{customer.name}</h3>
                    <p className="text-slate-500 font-bold text-sm mb-4">{customer.phone}</p>
                    <span className="text-[10px] text-emerald-500 font-black uppercase flex items-center gap-1 italic">
                      <CheckCircle2 size={12} /> Sync Online
                    </span>
                  </div>
                ))
              ) : (
                rules.map(rule => (
                  <div key={rule.id} className="bg-[#0B1120] border border-white/5 p-6 rounded-[2rem] relative border-r-4 border-r-blue-600">
                    <h3 className="text-md font-black text-blue-400 mb-2 uppercase">{rule.title}</h3>
                    <p className="text-xs text-slate-400 font-bold mb-4">{rule.logic}</p>
                    <div className={`w-2 h-2 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-sm uppercase tracking-tighter">{label}</span>
    </button>
  );
}
