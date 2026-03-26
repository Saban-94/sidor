import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove, onChildAdded } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, UserCog, Building, MapPin, CreditCard, Power, X, Search, 
  Merge, CheckCircle2, Wifi, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, Terminal, Database, ArrowRightLeft, 
  Loader2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle, Settings2, Link2, Globe, Eraser, GitBranch
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
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'CHATS' | 'CRM' | 'FLOW' | 'NETWORK'>('CHATS');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  
  // Core Data State
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [incomingLogs, setIncomingLogs] = useState<any[]>([]);

  // Infrastructure Config
  const [sysConfig, setSysConfig] = useState({
    rtDbUrl: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
    fbStore: "Firebase Firestore",
    callbackUrl: "",
    msgDelay: 2,
    alwaysConnected: true
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
  const signalQuality = timeDiff < 20000 ? 'EXCELLENT' : timeDiff < 60000 ? 'GOOD' : 'WEAK';

  // --- Realtime Listeners ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // 1. Status & Heartbeat
    const statusUnsub = onValue(ref(dbRT, 'saban94/status'), (snap) => {
      if (snap.exists()) setServerStatus(prev => ({ ...prev, ...snap.val() }));
    });

    // 2. Incoming Sniffer
    const incomingUnsub = onChildAdded(ref(dbRT, 'rami/incoming'), (snapshot) => {
        const data = snapshot.val();
        if (data?.sender) {
            setIncomingLogs(prev => [{...data, id: snapshot.key, time: Date.now(), path: 'rami/incoming'}, ...prev].slice(0, 20));
        }
    });

    // 3. Queue Monitor
    const queueUnsub = onValue(ref(dbRT, 'rami/outgoing'), (snap) => {
        setQueueCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    // 4. CRM Customers
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(100)), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
        clearInterval(timer); 
        statusUnsub();
        queueUnsub();
        unsubCust();
    };
  }, []);

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
      await push(ref(dbRT, 'rami/outgoing'), { number: targetId, message: txt, timestamp: Date.now() });
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-rami' 
      });
    } catch (e) { console.error(e); }
  };

  // 🔥 פונקציית איפוס השרת - תגרום לברקוד להופיע מחדש
  const handleHardReset = async () => {
    if (window.confirm("בטוח שברצונך לבצע ריסטרט קשיח לשרת? זה ינתק את החיבור הנוכחי ויחולל ברקוד סריקה חדש.")) {
        try {
            await update(ref(dbRT, 'saban94/status'), { 
                reset_command: true,
                online: false,
                qr: null 
            });
            alert("פקודת ריסטרט נשלחה. המתן להופעת הברקוד על המסך.");
        } catch (e) {
            alert("שגיאה בשליחת פקודת האיפוס.");
        }
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await setDoc(doc(dbFS, 'system', 'config'), sysConfig, { merge: true });
    setIsSaving(false);
    alert("הגדרות תשתית נשמרו!");
  };

  const handleSaveProfile = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    await setDoc(doc(dbFS, 'customers', selectedCustomer.id), { ...editCrm, lastUpdated: serverTimestamp() }, { merge: true });
    setIsSaving(false);
  };

  const filtered = customers.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0B141A] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`} dir="rtl">
      
      {/* 1. Sidebar ניווט */}
      <aside className="w-20 bg-[#111B21] border-l border-white/5 flex flex-col items-center py-8 z-30 shadow-2xl">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-10 overflow-hidden cursor-pointer active:scale-95 transition-transform">
          <img src={BRAND_LOGO} alt="Saban" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-8 flex-1">
          {[
            { id: 'CHATS', icon: MessageCircle, label: 'צ\'אטים' },
            { id: 'CRM', icon: UserCog, label: 'סטודיו DNA' },
            { id: 'FLOW', icon: GitBranch, label: 'ענפי מענה' },
            { id: 'NETWORK', icon: Network, label: 'תשתית' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-2xl transition-all relative group ${activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <tab.icon size={26} />
              <span className="absolute right-20 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-600 hover:text-emerald-500 transition-colors">
          {theme === 'dark' ? <Clock size={24} /> : <Activity size={24} />}
        </button>
      </aside>

      {/* 2. Side Panel (List) */}
      <aside className="w-[380px] bg-[#111B21] border-l border-white/5 flex flex-col z-20 shadow-xl">
        <header className="p-6 border-b border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black italic tracking-tighter text-slate-200 uppercase">Saban Hub</h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isTrulyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isTrulyOnline ? 'JONI LIVE' : 'OFFLINE'}
            </div>
          </div>
          {activeTab !== 'NETWORK' && (
            <div className="relative">
                <Search className="absolute right-3 top-3 text-slate-500" size={16}/>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש מנהל פרויקט..." className="w-full bg-[#202C33] p-3 pr-10 rounded-xl border-none outline-none text-sm font-bold shadow-inner focus:ring-1 focus:ring-emerald-500/50" />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {activeTab === 'NETWORK' ? (
                <div className="p-6 space-y-6">
                    {/* 🔥 כפתור איפוס מהיר */}
                    <button 
                      onClick={handleHardReset}
                      className="w-full p-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      <Power size={18}/> ריסטרט קשיח לשרת
                    </button>

                    <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={14}/> הגדרות JONI</h3>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold opacity-50">Firebase Realtime Url:</label>
                            <input value={sysConfig.rtDbUrl} onChange={e => setSysConfig({...sysConfig, rtDbUrl: e.target.value})} className="w-full bg-black/40 p-2.5 rounded-lg text-[10px] font-mono outline-none border border-white/5 text-white shadow-inner" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold opacity-50">המתן (שניות):</label>
                                <input type="number" value={sysConfig.msgDelay} onChange={e => setSysConfig({...sysConfig, msgDelay: Number(e.target.value)})} className="w-full bg-black/40 p-2.5 rounded-lg text-xs font-black outline-none border border-white/5 text-emerald-500" />
                            </div>
                            <button onClick={() => setSysConfig({...sysConfig, alwaysConnected: !sysConfig.alwaysConnected})} className={`mt-5 p-2 rounded-lg text-[10px] font-black border transition-all ${sysConfig.alwaysConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                                {sysConfig.alwaysConnected ? <Wifi size={14}/> : <WifiOff size={14}/>} תמיד מחובר
                            </button>
                        </div>
                        <button onClick={handleSaveConfig} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all">
                            שמור וסנכרן תשתית
                        </button>
                    </div>
                    
                    <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">איכות הצינור</span>
                          <span className={`text-[10px] font-bold ${isTrulyOnline ? 'text-emerald-500' : 'text-red-500'}`}>{signalQuality}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Heart size={20} className={isTrulyOnline ? 'text-emerald-500 animate-pulse' : 'text-red-500'}/>
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <motion.div animate={{width: isTrulyOnline ? '100%' : '10%'}} className={`h-full ${isTrulyOnline ? 'bg-emerald-500' : 'bg-red-500'}`}/>
                        </div>
                        <span className="font-mono text-[10px] opacity-50">{(timeDiff/1000).toFixed(1)}s</span>
                      </div>
                    </div>
                </div>
            ) : (
                filtered.map(c => (
                    <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 flex items-center gap-4 transition-all relative ${selectedCustomer?.id === c.id ? 'bg-[#2A3942] border-r-4 border-emerald-500' : 'hover:bg-[#202C33] border-r-4 border-transparent'}`}>
                        <div className="w-14 h-14 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/5 relative">
                            {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <Users className="m-auto mt-4 text-slate-600" size={24}/>}
                            {c.botState === 'HUMAN_RAMI' && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-[#111B21] rounded-full shadow-sm"></div>}
                        </div>
                        <div className="text-right flex-1 overflow-hidden">
                            <div className="text-[15px] font-bold text-slate-200 truncate">{c.name || "לקוח ללא שם"}</div>
                            <div className="text-[11px] opacity-40 font-mono mt-1 flex items-center gap-2 italic">ID: {normalizeId(c.id)}</div>
                        </div>
                        {c.botState !== 'HUMAN_RAMI' && <Bot size={14} className="text-emerald-500 animate-pulse" />}
                    </button>
                ))
            )}
        </div>
      </aside>

      {/* --- 3. Main Command Area --- */}
      <main className="flex-1 flex flex-col relative bg-[#0B141A]" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-20 bg-[#202C33]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10 shadow-lg">
              <div className="flex items-center gap-4 text-right">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/30">
                  <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-200 tracking-tight">{selectedCustomer.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedCustomer.botState === 'HUMAN_RAMI' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {selectedCustomer.botState === 'HUMAN_RAMI' ? 'שליטה ידנית' : 'AI פעיל'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl border-2 transition-all ${queueCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                  <span className="text-[10px] font-black uppercase flex items-center gap-2">
                    {queueCount > 0 ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
                    תור: {queueCount}
                  </span>
                </div>
                <button onClick={() => updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { botState: selectedCustomer.botState === 'HUMAN_RAMI' ? 'MENU' : 'HUMAN_RAMI' })} className={`p-3 rounded-2xl border-2 transition-all shadow-lg ${selectedCustomer.botState !== 'HUMAN_RAMI' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                  {selectedCustomer.botState !== 'HUMAN_RAMI' ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                </button>
              </div>
            </header>

            {/* Malshinan Sniffer */}
            <AnimatePresence>
              {showDiagnostics && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-black/95 backdrop-blur-md border-b border-emerald-500/20 overflow-hidden z-20 shadow-2xl">
                  <div className="p-4 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2 text-emerald-500 font-black">
                      <p className="uppercase flex items-center gap-2 tracking-[0.2em]"><Terminal size={14}/> מלשינון תעבורה (DUAL SNIFFER)</p>
                      <div className="flex gap-2">
                         <span className="bg-emerald-500/20 px-1 rounded">RAMI_PATH</span>
                         <span className="bg-blue-500/20 px-1 rounded text-blue-400">JONI_BRIDGE</span>
                      </div>
                    </div>
                    {incomingLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-4 border-b border-white/5 py-1.5 hover:bg-white/5 transition-colors">
                        <span className="text-blue-500 font-bold">[{new Date(log.time).toLocaleTimeString()}]</span>
                        <span className="text-purple-400 font-black">FROM: {log.sender}</span>
                        <span className="text-slate-300 truncate italic flex-1">"{log.text}"</span>
                        <span className="opacity-40 text-[8px] uppercase font-bold">{log.path?.split('/')[0]}</span>
                      </div>
                    ))}
                    {incomingLogs.length === 0 && <p className="text-slate-600 italic py-2 animate-pulse">ממתין לתעבורה משרת המשרד...</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 no-scrollbar shadow-inner">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-[1.5rem] text-[15px] shadow-xl relative leading-relaxed transition-all ${m.type === 'in' ? 'bg-[#202C33] text-slate-100 self-start rounded-tr-none border border-white/5' : 'bg-[#005C4B] text-white self-end rounded-tl-none shadow-emerald-950/20 border border-emerald-400/10'}`}>
                  {m.source === 'manual-rami' && <div className="text-[9px] font-black uppercase text-emerald-300 mb-1 tracking-widest border-b border-white/10 pb-1 text-right">ראמי שלח</div>}
                  <div className="font-medium whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[10px] opacity-40 text-left mt-3 font-mono flex justify-end gap-1 items-center italic">
                    {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : 'שולח...'}
                    {!m.type && <CheckCircle2 size={12} className="text-emerald-400 ml-1"/>}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 bg-[#202C33] border-t border-white/5 flex gap-4 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
              <input 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()} 
                placeholder="כתוב הודעה לצינור..." 
                className={`flex-1 bg-[#2A3942] p-4 rounded-2xl border outline-none font-bold text-slate-100 focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner ${queueCount > 3 ? 'border-red-500/50' : 'border-white/5'}`} 
              />
              <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-[#111B21] rounded-2xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-500 shadow-emerald-500/20 transition-all">
                <Send className="rotate-180 -mr-1" size={30}/>
              </button>
            </footer>
          </>
        ) : (
          <div className="m-auto flex flex-col items-center gap-10 text-white text-center opacity-10">
              <MessageCircle size={250} className="animate-pulse" />
              <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none">Saban Hub</h1>
          </div>
        )}
      </main>

      {/* --- 4. CRM Sidebar (DNA) --- */}
      {selectedCustomer && ( activeTab === 'CRM' || activeTab === 'CHATS' ) && (
        <aside className="w-[450px] flex flex-col bg-[#111B21] border-r border-white/5 p-8 overflow-y-auto no-scrollbar shadow-2xl z-30">
          <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h3 className="font-black flex items-center gap-3 text-blue-400 text-xl tracking-tight uppercase"><ShieldCheck size={28}/> DNA & CRM</h3>
            <button onClick={() => remove(ref(dbRT, 'rami/outgoing'))} title="נקה תור" className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-600 transition-all shadow-sm"><Eraser size={18}/></button>
          </header>
          
          <div className="space-y-10 text-right">
            <div className="flex flex-col items-center gap-6">
              <div className="w-44 h-44 rounded-[3.5rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative group transform hover:rotate-2 transition-all">
                <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                <div onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer font-black text-[10px] uppercase text-white">החלף תמונה</div>
              </div>
              <input 
                value={editCrm.name} 
                onChange={e => setEditCrm({...editCrm, name: e.target.value})} 
                className="bg-transparent border-none outline-none text-3xl font-black text-white italic text-center w-full focus:ring-1 focus:ring-emerald-500/30 rounded" 
                placeholder="שם הלקוח" 
              />
              <span className="text-[11px] bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full font-mono font-black tracking-[0.2em]">ID: {selectedCustomer.id}</span>
            </div>

            <div className="grid gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> קומקס</label>
                <input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className="w-full bg-[#202C33] p-4 rounded-2xl outline-none border border-white/5 font-bold shadow-inner focus:border-blue-500/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2"><Zap size={16}/> פקודות DNA אישיות</label>
                <textarea 
                  value={editCrm.dnaContext} 
                  onChange={e => setEditCrm({...editCrm, dnaContext: e.target.value})} 
                  rows={8} 
                  className="w-full bg-purple-500/5 p-5 rounded-[2rem] outline-none border border-purple-500/20 focus:border-purple-500 font-bold text-[13px] resize-none leading-relaxed text-slate-200 shadow-inner" 
                  placeholder="תכנת את הבוט ללקוח זה..." 
                />
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2.5rem] shadow-xl active:scale-95 transition-all text-xl uppercase tracking-widest flex items-center justify-center gap-4">
              {isSaving ? <Loader2 size={24} className="animate-spin"/> : <><Save size={24}/> Sync & Commit DNA</>}
            </button>
          </div>
        </aside>
      )}

      {/* --- 5. Global QR Overlay (Persistent Scan) --- */}
      <AnimatePresence>
        {(!isTrulyOnline && serverStatus.qr) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B141A]/98 backdrop-blur-3xl">
             <div className="bg-white rounded-[4rem] p-12 max-w-md w-full text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative border-4 border-amber-500/30 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse"></div>
                <div className="w-24 h-24 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white animate-bounce"><QrCode size={56} /></div>
                <h2 className="text-4xl font-black text-slate-900 italic mb-3 tracking-tighter uppercase leading-none text-center">Scan Required</h2>
                <p className="text-slate-500 font-bold mb-10 text-base leading-relaxed text-center">השרת במשרד ממתין לחיבור. סרוק את הברקוד כדי לפתוח את הצינור מחדש.</p>
                <div className="bg-white p-6 rounded-[3rem] border-4 border-dashed border-slate-200 mb-10 aspect-square flex items-center justify-center overflow-hidden shadow-inner relative group">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-3xl border-4 border-white" alt="QR" />
                </div>
                <button onClick={handleHardReset} className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-lg active:scale-95 border border-red-700/20">ביצוע ריסטרט קשיח למשרד</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
