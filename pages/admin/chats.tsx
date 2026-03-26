import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove, onChildAdded } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, UserCog, Building, MapPin, CreditCard, Power, X, Search, 
  Merge, CheckCircle2, Wifi, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, Terminal, Database, ArrowRightLeft, 
  Loader2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle, Settings2, Link2, Globe, Eraser, LayoutDashboard, GitBranch
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

  // System & CRM Edit States
  const [sysConfig, setSysConfig] = useState({ msgDelay: 2, activePath: 'rami' });
  const [editCrm, setEditCrm] = useState<any>({ name: '', comaxId: '', dnaContext: '', photo: '' });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Helpers
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000);
  const signalQuality = timeDiff < 15000 ? 'EXCELLENT' : timeDiff < 45000 ? 'GOOD' : 'WEAK';

  // --- Realtime Listeners ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // 1. Status Pulse (saban94/status)
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      if (snap.exists()) setServerStatus(prev => ({ ...prev, ...snap.val() }));
    });

    // 2. Dual Path Sniffer (The Malshinan)
    const paths = ['rami/incoming', 'saban94/incoming'];
    paths.forEach(p => {
        onChildAdded(ref(dbRT, p), (snapshot) => {
            const data = snapshot.val();
            if (data?.sender) {
                setIncomingLogs(prev => [{...data, id: snapshot.key, time: Date.now(), path: p}, ...prev].slice(0, 25));
            }
        });
    });

    // 3. Outgoing Queue Monitor
    onValue(ref(dbRT, 'rami/outgoing'), (snap) => {
        setQueueCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    // 4. CRM Customers Listener
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(100)), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, []);

  // --- Selection & Chat Logic ---
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
      // Manual Takeover Status
      await updateDoc(doc(dbFS, 'customers', targetId), { botState: 'HUMAN_RAMI', lastUpdated: serverTimestamp() });
      
      // Push to Realtime Pipe
      await push(ref(dbRT, 'rami/outgoing'), { number: targetId, message: txt, timestamp: Date.now() });
      
      // Log to History
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-rami' 
      });
    } catch (e) { console.error("Send Error:", e); }
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
      
      {/* --- 1. Left Navigation Bar (PWA Style) --- */}
      <aside className="w-20 bg-[#111B21] border-l border-white/5 flex flex-col items-center py-8 z-30 shadow-2xl">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-10 overflow-hidden cursor-pointer active:scale-90 transition-transform">
          <img src={BRAND_LOGO} alt="Saban" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-8 flex-1">
          {[
            { id: 'CHATS', icon: MessageCircle, label: 'צ\'אטים' },
            { id: 'CRM', icon: UserCog, label: 'סטודיו DNA' },
            { id: 'FLOW', icon: GitBranch, label: 'ניהול תפריט' },
            { id: 'NETWORK', icon: Network, label: 'מלשינון רשת' }
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

      {/* --- 2. Side Panel (List) --- */}
      <aside className="w-[380px] bg-[#111B21] border-l border-white/5 flex flex-col z-20">
        <header className="p-6 border-b border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black italic tracking-tighter text-slate-200">SABAN <span className="text-emerald-500">HUB</span></h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isTrulyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isTrulyOnline ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-500" size={16} />
            <input 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="חיפוש מנהל פרויקט..." 
              className="w-full bg-[#202C33] p-3 pr-10 rounded-xl border-none outline-none text-sm font-medium text-slate-200 focus:ring-1 focus:ring-emerald-500/50 transition-all" 
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {filtered.map(c => (
            <button 
              key={c.id} 
              onClick={() => setSelectedCustomer(c)}
              className={`w-full p-4 flex items-center gap-4 transition-all relative ${selectedCustomer?.id === c.id ? 'bg-[#2A3942] border-r-4 border-emerald-500' : 'hover:bg-[#202C33] border-r-4 border-transparent'}`}
            >
              <div className="w-14 h-14 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/5 relative shadow-inner">
                {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <Users className="m-auto mt-4 text-slate-600" size={24}/>}
                {c.botState === 'HUMAN_RAMI' && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-[#111B21] rounded-full shadow-sm"></div>}
              </div>
              <div className="text-right flex-1 overflow-hidden">
                <div className="text-[15px] font-bold text-slate-200 truncate">{c.name || "לקוח ללא שם"}</div>
                <div className="text-[11px] opacity-40 font-mono mt-1 flex items-center gap-2 italic">
                  ID: {normalizeId(c.id)} | {c.botState || 'MENU'}
                </div>
              </div>
              {c.botState !== 'HUMAN_RAMI' && <Bot size={14} className="text-emerald-500 animate-pulse" />}
            </button>
          ))}
        </div>
      </aside>

      {/* --- 3. Main Command Area --- */}
      <main className="flex-1 flex flex-col relative bg-[#0B141A]" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            {/* Header */}
            <header className="h-20 bg-[#202C33]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-md">
                  <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-200 tracking-tight">{selectedCustomer.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedCustomer.botState === 'HUMAN_RAMI' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {selectedCustomer.botState === 'HUMAN_RAMI' ? 'שליטה ידנית של ראמי' : 'מנוע AI פעיל'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl border-2 transition-all ${queueCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                  <span className="text-[10px] font-black uppercase flex items-center gap-2">
                    {queueCount > 0 ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
                    תור: {queueCount} {queueCount > 0 ? '(חסום)' : '(נקי)'}
                  </span>
                </div>
                <button onClick={() => updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { botState: selectedCustomer.botState === 'HUMAN_RAMI' ? 'MENU' : 'HUMAN_RAMI' })} className={`p-3 rounded-2xl border-2 transition-all shadow-lg ${selectedCustomer.botState !== 'HUMAN_RAMI' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                  {selectedCustomer.botState !== 'HUMAN_RAMI' ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                </button>
              </div>
            </header>

            {/* Malshinan Sniffer Terminal */}
            <AnimatePresence>
              {showDiagnostics && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-black/95 backdrop-blur-md border-b border-emerald-500/20 overflow-hidden z-20 shadow-2xl">
                  <div className="p-4 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                      <p className="text-emerald-500 font-black uppercase flex items-center gap-2 tracking-[0.2em]"><Terminal size={14}/> מלשינון תעבורה (DUAL PATH SNIFFER)</p>
                      <div className="flex gap-2">
                         <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black">RAMI/INC</span>
                         <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black">SABAN/INC</span>
                      </div>
                    </div>
                    {incomingLogs.map((log, idx) => (
                      <div key={idx} className={`flex gap-4 border-b border-white/5 py-1.5 hover:bg-white/5 transition-colors ${log.path?.includes('saban94') ? 'text-amber-200' : 'text-slate-100'}`}>
                        <span className="text-blue-500 font-bold">[{new Date(log.time).toLocaleTimeString()}]</span>
                        <span className={`font-black ${log.path?.includes('saban94') ? 'text-amber-500' : 'text-emerald-400'}`}>FROM: {log.sender}</span>
                        <span className="text-slate-400 truncate italic flex-1">"{log.text}"</span>
                        <span className="opacity-40 text-[8px] uppercase">{log.path}</span>
                      </div>
                    ))}
                    {incomingLogs.length === 0 && <p className="text-slate-600 italic py-2 animate-pulse">ממתין לתעבורה משרת המשרד...</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 no-scrollbar shadow-inner">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-[1.5rem] text-[15px] shadow-xl relative leading-relaxed transition-all ${m.type === 'in' ? 'bg-[#202C33] text-slate-100 self-start rounded-tr-none border border-white/5' : 'bg-[#005C4B] text-white self-end rounded-tl-none shadow-emerald-950/20 border border-emerald-400/10'}`}>
                  {m.source === 'manual-rami' && <div className="text-[9px] font-black uppercase text-emerald-300 mb-1 tracking-widest border-b border-white/10 pb-1">ראמי שלח</div>}
                  <div className="font-medium whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[10px] opacity-40 text-left mt-3 font-mono flex justify-end gap-1 items-center italic">
                    {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '...'}
                    {!m.type && <CheckCircle2 size={12} className="text-emerald-400 ml-1"/>}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Input */}
            <footer className="p-6 bg-[#202C33] border-t border-white/5 flex gap-4 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
              <div className="flex-1 relative">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                  placeholder={queueCount > 5 ? "⚠️ הצינור סתום, ההודעה עשויה להתעכב" : "כתוב הודעה לצינור..."} 
                  className={`w-full bg-[#2A3942] p-4 rounded-2xl border outline-none font-bold text-slate-100 focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner ${queueCount > 5 ? 'border-red-500/50' : 'border-white/5'}`} 
                />
              </div>
              <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-[#111B21] rounded-2xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-500 shadow-emerald-500/20 transition-all">
                <Send className="rotate-180 -mr-1" size={30}/>
              </button>
            </footer>
          </>
        ) : (
          <div className="m-auto flex flex-col items-center gap-10 text-white text-center opacity-20">
              <MessageCircle size={250} className="animate-pulse" />
              <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none">SABAN HUB<br/><span className="text-3xl text-emerald-500 tracking-[0.4em]">Ready for Action</span></h1>
          </div>
        )}
      </main>

      {/* --- 4. CRM & AI Studio (Right Sidebar) --- */}
      {selectedCustomer && (
        <aside className="w-[450px] flex flex-col bg-[#111B21] border-r border-white/5 p-8 overflow-y-auto no-scrollbar shadow-2xl z-30">
          <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h3 className="font-black flex items-center gap-3 text-blue-400 text-xl tracking-tight uppercase"><ShieldCheck size={28}/> DNA & IDENTITY</h3>
            <div className="flex gap-2">
               <button onClick={() => remove(ref(dbRT, 'rami/outgoing'))} title="נקה תור" className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Eraser size={18}/></button>
            </div>
          </header>
          
          <div className="space-y-10">
            {/* Profile Avatar & Name */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-44 h-44 rounded-[3.5rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative group transform hover:rotate-2 transition-all">
                <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                <div onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer font-black text-[10px] uppercase text-white gap-2">
                  <ImageIcon size={24}/> החלף תמונת זהות
                </div>
              </div>
              <div className="text-center w-full space-y-2">
                <input 
                  value={editCrm.name} 
                  onChange={e => setEditCrm({...editCrm, name: e.target.value})} 
                  className="bg-transparent border-none outline-none text-3xl font-black text-white italic text-center w-full focus:ring-1 focus:ring-emerald-500/30 rounded" 
                  placeholder="שם הלקוח" 
                />
                <span className="text-[11px] bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full font-mono font-black tracking-[0.2em] uppercase shadow-inner border border-emerald-500/10">ID: {selectedCustomer.id}</span>
              </div>
            </div>

            {/* Config Fields */}
            <div className="grid gap-6 text-white">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1"><CreditCard size={14}/> מספר לקוח קומקס</label>
                <input 
                  value={editCrm.comaxId} 
                  onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} 
                  className="w-full bg-[#202C33] p-4 rounded-2xl outline-none border border-white/5 font-bold shadow-inner focus:border-blue-500/50 transition-all" 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2 px-1"><Zap size={16}/> פקודות DNA והזרקת מוח AI</label>
                <textarea 
                  value={editCrm.dnaContext} 
                  onChange={e => setEditCrm({...editCrm, dnaContext: e.target.value})} 
                  rows={8} 
                  className="w-full bg-purple-500/5 p-5 rounded-[2rem] outline-none border border-purple-500/20 focus:border-purple-500 font-bold text-[13px] resize-none leading-relaxed text-slate-200 shadow-inner" 
                  placeholder="תכנת את הבוט ללקוח זה: למשל, 'תמיד להציע הובלה עם מנוף', 'לקוח VIP - לדבר בשיא הכבוד'..." 
                />
              </div>
            </div>

            {/* Pulse Stats */}
            <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner space-y-5">
              <div className="flex justify-between items-center text-slate-400 font-black uppercase tracking-widest text-[10px]">
                <span>איכות הצינור</span>
                <span className={queueCount > 0 ? 'text-red-500' : 'text-emerald-500'}>{signalQuality}</span>
              </div>
              <div className="flex items-center gap-4">
                <Heart size={24} className={isTrulyOnline ? 'text-emerald-500 animate-pulse' : 'text-red-500'}/>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <motion.div animate={{width: isTrulyOnline ? '100%' : '10%'}} className={`h-full ${isTrulyOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}/>
                </div>
                <span className="font-mono text-xs opacity-50 font-black">{(timeDiff/1000).toFixed(1)}s LAG</span>
              </div>
            </div>

            <button 
              onClick={handleSaveProfile} 
              disabled={isSaving} 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2.5rem] shadow-[0_15px_30px_rgba(37,99,235,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 text-xl tracking-widest uppercase"
            >
              {isSaving ? <Loader2 size={24} className="animate-spin"/> : <><Save size={24}/> Sync & Commit DNA</>}
            </button>
          </div>
        </aside>
      )}

      {/* --- 5. Global QR Overlay --- */}
      <AnimatePresence>
        {!isTrulyOnline && serverStatus.qr && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B141A]/98 backdrop-blur-3xl">
             <div className="bg-white rounded-[4rem] p-12 max-w-md w-full text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative border-4 border-amber-500/30 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
                <div className="w-24 h-24 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white animate-bounce"><QrCode size={56} /></div>
                <h2 className="text-4xl font-black text-slate-900 italic mb-3 tracking-tighter uppercase leading-none">Connection Lost</h2>
                <p className="text-slate-500 font-bold mb-10 text-base leading-relaxed">השרת במשרד נותק. סרוק כדי לחבר מחדש את צינור הנתונים של סבן.</p>
                <div className="bg-slate-50 p-8 rounded-[3rem] border-4 border-dashed border-slate-200 mb-10 aspect-square flex items-center justify-center overflow-hidden shadow-inner relative group">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-3xl border-8 border-white" alt="QR" />
                </div>
                <button onClick={() => update(ref(dbRT, 'saban94/status'), { reset_command: true })} className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-lg active:scale-95 border border-red-700/20">ביצוע ריסטרט קשיח למשרד</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
