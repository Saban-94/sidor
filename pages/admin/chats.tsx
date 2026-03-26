import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, Printer, UserCog, Building, MapPin, Phone, CreditCard, Power, X, Search, 
  Truck, Crown, PackageSearch, Merge, CheckCircle2, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, AlertTriangle, ShieldAlert, History, Terminal, Database, ArrowRightLeft
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
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null, battery: 100, version: '1.0.0' });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showQrModal, setShowQrModal] = useState(false);
  
  // נתוני ליבה
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // המלשינון (Diagnostic Logs)
  const [diagLogs, setDiagLogs] = useState<{id: string, msg: string, type: 'info' | 'error' | 'success' | 'warn', time: number}[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // פונקציות עזר
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 60000);
  const signalQuality = timeDiff < 10000 ? 'EXCELLENT' : timeDiff < 30000 ? 'GOOD' : timeDiff < 60000 ? 'WEAK' : 'DISCONNECTED';

  // הוספת לוג למלשינון
  const addLog = (msg: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
    setDiagLogs(prev => [{ id: Math.random().toString(), msg, type, time: Date.now() }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // מאזין סטטוס שרת - "הדופק"
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      const data = snap.val();
      if (data) {
        if (!serverStatus.online && data.online) addLog("השרת במשרד התחבר בהצלחה", "success");
        if (serverStatus.online && !data.online) addLog("השרת במשרד התנתק - בודק סיבה...", "error");
        setServerStatus(prev => ({ ...prev, ...data }));
        if (data.qr && !data.online) setShowQrModal(true);
        if (data.online) setShowQrModal(false);
      }
    });

    // מאזין לטעויות שליחה מהשרת (המלשינון תופס אותן)
    onValue(ref(dbRT, 'saban94/logs'), (snap) => {
        const logs = snap.val();
        if (logs) {
            Object.values(logs).forEach((log: any) => {
                addLog(`[SERVER] ${log.message}`, log.type || 'info');
            });
            remove(ref(dbRT, 'saban94/logs')); // ניקוי לוגים שנקראו
        }
    });

    // רשימת לקוחות מאוחדת
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
  }, [serverStatus.online]);

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

  // פונקציות ביצוע
  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    const targetId = selectedCustomer.id; 
    setChatInput('');

    addLog(`שולח הודעה ל-${targetId}: ${txt.substring(0, 15)}...`, "info");

    try {
      await push(ref(dbRT, 'saban94/outgoing'), { number: targetId, message: txt, timestamp: Date.now() });
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-rami' 
      });
      await updateDoc(doc(dbFS, 'customers', targetId), { lastUpdated: serverTimestamp() });
      addLog(`הודעה נדחפה לצינור, ממתין לאישור שליחה...`, "success");
    } catch (e: any) { 
        addLog(`כשל בדחיפת הודעה: ${e.message}`, "error");
    }
  };

  const handleResetServer = async () => {
    if (window.confirm("בטוח שרוצה לבצע ריסטרט פיזי לשרת במשרד?")) {
      addLog("שולח פקודת ריסטרט מרחוק...", "warn");
      await update(ref(dbRT, 'saban94/status'), { online: false, qr: null, reset_command: true });
      setShowQrModal(true);
    }
  };

  const filtered = customers.filter(c => (c.projectName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617] text-slate-100 font-sans' : 'bg-slate-50 text-slate-900 font-sans'}`} dir="rtl">
      
      {/* 1. סרגל ניווט צידי צר */}
      <aside className={`w-20 flex flex-col items-center py-8 border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-10 overflow-hidden cursor-pointer active:scale-90 transition-transform">
            <img src={BRAND_LOGO} alt="logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 flex-1">
            {[
                {id: 'HUB', icon: MessageCircle, label: 'צ\'אט'},
                {id: 'CRM', icon: Users, label: 'לקוחות'},
                {id: 'NETWORK', icon: Network, label: 'מלשינון'}
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 rounded-xl transition-all relative group ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500'}`}>
                    <tab.icon size={24} />
                    <span className="absolute right-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">{tab.label}</span>
                </button>
            ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-500 hover:text-emerald-500 transition-colors">
            {theme === 'dark' ? <Clock size={24} /> : <Terminal size={24}/>}
        </button>
      </aside>

      {/* 2. רשימת הלקוחות / סטטוס רשת */}
      <aside className={`w-96 flex flex-col border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
        <header className="p-6 border-b border-inherit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg flex items-center gap-2 text-emerald-500 tracking-tight uppercase">
                {activeTab === 'NETWORK' ? <Network/> : <MessageCircle/>}
                {activeTab === 'NETWORK' ? 'מלשינון רשת' : 'JONI HUB'}
            </h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isTrulyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {isTrulyOnline ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          {activeTab !== 'NETWORK' && (
            <div className="relative">
                <Search className="absolute right-3 top-3 text-slate-500" size={16}/>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש מנהל פרויקט..." className="w-full bg-black/20 p-3 pr-10 rounded-xl border-none outline-none text-sm font-bold shadow-inner focus:ring-1 focus:ring-emerald-500" />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {activeTab === 'NETWORK' ? (
              <div className="space-y-4">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 space-y-3">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">איכות הצינור (Latency)</h3>
                      <div className="flex items-center justify-between">
                          <span className="text-lg font-black italic">{signalQuality}</span>
                          <span className="text-xs font-mono opacity-50">{(timeDiff/1000).toFixed(1)}s</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div initial={{width: 0}} animate={{width: isTrulyOnline ? '100%' : '0%'}} className={`h-full ${signalQuality === 'EXCELLENT' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                  </div>
                  <button onClick={handleResetServer} className="w-full p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                      <Power size={16}/> ביצוע ריסטרט קשיח למשרד
                  </button>
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase px-2">אירועי רשת אחרונים</p>
                      {diagLogs.map(log => (
                          <div key={log.id} className="p-3 bg-black/20 rounded-lg border border-white/5 text-[11px] leading-tight">
                              <div className="flex justify-between mb-1">
                                  <span className={`font-black uppercase ${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`}>{log.type}</span>
                                  <span className="opacity-30 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                              </div>
                              <p className="font-bold opacity-80">{log.msg}</p>
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
                    <div className="text-sm font-black truncate text-slate-200">{c.projectName || c.name || "לקוח"}</div>
                    <div className="text-[10px] opacity-40 font-mono mt-1">ID: {normalizeId(c.id)}</div>
                  </div>
                </button>
              ))
          )}
        </div>
      </aside>

      {/* 3. אזור העבודה המרכזי - הצינור */}
      <main className="flex-1 flex flex-col relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/50">
                    <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-lg font-black italic tracking-tight">{selectedCustomer.projectName || selectedCustomer.name}</h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <Smartphone size={10}/> {selectedCustomer.id}
                    </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase">מצב בוט</span>
                    <span className={`text-[10px] font-bold ${isAiActive ? 'text-emerald-500' : 'text-amber-500'}`}>{isAiActive ? 'AUTO-PILOT' : 'MANUAL CONTROL'}</span>
                </div>
                <button onClick={() => setIsAiActive(!isAiActive)} className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/50'}`}>
                    <Zap size={24} className={isAiActive ? 'fill-white' : ''}/>
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 no-scrollbar">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-2xl text-[14px] shadow-2xl relative leading-relaxed ${m.type === 'in' ? 'bg-slate-800 text-slate-100 self-start rounded-tr-none' : 'bg-[#005c4b] text-white self-end rounded-tl-none shadow-emerald-950/20'}`}>
                  <div className="font-bold">{m.text}</div>
                  <div className="text-[9px] opacity-40 text-left mt-3 font-mono flex justify-end gap-1 items-center">
                    {m.isSending ? 'שידור...' : (m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '...')}
                    {!m.type && <CheckCircle2 size={10} className="text-emerald-400 ml-1"/>}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 bg-[#0f172a]/95 border-t border-white/5 flex gap-4 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
              <div className="flex-1 relative">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="הכנס פקודה או הודעה אישית..." className="w-full bg-black/40 p-4 rounded-2xl border border-white/5 outline-none font-bold text-white focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner" />
                  <div className="absolute left-4 top-4 flex gap-2 opacity-30">
                      <ImageIcon size={20}/>
                      <MapPin size={20}/>
                  </div>
              </div>
              <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 hover:bg-emerald-500 transition-all hover:shadow-emerald-500/20"><Send className="rotate-180 -mr-1"/></button>
            </footer>
          </>
        ) : (
          <div className="m-auto opacity-10 flex flex-col items-center gap-8 text-white text-center">
              <div className="relative">
                  <MessageCircle size={250} className="animate-pulse" />
                  <Bot size={80} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
              </div>
              <h1 className="text-6xl font-black italic tracking-tighter uppercase">SABAN HUB<br/><span className="text-3xl text-emerald-500">Professional Pipeline Command</span></h1>
          </div>
        )}
      </main>

      {/* 4. CRM Sidebar / Identity Lab */}
      {selectedCustomer && (
        <aside className={`w-[450px] flex flex-col p-8 border-r ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white'} overflow-y-auto no-scrollbar`}>
          <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h3 className="font-black flex items-center gap-3 text-blue-400 text-xl tracking-tight"><ShieldCheck size={28}/> אבחון וזהות</h3>
            <div className="flex gap-2">
                <button onClick={handleResetServer} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Power size={18}/></button>
            </div>
          </header>
          
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-6">
                <div className="w-40 h-40 rounded-[3rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative group transform hover:rotate-2 transition-all">
                  <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer font-black text-xs uppercase text-white gap-2">
                      <ImageIcon size={24}/> החלף תמונת זהות
                  </div>
                </div>
                <div className="text-center space-y-2">
                    <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">{selectedCustomer.projectName || selectedCustomer.name}</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-mono font-bold tracking-widest">UID: {selectedCustomer.uid}</span>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><CreditCard size={12}/> מספר קומקס / לקוח</label><input value={selectedCustomer.comaxId || ''} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 focus:border-blue-500 font-bold text-white transition-all" readOnly /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><MapPin size={12}/> כתובת פרויקט מסונכרנת</label><input value={selectedCustomer.projectAddress || 'לא הוגדרה כתובת'} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 focus:border-blue-500 font-bold text-white transition-all" readOnly /></div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><Zap size={12}/> DNA פקודות AI</label>
                    <textarea value={selectedCustomer.dnaContext || ''} rows={4} className="w-full bg-purple-500/5 p-4 rounded-2xl outline-none border border-purple-500/10 focus:border-purple-500 font-bold text-xs resize-none leading-relaxed text-slate-200" placeholder="הנחיות לבוט עבור לקוח זה..." />
                </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">סטטוס צינור JONI</span>
                    <span className={`text-[10px] font-bold ${isTrulyOnline ? 'text-emerald-500' : 'text-red-500'}`}>{isTrulyOnline ? 'ENCRYPTED & LIVE' : 'SYNC ERROR'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'}`}>
                        <Heart size={24} className={isTrulyOnline ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold opacity-60 italic">
                            <span>דיליי (Lag):</span>
                            <span>{(timeDiff/1000).toFixed(1)}s</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <motion.div initial={{width: 0}} animate={{width: isTrulyOnline ? '100%' : '20%'}} className={`h-full ${isTrulyOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={() => addLog("סנכרון ידני הופעל ע\"י המפעיל", "info")} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg">
                <ArrowRightLeft size={24}/> סנכרון כרטיס SUPREME
            </button>
          </div>
        </aside>
      )}

      {/* 5. מודל סריקת ברקוד (The Guard) */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl">
             <div className="bg-white rounded-[4rem] p-12 max-w-md w-full text-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative border-4 border-amber-500/30 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse"></div>
                <button onClick={() => setShowQrModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={40}/></button>
                <div className="w-24 h-24 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white"><QrCode size={56} /></div>
                <h2 className="text-4xl font-black text-slate-900 italic mb-3 tracking-tighter">חיבור צינור JONI</h2>
                <p className="text-slate-500 font-bold mb-10 text-base leading-relaxed">השרת במשרד נותק או דורש אימות.<br/><span className="text-amber-600">סרוק מהטלפון שלך לחיבור מאובטח.</span></p>
                <div className="bg-slate-50 p-8 rounded-[3rem] border-4 border-dashed border-slate-200 mb-10 aspect-square flex items-center justify-center overflow-hidden shadow-inner relative group">
                    {serverStatus.qr ? (
                        <motion.img initial={{scale: 0.8}} animate={{scale: 1}} src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-3xl transform hover:scale-110 transition-transform duration-500 border-8 border-white" alt="QR" />
                    ) : (
                        <div className="flex flex-col items-center gap-6 text-slate-400">
                            <Activity size={60} className="animate-spin text-amber-500" />
                            <span className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">מייצר ברקוד מאובטח...</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-4">
                    <button onClick={handleResetServer} className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95">ריסטרט שרת</button>
                    <button onClick={() => setShowQrModal(false)} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">ביטול</button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
