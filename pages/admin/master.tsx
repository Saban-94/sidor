'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, query, onSnapshot, doc, setDoc, 
  orderBy, limit, serverTimestamp, addDoc 
} from 'firebase/firestore';
import { 
  ShieldCheck, Users, BrainCircuit, Network, Save, 
  Activity, Trash2, Plus, Search, Zap, Info, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function MasterControl() {
  const [activeTab, setActiveTab] = useState<'CRM' | 'DNA' | 'FLOW'>('CRM');
  const [customers, setCustomers] = useState<any[]>([]);
  const [botConfig, setBotConfig] = useState({ name: "סבן AI", instructions: "", tone: "מקצועי" });
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isSaving, setIsSaving] = useState(false);

  // 1. חיבור ובדיקת דופק למאגרים
  useEffect(() => {
    try {
      // האזנה ללקוחות
      const qUsers = query(collection(db, 'customers'), orderBy('lastSeen', 'desc'), limit(50));
      const unsubUsers = onSnapshot(qUsers, (snap) => {
        setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setDbStatus('connected');
      }, (err) => {
        console.error("Firestore Error:", err);
        setDbStatus('error');
      });

      // האזנה ל-DNA
      const unsubDNA = onSnapshot(doc(db, 'settings', 'bot-dna'), (d) => {
        if (d.exists()) setBotConfig(d.data() as any);
      });

      // האזנה ל-FLOW
      const unsubFlow = onSnapshot(collection(db, 'bot-flow'), (snap) => {
        setFlowNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubUsers(); unsubDNA(); unsubFlow(); };
    } catch (e) {
      setDbStatus('error');
    }
  }, []);

  // 2. פונקציות ניהול
  const saveDNA = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'bot-dna'), { ...botConfig, updatedAt: serverTimestamp() });
      alert("המוח עודכן!");
    } finally { setIsSaving(false); }
  };

  const injectTest = async () => {
    await addDoc(collection(db, 'customers'), {
      name: "בדיקת מערכת",
      phone: "050-0000000",
      lastSeen: serverTimestamp(),
      status: "test"
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans" dir="rtl">
      {/* Top Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-emerald-200 shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 tracking-tighter uppercase">Saban OS Master</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {dbStatus === 'connected' ? 'Database Connected' : 'Connection Error'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {['CRM', 'DNA', 'FLOW'].map((t) => (
            <button
              key={t} onClick={() => setActiveTab(t as any)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === t ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'CRM' ? 'לקוחות' : t === 'DNA' ? 'המוח' : 'זרימה'}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {/* CRM VIEW */}
          {activeTab === 'CRM' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-bold flex items-center gap-2"><Users size={18} className="text-emerald-500" /> ניהול לקוחות</h2>
                  <button onClick={injectTest} className="text-[10px] font-black uppercase text-emerald-600 hover:underline">הזרק בדיקה</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-medium">אין נתונים ב-customers. וודא שהקולקציה קיימת.</div>
                  ) : (
                    customers.map(c => (
                      <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{c.name?.[0]}</div>
                          <div>
                            <div className="font-bold text-sm text-slate-800">{c.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* DNA VIEW */}
          {activeTab === 'DNA' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <BrainCircuit className="text-emerald-500" size={28} />
                  <h2 className="text-xl font-bold">הגדרות ליבת המוח</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">שם הנציג</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500/20" value={botConfig.name} onChange={e => setBotConfig({...botConfig, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">הנחיות מערכת (Prompt)</label>
                    <textarea className="w-full h-64 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none text-sm leading-relaxed" value={botConfig.instructions} onChange={e => setBotConfig({...botConfig, instructions: e.target.value})} />
                  </div>
                  <button onClick={saveDNA} disabled={isSaving} className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                    {isSaving ? <Activity className="animate-spin" /> : <Save size={20} />} שמור שינויים
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* FLOW VIEW */}
          {activeTab === 'FLOW' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2"><Network size={18} className="text-blue-500" /> תרשים זרימה</h2>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-md shadow-blue-100"><Plus size={16} /> הוסף שלב</button>
              </div>
              {flowNodes.map((n, i) => (
                <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-6 shadow-sm border-r-4 border-r-blue-500">
                  <div className="font-black text-blue-500 text-xl opacity-20">{i+1}</div>
                  <div className="flex-1 space-y-3">
                    <input className="font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-200 w-full outline-none pb-1" value={n.title} />
                    <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs h-20 outline-none focus:border-blue-200" value={n.prompt} />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
