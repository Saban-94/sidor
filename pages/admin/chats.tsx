import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove, onChildAdded } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, UserCog, Building, MapPin, CreditCard, Power, X, Search, 
  Merge, CheckCircle2, Wifi, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, Terminal, Database, ArrowRightLeft, 
  Loader2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle, Settings2, Link2, Globe, Eraser, GitBranch, Radio
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
  const [activeTab, setActiveTab] = useState<'CHATS' | 'CRM' | 'FLOW' | 'NETWORK'>('CHATS');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  
  // 🔥 מערכת ניטור נתיבים רב-מוקדית
  const [pipeLogs, setPipeLogs] = useState<any[]>([]);
  const [pathStatus, setPathStatus] = useState({
    'rami/incoming': { count: 0, last: 0, active: false },
    'rami/outgoing': { count: 0, last: 0, active: false },
    'saban94/incoming': { count: 0, last: 0, active: false },
    'saban94/outgoing': { count: 0, last: 0, active: false }
  });

  const [sysConfig, setSysConfig] = useState({
    activePath: 'rami', // ניתן להחליף בין rami ל-saban94
    msgDelay: 2
  });

  const [editCrm, setEditCrm] = useState<any>({ name: '', comaxId: '', dnaContext: '', photo: '' });
  const scrollRef = useRef<HTMLDivElement>(null);

  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000); 

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // 1. דופק שרת
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      if (snap.exists()) setServerStatus(prev => ({ ...prev, ...snap.val() }));
    });

    // 2. 🔥 Dual Sniffer - מאזין לכל הנתיבים במקביל
    const allPaths = ['rami/incoming', 'rami/outgoing', 'saban94/incoming', 'saban94/outgoing'];
    
    allPaths.forEach(p => {
        onChildAdded(ref(dbRT, p), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setPipeLogs(prev => [{
                    ...data, 
                    id: snapshot.key, 
                    time: Date.now(), 
                    path: p,
                    type: p.includes('incoming') ? 'IN' : 'OUT'
                }, ...prev].slice(0, 50));

                setPathStatus(prev => ({
                    ...prev,
                    [p]: { count: prev[p as keyof typeof prev].count + 1, last: Date.now(), active: true }
                }));
                
                // כיבוי נורית חיווי אחרי 2 שניות
                setTimeout(() => {
                    setPathStatus(current => ({
                        ...current,
                        [p]: { ...current[p as keyof typeof prev], active: false }
                    }));
                }, 2000);
            }
        });
    });

    // 3. תור שליחה פעיל
    onValue(ref(dbRT, `${sysConfig.activePath}/outgoing`), (snap) => {
        setQueueCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    // 4. CRM
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(100)), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, [sysConfig.activePath]);

  useEffect(() => {
    if (!selectedCustomer) return;
    setEditCrm({
      name: selectedCustomer.name || '',
      comaxId: selectedCustomer.comaxId || '',
      dnaContext: selectedCustomer.dnaContext || '',
      photo: selectedCustomer.photo || ''
    });

    const unsubChat = onSnapshot(query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'), limit(50)), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });
    return () => unsubChat();
  }, [selectedCustomer?.id]);

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    const targetId = selectedCustomer.id; 
    setChatInput('');

    try {
      await updateDoc(doc(dbFS, 'customers', targetId), { botState: 'HUMAN_RAMI', lastUpdated: serverTimestamp() });
      // שליחה לנתיב שנבחר כפעיל (rami או saban94)
      await push(ref(dbRT, `${sysConfig.activePath}/outgoing`), { 
        number: targetId, 
        message: txt, 
        timestamp: Date.now(),
        status: 'pending'
      });
      
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual' 
      });
    } catch (e) { console.error(e); }
  };

  const handleHardReset = async () => {
    if (window.confirm("ריסטרט קשיח לשרת?")) {
        await update(ref(dbRT, 'saban94/status'), { reset_command: true, online: false, qr: null });
    }
  };

  const clearQueue = async (path: string) => {
    if (window.confirm(`לנקות את ${path}?`)) {
        await remove(ref(dbRT, path));
    }
  };

  const filtered = customers.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0B141A] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`} dir="rtl">
      
      {/* 1. Sidebar ניווט */}
      <aside className="w-16 bg-[#111B21] border-l border-white/5 flex flex-col items-center py-6 z-30 shadow-2xl shrink-0">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl mb-8 overflow-hidden cursor-pointer active:scale-95 transition-transform">
          <img src={BRAND_LOGO} alt="logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 flex-1 text-slate-500">
          {[
            { id: 'CHATS', icon: MessageCircle },
            { id: 'CRM', icon: UserCog },
            { id: 'FLOW', icon: GitBranch },
            { id: 'NETWORK', icon: Network }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-500 shadow-inner' : 'hover:text-slate-300'}`}
            >
              <tab.icon size={24} />
            </button>
          ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-600 hover:text-emerald-500 transition-colors">
          {theme === 'dark' ? <Clock size={20} /> : <Activity size={20} />}
        </button>
      </aside>

      {/* 2. Side Panel - רשימה / בדיקת נתיבים */}
      <aside className="w-80 bg-[#111B21] border-l border-white/5 flex flex-col z-20 shadow-xl overflow-hidden shrink-0">
        <header className="p-4 border-b border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-slate-200 text-sm tracking-widest uppercase">Saban Hub</h2>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {isTrulyOnline ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          {activeTab !== 'NETWORK' && (
            <div className="relative">
                <Search className="absolute right-2.5 top-2 text-slate-600" size={14}/>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש..." className="w-full bg-[#202C33] p-2 pr-9 rounded-lg border-none outline-none text-xs text-slate-200" />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {activeTab === 'NETWORK' ? (
                <div className="p-4 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Diagnostic Pipe Monitor</h3>
                    
                    <div className="space-y-2">
                        {Object.entries(pathStatus).map(([path, stats]) => (
                            <div key={path} className={`p-3 rounded-xl border border-white/5 transition-all ${stats.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/20'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-mono text-slate-400">{path}</span>
                                    <div className={`w-2 h-2 rounded-full ${stats.active ? 'bg-emerald-500 animate-ping' : stats.last > 0 ? 'bg-emerald-900' : 'bg-slate-800'}`} />
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-slate-200">{stats.count} pkts</span>
                                    <button onClick={() => clearQueue(path)} className="text-[8px] uppercase text-red-500/60 hover:text-red-500">נקה</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">נתיב שליחה נוכחי</label>
                        <div className="flex bg-black/40 p-1 rounded-lg gap-1">
                            {['rami', 'saban94'].map(p => (
                                <button key={p} onClick={() => setSysConfig({...sysConfig, activePath: p})} className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${sysConfig.activePath === p ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}>
                                    {p.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleHardReset} className="w-full mt-4 p-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">
                        Hard Reset Server
                    </button>
                </div>
            ) : (
                filtered.map(c => (
                    <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-3 flex items-center gap-3 transition-all ${selectedCustomer?.id === c.id ? 'bg-[#2A3942] border-r-2 border-emerald-500' : 'hover:bg-[#202C33]'}`}>
                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/5 relative shadow-inner">
                            {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <Users className="m-auto mt-2 text-slate-600" size={20}/>}
                            {c.botState === 'HUMAN_RAMI' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#111B21] rounded-full"></div>}
                        </div>
                        <div className="text-right flex-1 overflow-hidden">
                            <div className="text-xs font-bold text-slate-200 truncate">{c.name || c.id}</div>
                            <div className="text-[10px] opacity-40 font-mono italic">ID: {normalizeId(c.id)}</div>
                        </div>
                        {c.botState !== 'HUMAN_RAMI' && <Bot size={12} className="text-emerald-500 animate-pulse" />}
                    </button>
                ))
            )}
        </div>
      </aside>

      {/* --- 3. Main Command Area --- */}
      <main className="flex-1 flex flex-col relative bg-[#0B141A]" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-16 bg-[#202C33]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-10 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10"><img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" /></div>
                <div>
                  <h2 className="text-sm font-bold text-slate-200">{selectedCustomer.name}</h2>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${selectedCustomer.botState === 'HUMAN_RAMI' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedCustomer.botState === 'HUMAN_RAMI' ? 'Manual' : 'AI Active'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase transition-all ${queueCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                    Q: {queueCount}
                </div>
                <button onClick={() => updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { botState: selectedCustomer.botState === 'HUMAN_RAMI' ? 'MENU' : 'HUMAN_RAMI' })} className={`p-2 rounded-lg border transition-all ${selectedCustomer.botState !== 'HUMAN_RAMI' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-red-500/20 border-red-500/40 text-red-500'}`}>
                  {selectedCustomer.botState !== 'HUMAN_RAMI' ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                </button>
              </div>
            </header>

            {/* 🔥 Malshinan - Live Dual Sniffer */}
            <AnimatePresence>
              {showDiagnostics && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-black/95 backdrop-blur-md border-b border-emerald-500/20 overflow-hidden z-20 shadow-2xl shrink-0">
                  <div className="p-3 font-mono text-[9px] space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center text-emerald-500 font-black mb-2 px-1">
                      <p className="flex items-center gap-2"><Terminal size={12}/> RAW PIPE SNIFFER</p>
                      <span className="text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">MONITORING ALL PATHS</span>
                    </div>
                    {pipeLogs.length === 0 && <p className="text-slate-600 italic px-1 animate-pulse">ממתין לתעבורה משרת המשרד / JONI Extension...</p>}
                    {pipeLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-3 border-b border-white/5 py-1 hover:bg-white/5 transition-colors px-1">
                        <span className="text-blue-500 opacity-60">[{new Date(log.time).toLocaleTimeString()}]</span>
                        <span className={`font-black shrink-0 ${log.type === 'IN' ? 'text-blue-400' : 'text-emerald-400'}`}>{log.type}</span>
                        <span className="text-purple-400 font-bold shrink-0">{log.sender || log.number}:</span>
                        <span className="text-slate-300 truncate flex-1 opacity-90">"{log.text || log.message}"</span>
                        <span className="opacity-30 text-[7px] uppercase font-bold text-right">{log.path}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar shadow-inner">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[80%] p-3 rounded-xl text-sm shadow-xl relative leading-relaxed ${m.type === 'in' ? 'bg-[#202C33] text-slate-100 self-start rounded-tr-none border border-white/5' : 'bg-[#005C4B] text-white self-end rounded-tl-none border border-emerald-400/10'}`}>
                  <div className="font-medium whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[8px] opacity-40 text-left mt-2 font-mono flex justify-end gap-1 items-center italic">
                    {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '...'}
                    {!m.type && <CheckCircle2 size={10} className="text-emerald-400 ml-1"/>}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-4 bg-[#202C33] border-t border-white/5 flex gap-3 z-10 shadow-2xl">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="שלח הודעה לצינור..." className="flex-1 bg-[#2A3942] p-3 rounded-xl border-none outline-none text-white text-sm font-bold shadow-inner" />
              <button onClick={handleSend} className="w-12 h-12 bg-emerald-500 text-[#111B21] rounded-xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-400 transition-all shrink-0">
                <Send className="rotate-180 -mr-1" size={24}/>
              </button>
            </footer>
          </>
        ) : (
          <div className="m-auto opacity-5 select-none flex flex-col items-center gap-6">
              <MessageCircle size={200} className="animate-pulse" />
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Saban Master Hub</h1>
          </div>
        )}
      </main>

      {/* --- 4. CRM & Identity Sidebar --- */}
      {selectedCustomer && ( activeTab === 'CRM' || activeTab === 'CHATS' ) && (
        <aside className="w-[400px] flex flex-col bg-[#111B21] border-r border-white/5 p-6 overflow-y-auto no-scrollbar shadow-2xl z-30 shrink-0">
          <header className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <h3 className="font-black flex items-center gap-2 text-blue-400 text-sm tracking-tight uppercase"><ShieldCheck size={20}/> Identity Lab</h3>
            <button onClick={() => remove(ref(dbRT, `${sysConfig.activePath}/outgoing`))} title="נקה תור" className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Eraser size={16}/></button>
          </header>
          
          <div className="space-y-8 text-right">
            <div className="flex flex-col items-center gap-4">
              <div className="w-36 h-36 rounded-3xl bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-2xl relative group">
                <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                <div onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center font-black text-[9px] uppercase text-white cursor-pointer">החלף זהות</div>
              </div>
              <input value={editCrm.name} onChange={e => setEditCrm({...editCrm, name: e.target.value})} className="bg-transparent border-none outline-none text-xl font-black text-white italic text-center w-full focus:ring-1 focus:ring-emerald-500/20 rounded" placeholder="שם הלקוח" />
            </div>

            <div className="space-y-4">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase px-1">קומקס</label><input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className="w-full bg-[#202C33] p-3 rounded-xl outline-none border border-white/5 text-xs text-white shadow-inner" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-purple-400 uppercase px-1">DNA אישי</label><textarea value={editCrm.dnaContext} onChange={e => setEditCrm({...editCrm, dnaContext: e.target.value})} rows={6} className="w-full bg-purple-500/5 p-3 rounded-xl outline-none border border-purple-500/20 text-xs text-slate-100 resize-none shadow-inner" placeholder="תכנת את הבוט..." /></div>
            </div>

            <button onClick={() => { setIsSaving(true); setDoc(doc(dbFS, 'customers', selectedCustomer.id), {...editCrm, lastUpdated: serverTimestamp()}, {merge: true}).then(() => setIsSaving(false)); }} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest">
              {isSaving ? <Loader2 size={20} className="animate-spin m-auto"/> : <><Save size={18} className="inline ml-2"/> Commit DNA</>}
            </button>
          </div>
        </aside>
      )}

      {/* 5. Global QR Overlay */}
      <AnimatePresence>
        {(!isTrulyOnline && serverStatus.qr) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B141A]/98 backdrop-blur-3xl">
             <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative border-4 border-amber-500/30 overflow-hidden">
                <div className="w-20 h-20 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl text-white animate-bounce"><QrCode size={40} /></div>
                <h2 className="text-2xl font-black text-slate-900 italic mb-2 tracking-tighter uppercase">Pipe Lost</h2>
                <p className="text-slate-500 font-bold mb-8 text-xs leading-relaxed">הצינור מנותק. סרוק כדי לפתוח את עורק הנתונים.</p>
                <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-slate-200 mb-8 aspect-square flex items-center justify-center overflow-hidden shadow-inner">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-2xl border-4 border-white" alt="QR" />
                </div>
                <button onClick={handleHardReset} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Force Restart Server</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
