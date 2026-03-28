'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, BrainCircuit, Save, Activity, Smartphone, 
  Send, Zap, Database, ListChecks, Terminal, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- אתחול קליינטים ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function SabanBrainOS() {
  const [loading, setLoading] = useState(false);
  const [simInput, setSimInput] = useState('');
  const [chat, setChat] = useState<any[]>([{ role: 'assistant', content: 'בוס, המערכת מוכנה להנחיות ה-DNA החדשות שלך.' }]);
  
  const [brainDNA, setBrainDNA] = useState({
    contextIntegration: '', 
    executionProtocol: '',  
    coreIdentity: '',       
    toneAndVoice: ''        
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'brain-core'), (d) => {
      if (d.exists()) setBrainDNA(d.data() as any);
    });
    return () => unsub();
  }, []);

  const saveAll = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'brain-core'), { 
        ...brainDNA, 
        lastUpdated: serverTimestamp(),
        updatedBy: 'Rami'
      });
      alert('ה-DNA של המוח עודכן בהצלחה!');
    } catch (e) { 
      console.error(e);
      alert("שגיאה בסנכרון"); 
    }
    setLoading(false);
  };

  const runSimulation = () => {
    if (!simInput.trim()) return;
    const userMsg = simInput;
    setChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setSimInput('');

    setTimeout(() => {
      setChat(prev => [...prev, { 
        role: 'assistant', 
        content: `בוס, קיבלתי: "${userMsg}". פועל לפי ה-DNA: שילוב קונטקסט מלא, ביצוע ללא דמיון. אני יד ימינך.` 
      }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <nav className="bg-[#1E293B] text-white p-4 sticky top-0 z-50 shadow-2xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg"><ShieldCheck size={24}/></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Saban OS</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Master Intelligence</p>
          </div>
        </div>
        <button onClick={saveAll} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
          {loading ? <Activity className="animate-spin" size={16}/> : <Save size={16}/>} שמור DNA מערכתי
        </button>
      </nav>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1800px] mx-auto">
        
        {/* DNA Sections */}
        <div className="lg:col-span-4 space-y-4">
          <SectionCard 
            title="1. שילוב ה-Context" 
            icon={<Database size={20}/>}
            value={brainDNA.contextIntegration}
            onChange={(v: string) => setBrainDNA({...brainDNA, contextIntegration: v})}
            description="חיבור שם משתמש, היסטוריה וצרכי הבוס."
          />
          <SectionCard 
            title="2. פרוטוקול ביצוע" 
            icon={<Terminal size={20}/>}
            value={brainDNA.executionProtocol}
            onChange={(v: string) => setBrainDNA({...brainDNA, executionProtocol: v})}
            description="חוקים לביצוע פגישות, ניווט ומיילים."
          />
          <SectionCard 
            title="3. הגדרת ה-DNA" 
            icon={<BrainCircuit size={20}/>}
            value={brainDNA.coreIdentity}
            onChange={(v: string) => setBrainDNA({...brainDNA, coreIdentity: v})}
            description="הזהות של המוח כשותף עסקי של ראמי."
          />
          <SectionCard 
            title="4. טון דיבור" 
            icon={<Mic size={20}/>}
            value={brainDNA.toneAndVoice}
            onChange={(v: string) => setBrainDNA({...brainDNA, toneAndVoice: v})}
            description="שפה חדה ועניינית (בוס, אח, שותף)."
          />
        </div>

        {/* Center: Smartphone Simulator */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-[320px] h-[650px] bg-[#121212] rounded-[55px] border-[10px] border-[#222] shadow-2xl relative overflow-hidden flex flex-col p-3">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#121212] rounded-b-2xl z-20 flex justify-center items-end pb-1">
                <div className="w-10 h-1 bg-slate-800 rounded-full"/>
             </div>
             
             <div className="flex-1 bg-[#0B141A] rounded-[40px] overflow-hidden flex flex-col">
                <div className="bg-[#202C33] p-4 pt-8 text-white flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-black text-xs font-mono">OS</div>
                    <div className="text-xs font-bold leading-none">Simulation<br/><span className="text-[8px] text-emerald-500 opacity-70 uppercase">Rami Logic</span></div>
                  </div>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {chat.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-2.5 rounded-xl text-[10px] leading-tight ${m.role === 'user' ? 'bg-[#005C4B] text-white rounded-tr-none' : 'bg-[#202C33] text-slate-200 rounded-tl-none border border-white/5'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#111B21] flex gap-2">
                  <input 
                    value={simInput} onChange={(e) => setSimInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && runSimulation()}
                    className="flex-1 bg-[#2A3942] border-none rounded-full px-4 py-2 text-[10px] text-white outline-none"
                    placeholder="כתוב פקודה לבדיקה..."
                  />
                  <button onClick={runSimulation} className="bg-emerald-500 text-black p-2 rounded-full transition-transform active:scale-90"><Send size={14}/></button>
                </div>
             </div>
          </div>
        </div>

        {/* Left: Logic Status & Logs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="font-black flex items-center gap-2 mb-4 text-slate-800 uppercase text-xs tracking-widest"><ListChecks className="text-blue-500" size={16}/> חוקי הברזל של ראמי</h2>
            <div className="space-y-3 text-[11px] text-slate-600 font-bold">
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"/>
                  <p>המוח אינו פועל מדמיונו - רק לפי ה-DNA שהוזן בממשק זה.</p>
               </div>
               <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0"/>
                  <p>כל תשובה חייבת להיות ביצועית ולהסתיים בשורת TL;DR מודגשת.</p>
               </div>
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl h-[300px] flex flex-col font-mono text-[9px] text-emerald-400 overflow-hidden">
             <div className="text-slate-500 mb-3 border-b border-slate-800 pb-2 flex justify-between items-center uppercase tracking-widest">
               <span>System Console</span>
               <span className="animate-pulse">● Live</span>
             </div>
             <div className="space-y-1.5 opacity-80 overflow-y-auto">
                <div>[{new Date().toLocaleTimeString()}] DNA synchronization active...</div>
                <div>[{new Date().toLocaleTimeString()}] Simulation engine initialized.</div>
                <div>[{new Date().toLocaleTimeString()}] Security protocol: Rami Only.</div>
                <div className="text-slate-600 mt-4 italic">// Waiting for input...</div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function SectionCard({ title, icon, value, onChange, description }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 hover:border-emerald-200 transition-colors group">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">{icon}</div>
        <div>
          <h3 className="font-black text-sm text-slate-800">{title}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{description}</p>
        </div>
      </div>
      <textarea 
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-28 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs outline-none focus:ring-2 focus:ring-emerald-200 resize-none transition-all placeholder:opacity-50"
        placeholder="הזן פקודות DNA כאן..."
      />
    </div>
  );
}
