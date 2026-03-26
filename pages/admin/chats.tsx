import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove, onChildAdded } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, Printer, UserCog, Building, MapPin, Phone, CreditCard, Power, X, Search, 
  Truck, Crown, PackageSearch, Merge, CheckCircle2, Wifi, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, AlertTriangle, ShieldAlert, History, Terminal, Database, ArrowRightLeft, 
  Loader2, Radio, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, AlertCircle, Settings2, Link2, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Config ---
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
  const [activeTab, setActiveTab] = useState<'HUB' | 'CRM' | 'NETWORK'>('HUB');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null, battery: 100 });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true); 
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [incomingLogs, setIncomingLogs] = useState<any[]>([]);

  // הגדרות תשתית (Infrastructure Config)
  const [sysConfig, setSysConfig] = useState({
    rtDbUrl: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
    callbackUrl: "",
    msgDelay: 2,
    alwaysConnected: true
  });

  const [editCrm, setEditCrm] = useState<any>({ 
    name: '', comaxId: '', projectName: '', projectAddress: '', dnaContext: '', photo: '' 
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000);
  const signalQuality = timeDiff < 10000 ? 'EXCELLENT' : timeDiff < 30000 ? 'GOOD' : timeDiff < 60000 ? 'WEAK' : 'DISCONNECTED';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // 1. 🔥 יישור נתיב סטטוס (לפי rtdb-saban94)
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      const data = snap.val();
      if (data) {
        setServerStatus(prev => ({ ...prev, ...data }));
        if (data.qr && !data.online) setShowQrModal(true);
      }
    });

    // 2. הגדרות מערכת מ-Firestore
    onSnapshot(doc(dbFS, 'system', 'config'), (snap) => {
        if (snap.exists()) setSysConfig(prev => ({ ...prev, ...snap.data() }));
    });

    // 3. 🔥 יישור מלשינון תעבורה נכנסת (נתיב: rami/incoming)
    const incomingRef = ref(dbRT, 'rami/incoming');
    const unsubIncoming = onChildAdded(incomingRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setIncomingLogs(prev => [{
                ...data, 
                id: snapshot.key, 
                time: Date.now(),
                status: 'RECEIVED'
            }, ...prev].slice(0, 20));
        }
    });

    // 4. 🔥 יישור תור שליחה (נתיב: rami/outgoing)
    onValue(ref(dbRT, 'rami/outgoing'), (snap) => {
        setQueueCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    // 5. לקוחות
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(150)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const lastActivity = curr.lastMessageAt?.seconds ? curr.lastMessageAt.seconds * 1000 : 0;
          const isInactive = (Date.now() - lastActivity) > (12 * 60 * 60 * 1000); 
          const existing = unifiedMap.get(uid);
          if (!existing || (!existing.name && curr.name)) {
            unifiedMap.set(uid, { ...curr, uid, isInactive });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, []);

  // סנכרון צ'אט
  useEffect(() => {
    if (!selectedCustomer) return;
    setEditCrm({
      name: selectedCustomer.name || '',
      comaxId: selectedCustomer.comaxId || '',
      projectName: selectedCustomer.projectName || '',
      projectAddress: selectedCustomer.projectAddress || '',
      dnaContext: selectedCustomer.dnaContext || '',
      photo: selectedCustomer.photo || ''
    });
    const unsubHistory = onSnapshot(query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'), limit(100)), (snap) => {
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
    try {
      await updateDoc(doc(dbFS, 'customers', targetId), { botState: 'HUMAN_RAMI', lastUpdated: serverTimestamp() });
      
      // 🔥 שליחה לנתיב rami/outgoing
      await push(ref(dbRT, 'rami/outgoing'), { number: targetId, message: txt, timestamp: Date.now() });
      
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-control' 
      });
    } catch (e) { console.error(e); }
  };

  const saveProfile = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    try {
      await setDoc(doc(dbFS, 'customers', selectedCustomer.id), { 
        ...editCrm, 
        lastUpdated: serverTimestamp() 
      }, { merge: true });
      setIsSaving(false);
      alert("פרופיל הלקוח ו-DNA סונכרנו בהצלחה!");
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    await setDoc(doc(dbFS, 'system', 'config'), sysConfig, { merge: true });
    setIsSaving(false);
    alert("הגדרות תשתית נשמרו וסונכרנו לשרת!");
  };

  const filtered = customers.filter(c => (c.projectName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617] text-slate-100 font-sans' : 'bg-slate-50 text-slate-900 font-sans'}`} dir="rtl">
      
      {/* 1. סרגל ניווט */}
      <aside className={`w-20 flex flex-col items-center py-8 border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-10 overflow-hidden cursor-pointer active:scale-95 transition-transform">
            <img src={BRAND_LOGO} alt="logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 flex-1 text-slate-500">
            {[{id: 'HUB', icon: MessageCircle}, {id: 'CRM', icon: UserCog}, {id: 'NETWORK', icon: Network}].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-xl' : 'hover:bg-emerald-500/10 hover:text-emerald-400'}`}>
                    <tab.icon size={24} />
                </button>
            ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-500 hover:text-emerald-500 transition-colors">
            {theme === 'dark' ? <Clock size={24} /> : <Terminal size={24}/>}
        </button>
      </aside>

      {/* 2. רשימת צ'אטים / ממשק רשת */}
      <aside className={`w-96 flex flex-col border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
        <header className="p-6 border-b border-inherit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg flex items-center gap-2 text-emerald-500 uppercase tracking-tighter">
                {activeTab === 'NETWORK' ? <Settings2 size={20}/> : <ShieldCheck size={20}/>}
                {activeTab === 'NETWORK' ? 'ניהול תשתית' : 'JONI HUB'}
            </h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                {isTrulyOnline ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          {activeTab !== 'NETWORK' && (
            <div className="relative">
                <Search className="absolute right-3 top-3 text-slate-500" size={16}/>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש לקוח..." className="w-full bg-black/20 p-3 pr-10 rounded-xl border-none outline-none text-sm font-bold shadow-inner focus:ring-1 focus:ring-emerald-500" />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-black/5">
          {activeTab === 'NETWORK' ? (
              <div className="space-y-6">
                  {/* 🔥 הגדרות תשתית */}
                  <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Database size={10}/> Realtime Database URL</label>
                          <input value={sysConfig.rtDbUrl} onChange={e => setSysConfig({...sysConfig, rtDbUrl: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-[11px] font-mono outline-none border border-white/5 focus:border-blue-500 text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Clock size={10}/> המתן (שניות)</label>
                              <input type="number" value={sysConfig.msgDelay} onChange={e => setSysConfig({...sysConfig, msgDelay: Number(e.target.value)})} className="w-full bg-black/40 p-3 rounded-lg text-xs font-black outline-none border border-white/5 focus:border-amber-500 text-white" />
                          </div>
                          <div className="flex flex-col justify-end pb-1">
                              <button onClick={() => setSysConfig({...sysConfig, alwaysConnected: !sysConfig.alwaysConnected})} className={`p-3 rounded-lg text-[10px] font-black flex items-center justify-center gap-2 border transition-all ${sysConfig.alwaysConnected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
                                  {sysConfig.alwaysConnected ? <Wifi size={14}/> : <WifiOff size={14}/>} {sysConfig.alwaysConnected ? 'תמיד מחובר' : 'חיבור גמיש'}
                              </button>
                          </div>
                      </div>
                      <button onClick={saveConfig} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                          {isSaving ? <Loader2 size={14} className="animate-spin"/> : <><Save size={14}/> שמור הגדרות תשתית</>}
                      </button>
                  </div>

                  <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase px-2">יומן אירועי רשת</p>
                      {incomingLogs.map((log, idx) => (
                          <div key={idx} className="p-3 bg-black/20 rounded-xl border border-white/5 text-[10px] leading-tight">
                              <div className="flex justify-between mb-1 opacity-60">
                                  <span className="font-black text-blue-400 uppercase">{log.status}</span>
                                  <span className="font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                              </div>
                              <p className="font-bold text-slate-300 truncate">מ-{log.sender}: "{log.text}"</p>
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
            filtered.map(c => (
                <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg' : 'border-transparent hover:bg-white/5'}`}>
                  <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative border border-white/5 shadow-sm text-white">
                    {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <Users className="m-auto mt-3 text-slate-500" size={20}/>}
                  </div>
                  <div className="text-right flex-1 overflow-hidden">
                    <div className="text-sm font-black truncate text-white">{c.name || "לקוח"}</div>
                    <div className="text-[10px] opacity-40 font-mono mt-1 italic text-slate-400">{normalizeId(c.id)}</div>
                  </div>
                  {c.botState !== 'HUMAN_RAMI' && <Bot size={14} className="text-emerald-500 animate-pulse" />}
                </button>
              ))
          )}
        </div>
      </aside>

      {/* 3. אזור עבודה מרכזי */}
      <main className="flex-1 flex flex-col relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-20 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-lg">
                    <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-lg font-black italic tracking-tight">{selectedCustomer.name}</h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedCustomer.id}</span>
                </div>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { botState: selectedCustomer.botState === 'HUMAN_RAMI' ? 'MENU' : 'HUMAN_RAMI' })} className={`p-3 rounded-xl border-2 transition-all ${selectedCustomer.botState !== 'HUMAN_RAMI' ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                      {selectedCustomer.botState !== 'HUMAN_RAMI' ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  </button>
              </div>
            </header>

            {/* 🔥 מלשינון תעבורה מעל הצ'אט - נתיב rami/incoming */}
            <AnimatePresence>
                {showDiagnostics && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-black/90 backdrop-blur-md border-b border-white/10 overflow-hidden z-20 shadow-inner">
                        <div className="p-4 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                                <p className="text-amber-500 font-black uppercase flex items-center gap-2 tracking-widest"><Terminal size={14}/> מלשינון תעבורה (PATH: rami/incoming)</p>
                                <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-black tracking-widest">LIVE SNIFFER</span>
                            </div>
                            {incomingLogs.map((log, idx) => (
                                <div key={log.id || idx} className="flex gap-4 border-b border-white/5 py-1 hover:bg-white/5 transition-colors">
                                    <span className="text-blue-500">[{new Date(log.time).toLocaleTimeString()}]</span>
                                    <span className="text-purple-400 font-black">FROM: {log.sender}</span>
                                    <span className="text-slate-300 truncate italic flex-1">"{log.text}"</span>
                                    <span className="text-emerald-500 font-bold">{log.status}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 no-scrollbar shadow-inner">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-2xl text-[14px] shadow-xl relative leading-relaxed ${m.type === 'in' ? 'bg-slate-800 text-slate-100 self-start rounded-tr-none border border-white/5' : 'bg-[#005c4b] text-white self-end rounded-tl-none shadow-emerald-950/20'}`}>
                  <div className="font-bold leading-relaxed">{m.text}</div>
                  <div className="text-[9px] opacity-40 text-left mt-3 font-mono flex justify-end gap-1 items-center italic">
                    {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '...'}
                    {!m.type && <CheckCircle2 size={10} className="text-emerald-400 ml-1"/>}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 bg-[#0f172a]/95 border-t border-white/5 flex gap-4 z-10 shadow-2xl">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="כתוב הודעה לצינור..." className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5 outline-none font-bold text-white focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner" />
              <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-500 shadow-emerald-500/20 transition-all"><Send className="rotate-180 -mr-1" size={28}/></button>
            </footer>
          </>
        ) : (
          <div className="m-auto opacity-10 flex flex-col items-center gap-8 text-white text-center">
              <div className="relative">
                <MessageCircle size={220} className="animate-pulse" />
                <Bot size={80} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
              </div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-400">SABAN COMMAND<br/><span className="text-2xl text-emerald-500 tracking-[0.2em]">Operational Watchtower</span></h1>
          </div>
        )}
      </main>

      {/* 4. CRM Sidebar - DNA LAB */}
      {selectedCustomer && (
        <aside className={`w-[450px] flex flex-col p-8 border-r ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white'} overflow-y-auto no-scrollbar`}>
          <h3 className="font-black flex items-center gap-3 text-blue-400 text-xl tracking-tight mb-10 border-b border-white/5 pb-4 uppercase"><ShieldCheck size={28}/> DNA & CRM</h3>
          
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-6">
                <div className="w-36 h-36 rounded-[2.5rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-2xl relative group">
                  <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                  <div onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer font-black text-xs uppercase text-white">החלף תמונה</div>
                </div>
                <input value={editCrm.name} onChange={e => setEditCrm({...editCrm, name: e.target.value})} className="bg-transparent border-none outline-none text-2xl font-black text-white italic text-center w-full focus:ring-1 focus:ring-emerald-500 rounded transition-all" placeholder="שם הלקוח" />
            </div>

            <div className="grid gap-6 text-white">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1"><CreditCard size={12}/> מספר קומקס</label><input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 font-bold shadow-inner text-white" /></div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><Zap size={14}/> פקודות DNA אישיות</label>
                    <textarea value={editCrm.dnaContext} onChange={e => setEditCrm({...editCrm, dnaContext: e.target.value})} rows={6} className="w-full bg-purple-500/5 p-4 rounded-2xl outline-none border border-purple-500/10 focus:border-purple-500 font-bold text-xs resize-none leading-relaxed shadow-inner text-slate-100" placeholder="תכנת את הבוט ללקוח זה..." />
                </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 shadow-inner space-y-4 text-[11px]">
                <div className="flex justify-between items-center text-slate-400 font-black uppercase tracking-widest">
                    <span>איכות הצינור</span>
                    <span className={queueCount > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}>{queueCount > 0 ? `QUEUE: ${queueCount}` : 'Pipeline Clear'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Heart size={20} className={isTrulyOnline ? 'text-emerald-500 animate-pulse' : 'text-red-500'}/>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <motion.div animate={{width: isTrulyOnline ? '100%' : '10%'}} className={`h-full ${isTrulyOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}/>
                    </div>
                    <span className="font-mono opacity-50 font-black">{(timeDiff/1000).toFixed(1)}s LAG</span>
                </div>
            </div>

            <button onClick={saveProfile} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xl tracking-widest">
                {isSaving ? <Loader2 size={24} className="animate-spin"/> : <><Save size={24}/> Sync DNA & Profile</>}
            </button>
          </div>
        </aside>
      )}

      {/* מודל סריקה */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/98 backdrop-blur-3xl">
             <div className="bg-white rounded-[4rem] p-12 max-w-md w-full text-center shadow-2xl relative border-4 border-amber-500/30 overflow-hidden">
                <button onClick={() => setShowQrModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={32}/></button>
                <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl text-white"><QrCode size={40} /></div>
                <h2 className="text-3xl font-black text-slate-900 italic mb-2 tracking-tighter uppercase">Connection Required</h2>
                <p className="text-slate-500 font-bold mb-8 text-sm text-slate-600 text-center">השרת במשרד נותק. סרוק כדי לחבר את הצינור.</p>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border-4 border-dashed border-slate-200 mb-8 aspect-square flex items-center justify-center overflow-hidden">
                    {serverStatus.qr ? (
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-2xl transform hover:scale-105 transition-transform border-4 border-white" alt="QR" />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Activity size={48} className="animate-spin text-amber-500" />
                            <span className="text-xs font-black uppercase tracking-widest">Generating Secure QR...</span>
                        </div>
                    )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
