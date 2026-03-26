import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserCog, HardHat, Building, 
  MapPin, Phone, CreditCard, Power, X, Search, UserCheck, Truck, Crown, PackageSearch, Merge, CheckCircle2, Wifi, WifiOff, AlertCircle, Heart, RefreshCw, QrCode, Trash, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- אתחול Firebase ---
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
  // --- ניהול מערכת ---
  const [activeTab, setActiveTab] = useState<'HUB' | 'CRM' | 'FLOW' | 'INVENTORY' | 'DISPATCH' | 'MASTER'>('HUB');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showQrModal, setShowQrModal] = useState(false);

  // --- נתוני ליבה ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  
  const [isAiActive, setIsAiActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editCrm, setEditCrm] = useState<any>({ 
    comaxId: '', projectName: '', projectAddress: '', contactName: '', contactPhone: '', photo: '', dnaContext: '' 
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 🔥 לוגיקת נורמליזציה ---
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  // 🔥 חישוב דופק שרת - מוגדר כקבוע בתוך הרינדור למניעת שגיאות בילד
  const timeDiff = currentTime - serverStatus.lastSeen;
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000);

  // --- טעינת נתונים ראשונית ---
  useEffect(() => {
    document.title = "Saban Hub Command | JONI Pipe";
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);

    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);

    // מאזין לסטטוס השרת והברקוד
    const unsubStatus = onValue(ref(dbRT, 'saban94/status'), (snap) => {
      const data = snap.val();
      if (data) {
        setServerStatus({ online: data.online || false, lastSeen: data.lastSeen || 0, qr: data.qr || null });
        if (data.qr && !data.online) setShowQrModal(true);
        if (data.online) setShowQrModal(false);
      }
    });

    // איחוד זהויות אגרסיבי ב-Client Side
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(150)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const existing = unifiedMap.get(uid);
          
          if (!existing) {
            unifiedMap.set(uid, { ...curr, uid, allIds: [curr.id] });
          } else {
            const priorityCard = (curr.name && !existing.name) || (curr.photo && !existing.photo) ? curr : existing;
            unifiedMap.set(uid, {
              ...priorityCard,
              uid,
              allIds: Array.from(new Set([...existing.allIds, ...curr.allIds || [], curr.id]))
            });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    // טעינת עץ ה-AI
    const unsubFlow = onSnapshot(doc(dbFS, 'system', 'bot_flow_config'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setNodes(data.nodes || []);
          setGlobalDNA(data.globalDNA || '');
        }
    });

    return () => {
      window.removeEventListener('resize', checkSize);
      clearInterval(timer);
      unsubStatus();
      unsubCust();
      unsubFlow();
    };
  }, []);

  // טעינת היסטוריה
  useEffect(() => {
    if (!selectedCustomer) return;
    
    setEditCrm({ 
      comaxId: selectedCustomer.comaxId || '', 
      projectName: selectedCustomer.projectName || '', 
      projectAddress: selectedCustomer.projectAddress || '', 
      contactName: selectedCustomer.name || '', 
      contactPhone: selectedCustomer.id || '', 
      photo: selectedCustomer.photo || '',
      dnaContext: selectedCustomer.dnaContext || ''
    });

    const q = query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'));
    const unsubHistory = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Sync Error:", err));

    return () => unsubHistory();
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // --- פונקציות ביצוע ---
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleResetConnection = async () => {
    if (window.confirm("זה יבצע ריסטרט לשרת במשרד ויאלץ סריקת ברקוד חדשה. להמשיך?")) {
      setIsSaving(true);
      try {
        await update(ref(dbRT, 'saban94/status'), { online: false, qr: null, reset_command: true, lastSeen: Date.now() });
        setShowQrModal(true);
      } catch (e) { console.error(e); } finally { setIsSaving(false); }
    }
  };

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    setChatInput('');
    if (isAiActive) setIsAiActive(false);

    const tempId = "temp-" + Date.now();
    setMessages(prev => [...prev, { id: tempId, text: txt, type: 'out', isSending: true, timestamp: { seconds: Date.now()/1000 } }]);

    try {
      await push(ref(dbRT, 'saban94/outgoing'), { number: selectedCustomer.id, message: txt, timestamp: Date.now() });
      await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'command-hub' 
      });
      await updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { lastUpdated: serverTimestamp() });
    } catch (err: any) { console.error("Send failed:", err.message); }
  };

  const saveCustomerCard = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    try {
      await setDoc(doc(dbFS, 'customers', selectedCustomer.id), {
        ...editCrm,
        name: editCrm.contactName || selectedCustomer.name,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      alert("✅ כרטיס זהות סונכרן בהצלחה.");
    } catch (e: any) { console.error(e.message); } finally { setTimeout(() => setIsSaving(false), 800); }
  };

  const handleMergeManual = async () => {
    const targetPhone = prompt("הכנס מספר טלפון מדויק לאיחוד (למשל: 972542276631):");
    if (!targetPhone || !selectedCustomer || targetPhone === selectedCustomer.id) return;
    
    if (window.confirm(`⚠️ אזהרה: כל ההיסטוריה של ${selectedCustomer.id} תועבר ל-${targetPhone} והמזהה הישן יימחק לצמיתות. לאשר?`)) {
      setIsSaving(true);
      try {
        const oldId = selectedCustomer.id;
        const historySnap = await getDocs(collection(dbFS, 'customers', oldId, 'chat_history'));
        const batch = writeBatch(dbFS);
        
        historySnap.forEach((msgDoc) => {
          const newMsgDoc = doc(collection(dbFS, 'customers', targetPhone, 'chat_history'));
          batch.set(newMsgDoc, msgDoc.data());
          batch.delete(msgDoc.ref);
        });

        batch.set(doc(dbFS, 'customers', targetPhone), {
          ...selectedCustomer, id: targetPhone, lastUpdated: serverTimestamp(), identityUnified: true
        }, { merge: true });

        batch.delete(doc(dbFS, 'customers', oldId));
        await batch.commit();
        alert("איחוד הזהויות הושלם.");
        setSelectedCustomer(null);
      } catch (err: any) { console.error(err.message); } finally { setIsSaving(false); }
    }
  };

  const toggleSelection = (id: string) => {
    if (!isSelectionMode) return;
    setSelectedMsgIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredCustomers = customers.filter(c => 
    (c.projectName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.id || '').includes(searchTerm)
  );

  const sidebarBgStyle = theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl';
  const chatAreaBgStyle = theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#efeae2]';

  if (isPrinting) return (
    <div className="bg-white p-12 text-black font-serif min-h-screen overflow-auto" dir="rtl">
        <div className="max-w-4xl mx-auto border-[6px] border-double border-black p-12 bg-white shadow-2xl">
          <div className="flex justify-between items-center border-b-4 border-black pb-8 mb-8">
            <div><h1 className="text-6xl font-black italic text-[#0B2C63]">ח. סבן - חומרי בניין</h1><p className="text-xl font-bold uppercase mt-2">הזמנת עבודה דיגיטלית - {new Date().toLocaleDateString('he-IL')}</p></div>
            <img src={BRAND_LOGO} className="w-28 h-28 border-4 border-black object-cover rounded-xl" alt="logo" />
          </div>
          <div className="grid grid-cols-2 gap-10 mb-10 bg-slate-50 p-8 border-2 border-black">
            <div className="space-y-2"><p className="text-xs font-black uppercase text-slate-500 underline underline-offset-4">יעד פרויקט</p><p className="text-3xl font-black">{editCrm.projectName || "כללי"}</p><p className="font-bold flex items-center gap-2"><MapPin size={18}/> {editCrm.projectAddress || "נא להזין כתובת"}</p></div>
            <div className="text-left space-y-2"><p className="text-xs font-black uppercase text-slate-500 underline underline-offset-4">פרטי זיהוי</p><p className="text-2xl font-bold">קומקס: {editCrm.comaxId || "---"}</p><p className="font-bold">מנהל: {editCrm.contactName || "תחסין"}</p><p className="font-mono text-sm">{editCrm.contactPhone}</p></div>
          </div>
          <div className="border-2 border-black min-h-[500px] flex flex-col shadow-inner">
            <div className="bg-black text-white p-4 flex justify-between font-black text-xl uppercase tracking-widest"><span>תיאור מהצ'אט (JONI)</span><span className="w-32 text-center">כמות</span></div>
            <div className="p-8 space-y-8 flex-1">
              {messages.filter(m => selectedMsgIds.includes(m.id)).map((m, i) => (
                <div key={i} className="flex justify-between border-b-2 border-slate-200 pb-4 last:border-0 items-center">
                  <span className="flex-1 font-bold text-lg">{m.text}</span><span className="w-40 border-b-2 border-black h-10"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="fixed bottom-10 left-10 flex gap-6 no-print z-50">
          <button onClick={() => setIsPrinting(false)} className="bg-slate-900 text-white px-10 py-5 rounded-full font-black shadow-2xl hover:scale-105 transition-all">ביטול</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-10 py-5 rounded-full font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-3"><Printer size={24}/> הדפס הזמנה</button>
        </div>
    </div>
  );

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800'}`} dir="rtl">
      
      {/* 1. Sidebar ראשי */}
      {!isMobile && (
        <aside className={`w-24 flex flex-col items-center py-10 border-l gap-10 shrink-0 z-40 ${sidebarBgStyle}`}>
          <div onClick={() => setActiveTab('HUB')} className="w-16 h-16 bg-emerald-500 rounded-[1.8rem] flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer overflow-hidden border-2 border-white/20">
            <img src={BRAND_LOGO} alt="Bot" className="w-full h-full object-cover" />
          </div>
          <nav className="flex flex-col gap-8 flex-1">
            {[
              { id: 'HUB', icon: MessageCircle, label: 'JONI HUB' },
              { id: 'CRM', icon: Users, label: 'זהויות ואיחוד' },
              { id: 'DISPATCH', icon: Truck, label: 'סידור עבודה' },
              { id: 'INVENTORY', icon: PackageSearch, label: 'מלאי טכני' },
              { id: 'FLOW', icon: GitBranch, label: 'עץ ה-AI' },
              { id: 'MASTER', icon: Crown, label: 'מאסטר' }
            ].map((btn: any) => (
              <button key={btn.id} onClick={() => setActiveTab(btn.id)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative group ${activeTab === btn.id ? 'bg-emerald-50 text-white shadow-xl scale-110' : 'text-slate-500 hover:bg-emerald-500/10'}`}>
                <btn.icon size={26} />
                <span className="absolute right-20 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">{btn.label}</span>
              </button>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-4 mt-auto">
             <button onClick={() => setShowQrModal(true)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${serverStatus.qr ? 'bg-amber-500 text-white animate-bounce shadow-xl' : 'text-slate-500'}`}><QrCode size={24} /></button>
             <div onClick={handleResetConnection} className="flex flex-col items-center gap-1 group cursor-pointer hover:scale-110 transition-all">
                <div className={`w-4 h-4 rounded-full border-2 border-white/10 ${isTrulyOnline ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500 animate-pulse shadow-[0_0_15px_#ef4444]'}`} />
                <span className={`text-[8px] font-black transition-opacity whitespace-nowrap ${isTrulyOnline ? 'text-emerald-500' : 'text-red-500'}`}>{isTrulyOnline ? 'LIVE' : 'DEAD'}</span>
             </div>
             <button onClick={toggleTheme} className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10 transition-all border border-transparent hover:border-slate-500/20">
               {theme === 'dark' ? <Sun size={26} /> : <Moon size={26} />}
             </button>
          </div>
        </aside>
      )}

      {/* 2. רשימת זהויות מאוחדת */}
      {!isMobile && (activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-96 flex flex-col border-l shrink-0 z-30 ${sidebarBgStyle}`}>
          <header className="p-7 border-b border-inherit bg-emerald-500/5 flex flex-col gap-5">
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-100">
                <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500"/> זהויות JONI</h2>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${isTrulyOnline ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>{isTrulyOnline ? 'Sync OK' : 'Offline'}</span>
            </div>
            <div className={`relative bg-black/5 rounded-2xl overflow-hidden border border-black/5 shadow-inner`}>
                <Search className="absolute right-4 top-3.5 text-slate-500" size={16}/>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חיפוש זהות מאוחדת..." className="w-full bg-transparent p-4 pr-12 text-xs border-none outline-none font-bold text-slate-800 dark:text-slate-200" />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-slate-50/20">
            {filteredCustomers.map(c => (
              <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${selectedCustomer?.uid === c.uid ? 'bg-emerald-500/10 border-emerald-500/30 shadow-2xl scale-[1.02]' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm relative overflow-hidden border-2 ${selectedCustomer?.uid === c.uid ? 'border-emerald-500 shadow-lg' : 'border-white/10 bg-slate-800 text-slate-400'}`}>
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" alt="avatar" /> : (c.name ? c.name[0] : '?')}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0f172a] rounded-full"></div>
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <div className="text-sm font-black truncate leading-tight text-slate-800 dark:text-slate-100">{c.projectName || c.name || "אורח"}</div>
                  <div className="text-[10px] opacity-40 font-mono mt-1.5 truncate text-slate-500 dark:text-slate-400">Identity: {normalizeId(c.id)}</div>
                </div>
                {c.allIds?.length > 1 && <div className="bg-blue-500/10 text-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border border-blue-500/20">Merged</div>}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* 3. Main Command Hub */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        {selectedCustomer && activeTab === 'HUB' ? (
          <div className="flex-1 flex flex-col h-full">
            <header className={`h-24 flex items-center justify-between px-12 border-b z-20 ${sidebarBgStyle}`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/20">
                  <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                </div>
                <div><h2 className="font-black text-2xl italic tracking-tighter leading-none">{editCrm.projectName || selectedCustomer.name}</h2><p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-[0.3em] flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${isTrulyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>{selectedCustomer.id} | JONI PIPE ACTIVE</p></div>
              </div>
              <div className="flex items-center gap-5">
                <button onClick={() => setIsSelectionMode(!isSelectionMode)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all border-2 ${isSelectionMode ? 'bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-500/20' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}><CheckCircle2 size={18} /> {isSelectionMode ? 'סימון פעיל' : 'בחירת הודעות'}</button>
                <button onClick={() => setIsAiActive(!isAiActive)} className={`flex items-center gap-4 px-7 py-3 rounded-2xl font-black text-xs transition-all border-2 ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}><Power size={20} /> {isAiActive ? 'AI AUTO-MODE' : 'MANUAL (RAMI)'}</button>
                <button onClick={() => setIsPrinting(true)} className="p-4 bg-blue-600/10 text-blue-500 rounded-[1.5rem] hover:bg-blue-600/20 border border-blue-600/20 shadow-xl group"><Printer size={28} className="group-hover:scale-110 transition-transform"/></button>
              </div>
            </header>

            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-12 flex flex-col gap-6 scroll-smooth no-scrollbar ${chatAreaBgStyle}`} style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: theme === 'dark' ? 'soft-light' : 'overlay'}}>
              {messages.map((m, i) => (
                <motion.div initial={{ opacity: 0, x: m.type === 'in' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={m.id || i} onClick={() => toggleSelection(m.id)} className={`flex flex-col max-w-[75%] ${m.type === 'in' ? 'self-start' : 'self-end items-end'} ${isSelectionMode ? 'cursor-pointer hover:scale-[1.02]' : ''} transition-transform`}>
                  <div className={`p-6 rounded-[2rem] shadow-2xl text-[14px] relative border leading-relaxed ${m.type === 'in' ? (theme === 'dark' ? 'bg-[#202c33] border-none text-slate-200 rounded-tr-none shadow-black/20' : 'bg-white border-none text-slate-800 rounded-tr-none shadow-slate-200') : 'bg-[#005c4b] text-white border-none rounded-tl-none shadow-emerald-950/20'}`}>
                    {isSelectionMode && (<div className={`absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#0b141a] ${selectedMsgIds.includes(m.id) ? 'bg-orange-500 text-white scale-110' : 'bg-slate-700 text-slate-400 opacity-50'}`}><CheckCircle2 size={16}/></div>)}
                    <div className="text-[9px] font-black opacity-30 mb-2 flex items-center gap-2 uppercase tracking-tighter">{m.source === 'group' ? <Users size={12}/> : <Smartphone size={12}/>} {m.source === 'group' ? 'קבוצת הזמנות' : 'פרטי'}</div>
                    {m.mediaUrl && <img src={m.mediaUrl} className="mb-5 rounded-[1.5rem] max-h-96 w-full object-cover shadow-2xl" alt="prod" />}
                    <div className={`whitespace-pre-wrap font-bold tracking-tight ${m.isSending ? 'opacity-50' : ''}`}>{m.text}</div>
                    <div className={`text-[10px] mt-4 opacity-40 font-mono flex items-center gap-2 ${m.type === 'in' ? 'justify-start' : 'justify-end'}`}><Clock size={12} /> {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : 'שולח...'}</div>
                  </div>
                </motion.div>
              ))}
              {isThinking && <div className="self-end bg-emerald-500/10 text-emerald-400 p-5 rounded-[2rem] flex items-center gap-5 border border-emerald-500/20 shadow-2xl animate-pulse font-black uppercase tracking-widest text-xs"><Activity size={24} className="animate-spin" /> JONI AI FORMULATING...</div>}
            </div>

            <footer className={`p-10 border-t z-20 ${sidebarBgStyle}`}>
              {!isTrulyOnline && (
                  <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-6 text-center text-xs font-black border-2 border-dashed border-red-500/20 flex items-center justify-center gap-3 shadow-xl font-sans uppercase animate-pulse"><WifiOff size={18}/> JONI Bridge Dead - Office Computer Needs Attention</div>
              )}
              <div className={`flex items-center gap-5 p-5 rounded-[3rem] border transition-all ${theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200'} shadow-2xl`}>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="כתוב הודעה ללקוח (יכבה AI אוטומטית)..." className="flex-1 bg-transparent border-none outline-none text-lg px-4 font-bold placeholder:text-slate-600" />
                <button onClick={handleSend} className="w-16 h-16 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all hover:bg-emerald-500"><Send size={28} className="transform rotate-180" /></button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center gap-12 opacity-20 group text-slate-800 dark:text-slate-100"><div className="relative"><MessageCircle size={250} className="group-hover:scale-110 transition-transform duration-700" /><Bot size={80} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-bounce" /></div><h2 className="text-7xl font-black italic tracking-tighter uppercase text-center leading-tight">SABAN HUB<br/>UNIFIED COMMAND</h2></div>
        )}
      </main>

      {/* 4. CRM Sidebar - Identity & DNA Management */}
      {!isMobile && selectedCustomer && (activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-[500px] flex flex-col border-r shrink-0 z-20 shadow-2xl ${sidebarBgStyle}`}>
          <header className="p-8 border-b border-inherit bg-blue-600/5 flex justify-between items-center"><h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-3 text-slate-800 dark:text-slate-100"><UserCog size={26} className="text-blue-500"/> כרטיס זהות מאוחד</h2><button onClick={handleMergeManual} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"><Merge size={16}/> איחוד ומחיקה</button></header>
          <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar bg-white dark:bg-transparent text-slate-800 dark:text-slate-100">
             <div className="flex flex-col items-center gap-8 pb-10 border-b border-white/5">
                <div className="w-44 h-44 rounded-[4rem] bg-slate-800 overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)] border-4 border-emerald-500/30 relative group transform hover:rotate-3 transition-all duration-500">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                   <button onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 font-black uppercase text-xs shadow-inner">החלף תמונה</button>
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black italic tracking-tighter leading-none">{editCrm.contactName || selectedCustomer.name}</h3>
                   <div className="flex justify-center gap-3">
                     <span className={`text-[10px] font-black px-6 py-2.5 rounded-full uppercase border ${isTrulyOnline ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/40 shadow-sm' : 'text-red-500 bg-red-500/10 border-red-500/40 animate-pulse'}`}>Identity: {selectedCustomer.uid}</span>
                   </div>
                </div>
             </div>
             <div className="space-y-10">
                <div className="space-y-3"><label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><CreditCard size={14} className="text-emerald-500"/> מספר לקוח בקומקס</label><input value={editCrm.comaxId} onChange={e => setEditCrm((prev:any)=>({...prev, comaxId: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-lg font-black outline-none border-2 transition-all ${theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner'} focus:border-emerald-500 shadow-2xl`} /></div>
                <div className="space-y-3"><label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Building size={14} className="text-blue-500"/> שם פרויקט / חברה</label><input value={editCrm.projectName} onChange={e => setEditCrm((prev:any)=>({...prev, projectName: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-lg font-black outline-none border-2 transition-all ${theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner'} focus:border-blue-500 shadow-2xl`} /></div>
                <div className="space-y-3"><label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Bot size={14} className="text-purple-500"/> DNA אישי (הנחיות AI ללקוח זה)</label><textarea value={editCrm.dnaContext} onChange={e => setEditCrm((prev:any)=>({...prev, dnaContext: e.target.value}))} rows={4} placeholder="למשל: לתת לו יחס מיוחד, תמיד להציע מנוף..." className={`w-full p-6 rounded-[2rem] text-sm font-bold outline-none border-2 transition-all ${theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner'} focus:border-purple-500 shadow-2xl resize-none leading-relaxed`} /></div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14}/> איש קשר</label><input value={editCrm.contactName} onChange={e => setEditCrm((prev:any)=>({...prev, contactName: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-xs font-black outline-none border-2 ${theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner'} focus:border-indigo-500 shadow-xl`} /></div>
                   <div className="space-y-3"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Phone size={14}/> נייד</label><input value={editCrm.contactPhone} onChange={e => setEditCrm((prev:any)=>({...prev, contactPhone: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-xs font-mono font-black outline-none border-2 ${theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner'} focus:border-emerald-500 shadow-xl`} /></div>
                </div>
             </div>
             <button onClick={saveCustomerCard} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-8 rounded-[3rem] shadow-[0_30px_80px_rgba(37,99,235,0.5)] active:scale-95 transition-all flex items-center justify-center gap-6 mt-8 uppercase tracking-widest text-xl">{isSaving ? <Activity size={32} className="animate-spin"/> : <><Save size={32}/> Sync Supreme Card</>}</button>
             
             {/* 🔥 דופק שרת JONI LIVE אמיתי עם הצגת Latency */}
             <div className={`mt-6 p-6 rounded-3xl border-2 border-dashed flex items-center justify-between ${isTrulyOnline ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 shadow-inner' : 'border-red-500/20 bg-red-500/5 text-red-600 animate-pulse'}`}>
                <div className="flex items-center gap-3"><Heart size={24} className={isTrulyOnline ? 'animate-pulse text-emerald-500' : 'text-red-500'} /><div className="text-sm font-black uppercase tracking-widest">JONI PULSE</div></div>
                <div className="text-right flex flex-col text-[10px] font-mono font-bold italic">נראה: {serverStatus.lastSeen ? new Date(serverStatus.lastSeen).toLocaleTimeString('he-IL') : 'None'} | {(timeDiff/1000).toFixed(1)}s</div>
             </div>
             
             {selectedCustomer.allIds?.length > 1 && (
                 <div className="p-6 bg-amber-500/5 border-2 border-dashed border-amber-500/20 rounded-3xl space-y-3">
                     <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2"><AlertCircle size={14}/> זהות מולחמת (Merged Identity)</p>
                     <div className="flex flex-wrap gap-2">
                         {selectedCustomer.allIds.map((id: string) => (
                             <span key={id} className={`text-[9px] ${id === selectedCustomer.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'} px-2 py-1 rounded-md font-mono`}>{id}</span>
                         ))}
                     </div>
                 </div>
             )}
          </div>
        </aside>
      )}

      {/* --- QR MODAL --- */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-2xl">
             <div className="bg-white rounded-[3.5rem] p-12 max-w-md w-full text-center shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-4 border-amber-500/40 relative">
                <button onClick={() => setShowQrModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={42}/></button>
                <div className="w-24 h-24 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white animate-pulse"><QrCode size={64} /></div>
                <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-4">צינור JONI מאובטח</h2>
                <p className="text-slate-500 font-bold mb-10 leading-relaxed text-base text-slate-600">השרת במשרד ממתין לסריקת ברקוד חדש.<br/><span className="text-amber-600">סרוק מהטלפון לחיבור הצינור.</span></p>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-4 border-dashed border-slate-200 mb-10 aspect-square flex items-center justify-center min-h-[300px] shadow-inner relative">
                    {serverStatus.qr ? (
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-3xl border-8 border-white transform transition-transform hover:scale-105" alt="QR" />
                    ) : (
                        <div className="flex flex-col items-center gap-6 text-slate-400">
                            <Activity size={60} className="animate-spin text-amber-500" />
                            <span className="text-sm font-black uppercase tracking-widest animate-pulse">מייצר ברקוד מאובטח...</span>
                        </div>
                    )}
                </div>
                <button onClick={handleResetConnection} className="w-full bg-red-600/10 text-red-600 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 border border-red-600/20 active:scale-95 shadow-lg">בצע ריסטרט לשרת במשרד</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {theme === 'dark' && <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"><div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[250px]"></div><div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[250px]"></div></div>}
    </div>
  );
}
