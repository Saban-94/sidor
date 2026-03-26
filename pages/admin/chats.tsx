import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove, onChildAdded } from 'firebase/database';
import { 
  Network, Terminal, Send, PlayCircle, Eraser, Activity, 
  ShieldCheck, MessageCircle, UserCog, Clock, Power, Radio, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);
const dbRT = getDatabase(app);

const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function SabanPipeDiagnostics() {
  const [activeTab, setActiveTab] = useState<'NETWORK' | 'CHATS'>('NETWORK');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [testPhone, setTestPhone] = useState('0508861080');
  
  // 🔥 מערכת ניטור נתיבים הנדסית
  const [pipeLogs, setPipeLogs] = useState<any[]>([]);
  const [pathStats, setPathStats] = useState<any>({
    'rami/incoming': { count: 0, last: 0, active: false },
    'rami/outgoing': { count: 0, last: 0, active: false },
    'saban94/incoming': { count: 0, last: 0, active: false },
    'saban94/outgoing': { count: 0, last: 0, active: false }
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // 1. דופק שרת (Heartbeat)
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      if (snap.exists()) setServerStatus(prev => ({ ...prev, ...snap.val() }));
    });

    // 2. 🔥 Live Sniffer - מאזין לכל נתיב אפשרי (JONI & LOCAL)
    const allPaths = ['rami/incoming', 'rami/outgoing', 'saban94/incoming', 'saban94/outgoing'];
    
    allPaths.forEach(p => {
        onChildAdded(ref(dbRT, p), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const type = p.includes('incoming') ? 'IN' : 'OUT';
                setPipeLogs(prev => [{
                    id: snapshot.key,
                    time: Date.now(),
                    path: p,
                    type: type,
                    sender: data.sender || data.number || 'System',
                    text: data.text || data.message || 'Packet'
                }, ...prev].slice(0, 50));

                setPathStats((prev: any) => ({
                    ...prev,
                    [p]: { count: (prev[p]?.count || 0) + 1, last: Date.now(), active: true }
                }));

                setTimeout(() => {
                    setPathStats((curr: any) => ({ ...curr, [p]: { ...curr[p], active: false } }));
                }, 1000);
            }
        });
    });

    // 3. טעינת לקוחות בסיסית
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(50)), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, []);

  // שליחת הודעת בדיקה לנתיב נבחר
  const triggerPing = async (path: 'rami' | 'saban94') => {
    const target = `${path}/outgoing`;
    try {
        await push(ref(dbRT, target), {
            number: testPhone,
            message: `PING TEST: ${new Date().toLocaleTimeString()} (Path: ${target})`,
            timestamp: Date.now(),
            status: 'diagnostic'
        });
    } catch (e) { console.error(e); }
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000);

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0B141A] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`} dir="rtl">
      
      {/* Sidebar ניווט */}
      <aside className="w-16 bg-[#111B21] border-l border-white/5 flex flex-col items-center py-6 shrink-0 z-30 shadow-2xl">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl mb-8 overflow-hidden border border-white/10 shadow-lg">
            <img src={BRAND_LOGO} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 flex-1">
          {[{ id: 'NETWORK', icon: Network }, { id: 'CHATS', icon: MessageCircle }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-500 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}>
              <tab.icon size={24} />
            </button>
          ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-600 hover:text-emerald-500">
          {theme === 'dark' ? <Clock size={20} /> : <Activity size={20} />}
        </button>
      </aside>

      {/* אזור הבקרה המרכזי */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0B141A]">
        
        {/* Header סטטוס */}
        <header className="h-20 bg-[#202C33] border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-20 shadow-xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isTrulyOnline ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <Radio className={isTrulyOnline ? 'text-emerald-500' : 'text-red-500'} size={24}/>
            </div>
            <div>
                <h1 className="text-xl font-black italic tracking-tighter uppercase">Saban <span className="text-emerald-500">Diagnostics</span></h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    System Pulse: <span className={isTrulyOnline ? 'text-emerald-500' : 'text-red-500'}>{isTrulyOnline ? 'Active' : 'Offline'}</span> 
                    <span className="opacity-30">|</span> 
                    Lag: {(timeDiff/1000).toFixed(0)}s
                </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase">מכשיר לבדיקה:</span>
              <input value={testPhone} onChange={e => setTestPhone(e.target.value)} className="bg-transparent border-none outline-none text-xs font-mono font-bold text-emerald-500 w-32 text-left" dir="ltr" />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            
            {/* טור ימין: כרטיסי נתיבים */}
            <div className="w-80 border-l border-white/5 p-6 space-y-6 overflow-y-auto bg-[#111B21]/50 scrollbar-hide">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Channels</h3>
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                </div>
                
                {['rami', 'saban94'].map(sys => (
                    <div key={sys} className="space-y-3 p-4 bg-slate-900/80 rounded-[2rem] border border-white/5 shadow-2xl transition-all hover:border-emerald-500/20">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={12} className="text-emerald-500"/> {sys}
                            </span>
                            <button onClick={() => triggerPing(sys as any)} className="p-1.5 bg-emerald-500 text-[#111B21] rounded-lg hover:scale-110 active:scale-90 transition-all shadow-lg">
                                <PlayCircle size={16}/>
                            </button>
                        </div>
                        
                        {[`${sys}/incoming`, `${sys}/outgoing`].map(p => (
                            <div key={p} className={`p-3 rounded-xl border transition-all ${pathStats[p]?.active ? 'bg-emerald-500/20 border-emerald-500/40 scale-[1.02]' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase">{p.split('/')[1]}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${pathStats[p]?.active ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : (pathStats[p]?.last > 0) ? 'bg-emerald-900' : 'bg-slate-800'}`} />
                                </div>
                                <div className="mt-1 flex justify-between items-baseline">
                                    <span className="text-lg font-black text-slate-200">{pathStats[p]?.count || 0}</span>
                                    <button onClick={() => remove(ref(dbRT, p))} className="text-[8px] uppercase text-red-500/40 hover:text-red-500 transition-colors">Clear</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                <button onClick={() => update(ref(dbRT, 'saban94/status'), { reset_command: true })} className="w-full p-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-lg">
                    <Power size={14}/> Force Restart Bridge
                </button>
            </div>

            {/* טור שמאל: המלשינון (Sniffer) */}
            <div className="flex-1 flex flex-col bg-black/40 relative">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111B21]/30 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Terminal size={14} className="text-emerald-500"/>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-Time Data Streams</span>
                    </div>
                    <button onClick={() => setPipeLogs([])} className="text-[9px] text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors"><Eraser size={10}/> Clear Console</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 custom-scrollbar bg-[#0B141A]">
                    {pipeLogs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-4">
                            <Activity size={40} className="animate-pulse opacity-20"/>
                            <p className="italic font-bold">Listening to all pipes...</p>
                        </div>
                    )}
                    {pipeLogs.map((log, idx) => (
                        <div key={log.id || idx} className={`p-2 rounded-lg border-b border-white/5 flex gap-4 transition-all hover:bg-white/5 ${log.path.includes('saban94') ? 'bg-amber-500/5' : ''}`}>
                            <span className="text-blue-500 shrink-0 opacity-40">[{new Date(log.time).toLocaleTimeString()}]</span>
                            <span className={`font-black shrink-0 px-1.5 rounded ${log.type === 'IN' ? 'text-blue-400 bg-blue-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>{log.type}</span>
                            <span className="text-purple-400 font-bold shrink-0">{log.sender}:</span>
                            <span className="flex-1 truncate text-slate-300">"{log.text}"</span>
                            <span className={`opacity-20 text-[8px] font-black uppercase shrink-0 px-2 py-0.5 rounded border ${log.path.includes('rami') ? 'border-blue-500' : 'border-amber-500'}`}>{log.path}</span>
                        </div>
                    ))}
                </div>
                
                {/* Overlay לניתוק */}
                <AnimatePresence>
                    {!isTrulyOnline && serverStatus.qr && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0B141A]/90 backdrop-blur-md z-40 flex items-center justify-center p-8">
                            <div className="max-w-xs w-full bg-white rounded-[3rem] p-8 text-center shadow-2xl border-4 border-amber-500/20">
                                <QrCode size={48} className="mx-auto text-amber-500 mb-4 animate-bounce"/>
                                <h2 className="text-slate-900 font-black uppercase tracking-tighter text-xl mb-2">Pipe Broken</h2>
                                <p className="text-slate-500 text-[10px] font-bold mb-6 italic leading-relaxed">השרת במשרד ממתין לסינכרון. סרוק את הברקוד כדי לפתוח את הצינור.</p>
                                <div className="bg-slate-100 p-4 rounded-3xl border-2 border-dashed border-slate-300 mb-6 aspect-square flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-lg rounded-xl" />
                                </div>
                                <button onClick={() => update(ref(dbRT, 'saban94/status'), { reset_command: true })} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-red-700 transition-all">Restart System</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>

      </main>
    </div>
  );
}
