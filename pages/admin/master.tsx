'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Users, BrainCircuit, Save, Activity, Database, Copy } from 'lucide-react';

// קונפיגורציה
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterControl() {
  const [activeTab, setActiveTab] = useState<'CRM' | 'DNA'>('CRM');
  const [customers, setCustomers] = useState<any[]>([]);
  const [botConfig, setBotConfig] = useState({ name: '', instructions: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 1. טעינת לקוחות מ-Supabase
    const fetchSB = async () => {
      const { data } = await supabase.from('customers').select('*').order('last_seen', { ascending: false });
      if (data) setCustomers(data);
    };

    // 2. טעינת DNA מ-Firebase (סנכרון חי)
    const unsubDNA = onSnapshot(doc(dbFS, 'settings', 'bot-dna'), (d) => {
      if (d.exists()) setBotConfig(d.data() as any);
    });

    fetchSB();
    return () => unsubDNA();
  }, []);

  const saveDNA = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(dbFS, 'settings', 'bot-dna'), { ...botConfig, updatedAt: serverTimestamp() });
      alert("המוח עודכן בהצלחה!");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      <nav className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" />
          <span className="font-black text-slate-800 uppercase">Saban OS Control</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('CRM')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'CRM' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-50'}`}>לקוחות</button>
          <button onClick={() => setActiveTab('DNA')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'DNA' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-50'}`}>המוח</button>
        </div>
      </nav>

      <main className="p-6 max-w-4xl mx-auto">
        {activeTab === 'CRM' ? (
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
             <div className="p-4 bg-slate-50 border-b font-bold flex items-center gap-2"><Users size={16}/> רשימת לקוחות Supabase</div>
             <div className="divide-y">
                {customers.map(c => (
                  <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-sm">{c.name || 'ללא שם'}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(`https://sidor.vercel.app/chat/${c.phone}`)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Copy size={16}/></button>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold flex items-center gap-2"><BrainCircuit size={20} className="text-emerald-500"/> הגדרות מוח הבוט</h2>
            <input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={botConfig.name} onChange={e => setBotConfig({...botConfig, name: e.target.value})} placeholder="שם הבוט" />
            <textarea className="w-full h-64 p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" value={botConfig.instructions} onChange={e => setBotConfig({...botConfig, instructions: e.target.value})} placeholder="הנחיות לבוט..." />
            <button onClick={saveDNA} disabled={isSaving} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              {isSaving ? <Activity className="animate-spin"/> : <Save size={18}/>} שמור שינויים
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
