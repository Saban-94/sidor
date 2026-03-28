'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, query, onSnapshot, doc, setDoc, 
  orderBy, limit, serverTimestamp, addDoc 
} from 'firebase/firestore';
import { 
  ShieldCheck, Users, BrainCircuit, Network, Save, 
  Activity, Trash2, Plus, Search, AlertTriangle, CheckCircle, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase - וודא שהמשתנים הללו מוגדרים ב-Vercel!
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
  const [botConfig, setBotConfig] = useState({ name: "סבן AI", instructions: "" });
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  
  // מערכת אבחון לוגים
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'ok' | 'error'>('waiting');

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);

  useEffect(() => {
    addLog("מנסה להתחבר ל-Firebase...");
    
    try {
      // 1. האזנה ללקוחות
      const q = query(collection(db, 'customers'), orderBy('lastSeen', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          addLog("⚠️ חיבור תקין, אבל קולקציית customers ריקה במאגר.");
        } else {
          addLog(`✅ נמצאו ${snapshot.size} לקוחות.`);
        }
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setConnectionStatus('ok');
      }, (err) => {
        addLog(`❌ שגיאת Firebase: ${err.message}`);
        setConnectionStatus('error');
      });

      // 2. האזנה ל-DNA (המוח)
      onSnapshot(doc(db, 'settings', 'bot-dna'), (d) => {
        if (d.exists()) {
          setBotConfig(d.data() as any);
          addLog("🧠 נתוני מוח נטענו.");
        }
      });

      return () => unsub();
    } catch (e: any) {
      addLog(`💥 קריסה מקומית: ${e.message}`);
      setConnectionStatus('error');
    }
  }, []);

  const handleInject = async () => {
    addLog("מנסה להזריק לקוח בדיקה...");
    try {
      await addDoc(collection(db, 'customers'), {
        name: "בדיקת מערכת",
        phone: "050-0000000",
        lastSeen: serverTimestamp(),
        status: "test"
      });
      addLog("✅ הזרקה הצליחה!");
    } catch (e: any) {
      addLog(`❌ הזרקה נכשלה: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans" dir="rtl">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 tracking-tight uppercase">Saban OS Master</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {connectionStatus === 'ok' ? 'System Live' : 'Connection Error'}
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

      {/* לוח אבחון (Diagnostics) */}
      <div className="max-w-6xl mx-auto px-6 mt-4">
        <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[10px] shadow-inner border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-800 pb-1">
            <Database size={12} /> DIAGNOSTIC LOGS:
          </div>
          {logs.map((log, i) => <div key={i} className="mb-1 opacity-90">{log}</div>)}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {/* CRM VIEW */}
          {activeTab === 'CRM' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-bold flex items-center gap-2 text-slate-700"><Users size={18} className="text-emerald-500" /> ניהול לקוחות</h2>
                  <button onClick={handleInject} className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-600 transition-all shadow-sm">
                    הזרק לקוח בדיקה 💉
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">
                      <AlertTriangle size={40} className="mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-sm">לא נמצאו לקוחות במאגר.</p>
                      <p className="text-[10px] mt-1 uppercase tracking-wider text-slate-300 italic">Check collection "customers" in Firestore</p>
                    </div>
                  ) : (
                    customers.map(c => (
                      <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">{c.name?.[0] || '?'}</div>
                          <div>
                            <div className="font-bold text-sm text-slate-800">{c.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-400 font-mono">{c.phone || 'No phone'}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">ACTIVE</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* DNA & FLOW VIEW */}
          {/* ... המשך הלוגיקה של ה-DNA וה-FLOW (כפי שמופיע בקוד הקודם) ... */}
        </AnimatePresence>
      </main>
    </div>
  );
}
