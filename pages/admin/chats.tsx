import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, Printer, UserCog, Building, MapPin, Phone, CreditCard, Power, X, Search, 
  Truck, Crown, PackageSearch, Merge, CheckCircle2, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, AlertTriangle, ShieldAlert, History, Terminal, Database, ArrowRightLeft, 
  Loader2, Radio, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff
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
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [incomingLogs, setIncomingLogs] = useState<any[]>([]);

  const [editCrm, setEditCrm] = useState<any>({ 
    name: '', comaxId: '', projectName: '', projectAddress: '', dnaContext: '', photo: '' 
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // נרמול מזהים לאיחוד
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 60000);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // מאזין סטטוס שרת
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      const data = snap.val();
      if (data) {
        setServerStatus(prev => ({ ...prev, ...data }));
        if (data.qr && !data.online) setShowQrModal(true);
      }
    });

    // מלשינון: מעקב אחרי הודעות נכנסות גולמיות (Raw Traffic)
    onValue(ref(dbRT, 'saban94/incoming'), (snap) => {
        if (snap.exists()) {
            const rawData = snap.val();
            const lastEntry = Object.values(rawData).pop() as any;
            setIncomingLogs(prev => [{...lastEntry, id: Date.now()}, ...prev].slice(0, 10));
        }
    });

    // מד עומס בצינור השליחה
    onValue(ref(dbRT, 'saban94/outgoing'), (snap) => {
        setQueueCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    // טעינת לקוחות עם לוגיקת "רדומים"
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(100)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const lastActivity = curr.lastMessageAt?.seconds ? curr.lastMessageAt.seconds * 1000 : 0;
          const isInactive = (Date.now() - lastActivity) > (24 * 60 * 60 * 1000); // מעל 24 שעות
          
          const existing = unifiedMap.get(uid);
          if (!existing || (!existing.name && curr.name)) {
            unifiedMap.set(uid, { ...curr, uid, isInactive });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, []);

  // סנכרון צ'אט (תיקון קבלה אגרסיבי)
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

    // מאזין להיסטוריה - אם הודעה נכנסת ל-Firestore היא תקפוץ כאן מיד
    const unsubHistory = onSnapshot(query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'), limit(60)), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubHistory();
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // שליחה ידנית + השתלטות
  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    const targetId = selectedCustomer.id; 
    setChatInput('');

    try {
      // כיבוי AI אוטומטי בעת השתלטות
      await updateDoc(doc(dbFS, 'customers', targetId), { botState: 'HUMAN_RAMI' });
      
      await push(ref(dbRT, 'saban94/outgoing'), { number: targetId, message: txt, timestamp: Date.now() });

      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-control' 
      });
      
      await updateDoc(doc(dbFS, 'customers', targetId), { lastUpdated: serverTimestamp() });
    } catch (e) { console.error(e); }
  };

  const resetToAiMenu = async () => {
    if (!selectedCustomer) return;
    await updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { botState: 'MENU', lastUpdated: serverTimestamp() });
    await push(ref(dbRT, 'saban94/outgoing'), { 
        number: selectedCustomer.id, 
        message: "סנכרון תפריט הופעל. מיד תקבל את האפשרויות המעודכנות...",
        timestamp: Date.now() 
    });
  };

  const saveProfile = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    await setDoc(doc(dbFS, 'customers', selectedCustomer.id), { ...editCrm, lastUpdated: serverTimestamp() }, { merge: true });
    setIsSaving(false);
  };

  const filtered = customers.filter(c => (c.projectName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617] text-slate-100 font-sans' : 'bg-slate-50 text-slate-900 font-sans'}`} dir="rtl">
      
      {/* סרגל ניווט */}
      <aside className={`w-20 flex flex-col items-center py-8 border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-10 overflow-hidden cursor-pointer">
            <img src={BRAND_LOGO} alt="logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 flex-1">
            {[{id: 'HUB', icon: MessageCircle}, {id: 'CRM', icon: UserCog}, {id: 'NETWORK', icon: Network}].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-500 hover:bg-emerald-500/10'}`}>
                    <tab.icon size={24} />
                </button>
            ))}
        </div>
        <button onClick={() => setShowDiagnostics(!showDiagnostics)} className={`p-3 transition-colors ${showDiagnostics ? 'text-amber-500' : 'text-slate-500'}`}>
            <Terminal size={24} />
        </button>
      </aside>

      {/* רשימת צ'אטים */}
      <aside className={`w-96 flex flex-col border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'}`}>
        <header className="p-6 border-b border-inherit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg flex items-center gap-2 text-emerald-500 uppercase tracking-tighter">JONI HUB</h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {isTrulyOnline ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-500" size={16}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש לקוח..." className="w-full bg-black/20 p-3 pr-10 rounded-xl border-none outline-none text-sm font-bold shadow-inner" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-transparent hover:bg-white/5'}`}>
                <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative">
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <Users className="m-auto mt-3 text-slate-500" size={20}/>}
                  {c.isInactive && <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-slate-500 rounded-full border-2 border-[#0f172a]" title="לקוח רדום"></div>}
                  {c.botState === 'HUMAN_RAMI' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a]" title="שליטה ידנית"></div>}
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <div className="text-sm font-black truncate">{c.name || "לקוח"}</div>
                  <div className="text-[10px] opacity-40 font-mono mt-1 italic">
                      {c.isInactive ? 'רדום (מעל 24ש)' : 'פעיל'} | {normalizeId(c.id)}
                  </div>
                </div>
                {c.botState !== 'HUMAN_RAMI' && <Bot size={14} className="text-emerald-500 animate-pulse" />}
              </button>
            ))}
        </div>
      </aside>

      {/* אזור עבודה ראשי */}
      <main className="flex-1 flex flex-col relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-lg">
                    <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-lg font-black italic tracking-tight">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedCustomer.botState === 'HUMAN_RAMI' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {selectedCustomer.botState === 'HUMAN_RAMI' ? 'Manual Control' : 'AI Engine Listening'}
                        </span>
                    </div>
                </div>
              </div>
              <div className="flex gap-3">
                  <button onClick={resetToAiMenu} className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-black hover:bg-purple-600 hover:text-white transition-all">
                      <RefreshCw size={14}/> רענון תפריט
                  </button>
                  <button onClick={() => updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { botState: selectedCustomer.botState === 'HUMAN_RAMI' ? 'MENU' : 'HUMAN_RAMI' })} className={`p-3 rounded-xl border-2 transition-all ${selectedCustomer.botState !== 'HUMAN_RAMI' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      {selectedCustomer.botState !== 'HUMAN_RAMI' ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  </button>
              </div>
            </header>

            {/* מלשינון לוגים פנימי (שקוף) */}
            <AnimatePresence>
                {showDiagnostics && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-black/80 backdrop-blur-md border-b border-white/10 overflow-hidden z-20">
                        <div className="p-4 font-mono text-[10px] space-y-1 max-h-40 overflow-y-auto">
                            <p className="text-amber-500 font-bold border-b border-white/5 pb-1 mb-2 flex items-center gap-2"><Terminal size={12}/> מלשינון תעבורה (RAW INCOMING):</p>
                            {incomingLogs.length === 0 && <p className="text-slate-500 italic">ממתין לתעבורה מהווצאפ...</p>}
                            {incomingLogs.map(log => (
                                <div key={log.id} className="flex gap-4 border-b border-white/5 py-1">
                                    <span className="text-blue-400">[{new Date().toLocaleTimeString()}]</span>
                                    <span className="text-emerald-400">FROM: {log.sender}</span>
                                    <span className="text-slate-300 truncate italic">MSG: "{log.text}"</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 no-scrollbar">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-2xl text-[14px] shadow-2xl relative ${m.type === 'in' ? 'bg-slate-800 text-slate-100 self-start rounded-tr-none border border-white/5' : 'bg-[#005c4b] text-white self-end rounded-tl-none shadow-emerald-950/20'}`}>
                  {m.source === 'manual-control' && <div className="text-[8px] font-black uppercase text-emerald-300 mb-1 tracking-widest">השתלטות ידנית</div>}
                  <div className="font-bold leading-relaxed">{m.text}</div>
                  <div className="text-[9px] opacity-40 text-left mt-3 font-mono flex justify-end gap-1 items-center">
                    {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : 'שולח...'}
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
              <MessageCircle size={200} className="animate-pulse" />
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">SABAN COMMAND<br/><span className="text-2xl text-emerald-500 tracking-[0.2em]">The AI Watchtower</span></h1>
          </div>
        )}
      </main>

      {/* CRM Sidebar - DNA LAB */}
      {selectedCustomer && (
        <aside className={`w-[450px] flex flex-col p-8 border-r ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white'} overflow-y-auto no-scrollbar`}>
          <h3 className="font-black flex items-center gap-3 text-blue-400 text-xl tracking-tight mb-10 border-b border-white/5 pb-4 uppercase"><ShieldCheck/> DNA & IDENTITY</h3>
          
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-6">
                <div className="w-36 h-36 rounded-[2.5rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-2xl relative group">
                  <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                  <div onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer font-black text-xs uppercase text-white">החלף תמונה</div>
                </div>
                <input value={editCrm.name} onChange={e => setEditCrm({...editCrm, name: e.target.value})} className="bg-transparent border-none outline-none text-2xl font-black text-white italic text-center w-full focus:ring-1 focus:ring-emerald-500 rounded transition-all" placeholder="שם הלקוח" />
            </div>

            <div className="grid gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1"><CreditCard size={12}/> קומקס / לקוח</label><input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 font-bold text-white shadow-inner" /></div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><Zap size={14}/> הנחיות DNA אישיות</label>
                    <textarea value={editCrm.dnaContext} onChange={e => setEditCrm({...editCrm, dnaContext: e.target.value})} rows={6} className="w-full bg-purple-500/5 p-4 rounded-2xl outline-none border border-purple-500/10 focus:border-purple-500 font-bold text-xs resize-none leading-relaxed text-slate-200 shadow-inner" placeholder="תכנת את הבוט ללקוח זה..." />
                </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 shadow-inner space-y-4 text-[11px]">
                <div className="flex justify-between items-center text-slate-400 font-black uppercase tracking-widest">
                    <span>סטטוס צינור</span>
                    <span className={queueCount > 0 ? 'text-amber-500' : 'text-emerald-500'}>{queueCount > 0 ? 'Queue Active' : 'Pipeline Clear'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Heart size={20} className={isTrulyOnline ? 'text-emerald-500 animate-pulse' : 'text-red-500'}/>
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div animate={{width: isTrulyOnline ? '100%' : '10%'}} className={`h-full ${isTrulyOnline ? 'bg-emerald-500' : 'bg-red-500'}`}/>
                    </div>
                    <span className="font-mono opacity-50">{(timeDiff/1000).toFixed(1)}s LAG</span>
                </div>
            </div>

            <button onClick={saveProfile} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xl uppercase tracking-widest">
                {isSaving ? <Loader2 size={24} className="animate-spin"/> : <><Save size={24}/> Sync & Commit</>}
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
                <h2 className="text-3xl font-black text-slate-900 italic mb-2 tracking-tighter">Secure JONI Pipe</h2>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border-4 border-dashed border-slate-200 mb-8 aspect-square flex items-center justify-center overflow-hidden">
                    {serverStatus.qr ? (
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-2xl border-4 border-white" alt="QR" />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Activity size={48} className="animate-spin text-amber-500" />
                            <span className="text-xs font-black uppercase">Generating...</span>
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
