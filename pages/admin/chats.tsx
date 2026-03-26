import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, Printer, UserCog, Building, MapPin, Phone, CreditCard, Power, X, Search, 
  Truck, Crown, PackageSearch, Merge, CheckCircle2, WifiOff, Heart, QrCode, Clock, Trash,
  Zap, Network, AlertTriangle, ShieldAlert, History, Terminal, Database, ArrowRightLeft, 
  Loader2, Radio, ToggleLeft, ToggleRight
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
  const [isSaving, setIsSaving] = useState(false);

  // המלשינון (Diagnostic Logs & Queue)
  const [diagLogs, setDiagLogs] = useState<{id: string, msg: string, type: 'info' | 'error' | 'success' | 'warn', time: number}[]>([]);
  const [queueCount, setQueueCount] = useState(0);

  // State לעריכת CRM
  const [editCrm, setEditCrm] = useState<any>({ 
    name: '', comaxId: '', projectName: '', projectAddress: '', dnaContext: '', photo: '' 
  });

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

  const addLog = (msg: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
    setDiagLogs(prev => [{ id: Math.random().toString(), msg, type, time: Date.now() }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      const data = snap.val();
      if (data) {
        setServerStatus(prev => ({ ...prev, ...data }));
        if (data.qr && !data.online) setShowQrModal(true);
        if (data.online) setShowQrModal(false);
      }
    });

    onValue(ref(dbRT, 'saban94/outgoing'), (snap) => {
        setQueueCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(150)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const existing = unifiedMap.get(uid);
          if (!existing || (!existing.name && curr.name)) {
            unifiedMap.set(uid, { ...curr, uid, allIds: [curr.id] });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, []);

  // סנכרון צ'אט ופרופיל לקוח נבחר
  useEffect(() => {
    if (!selectedCustomer) return;

    // עדכון טופס עריכה
    setEditCrm({
      name: selectedCustomer.name || '',
      comaxId: selectedCustomer.comaxId || '',
      projectName: selectedCustomer.projectName || '',
      projectAddress: selectedCustomer.projectAddress || '',
      dnaContext: selectedCustomer.dnaContext || '',
      photo: selectedCustomer.photo || ''
    });

    const unsubHistory = onSnapshot(query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc')), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubHistory();
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 🔥 שליחת הודעה + השתלטות (Takeover)
  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    const targetId = selectedCustomer.id; 
    setChatInput('');

    addLog(`השתלטות: שולח הודעה ידנית ל-${targetId}`, "info");

    try {
      // 1. כיבוי הבוט אוטומטית (Human Intervention)
      await updateDoc(doc(dbFS, 'customers', targetId), { 
        botState: 'HUMAN_RAMI',
        lastUpdated: serverTimestamp() 
      });

      // 2. דחיפה לצינור RTDB
      await push(ref(dbRT, 'saban94/outgoing'), { number: targetId, message: txt, timestamp: Date.now() });

      // 3. תיעוד ב-Firestore
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-control' 
      });
      
      addLog(`הודעה נשלחה. AI הועבר למצב כבוי.`, "success");
    } catch (e: any) { 
        addLog(`שגיאת שליחה: ${e.message}`, "error");
    }
  };

  // 🔥 שינוי מצב בוט ידני
  const toggleAiState = async () => {
    if (!selectedCustomer) return;
    const isCurrentlyActive = selectedCustomer.botState !== 'HUMAN_RAMI';
    const newState = isCurrentlyActive ? 'HUMAN_RAMI' : 'MENU';
    
    addLog(`משנה מצב AI ל-${newState}`, "warn");
    await updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { botState: newState });
    // עדכון מקומי ל-UI מהיר
    setSelectedCustomer({...selectedCustomer, botState: newState});
  };

  const saveProfile = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    try {
        await setDoc(doc(dbFS, 'customers', selectedCustomer.id), { 
            ...editCrm, 
            lastUpdated: serverTimestamp() 
        }, { merge: true });
        addLog("פרופיל ו-DNA עודכנו ב-Database", "success");
        setIsSaving(false);
    } catch (e: any) {
        addLog(`שגיאת שמירה: ${e.message}`, "error");
        setIsSaving(false);
    }
  };

  const handleResetServer = async () => {
    if (window.confirm("בצע ריסטרט פיזי לשרת במשרד?")) {
      await update(ref(dbRT, 'saban94/status'), { online: false, qr: null, reset_command: true });
      setShowQrModal(true);
    }
  };

  const filtered = customers.filter(c => (c.projectName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617] text-slate-100 font-sans' : 'bg-slate-50 text-slate-900 font-sans'}`} dir="rtl">
      
      {/* Sidebar ניווט צר */}
      <aside className={`w-20 flex flex-col items-center py-8 border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-10 overflow-hidden cursor-pointer active:scale-90 transition-transform">
            <img src={BRAND_LOGO} alt="logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-6 flex-1">
            {[
                {id: 'HUB', icon: MessageCircle, label: 'צ\'אט'},
                {id: 'CRM', icon: UserCog, label: 'CRM'},
                {id: 'NETWORK', icon: Activity, label: 'מלשינון'}
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 rounded-xl transition-all relative group ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-xl scale-110' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}>
                    <tab.icon size={24} />
                    <span className="absolute right-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">{tab.label}</span>
                </button>
            ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 text-slate-500 hover:text-emerald-500 transition-colors">
            {theme === 'dark' ? <Clock size={24} /> : <Terminal size={24}/>}
        </button>
      </aside>

      {/* רשימת לקוחות */}
      <aside className={`w-96 flex flex-col border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
        <header className="p-6 border-b border-inherit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg flex items-center gap-2 text-emerald-500 tracking-tight">
                <ShieldCheck size={20}/> JONI HUB
            </h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black ${isTrulyOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isTrulyOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
                {isTrulyOnline ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-500" size={16}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש מנהל פרויקט..." className="w-full bg-black/20 p-3 pr-10 rounded-xl border-none outline-none text-sm font-bold shadow-inner focus:ring-1 focus:ring-emerald-500" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${selectedCustomer?.uid === c.uid ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg' : 'border-transparent hover:bg-white/5'}`}>
                <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-white/10 shadow-sm relative">
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <Users className="m-auto mt-3 text-slate-500" size={20}/>}
                  {c.botState === 'HUMAN_RAMI' && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0f172a] rounded-full"></div>}
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <div className="text-sm font-black truncate">{c.name || "לקוח חדש"}</div>
                  <div className="text-[10px] opacity-40 font-mono mt-1">ID: {normalizeId(c.id)}</div>
                </div>
                {c.botState !== 'HUMAN_RAMI' && <Bot size={14} className="text-emerald-500 animate-pulse" />}
              </button>
            ))}
        </div>
      </aside>

      {/* אזור עבודה מרכזי - הצ'אט */}
      <main className="flex-1 flex flex-col relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/50">
                    <img src={selectedCustomer.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-lg font-black italic tracking-tight">{selectedCustomer.name}</h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedCustomer.id}</span>
                </div>
              </div>
              
              {/* כפתור הפעלה/כיבוי AI ללקוח */}
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase">סטטוס בוט JONI</span>
                    <span className={`text-[10px] font-black ${selectedCustomer.botState !== 'HUMAN_RAMI' ? 'text-emerald-500 animate-pulse' : 'text-red-500'}`}>
                        {selectedCustomer.botState !== 'HUMAN_RAMI' ? 'AUTO-REPLY ACTIVE' : 'MANUAL CONTROL (RAMI)'}
                    </span>
                </div>
                <button onClick={toggleAiState} className={`p-3 rounded-xl border-2 transition-all ${selectedCustomer.botState !== 'HUMAN_RAMI' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                    {selectedCustomer.botState !== 'HUMAN_RAMI' ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 no-scrollbar">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-2xl text-[14px] shadow-2xl relative leading-relaxed ${m.type === 'in' ? 'bg-slate-800 text-slate-100 self-start rounded-tr-none border border-white/5' : 'bg-[#005c4b] text-white self-end rounded-tl-none shadow-emerald-950/20'}`}>
                  {m.source === 'manual-control' && <div className="text-[8px] font-black uppercase text-emerald-300 mb-1 tracking-tighter">השתלטות ראמי</div>}
                  <div className="font-bold">{m.text}</div>
                  <div className="text-[9px] opacity-40 text-left mt-3 font-mono flex justify-end gap-1 items-center">
                    {m.isSending && <Loader2 size={10} className="animate-spin ml-1"/>}
                    {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '...'}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 bg-[#0f172a]/95 border-t border-white/5 flex gap-4 z-10 shadow-2xl">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="הכנס הודעה אישית (יכבה את הבוט אוטומטית)..." className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5 outline-none font-bold text-white focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner" />
              <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-500 transition-all hover:shadow-emerald-500/20 shadow-emerald-900/40"><Send className="rotate-180 -mr-1" size={28}/></button>
            </footer>
          </>
        ) : (
          <div className="m-auto opacity-10 flex flex-col items-center gap-8 text-white text-center">
              <MessageCircle size={250} className="animate-pulse" />
              <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-slate-400">SABAN HUB<br/><span className="text-3xl text-emerald-500">Professional Pipeline Command</span></h1>
          </div>
        )}
      </main>

      {/* 4. CRM Sidebar / DNA & Identity Lab */}
      {selectedCustomer && (
        <aside className={`w-[500px] flex flex-col p-8 border-r ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white'} overflow-y-auto no-scrollbar`}>
          <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h3 className="font-black flex items-center gap-3 text-blue-400 text-xl tracking-tight uppercase"><UserCog/> פרופיל ו-DNA</h3>
            <button onClick={handleResetServer} title="ריסטרט למשרד" className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Power size={18}/></button>
          </header>
          
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-6">
                <div className="w-40 h-40 rounded-[3rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative group transform hover:rotate-2 transition-all">
                  <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                  <div onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer font-black text-xs uppercase text-white gap-2">
                      <ImageIcon size={24}/> החלף תמונת זהות
                  </div>
                </div>
                <div className="text-center space-y-2">
                    <input value={editCrm.name} onChange={e => setEditCrm({...editCrm, name: e.target.value})} className="bg-transparent border-none outline-none text-3xl font-black text-white italic text-center w-full focus:ring-1 focus:ring-emerald-500 rounded" placeholder="שם הלקוח" />
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-mono font-bold tracking-widest">ID: {selectedCustomer.id}</span>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><CreditCard size={12}/> מספר קומקס / לקוח</label><input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 focus:border-blue-500 font-bold text-white shadow-inner transition-all" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><MapPin size={12}/> כתובת יעד</label><input value={editCrm.projectAddress} onChange={e => setEditCrm({...editCrm, projectAddress: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl outline-none border border-white/5 focus:border-blue-500 font-bold text-white shadow-inner transition-all" /></div>
                
                {/* 🔥 עורך ה-DNA האישי (AI Personality) */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><Zap size={14}/> DNA והוראות AI אישיות</label>
                    <textarea 
                        value={editCrm.dnaContext} 
                        onChange={e => setEditCrm({...editCrm, dnaContext: e.target.value})} 
                        rows={6} 
                        className="w-full bg-purple-500/5 p-4 rounded-2xl outline-none border border-purple-500/10 focus:border-purple-500 font-bold text-xs resize-none leading-relaxed text-slate-200 shadow-inner" 
                        placeholder="תכנת את הבוט ללקוח זה: למשל, 'תמיד להציע הובלה עם מנוף', 'לקוח VIP - לדבר בשיא הכבוד'..." 
                    />
                </div>
            </div>

            <button onClick={saveProfile} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xl">
                {isSaving ? <Loader2 size={24} className="animate-spin"/> : <><Save size={24}/> סנכרן DNA ופרופיל</>}
            </button>

            <div className={`mt-8 p-5 rounded-3xl border-2 border-dashed flex justify-between items-center ${isTrulyOnline ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest"><Heart size={20} className={isTrulyOnline ? 'animate-pulse text-emerald-500' : 'text-red-500'}/> JONI PULSE</div>
                <div className="text-[10px] font-mono opacity-60">{(timeDiff/1000).toFixed(1)}s LAG</div>
            </div>
          </div>
        </aside>
      )}

      {/* מודל סריקת ברקוד (The Gatekeeper) */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/98 backdrop-blur-3xl">
             <div className="bg-white rounded-[4rem] p-12 max-w-md w-full text-center shadow-[0_40px_120px_rgba(0,0,0,0.8)] relative border-4 border-amber-500/30 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
                <button onClick={() => setShowQrModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={40}/></button>
                <div className="w-24 h-24 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white animate-bounce"><QrCode size={56} /></div>
                <h2 className="text-4xl font-black text-slate-900 italic mb-2 tracking-tighter">חיבור צינור JONI</h2>
                <p className="text-slate-500 font-bold mb-10 text-base leading-relaxed text-slate-600">השרת במשרד נותק. סרוק כדי לחבר.</p>
                <div className="bg-slate-50 p-8 rounded-[3rem] border-4 border-dashed border-slate-200 mb-10 aspect-square flex items-center justify-center overflow-hidden shadow-inner relative group">
                    {serverStatus.qr ? (
                        <motion.img initial={{scale: 0.8}} animate={{scale: 1}} src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-3xl border-8 border-white" alt="QR" />
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
