'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, BrainCircuit, Save, Activity, Smartphone, 
  Send, Zap, MessageSquare, Database, ListChecks, 
  UserCheck, Mic, Terminal, Info
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
  const [chat, setChat] = useState<any[]>([{ role: 'assistant', content: 'בוס, המערכת מוכנה. מחכה להנחיות ה-DNA החדשות שלך.' }]);
  
  // המבנה המפוצל להעשרת ידע המוח
  const [brainDNA, setBrainDNA] = useState({
    contextIntegration: '', // סעיף 1: שילוב קונטקסט
    executionProtocol: '',  // סעיף 2: פרוטוקול ביצוע
    coreIdentity: '',       // סעיף 3: הגדרת DNA
    toneAndVoice: ''        // סעיף 4: טון דיבור
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'brain-core'), (d) => {
      if (d.exists()) setBrainDNA(d.data() as any);
    });
    return () => unsub();
  }, []);

  const saveSection = async (section: string) => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'brain-core'), { 
        ...brainDNA, 
        lastUpdated: serverTimestamp(),
        updatedBy: 'Rami'
      });
      alert(`סעיף עודכן בהצלחה! המוח הוטען בידע חדש.`);
    } catch (e) { alert("שגיאה בסנכרון"); }
    setLoading(false);
  };

  const runSimulation = () => {
    if (!simInput.trim()) return;
    const userMsg = simInput;
    setChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setSimInput('');

    // דימוי חוקי ה-DNA בתשובה
    setTimeout(() => {
      setChat(prev => [...prev, { 
        role: 'assistant', 
        content: `ניתוח לפי חוקי ראמי:\n1. קונטקסט: זוהה.\n2. ביצוע: בבדיקה.\nתשובה: בוס, קיבלתי את הפקודה "${userMsg}". פועל בדיוק לפי ה-DNA שהגדרת לי עכשיו. אין דמיון, רק ביצוע.` 
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans" dir="rtl">
      {/* Top Bar */}
      <nav className="bg-[#1E293B] text-white p-4 sticky top-0 z-50 shadow-2xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20"><ShieldCheck size={24}/></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Saban Brain OS - Admin</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Master Control v2.0</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-xs font-mono text-emerald-400">
            {loading ? 'SYNCING...' : 'DATABASE LIVE'}
          </div>
        </div>
      </nav>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1900px] mx-auto">
        
        {/* צד ימין: סעיפי העשרת ידע (DNA) */}
        <div className="lg:col-span-4 space-y-4">
          <SectionCard 
            title="1. השילוב בין ה-Context" 
            icon={<Database size={20}/>}
            value={brainDNA.contextIntegration}
            onChange={(v) => setBrainDNA({...brainDNA, contextIntegration: v})}
            onSave={() => saveSection('context')}
            description="איך המוח מחבר בין שם המשתמש, ההיסטוריה והצרכים של ראמי."
          />
          <SectionCard 
            title="2. פרוטוקול ביצוע" 
            icon={<Terminal size={20}/>}
            value={brainDNA.executionProtocol}
            onChange={(v) => setBrainDNA({...brainDNA, executionProtocol: v})}
            onSave={() => saveSection('execution')}
            description="חוקים נוקשים לפעולות: יומן, וייז, מיילים. מה עושים כשמשהו חסר."
          />
          <SectionCard 
            title="3. הגדרת DNA (זהות)" 
            icon={<BrainCircuit size={20}/>}
            value={brainDNA.coreIdentity}
            onChange={(v) => setBrainDNA({...brainDNA, coreIdentity: v})}
            onSave={() => saveSection('identity')}
            description="מי המוח? שותף של ראמי. לא רובוט, לא עוזר וירטואלי רגיל."
          />
          <SectionCard 
            title="4. טון דיבור: השותף החכם" 
            icon={<Mic size={20}/>}
            value={brainDNA.toneAndVoice}
            onChange={(v) => setBrainDNA({...brainDNA, toneAndVoice: v})}
            onSave={() => saveSection('tone')}
            description="השפה: חדה, עניינית, חברית ("בוס", "אח"). ללא מילים מיותרות."
          />
        </div>

        {/* מרכז: סימולטור אייפון לבדיקת חוקים */}
        <div className="lg:col-span-4 flex justify-center items-start pt-4">
          <div className="w-[320px] h-[660px] bg-[#121212] rounded-[55px] border-[10px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col p-3">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#121212] rounded-b-2xl z-20 flex justify-center items-end pb-1 gap-2">
                <div className="w-10 h-1 bg-slate-800 rounded-full"/>
             </div>
             
             <div className="flex-1 bg-[#0B141A] rounded-[40px] overflow-hidden flex flex-col border border-white/5">
                <div className="bg-[#202C33] p-4 pt-8 text-white flex items-center gap-3 border-b border-white/5">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-black text-xs">OS</div>
                  <div>
                    <div className="text-xs font-bold">Simulator Mode</div>
                    <div className="text-[8px] text-emerald-500 animate-pulse">TESTING NEW DNA...</div>
                  </div>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                  {chat.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-2.5 rounded-xl text-[11px] leading-tight ${m.role === 'user' ? 'bg-[#005C4B] text-white rounded-tr-none' : 'bg-[#202C33] text-slate-200 rounded-tl-none border border-white/5'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#111B21] flex gap-2">
                  <input 
                    value={simInput} onChange={(e) => setSimInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && runSimulation()}
                    placeholder="שלח הודעת בדיקה..."
                    className="flex-1 bg-[#2A3942] border-none rounded-full px-4 py-2 text-[10px] text-white outline-none"
                  />
                  <button onClick={runSimulation} className="bg-emerald-500 text-black p-2 rounded-full"><Send size={14}/></button>
                </div>
             </div>
          </div>
        </div>

        {/* צד שמאל: לוח בקרה לוגים ותצוגת חוקים פעילים */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="font-black flex items-center gap-2 mb-4 text-slate-800"><ListChecks className="text-blue-500"/> חוקים פעילים (Rami's Logic)</h2>
            <div className="space-y-3 text-xs text-slate-600 font-medium">
               <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                 <div className="bg-blue-500 text-white p-1 rounded-md mt-0.5"><UserCheck size={12}/></div>
                 <p>המוח לא ממציא נתונים. אם אין מידע ב-Context, הוא שואל את ראמי.</p>
               </div>
               <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                 <div className="bg-emerald-500 text-white p-1 rounded-md mt-0.5"><Zap size={12}/></div>
                 <p>ביצוע פקודות תמיד קודם לשיחה כללית.</p>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 h-[300px] overflow-hidden flex flex-col">
            <h2 className="text-white font-bold text-xs flex items-center gap-2 mb-4 uppercase tracking-widest opacity-50"><Terminal size={14}/> Live Console Log</h2>
            <div className="flex-1 font-mono text-[10px] text-emerald-400 space-y-1 opacity-80 overflow-y-auto">
              <div>[{new Date().toLocaleTimeString()}] System Booting...</div>
              <div>[{new Date().toLocaleTimeString()}] DNA Loaded: 4/4 sections.</div>
              <div>[{new Date().toLocaleTimeString()}] Simulator Ready for Rami.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// קומפוננטת כרטיס סעיף
function SectionCard({ title, icon, value, onChange, onSave, description }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-600">{icon}</div>
          <div>
            <h3 className="font-black text-sm text-slate-800">{title}</h3>
            <p className="text-[10px] text-slate-400 font-bold">{description}</p>
          </div>
        </div>
        <button onClick={onSave} className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"><Save size={16}/></button>
      </div>
      <textarea 
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs outline-none focus:ring-2 focus:ring-emerald-200 resize-none transition-all"
        placeholder="הזן הנחיות מפורטות לסעיף זה..."
      />
    </motion.div>
  );
}
