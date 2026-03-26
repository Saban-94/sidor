import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove, onChildAdded } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, UserCog, Building, MapPin, CreditCard, Power, X, Search, 
  Merge, CheckCircle2, Wifi, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, Terminal, Database, ArrowRightLeft, 
  Loader2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle, Settings2, Link2, Globe, Eraser, GitBranch, Radio, PlayCircle
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

export default function SabanMasterHub() {
  const [activeTab, setActiveTab] = useState<'NETWORK' | 'CHATS' | 'CRM'>('NETWORK'); // ברירת מחדל לבדיקת רשת
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null });
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // 🔥 מערכת ניטור נתיבים הנדסית
  const [pipeLogs, setPipeLogs] = useState<any[]>([]);
  const [pathStats, setPathStats] = useState<any>({
    'rami/incoming': { count: 0, last: 0, active: false },
    'rami/outgoing': { count: 0, last: 0, active: false },
    'saban94/incoming': { count: 0, last: 0, active: false },
    'saban94/outgoing': { count: 0, last: 0, active: false }
  });

  const [testPhone, setTestPhone] = useState('0508861080');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // 1. דופק שרת כללי
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      if (snap.exists()) setServerStatus(prev => ({ ...prev, ...snap.val() }));
    });

    // 2. 🔥 Multi-Path Sniffer: מאזין לכל עורקי הנתונים
    const paths = ['rami/incoming', 'rami/outgoing', 'saban94/incoming', 'saban94/outgoing'];
    
    paths.forEach(p => {
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
                    text: data.text || data.message || 'Data Packet'
                }, ...prev].slice(0, 50));

                setPathStats((prev: any) => ({
                    ...prev,
                    [p]: { count: (prev[p]?.count || 0) + 1, last: Date.now(), active: true }
                }));

                setTimeout(() => {
                    setPathStats((curr: any) => ({
                        ...curr,
                        [p]: { ...curr[p], active: false }
                    }));
                }, 1500);
            }
        });
    });

    return () => clearInterval(timer);
  }, []);

  // פונקציית בדיקת "פינג" לנתיב ספציפי
  const sendTestPing = async (path: 'rami' | 'saban94') => {
    const targetPath = `${path}/outgoing`;
    try {
        await push(ref(dbRT, targetPath), {
            number: testPhone,
            message: `PING TEST: ${new Date().toLocaleTimeString()} (Path: ${targetPath})`,
            timestamp: Date.now(),
            status: 'diagnostic-test'
        });
    } catch (e) {
        console.error("Ping Error:", e);
    }
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000);

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0B141A] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`} dir="rtl">
      
      {/* Sidebar ניווט מינימלי */}
      <aside className="w-16 bg-[#111B21] border-l border-white/5 flex flex-col items-center py-6 shrink-0 z-30">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl mb-8 overflow-hidden"><img src={BRAND_LOGO} className="w-full h-full object-cover" /></div>
        <div className="flex flex-col gap-6 flex-1">
          {[
            { id: 'NETWORK', icon: Network },
            { id: 'CHATS', icon: MessageCircle },
            { id: 'CRM', icon: UserCog }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-500'}`}>
              <tab.icon size={24} />
            </button>
          ))}
        </div>
      </aside>

      {/* אזור הבדיקה המרכזי */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0B141A]">
        
        {/* Header סטטוס */}
        <header className="h-20 bg-[#202C33] border-b border-white/5 flex items-center justify-between px-8 shrink-0 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl"><Network className="text-emerald-500" size={24}/></div>
            <div>
                <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">DIAGNOSTICS</span></h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isTrulyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    System Pulse: {isTrulyOnline ? 'Connected' : 'Disconnected'} ({(timeDiff/1000).toFixed(0)}s lag)
                </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black text-slate-500 mr-2 uppercase">טלפון לטסט:</span>
              <input value={testPhone} onChange={e => setTestPhone(e.target.value)} className="bg-transparent border-none outline-none text-xs font-mono font-bold text-emerald-500 w-32" />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            
            {/* טור ימין: כרטיסי נתיבים */}
            <div className="w-96 border-l border-white/5 p-6 space-y-6 overflow-y-auto bg-[#111B21]/50">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Pipeline Status</h3>
                
                {['rami', 'saban94'].map(sys => (
                    <div key={sys} className="space-y-3 p-4 bg-slate-900/50 rounded-[2rem] border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-white uppercase tracking-widest">{sys} System</span>
                            <button onClick={() => sendTestPing(sys as any)} className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all">
                                <PlayCircle size={16}/>
                            </button>
                        </div>
                        
                        {[`${sys}/incoming`, `${sys}/outgoing`].map(p => (
                            <div key={p} className={`p-3 rounded-xl border transition-all ${pathStats[p]?.active ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase">{p.split('/')[1]}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${pathStats[p]?.active ? 'bg-emerald-500 animate-ping' : (Date.now() - pathStats[p]?.last < 300000 && pathStats[p]?.last !== 0) ? 'bg-emerald-800' : 'bg-slate-800'}`} />
                                </div>
                                <div className="mt-1 flex justify-between items-baseline">
                                    <span className="text-lg font-black text-slate-200">{pathStats[p]?.count || 0}</span>
                                    <span className="text-[8px] font-mono opacity-30 italic">pkts processed</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                <button onClick={() => update(ref(dbRT, 'saban94/status'), { reset_command: true })} className="w-full p-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95">
                    <Power size={14}/> Force Restart Bridge
                </button>
            </div>

            {/* טור שמאל: לוגים חיים (The Sniffer) */}
            <div className="flex-1 flex flex-col bg-black/40">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={12}/> Live Packet Sniffer</span>
                    <button onClick={() => setPipeLogs([])} className="text-[9px] text-slate-600 hover:text-red-400 flex items-center gap-1"><Eraser size={10}/> Clear Console</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2 custom-scrollbar">
                    {pipeLogs.length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-700 italic">
                            Waiting for traffic on any path...
                        </div>
                    )}
                    {pipeLogs.map((log, idx) => (
                        <div key={log.id || idx} className={`p-2 rounded-lg border-b border-white/5 flex gap-4 transition-all hover:bg-white/5 ${log.path.includes('saban94') ? 'text-amber-200' : 'text-slate-100'}`}>
                            <span className="text-blue-500 shrink-0 opacity-60">[{new Date(log.time).toLocaleTimeString()}]</span>
                            <span className={`font-black shrink-0 ${log.type === 'IN' ? 'text-blue-400' : 'text-emerald-400'}`}>{log.type}</span>
                            <span className="text-purple-400 font-bold shrink-0">{log.sender}:</span>
                            <span className="flex-1 truncate opacity-90">"{log.text}"</span>
                            <span className="opacity-20 text-[8px] uppercase font-bold shrink-0">{log.path}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>

      </main>

      {/* מודל QR - קופץ רק אם באמת מנותק ויש ברקוד */}
      <AnimatePresence>
        {(!isTrulyOnline && serverStatus.qr) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B141A]/98 backdrop-blur-3xl">
             <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative border-4 border-amber-500/30">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl text-white animate-bounce"><QrCode size={32} /></div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2">Sync Required</h2>
                <p className="text-slate-500 text-xs mb-8">סרוק כדי לפתוח את צינור הנתונים.</p>
                <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-slate-200 mb-8 aspect-square flex items-center justify-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-lg rounded-xl border-4 border-white" alt="QR" />
                </div>
                <button onClick={() => update(ref(dbRT, 'saban94/status'), { reset_command: true })} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Restart System</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
