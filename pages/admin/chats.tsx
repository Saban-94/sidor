import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, Printer, UserCog, Building, MapPin, Phone, CreditCard, Power, X, Search, 
  Truck, Crown, PackageSearch, Merge, CheckCircle2, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, AlertTriangle, ShieldAlert, History, Terminal, Database, ArrowRightLeft, 
  Loader2, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Init ---
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

export default function App() {
  // ניהול טאבים וממשק
  const [activeTab, setActiveTab] = useState<'HUB' | 'CRM' | 'NETWORK'>('HUB');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null, battery: 100 });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showQrModal, setShowQrModal] = useState(false);
  
  // נתוני ליבה
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // המלשינון (Diagnostic Logs & Queue)
  const [diagLogs, setDiagLogs] = useState<{id: string, msg: string, type: 'info' | 'error' | 'success' | 'warn', time: number}[]>([]);
  const [queueCount, setQueueCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // פונקציות עזר
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  // 🔥 חישוב דופק שרת - קבוע למניעת שגיאות בילד
  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 60000);
  const signalQuality = timeDiff < 10000 ? 'EXCELLENT' : timeDiff < 30000 ? 'GOOD' : timeDiff < 60000 ? 'WEAK' : 'DISCONNECTED';

  // הוספת לוג למלשינון
  const addLog = (msg: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
    setDiagLogs(prev => [{ id: Math.random().toString(), msg, type, time: Date.now() }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // מאזין סטטוס שרת
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      const data = snap.val();
      if (data) {
        setServerStatus(prev => ({ ...prev, ...data }));
        if (data.qr && !data.online) setShowQrModal(true);
        if (data.online) setShowQrModal(false);
      }
    });

    // 🔥 מלשינון תור: בודק כמה הודעות מחכות בצינור
    onValue(ref(dbRT, 'saban94/outgoing'), (snap) => {
        const data = snap.val();
        setQueueCount(data ? Object.keys(data).length : 0);
    });

    // מאזין ללוגי שרת
    onValue(ref(dbRT, 'saban94/logs'), (snap) => {
        const logs = snap.val();
        if (logs) {
            Object.values(logs).forEach((l: any) => addLog(l.message, l.type));
            remove(ref(dbRT, 'saban94/logs'));
        }
    });

    // רשימת לקוחות
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(150)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const existing = unifiedMap.get(uid);
          if (!existing || (curr.name && !existing.name)) {
            unifiedMap.set(uid, { ...curr, uid, allIds: [curr.id] });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, []);

  // טעינת צ'אט
  useEffect(() => {
    if (!selectedCustomer) return;
    const unsubHistory = onSnapshot(query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc')), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubHistory();
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    const targetId = selectedCustomer.id; 
    setChatInput('');

    addLog(`ניסיון שליחה ל-${targetId}`, "info");

    try {
      // דחיפה ל-RTDB
      const pushRef = await push(ref(dbRT, 'saban94/outgoing'), { 
        number: targetId, 
        message: txt, 
        timestamp: Date.now() 
      });

      // תיעוד ב-Firestore
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-rami' 
      });
      await updateDoc(doc(dbFS, 'customers', targetId), { lastUpdated: serverTimestamp() });
      
      addLog(`הודעה נדחפה לצינור (ID: ${pushRef.key})`, "success");
      
      // האזנה למשיכה ע"י השרת
      onValue(ref(dbRT, `saban94/outgoing/${pushRef.key}`), (snap) => {
          if (!snap.exists()) addLog("אישור: השרת במשרד משך את ההודעה", "success");
      });

    } catch (e: any) { 
        addLog(`שגיאת שליחה: ${e.message}`, "error");
    }
  };

  const handleResetServer = async () => {
    if (window.confirm("בצע ריסטרט פיזי לשרת במשרד?")) {
      addLog("שולח פקודת KILL למשרד...", "warn");
      await update(ref(dbRT, 'saban94/status'), { online: false, qr: null, reset_command: true });
      setShowQrModal(true);
    }
  };

  const filtered = customers.filter(c => (c.projectName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      
      {/* Sidebar ניווט */}
      <aside className={`w-20 flex flex-col items-center py-8 border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-10 overflow-hidden cursor-pointer">
            <img src={BRAND_LOGO} alt="logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 flex-1">
            {[
                {id: 'HUB', icon: MessageCircle, label: 'HUB'},
                {id: 'CRM', icon: Users, label: 'לקוחות'},
                {id: 'NETWORK', icon: Network, label: 'רשת'}
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 rounded-xl transition-all relative group ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-500 hover:bg-emerald-500/10'}`}>
                    <tab.icon size={24} />
                    <span className="absolute right-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">{tab.label}</span>
                </button>
            ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-500 hover:text-emerald-500">
            {theme === 'dark' ? <Clock size={24} /> : <Terminal size={24}/>}
        </button>
      </aside>

      {/* רשימה / מלשינון */}
      <aside className={`w-96 flex flex-col border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
        <header className="p-6 border-b border-inherit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg flex items-center gap-2 text-emerald-500 tracking-tight uppercase">
                {activeTab === 'NETWORK' ? <Network/> : <MessageCircle/>}
                {activeTab === 'NETWORK' ? 'מלשינון חי' : 'JONI HUB'}
            </h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isTrulyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {isTrulyOnline ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          {activeTab !== 'NETWORK' && (
            <div className="relative">
                <Search className="absolute right-3 top-3 text-slate-500" size={16}/>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש מנהל פרויקט..." className="w-full bg-black/20 p-3 pr-10 rounded-xl border-none outline-none text-sm font-bold shadow-inner" />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {activeTab === 'NETWORK' ? (
              <div className="space-y-4">
                  {/* 🔥 Queue Monitor */}
                  <div className={`p-4 rounded-2xl border-2 transition-all ${queueCount > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ArrowRightLeft size={14}/> עומס בצינור</span>
                        <span className="text-xl font-black">{queueCount}</span>
                      </div>
                      <p className="text-[10px] font-bold opacity-70">
                          {queueCount > 0 ? 'הודעות ממתינות שהשרת במשרד ימשוך אותן' : 'הצינור נקי - כל ההודעות נמשכו'}
                      </p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 space-y-3">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">ביצועי רשת (Latency)</h3>
                      <div className="flex items-center justify-between">
                          <span className="text-lg font-black italic">{signalQuality}</span>
                          <span className="text-xs font-mono opacity-50">{(timeDiff/1000).toFixed(1)}s</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div initial={{width: 0}} animate={{width: isTrulyOnline ? '100%' : '0%'}} className={`h-full ${signalQuality === 'EXCELLENT' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                  </div>

                  <button onClick={handleResetServer} className="w-full p-4 bg-red-600/10 text-red-600 border border-red-600/20 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                      <Power size={16}/> ריסטרט קשיח לשרת במשרד
                  </button>

                  <div className="space-y-1 mt-6">
                      <p className="text-[10px] font-black text-slate-500 uppercase px-2 mb-2">יומן אירועים (מלשינון)</p>
                      {diagLogs.map(log => (
                          <div key={log.id} className="p-3 bg-black/20 rounded-xl border border-white/5 text-[11px] leading-tight mb-2">
                              <div className="flex justify-between mb-1 opacity-60">
                                  <span className={`font-black uppercase ${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`}>{log.type}</span>
                                  <span className="font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                              </div>
                              <p className="font-bold">{log.msg}</p>
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
            filtered.map(c => (
                <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${selectedCustomer?.uid === c.uid ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-transparent hover:bg-white/5'}`}>
                  <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-white/10">
                    {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <UserCog className="m-auto mt-3 text-slate-500"/>}
                  </div>
                  <div className="text-right flex-1 overflow-hidden">
                    <div className="text-sm font-black truncate">{c.projectName || c.name || "לקוח"}</div>
                    <div className="text-[10px] opacity-40 font-mono mt-1">ID: {normalizeId(c.id)}</div>
                  </div>
                </button>
              ))
          )}
        </div>
      </aside>

      {/* אזור עבודה */}
      <main className="flex-1 flex flex-col relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/50">
                    <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-lg font-black italic tracking-tight">{selectedCustomer.projectName || selectedCustomer.name}</h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{selectedCustomer.id}</span>
                </div>
              </div>
              <button onClick={() => setIsAiActive(!isAiActive)} className={`px-5 py-2 rounded-xl font-black text-xs border-2 transition-all ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                {isAiActive ? <Radio className="inline ml-2 animate-pulse" size={14}/> : <Zap className="inline ml-2" size={14}/>}
                {isAiActive ? 'AI ACTIVE' : 'MANUAL CONTROL'}
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 no-scrollbar">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-2xl text-[14px] shadow-xl relative ${m.type === 'in' ? 'bg-[#202c33] text-white self-start rounded-tr-none' : 'bg-[#005c4b] text-white self-end rounded-tl-none shadow-emerald-950/20'}`}>
                  <div className="font-bold leading-relaxed">{m.text}</div>
                  <div className="text-[9px] opacity-40 text-left mt-3 font-mono flex justify-end gap-1 items-center">
                    {m.isSending ? <Loader2 size={10} className="animate-spin ml-1"/> : null}
                    {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '...'}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 bg-[#0f172a]/95 border-t border-white/5 flex gap-4 z-10 shadow-2xl">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={isTrulyOnline ? "כתוב הודעה לצינור..." : "המערכת במצב OFFLINE - בדוק משרד"} disabled={!isTrulyOnline} className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5 outline-none font-bold text-white focus:ring-2 focus:ring-emerald-500/30 transition-all disabled:opacity-50" />
              <button onClick={handleSend} disabled={!isTrulyOnline} className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-500 transition-all disabled:opacity-50"><Send className="rotate-180"/></button>
            </footer>
          </>
        ) : (
          <div className="m-auto opacity-10 flex flex-col items-center gap-6 text-white"><MessageCircle size={200}/><h1 className="text-5xl font-black italic tracking-tighter uppercase text-center">SABAN HUB<br/>COMMAND CENTER</h1></div>
        )}
      </main>

      {/* CRM Sidebar / Diagnostics */}
      {selectedCustomer && (
        <aside className={`w-[450px] flex flex-col p-8 border-r ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white'} overflow-y-auto no-scrollbar`}>
          <h3 className="font-black flex items-center gap-3 text-blue-400 text-xl tracking-tight mb-10 border-b border-white/5 pb-4 uppercase"><ShieldCheck/> אבחון וזהות</h3>
          
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-6">
                <div className="w-36 h-36 rounded-[2.5rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-2xl relative">
                  <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div className="text-center space-y-2">
                    <h4 className="text-3xl font-black text-white italic">{selectedCustomer.projectName || selectedCustomer.name}</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-widest">ID: {selectedCustomer.id}</span>
                </div>
            </div>

            <div className="grid gap-5">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12}/> קומקס</label><input value={selectedCustomer.comaxId || ''} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 font-bold text-white shadow-inner" readOnly /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> כתובת יעד</label><input value={selectedCustomer.projectAddress || 'חסר כתובת'} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 font-bold text-white shadow-inner" readOnly /></div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 shadow-inner space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">איכות צינור JONI</span>
                    <span className={`text-[10px] font-bold ${isTrulyOnline ? 'text-emerald-500' : 'text-red-500'}`}>{isTrulyOnline ? 'LIVE CONNECTED' : 'SYNC DISCONNECTED'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                        <Heart size={24} className={isTrulyOnline ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold opacity-60">
                            <span>דיליי (Lag):</span>
                            <span>{(timeDiff/1000).toFixed(1)}s</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <motion.div initial={{width: 0}} animate={{width: isTrulyOnline ? '100%' : '10%'}} className={`h-full ${isTrulyOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`} />
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={handleResetServer} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg">
                <Power size={24}/> בצע ריסטרט למשרד
            </button>
          </div>
        </aside>
      )}

      {/* מודל ברקוד */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl">
             <div className="bg-white rounded-[4rem] p-12 max-w-md w-full text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative border-4 border-amber-500/30 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
                <button onClick={() => setShowQrModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={32}/></button>
                <div className="w-24 h-24 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white animate-bounce"><QrCode size={56} /></div>
                <h2 className="text-4xl font-black text-slate-900 italic mb-2 tracking-tighter">חיבור צינור JONI</h2>
                <p className="text-slate-500 font-bold mb-10 text-base leading-relaxed text-slate-600">השרת במשרד נותק. סרוק כדי לחבר.</p>
                <div className="bg-slate-50 p-8 rounded-[3rem] border-4 border-dashed border-slate-200 mb-10 aspect-square flex items-center justify-center overflow-hidden shadow-inner relative group">
                    {serverStatus.qr ? (
                        <motion.img initial={{scale: 0.8}} animate={{scale: 1}} src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-3xl transform hover:scale-110 transition-transform duration-500 border-8 border-white" alt="QR" />
                    ) : (
                        <div className="flex flex-col items-center gap-6 text-slate-400">
                            <Activity size={64} className="animate-spin text-amber-500" />
                            <span className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">מייצר ברקוד מאובטח...</span>
                        </div>
                    )}
                </div>
                <button onClick={handleResetServer} className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-lg active:scale-95 border border-red-700/20">ביצוע ריסטרט קשיח למשרד</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
