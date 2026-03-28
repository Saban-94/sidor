'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Users, BrainCircuit, Network, Database, Zap, Plus, Search, Copy, Trash2 } from 'lucide-react';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// אתחול Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterControl() {
  const [activeTab, setActiveTab] = useState<'CRM' | 'DNA' | 'FLOW'>('CRM');
  const [customers, setCustomers] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);

  useEffect(() => {
    addLog("מתחיל סנכרון מאגרים...");
    
    // מאזין ל-Firebase
    const unsub = onSnapshot(query(collection(db, 'customers'), orderBy('lastSeen', 'desc')), (snap) => {
      const fbData = snap.docs.map(d => ({ ...d.data(), source: 'firebase', id: d.id }));
      setCustomers(fbData); // כרגע מציג את פיירבייס, נמזג בהמשך עם סופבייס במידת הצורך
      addLog(`✅ Firebase: נמצאו ${snap.size} לקוחות`);
    });

    return () => unsub();
  }, []);

  const injectToBoth = async () => {
    addLog("מזריק לשני המאגרים...");
    const testUser = { name: "נציג סבן OS", phone: "050" + Math.floor(Math.random() * 1000000), status: 'active' };

    try {
      // הזרקה לפיירבייס
      await addDoc(collection(db, 'customers'), { ...testUser, lastSeen: serverTimestamp() });
      
      // הזרקה לסופבייס
      const { error } = await supabase.from('customers').insert([testUser]);
      if (error) throw error;

      addLog("✅ הזרקה כפולה הצליחה!");
    } catch (e: any) {
      addLog(`❌ כשל בהזרקה: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans" dir="rtl">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg"><ShieldCheck size={24} /></div>
          <h1 className="font-black text-slate-800 tracking-tight uppercase">Saban Master Control</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {['CRM', 'DNA', 'FLOW'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-4">
        <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[10px] shadow-inner border border-slate-800">
          <div className="text-slate-500 mb-1 border-b border-slate-800 pb-1 flex gap-2"><Database size={12}/> SYSTEM DIAGNOSTICS:</div>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'CRM' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold flex items-center gap-2"><Users size={18} className="text-emerald-500"/> מאגר לקוחות מאוחד</h2>
              <button onClick={injectToBoth} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-md">הזרק נתונים 💉</button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <div className="p-20 text-center text-slate-400 font-medium">הטבלה ריקה. לחץ על 'הזרק נתונים' לבדיקה.</div>
              ) : (
                customers.map(c => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black">{c.name?.[0]}</div>
                      <div>
                        <div className="font-bold text-sm">{c.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-bold uppercase">{c.source}</span>
                      <button className="p-2 text-slate-300 hover:text-blue-500"><Copy size={16}/></button>
                      <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
