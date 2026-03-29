'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { database, db, app } from '../../lib/firebase'; // RTDB ו-App
import { ref, onValue } from 'firebase/database';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Firestore
import { 
  Plus, Save, Trash2, Zap, MessageSquare, 
  Settings, Play, GitBranch, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// הגנה ל-TypeScript ול-Build של Vercel
const dbFS = app ? getFirestore(app) : null;
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function SabanStudio() {
  const [mounted, setMounted] = useState(false);
  const [flow, setFlow] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // הגנה בתוך ה-Effect
    if (!dbFS || !database) return;

    // לוגיקת טעינת ה-Flow
    const loadFlow = async () => {
      const flowDoc = doc(dbFS, 'bot_configs', 'main_flow');
      const snap = await getDoc(flowDoc);
      if (snap.exists()) {
        setFlow(snap.data());
      }
    };

    loadFlow();
  }, []);

  const saveFlow = async () => {
    if (!dbFS) return;
    await setDoc(doc(dbFS, 'bot_configs', 'main_flow'), flow);
    alert('הסידור נשמר במאגר בהצלחה!');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex" dir="rtl">
      <Head>
        <title>SABAN STUDIO | Bot Builder</title>
      </Head>

      {/* Sidebar - Premium Design */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col p-8 shadow-sm z-30">
        <div className="flex items-center gap-4 mb-12">
          <img src={BRAND_LOGO} alt="Saban" className="w-12 h-12 rounded-2xl shadow-lg" />
          <h1 className="text-xl font-black tracking-tighter uppercase">Studio <span className="text-blue-600">v2</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20">
            <Layout size={20}/> בונה תזרים
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all">
            <Settings size={20}/> הגדרות AI
          </button>
        </nav>

        <button onClick={saveFlow} className="mt-auto bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl">
          <Save size={20}/> שמור תרשים
        </button>
      </aside>

      {/* Main Builder Area */}
      <main className="flex-1 p-12 bg-slate-50 relative overflow-hidden">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black tracking-tight">בונה תזרים הודעות</h2>
            <p className="text-slate-400 font-bold mt-1">נהל את חוכמת האפליקציה של סבן 94</p>
          </div>
          <div className="flex gap-4">
            <button className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-600"><Play size={20}/></button>
            <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-2">
              <Plus size={20}/> שלב חדש
            </button>
          </div>
        </div>

        {/* Canvas Placeholder */}
        <div className="w-full h-[600px] bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex items-center justify-center">
          <div className="text-center opacity-30">
            <GitBranch size={64} className="mx-auto mb-4" />
            <p className="font-black text-xl">גרור אלמנטים לכאן כדי לבנות סידור</p>
          </div>
        </div>
      </main>
    </div>
  );
}
