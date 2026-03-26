import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, off } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Clock, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserCog, HardHat, Building, 
  MapPin, Phone, CreditCard, Power, X, Search, UserCheck, Truck, Crown, PackageSearch, Merge, CheckCircle2, Wifi, WifiOff, AlertCircle, Heart, RefreshCw
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
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0 });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [syncRetryCount, setSyncRetryCount] = useState(0);

  // --- נתוני ליבה ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  
  // --- צ'אט וניהול AI ---
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- CRM States ---
  const [editCrm, setEditCrm] = useState<any>({ 
    comaxId: '', projectName: '', projectAddress: '', contactName: '', contactPhone: '', photo: '' 
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // 🔥 חישוב "חי באמת" - הוספנו מרווח ביטחון של 90 שניות למנוע לאגים
  const timeDiff = currentTime - serverStatus.lastSeen;
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000);

  // --- עזר: איחוד זהויות (UID) ---
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  // --- טעינת נתונים ראשונית ---
  useEffect(() => {
    document.title = "Saban Hub Command | JONI Pipe";
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);

    // עדכון זמן מקומי כל 5 שניות לבדיקת דופק רגישה
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);

    // סטטוס שרת JONI בלייב מה-RTDB
    const statusRef = ref(dbRT, 'saban94/status');
    const unsubStatus = onValue(statusRef, (snap) => {
      const data = snap.val();
      if (data) setServerStatus({ online: data.online, lastSeen: data.lastSeen });
    });

    // טעינת לקוחות מאוחדים (זהויות) מ-Firestore
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), limit(150)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const existing = unifiedMap.get(uid);
          if (!existing || (!existing.projectName && curr.projectName) || (!existing.photo && curr.photo)) {
              unifiedMap.set(uid, { ...curr, uid });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    // טעינת הגדרות עץ ה-AI
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
  }, [syncRetryCount]); // רענון במידת הצורך

  // טעינת היסטוריה - סינכרון מלא וחי ללקוח הנבחר
  useEffect(() => {
    if (!selectedCustomer) return;
    
    setEditCrm({ 
      comaxId: selectedCustomer.comaxId || '', 
      projectName: selectedCustomer.projectName || '', 
      projectAddress: selectedCustomer.projectAddress || '', 
      contactName: selectedCustomer.name || '', 
      contactPhone: selectedCustomer.id || '', 
      photo: selectedCustomer.photo || '' 
    });

    const q = query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'));
    const unsubHistory = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Sync Error:", err));

    return () => unsubHistory();
  }, [selectedCustomer?.id, syncRetryCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // --- פונקציות ביצוע ---
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const forceSync = () => {
    setSyncRetryCount(prev => prev + 1);
    setChatInput('');
    alert("מבצע סינכרון מחדש מול JONI...");
  };

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    setChatInput('');

    // 🔥 שליטה עוינת: השתקה אוטומטית של AI ברגע שראמי מקליד
    if (isAiActive) setIsAiActive(false);

    try {
      await push(ref(dbRT, 'saban94/outgoing'), { 
        number: selectedCustomer.id, 
        message: txt, 
        timestamp: Date.now() 
      });

      await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), { 
        text: txt, 
        type: 'out', 
        timestamp: serverTimestamp(),
        source: 'manual-rami'
      });
    } catch (err: any) {
      console.error("Send error:", err.message);
    }
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
    } catch (err: any) {
      console.error("Save error:", err.message);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const handleMergeManual = async () => {
    const targetPhone = prompt("הכנס מספר טלפון לאיחוד (למשל: 972542276631):");
    if (!targetPhone || !selectedCustomer || targetPhone === selectedCustomer.id) return;
    
    if (window.confirm(`האם להעביר את כל ההיסטוריה ל-${targetPhone} ולמחוק את המזהה הישן?`)) {
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
        alert("איחוד הזהויות הושלם בהצלחה.");
        setSelectedCustomer(null);
      } catch (err: any) {
        console.error("Merge error:", err.message);
      } finally {
        setIsSaving(false);
      }
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

  // --- הגדרות עיצוב ---
  const themeClass = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sidebarBg = theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl';
  const inputBg = theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner';
  const chatAreaBg = theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#efeae2]';

  // --- תצוגת הדפסה ---
  if (isPrinting) return (
    <div className="bg-white p-12 text-black font-serif min-h-screen overflow-auto shadow-inner" dir="rtl">
        <div className="max-w-4xl mx-auto border-[6px] border-double border-black p-12 shadow-2xl bg-white">
          <div className="flex justify-between items-center border-b-4 border-black pb-8 mb-8">
            <div>
              <h1 className="text-6xl font-black italic tracking-tighter text-[#0B2C63]">ח. סבן - חומרי בניין</h1>
              <p className="text-xl font-bold uppercase mt-2">טופס הזמנת עבודה דיגיטלית - {new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <img src={BRAND_LOGO} className="w-28 h-28 border-4 border-black object-cover rounded-xl" alt="logo" />
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10 bg-slate-50 p-8 border-2 border-black shadow-lg">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase text-slate-500 underline underline-offset-4">יעד פרויקט</p>
              <p className="text-3xl font-black">{editCrm.projectName || "כללי"}</p>
              <p className="font-bold flex items-center gap-2"><MapPin size={18}/> {editCrm.projectAddress || "נא להזין כתובת"}</p>
            </div>
            <div className="text-left space-y-2">
              <p className="text-xs font-black uppercase text-slate-500 underline underline-offset-4">פרטי זיהוי</p>
              <p className="text-2xl font-bold">קומקס: {editCrm.comaxId || "---"}</p>
              <p className="font-bold">מנהל: {editCrm.contactName || "תחסין"}</p>
              <p className="font-mono text-sm">{editCrm.contactPhone}</p>
            </div>
          </div>

          <div className="border-2 border-black min-h-[500px] flex flex-col shadow-inner">
            <div className="bg-black text-white p-4 flex justify-between font-black text-xl uppercase tracking-widest">
              <span>תיאור הפריטים שנבחרו מהשיחה</span>
              <span className="w-32 text-center">כמות</span>
            </div>
            <div className="p-8 space-y-8 flex-1">
              {messages.filter(m => selectedMsgIds.includes(m.id)).map((m, i) => (
                <div key={i} className="flex justify-between border-b-2 border-slate-200 pb-4 last:border-0 items-center">
                  <span className="flex-1 font-bold text-lg">{m.text}</span>
                  <span className="w-40 border-b-2 border-black h-10"></span>
                </div>
              ))}
              {selectedMsgIds.length === 0 && <p className="m-auto opacity-30 italic text-2xl">לא נבחרו הודעות להדפסה.</p>}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-4 gap-4">
            {messages.filter(m => m.mediaUrl && selectedMsgIds.includes(m.id)).map((m, i) => (
              <img key={i} src={m.mediaUrl} className="border-2 border-black aspect-square object-cover shadow-lg" alt="site" />
            ))}
          </div>

          <div className="mt-20 flex justify-between items-end pt-12 border-t-4 border-black font-black uppercase italic opacity-80">
            <div className="text-center space-y-4">
               <div className="w-64 border-b-2 border-black mx-auto h-16"></div>
               <p>חתימת מנהל פרויקט</p>
            </div>
            <div className="text-center space-y-4">
               <div className="w-64 border-b-2 border-black mx-auto h-16"></div>
               <p>אישור מחסן ח. סבן</p>
            </div>
          </div>
        </div>
        <div className="fixed bottom-10 left-10 flex gap-6 no-print z-50">
          <button onClick={() => setIsPrinting(false)} className="bg-slate-900 text-white px-10 py-5 rounded-full font-black shadow-2xl hover:scale-105 transition-all">חזור לצ'אט</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-10 py-5 rounded-full font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
            <Printer size={24}/> הדפס הזמנה
          </button>
        </div>
    </div>
  );

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-all duration-500 ${themeClass}`} dir="rtl">
      
      {/* --- 1. Sidebar ראשי --- */}
      {!isMobile && (
        <aside className={`w-24 flex flex-col items-center py-10 border-l gap-10 shrink-0 z-40 ${sidebarBg}`}>
          <div onClick={() => setActiveTab('HUB')} className="w-16 h-16 bg-emerald-500 rounded-[1.8rem] flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer overflow-hidden border-2 border-white/20">
            <img src={BRAND_LOGO} alt="Bot" className="w-full h-full object-cover" />
          </div>
          
          <nav className="flex flex-col gap-6 flex-1">
            {[
              { id: 'HUB', icon: MessageCircle, label: 'JONI HUB' },
              { id: 'CRM', icon: Users, label: 'זהויות ואיחוד' },
              { id: 'DISPATCH', icon: Truck, label: 'סידור עבודה' },
              { id: 'INVENTORY', icon: PackageSearch, label: 'מלאי טכני' },
              { id: 'FLOW', icon: GitBranch, label: 'עץ ה-AI' },
              { id: 'MASTER', icon: Crown, label: 'מאסטר' }
            ].map((btn: any) => (
              <button 
                key={btn.id} onClick={() => setActiveTab(btn.id)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative group ${activeTab === btn.id ? 'bg-emerald-500 text-white shadow-xl scale-110' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
              >
                <btn.icon size={26} />
                <span className="absolute right-20 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">{btn.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-4 mt-auto">
             {/* 🔥 חיווי סטטוס שרת חכם (דופק אמיתי) */}
             <div onClick={forceSync} className="flex flex-col items-center gap-1 group cursor-pointer hover:scale-110 transition-all">
                <div className={`w-4 h-4 rounded-full border-2 border-white/10 ${isTrulyOnline ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]'}`} />
                <span className={`text-[8px] font-black transition-opacity whitespace-nowrap ${isTrulyOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                   {isTrulyOnline ? 'LIVE' : 'DEAD'}
                </span>
             </div>
             
             <button onClick={toggleTheme} className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10 transition-all border border-transparent hover:border-slate-500/20">
               {theme === 'dark' ? <Sun size={26} /> : <Moon size={26} />}
             </button>
          </div>
        </aside>
      )}

      {/* --- 2. רשימת שיחות (WhatsApp Style) --- */}
      {!isMobile && (activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-96 flex flex-col border-l shrink-0 z-30 ${sidebarBg}`}>
          <header className="p-7 border-b border-inherit bg-emerald-500/5 flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><MessageCircle size={18} className="text-emerald-500"/> צ'אט JONI</h2>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${isTrulyOnline ? 'bg-emerald-500 text-white shadow-sm' : 'bg-red-500 text-white animate-pulse shadow-md'}`}>{isTrulyOnline ? 'Live' : 'Sync-Error'}</span>
                    <button onClick={forceSync} className="text-slate-400 hover:text-emerald-500 transition-colors"><RefreshCw size={14}/></button>
                </div>
            </div>
            <div className={`relative bg-black/5 rounded-2xl overflow-hidden border border-black/5 shadow-inner`}>
                <Search className="absolute right-4 top-3.5 text-slate-500" size={16}/>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חיפוש מנהל פרויקט..." className="w-full bg-transparent p-4 pr-12 text-xs border-none outline-none font-bold" />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-slate-50/20">
            {filteredCustomers.map(c => (
              <button 
                key={c.id} onClick={() => setSelectedCustomer(c)} 
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30 shadow-2xl scale-[1.02]' : 'bg-transparent border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm relative overflow-hidden border-2 ${selectedCustomer?.id === c.id ? 'border-emerald-500 shadow-lg' : 'border-white/10 bg-slate-800 text-slate-400'}`}>
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : (c.name ? c.name[0] : '?')}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0f172a] rounded-full"></div>
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <div className="text-sm font-black truncate leading-tight text-slate-100">{c.projectName || c.name || "אורח"}</div>
                  <div className="text-[10px] opacity-40 font-mono mt-1.5 truncate">{normalizeId(c.id)}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* --- 3. אזור העבודה המרכזי --- */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        
        {selectedCustomer && activeTab === 'HUB' ? (
          <div className="flex-1 flex flex-col h-full">
            <header className={`h-24 flex items-center justify-between px-12 border-b z-20 ${sidebarBg}`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/20 relative group">
                  <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                  <div onClick={() => { const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u}) }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"><ImageIcon className="text-white" size={20}/></div>
                </div>
                <div>
                  <h2 className="font-black text-2xl italic tracking-tighter leading-none">{editCrm.projectName || selectedCustomer.name}</h2>
                  <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isTrulyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {normalizeId(selectedCustomer.id)} | UNIFIED CONTROL
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all border-2 ${isSelectionMode ? 'bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-500/20' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}
                >
                  <CheckCircle2 size={18} /> {isSelectionMode ? 'סימון פעיל' : 'בחירת הודעות'}
                </button>
                <button onClick={() => setIsAiActive(!isAiActive)} className={`flex items-center gap-4 px-7 py-3 rounded-2xl font-black text-xs transition-all border-2 ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                  <Power size={20} /> {isAiActive ? 'AI AUTO-MODE' : 'MANUAL (RAMI)'}
                </button>
                <button onClick={() => setIsPrinting(true)} className="p-4 bg-blue-600/10 text-blue-500 rounded-[1.5rem] hover:bg-blue-600/20 border border-blue-600/20 shadow-xl group">
                  <Printer size={28} className="group-hover:scale-110 transition-transform"/>
                </button>
              </div>
            </header>

            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-12 flex flex-col gap-6 scroll-smooth no-scrollbar ${chatAreaBg}`} style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: theme === 'dark' ? 'soft-light' : 'overlay'}}>
              {messages.map((m, i) => (
                <motion.div initial={{ opacity: 0, x: m.type === 'in' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={m.id || i} 
                    onClick={() => isSelectionMode && toggleSelection(m.id)}
                    className={`flex flex-col max-w-[75%] ${m.type === 'in' ? 'self-start' : 'self-end items-end'} ${isSelectionMode ? 'cursor-pointer hover:scale-[1.02]' : ''} transition-transform`}>
                  <div className={`p-6 rounded-[2rem] shadow-2xl text-[14px] relative border leading-relaxed ${m.type === 'in' ? (theme === 'dark' ? 'bg-[#202c33] border-none text-slate-200 rounded-tr-none shadow-black/20' : 'bg-white border-none text-slate-800 rounded-tr-none') : 'bg-[#005c4b] text-white border-none rounded-tl-none shadow-emerald-950/20'}`}>
                    {isSelectionMode && (
                      <div className={`absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#0b141a] ${selectedMsgIds.includes(m.id) ? 'bg-orange-500 text-white scale-110' : 'bg-slate-700 text-slate-400 opacity-50'}`}>
                        <CheckCircle2 size={16}/>
                      </div>
                    )}
                    <div className="text-[9px] font-black opacity-30 mb-2 flex items-center gap-2 uppercase tracking-tighter">
                      {m.source === 'group' ? <Users size={12}/> : <Smartphone size={12}/>} {m.source === 'group' ? 'קבוצת הזמנות' : 'פרטי'}
                    </div>
                    {m.mediaUrl && <img src={m.mediaUrl} className="mb-5 rounded-[1.5rem] max-h-96 w-full object-cover shadow-2xl border border-white/5" alt="img" />}
                    <div className="whitespace-pre-wrap font-bold tracking-tight">{m.text}</div>
                    <div className={`text-[10px] mt-4 opacity-40 font-mono flex items-center gap-2 ${m.type === 'in' ? 'justify-start' : 'justify-end'}`}>
                      <Clock size={12} /> {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : 'עתה'}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isThinking && (
                <div className="self-end bg-emerald-500/10 text-emerald-400 p-5 rounded-[2rem] flex items-center gap-5 border border-emerald-500/20 shadow-2xl animate-pulse">
                  <Activity size={24} className="animate-spin" />
                  <span className="text-sm font-black uppercase tracking-widest">JONI AI FORMULATING...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <footer className={`p-10 border-t z-20 ${sidebarBg}`}>
              {!isTrulyOnline && (
                  <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-6 text-center text-xs font-black border-2 border-dashed border-red-500/20 flex items-center justify-center gap-3 shadow-xl"><AlertCircle size={20}/> שרת ה-Bridge במשרד לא מגיב. דופק אחרון: {new Date(serverStatus.lastSeen).toLocaleTimeString('he-IL')}</div>
              )}
              <div className={`flex items-center gap-5 p-5 rounded-[3rem] border transition-all ${inputBg} shadow-2xl`}>
                <button className="p-3 text-slate-500 hover:text-emerald-500 transition-all hover:scale-125"><ImageIcon size={30}/></button>
                <input 
                  type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                  placeholder={isAiActive ? "הקש הודעה (יכבה AI)..." : "כתוב הודעה ללקוח..."}
                  className="flex-1 bg-transparent border-none outline-none text-lg px-4 font-bold placeholder:text-slate-600" 
                />
                <button onClick={handleSend} className="w-16 h-16 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all hover:bg-emerald-500">
                  <Send size={28} className="transform rotate-180" />
                </button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center gap-12 opacity-20 group">
             <div className="relative">
                <MessageCircle size={250} className="group-hover:scale-110 transition-transform duration-700" />
                <Bot size={80} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-bounce" />
             </div>
             <h2 className="text-7xl font-black italic tracking-tighter uppercase text-center leading-tight">SABAN HUB<br/>SUPREME COMMAND</h2>
          </div>
        )}
      </main>

      {/* --- 4. CRM Sidebar - Identity Management --- */}
      {!isMobile && selectedCustomer && (activeTab === 'CRM' || activeTab === 'HUB') && (
        <aside className={`w-[500px] flex flex-col border-r shrink-0 z-20 shadow-2xl ${sidebarBg}`}>
          <header className="p-8 border-b border-inherit bg-blue-600/5 flex justify-between items-center">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-3"><UserCog size={26} className="text-blue-500"/> כרטיס זהות מאוחד</h2>
             <button onClick={handleMergeManual} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"><Merge size={16}/> איחוד ומחיקה</button>
          </header>
          <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
             <div className="flex flex-col items-center gap-8 pb-10 border-b border-white/5">
                <div className="w-44 h-44 rounded-[4rem] bg-slate-800 overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)] border-4 border-emerald-500/30 relative group transform hover:rotate-3 transition-all duration-500">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black italic tracking-tighter leading-tight">{editCrm.contactName || selectedCustomer.name}</h3>
                   <div className="flex justify-center gap-3">
                     <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-6 py-2.5 rounded-full uppercase border border-emerald-500/40">ID: {normalizeId(selectedCustomer.id)}</span>
                   </div>
                </div>
             </div>
             <div className="space-y-10">
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><CreditCard size={14} className="text-emerald-500"/> מספר לקוח בקומקס</label><input value={editCrm.comaxId} onChange={e => setEditCrm((prev:any)=>({...prev, comaxId: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-lg font-black outline-none border-2 transition-all ${inputBg} focus:border-emerald-500 shadow-2xl`} /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Building size={14} className="text-blue-500"/> שם פרויקט / חברה</label><input value={editCrm.projectName} onChange={e => setEditCrm((prev:any)=>({...prev, projectName: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-lg font-black outline-none border-2 transition-all ${inputBg} focus:border-blue-500 shadow-2xl`} /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={14} className="text-red-500"/> כתובת אספקה</label><input value={editCrm.projectAddress} onChange={e => setEditCrm((prev:any)=>({...prev, projectAddress: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-lg font-black outline-none border-2 transition-all ${inputBg} focus:border-red-500 shadow-2xl`} /></div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest"><UserCheck size={14}/> שם איש קשר</label><input value={editCrm.contactName} onChange={e => setEditCrm((prev:any)=>({...prev, contactName: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-xs font-black outline-none border-2 ${inputBg} focus:border-indigo-500 shadow-xl`} /></div>
                   <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest"><Phone size={14}/> נייד</label><input value={editCrm.contactPhone} onChange={e => setEditCrm((prev:any)=>({...prev, contactPhone: e.target.value}))} className={`w-full p-6 rounded-[2rem] text-xs font-mono font-black outline-none border-2 ${inputBg} focus:border-emerald-500 shadow-xl`} /></div>
                </div>
             </div>
             <button onClick={saveCustomerCard} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-8 rounded-[3rem] shadow-[0_30px_80px_rgba(37,99,235,0.5)] active:scale-95 transition-all flex items-center justify-center gap-6 mt-8 uppercase tracking-widest text-xl">
                {isSaving ? <Activity size={32} className="animate-spin"/> : <><Save size={32}/> Sync Supreme Card</>}
             </button>
             {/* 🔥 דופק שרת JONI LIVE אמיתי */}
             <div className={`mt-6 p-6 rounded-3xl border-2 border-dashed flex items-center justify-between ${isTrulyOnline ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 shadow-inner' : 'border-red-500/20 bg-red-500/5 text-red-600 animate-pulse'}`}>
                <div className="flex items-center gap-3">
                   <Heart size={20} className={isTrulyOnline ? 'animate-pulse text-emerald-500' : 'text-red-500'} />
                   <div className="text-xs font-black uppercase tracking-widest">JONI PULSE: {isTrulyOnline ? 'STABLE' : 'ERROR'}</div>
                </div>
                <div className="text-right flex flex-col">
                   <div className="text-[10px] font-mono font-bold">
                      דופק: {serverStatus.lastSeen ? new Date(serverStatus.lastSeen).toLocaleTimeString('he-IL') : 'None'}
                   </div>
                   <div className="text-[8px] opacity-60">
                      איחור: {(timeDiff/1000).toFixed(1)}s
                   </div>
                </div>
             </div>
          </div>
        </aside>
      )}

      {theme === 'dark' && <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"><div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[250px]"></div><div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[250px]"></div></div>}
    </div>
  );
}

function Clock({ size = 16, className = "" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
