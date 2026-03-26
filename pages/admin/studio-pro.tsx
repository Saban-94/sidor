import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserCog, HardHat, Building, 
  MapPin, Phone, CreditCard, Power, X, Search, UserCheck, Truck, Crown, PackageSearch, Merge, CheckCircle2, AlertTriangle, Wifi, WifiOff
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
  // --- ניהול תצוגה ומערכת ---
  const [activeTab, setActiveTab] = useState<'HUB' | 'CRM' | 'FLOW' | 'INVENTORY' | 'DISPATCH' | 'MASTER'>('HUB');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(false);

  // --- נתוני ליבה ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  
  // --- ניהול צ'אט ו-AI ---
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // --- CRM States ---
  const [editCrm, setEditCrm] = useState<any>({ 
    comaxId: '', projectName: '', projectAddress: '', contactName: '', contactPhone: '', photo: '' 
  });
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 🔥 לוגיקת נורמליזציה (המפתח לאיחוד) ---
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-12) : id;
  };

  // --- הגדרות עיצוב ---
  const themeClass = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sidebarBg = theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl';
  const inputBg = theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner';
  const chatAreaBg = theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#efeae2]';

  // --- טעינת נתונים ראשונית ---
  useEffect(() => {
    document.title = "Saban HUB | Unified Command";
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);

    // בדיקת סטטוס שרת (JONI)
    const statusRef = ref(dbRT, 'saban94/status');
    onValue(statusRef, (snap) => {
      setIsServerOnline(snap.val()?.online || false);
    });

    // 1. טעינת לקוחות עם איחוד לוגי
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), limit(150)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const existing = unifiedMap.get(uid);
          if (!existing || (!existing.name && curr.name) || (!existing.photo && curr.photo)) {
              unifiedMap.set(uid, { ...curr, uid });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    // 2. טעינת עץ ענפים
    onSnapshot(doc(dbFS, 'system', 'bot_flow_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    return () => {
      window.removeEventListener('resize', checkSize);
      unsubCust();
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
      photo: selectedCustomer.photo || '' 
    });

    const q = query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'));
    const unsubHistory = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubHistory();
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // --- פונקציות ביצוע ---
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    setChatInput('');

    if (isAiActive) setIsAiActive(false);

    try {
      await push(ref(dbRT, 'saban94/outgoing'), { number: selectedCustomer.id, message: txt, timestamp: Date.now() });
      await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'hub' 
      });
    } catch (err: any) { console.error(err.message); }
  };

  const handlePhotoUpdate = async () => {
    const newUrl = prompt("הכנס לינק לתמונה (URL):", editCrm.photo);
    if (!newUrl || !selectedCustomer) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(dbFS, 'customers', selectedCustomer.id), { photo: newUrl });
      setEditCrm((prev: any) => ({ ...prev, photo: newUrl }));
    } catch (e: any) { console.error(e.message); } finally { setIsSaving(false); }
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
    } catch (e: any) { console.error(e.message); } finally { setTimeout(() => setIsSaving(false), 800); }
  };

  const handleMergeManual = async () => {
    const targetPhone = prompt("הכנס את מספר הטלפון המדויק לאיחוד (למשל: 972542276631):");
    if (!targetPhone || !selectedCustomer || targetPhone === selectedCustomer.id) return;
    
    if (window.confirm(`מבצע איחוד סופי: מעביר את כל ההיסטוריה ל-${targetPhone} ומוחק את המזהה הישן. לאשר?`)) {
      setIsSaving(true);
      try {
        const oldId = selectedCustomer.id;
        const oldChatRef = collection(dbFS, 'customers', oldId, 'chat_history');
        const newChatRef = collection(dbFS, 'customers', targetPhone, 'chat_history');
        
        const historySnap = await getDocs(oldChatRef);
        const batch = writeBatch(dbFS);
        
        historySnap.forEach((msgDoc) => {
          const newMsgDoc = doc(newChatRef);
          batch.set(newMsgDoc, msgDoc.data());
          batch.delete(msgDoc.ref);
        });

        batch.set(doc(dbFS, 'customers', targetPhone), {
          ...selectedCustomer,
          id: targetPhone,
          lastUpdated: serverTimestamp(),
          isUnified: true
        }, { merge: true });

        batch.delete(doc(dbFS, 'customers', oldId));

        await batch.commit();
        alert("האיחוד הושלם בהצלחה.");
        setSelectedCustomer(null);
      } catch (err: any) { alert("שגיאה: " + err.message); } finally { setIsSaving(false); }
    }
  };

  const toggleMessageSelection = (id: string) => {
    if (!isSelectionMode) return;
    setSelectedMsgIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredCustomers = customers.filter(c => 
    (c.projectName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.id || '').includes(searchTerm)
  );

  if (isPrinting) return (
    <div className="bg-white p-12 text-black font-serif min-h-screen overflow-auto" dir="rtl">
        <div className="max-w-4xl mx-auto border-[6px] border-double border-black p-10 shadow-2xl">
          <div className="flex justify-between items-center border-b-4 border-black pb-8 mb-8">
            <div><h1 className="text-5xl font-black italic tracking-tighter text-[#0B2C63]">ח. סבן - חומרי בניין</h1><p className="text-xl font-bold uppercase mt-2">טופס הזמנת עבודה - {new Date().toLocaleDateString('he-IL')}</p></div>
            <img src={BRAND_LOGO} className="w-28 h-28 border-4 border-black object-cover" alt="logo" />
          </div>
          <div className="grid grid-cols-2 gap-10 mb-10 bg-slate-50 p-6 border-2 border-black shadow-lg">
            <div className="space-y-2"><p className="text-xs font-black uppercase text-slate-500 underline">פרויקט</p><p className="text-2xl font-black">{editCrm.projectName || "פרויקט כללי"}</p><p className="font-bold flex items-center gap-2"><MapPin size={16}/> {editCrm.projectAddress || "חסר כתובת"}</p></div>
            <div className="text-left space-y-2"><p className="text-xs font-black uppercase text-slate-500 underline">פרטי לקוח</p><p className="text-xl font-bold">קומקס: {editCrm.comaxId || "---"}</p><p className="font-bold">מנהל: {editCrm.contactName || "תחסין"}</p><p className="font-mono text-sm">{editCrm.contactPhone}</p></div>
          </div>
          <div className="border-2 border-black min-h-[500px] flex flex-col shadow-inner">
            <div className="bg-black text-white p-3 flex justify-between font-black text-lg"><span>תיאור מהצ'אט</span><span className="w-32 text-center">כמות</span></div>
            <div className="p-6 space-y-6 flex-1">
              {messages.filter(m => selectedMsgIds.includes(m.id)).map((m, i) => (
                <div key={i} className="flex justify-between border-b-2 border-slate-200 pb-4 last:border-0 items-center">
                  <span className="flex-1 font-medium">{m.text}</span><span className="w-40 border-b-2 border-black h-8"></span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 flex justify-between items-end pt-10 border-t-4 border-black italic text-sm text-slate-600 uppercase font-black">
            <div>חתימת מנהל פרויקט</div>
            <div>אישור מחסן ח. סבן</div>
          </div>
        </div>
        <div className="fixed bottom-10 left-10 flex gap-6 no-print">
          <button onClick={() => setIsPrinting(false)} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl hover:scale-105 transition-all">חזור</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-8 py-4 rounded-3xl font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-2"><Printer size={22}/> הדפס</button>
        </div>
    </div>
  );

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-all duration-500 ${themeClass}`} dir="rtl">
      
      {/* 1. Sidebar ראשי */}
      {!isMobile && (
        <aside className={`w-24 flex flex-col items-center py-10 border-l gap-10 shrink-0 z-40 ${sidebarBg}`}>
          <div onClick={() => setActiveTab('HUB')} className="w-16 h-16 bg-emerald-500 rounded-[1.8rem] flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer overflow-hidden border-2 border-white/20">
            <img src={BRAND_LOGO} alt="Bot" className="w-full h-full object-cover" />
          </div>
          <nav className="flex flex-col gap-6 flex-1">
            {[
              { id: 'HUB', icon: MessageCircle, label: 'JONI HUB' },
              { id: 'CRM', icon: Users, label: 'לקוחות ואיחוד' },
              { id: 'DISPATCH', icon: Truck, label: 'סידור עבודה' },
              { id: 'INVENTORY', icon: PackageSearch, label: 'מלאי טכני' },
              { id: 'FLOW', icon: GitBranch, label: 'עץ ה-AI' },
              { id: 'MASTER', icon: Crown, label: 'מאסטר' }
            ].map((btn: any) => (
              <button key={btn.id} onClick={() => setActiveTab(btn.id)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative group ${activeTab === btn.id ? 'bg-emerald-500 text-white shadow-xl scale-110' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}>
                <btn.icon size={26} />
                <span className="absolute right-20 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">{btn.label}</span>
              </button>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-4 mt-auto">
             <div className={`w-3 h-3 rounded-full ${isServerOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]'}`} title={isServerOnline ? "Server Online" : "Server Offline"}></div>
             <button onClick={toggleTheme} className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10 transition-all border border-transparent hover:border-slate-500/20">
               {theme === 'dark' ? <Sun size={26} /> : <Moon size={26} />}
             </button>
          </div>
        </aside>
      )}

      {/* 2. רשימת פניות */}
      {!isMobile && (activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-85 flex flex-col border-l shrink-0 z-30 ${sidebarBg}`}>
          <header className="p-7 border-b border-inherit bg-emerald-500/5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><MessageCircle size={18} className="text-emerald-500"/> צ'אט JONI</h2>
                {isServerOnline ? (
                    <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse uppercase">Live</span>
                ) : (
                    <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1"><WifiOff size={10}/> Offline</span>
                )}
            </div>
            <div className={`relative bg-black/5 rounded-2xl overflow-hidden border border-black/5 shadow-inner`}>
                <Search className="absolute right-4 top-3.5 text-slate-500" size={16}/>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חיפוש מנהל פרויקט..." className="w-full bg-transparent p-3.5 pr-12 text-xs border-none outline-none font-bold" />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {filteredCustomers.map(c => (
              <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-[1.8rem] flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30 shadow-2xl scale-[1.02]' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm relative overflow-hidden border-2 ${selectedCustomer?.id === c.id ? 'border-emerald-500 shadow-lg' : 'border-white/10 bg-slate-800 text-slate-400'}`}>
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : (c.name ? c.name[0] : '?')}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0f172a] rounded-full"></div>
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <div className="text-sm font-black truncate leading-tight">{c.projectName || c.name || "אורח"}</div>
                  <div className="text-[10px] opacity-40 font-mono mt-1 truncate">{normalizeId(c.id)}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* 3. Main Workspace */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        {selectedCustomer && activeTab === 'HUB' ? (
          <div className="flex-1 flex flex-col h-full">
            <header className={`h-24 flex items-center justify-between px-12 border-b z-20 ${sidebarBg}`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/20 relative group">
                  <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                  <div onClick={handlePhotoUpdate} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"><ImageIcon className="text-white" size={20}/></div>
                </div>
                <div><h2 className="font-black text-2xl italic tracking-tighter leading-none">{editCrm.projectName || selectedCustomer.name}</h2><p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{normalizeId(selectedCustomer.id)} | UNIFIED CONTROL</p></div>
              </div>
              <div className="flex items-center gap-4">
                {!isServerOnline && (
                    <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 border border-red-500/20"><AlertTriangle size={14}/> JONI SERVER OFFLINE</div>
                )}
                <button onClick={() => setIsSelectionMode(!isSelectionMode)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border ${isSelectionMode ? 'bg-orange-500 border-orange-400 text-white shadow-lg' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}><Activity size={16} /> {isSelectionMode ? 'סימון פעיל' : 'מצב בחירה'}</button>
                <button onClick={() => setIsAiActive(!isAiActive)} className={`flex items-center gap-3 px-7 py-3 rounded-[1.4rem] font-black text-xs transition-all border-2 ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}><Power size={20} /> {isAiActive ? 'AI AUTO ON' : 'MANUAL'}</button>
                <button onClick={() => setIsPrinting(true)} className="p-4 bg-blue-600/10 text-blue-500 rounded-[1.5rem] hover:bg-blue-600/20 border border-blue-600/20 shadow-xl group"><Printer size={28} className="group-hover:scale-110 transition-transform"/></button>
              </div>
            </header>

            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-12 flex flex-col gap-8 scroll-smooth no-scrollbar ${chatAreaBg}`} style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: theme === 'dark' ? 'soft-light' : 'overlay'}}>
              {messages.map((m, i) => (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={m.id || i} onClick={() => isSelectionMode && toggleMessageSelection(m.id)} className={`flex flex-col max-w-[70%] ${m.type === 'in' ? 'self-start' : 'self-end items-end'} ${isSelectionMode ? 'cursor-pointer hover:scale-[1.02]' : ''} transition-transform`}>
                  <div className={`p-6 rounded-[2.2rem] shadow-2xl text-[14px] relative border leading-relaxed ${m.type === 'in' ? (theme === 'dark' ? 'bg-[#202c33] border-none text-slate-200 rounded-tr-none' : 'bg-white border-none text-slate-800 rounded-tr-none') : 'bg-[#005c4b] text-white border-none rounded-tl-none shadow-emerald-500/40'}`}>
                    {isSelectionMode && (<div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-xl border-2 border-white ${selectedMsgIds.includes(m.id) ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}><CheckCircle2 size={16}/></div>)}
                    <div className="text-[9px] font-black opacity-30 mb-2 flex items-center gap-2 uppercase tracking-tighter">{m.source === 'group' ? <Users size={12}/> : <Smartphone size={12}/>} {m.source === 'group' ? 'קבוצה' : 'אישי'}</div>
                    {m.mediaUrl && <img src={m.mediaUrl} className="mb-5 rounded-[1.5rem] max-h-96 w-full object-cover shadow-2xl" alt="product" />}
                    <div className="whitespace-pre-wrap font-bold">{m.text}</div>
                    <div className={`text-[10px] mt-4 opacity-40 font-mono flex items-center gap-2 ${m.type === 'in' ? 'justify-start' : 'justify-end'}`}><Clock size={12} /> {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : 'עתה'}</div>
                  </div>
                </motion.div>
              ))}
              {isThinking && <div className="self-end bg-emerald-500/10 text-emerald-400 p-5 rounded-[2rem] flex items-center gap-5 border border-emerald-500/20 shadow-2xl animate-pulse"><Activity size={24} className="animate-spin" /><span className="text-sm font-black uppercase tracking-widest">JONI IS THINKING...</span></div>}
            </div>

            <footer className={`p-10 border-t z-20 ${sidebarBg}`}>
              <div className={`flex items-center gap-5 p-5 rounded-[2.8rem] border transition-all ${inputBg} shadow-2xl`}>
                <button onClick={handlePhotoUpdate} className="p-3 text-slate-500 hover:text-emerald-500 transition-all hover:scale-125"><ImageIcon size={28}/></button>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="הקש הודעה לניהול פרויקט (השתלטות ידנית)..." className="flex-1 bg-transparent border-none outline-none text-base px-3 font-bold placeholder:text-slate-600" />
                <button onClick={handleSend} className="w-16 h-16 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all hover:bg-emerald-500"><Send size={28} className="transform rotate-180" /></button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center gap-10 opacity-20 group"><div className="relative"><MessageCircle size={200} /><Bot size={70} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-bounce" /></div><h2 className="text-6xl font-black italic tracking-tighter uppercase text-center leading-tight">SABAN HUB<br/>UNIFIED COMMAND</h2><p className="text-sm font-bold tracking-[0.8em] text-center uppercase">Secure Operating System v5.6</p></div>
        )}
      </main>

      {/* 4. CRM Sidebar */}
      {!isMobile && selectedCustomer && (activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-[480px] flex flex-col border-r shrink-0 z-20 shadow-2xl ${sidebarBg}`}>
          <header className="p-8 border-b border-inherit bg-blue-600/5 flex justify-between items-center"><h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-3"><UserCog size={24} className="text-blue-500"/> זהות מאוחדת</h2><button onClick={handleMergeManual} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg"><Merge size={14}/> איחוד ומחיקה</button></header>
          <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
             <div className="flex flex-col items-center gap-8 pb-10 border-b border-white/5">
                <div className="w-40 h-40 rounded-[3.5rem] bg-slate-800 overflow-hidden shadow-2xl border-4 border-emerald-500/30 relative group transform hover:rotate-3 transition-all">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                   <button onClick={handlePhotoUpdate} className="absolute inset-0 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3"><ImageIcon size={28}/><span className="text-[11px] font-black uppercase tracking-[0.2em]">החלף תמונה</span></button>
                </div>
                <div className="text-center space-y-3"><h3 className="text-3xl font-black italic tracking-tighter leading-none">{editCrm.contactName || selectedCustomer.name}</h3><span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-5 py-2 rounded-full uppercase border border-emerald-500/30">זהות מאוחדת: {normalizeId(selectedCustomer.id)}</span></div>
             </div>
             <div className="space-y-8">
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-emerald-500"/> מספר לקוח בקומקס</label><input value={editCrm.comaxId} onChange={e => setEditCrm((prev:any)=>({...prev, comaxId: e.target.value}))} className={`w-full p-5 rounded-[1.8rem] text-sm font-black outline-none border-2 transition-all ${inputBg} focus:border-emerald-500 shadow-xl`} /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building size={14} className="text-blue-500"/> שם פרויקט / חברה</label><input value={editCrm.projectName} onChange={e => setEditCrm((prev:any)=>({...prev, projectName: e.target.value}))} className={`w-full p-5 rounded-[1.8rem] text-sm font-black outline-none border-2 transition-all ${inputBg} focus:border-blue-500 shadow-xl`} /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-red-500"/> כתובת אספקה</label><input value={editCrm.projectAddress} onChange={e => setEditCrm((prev:any)=>({...prev, projectAddress: e.target.value}))} className={`w-full p-5 rounded-[1.8rem] text-sm font-black outline-none border-2 transition-all ${inputBg} focus:border-red-500 shadow-xl`} /></div>
                <div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14}/> שם איש קשר</label><input value={editCrm.contactName} onChange={e => setEditCrm((prev:any)=>({...prev, contactName: e.target.value}))} className={`w-full p-5 rounded-[1.8rem] text-xs font-black outline-none border-2 ${inputBg} focus:border-indigo-500 shadow-xl`} /></div><div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Phone size={14}/> נייד</label><input value={editCrm.contactPhone} onChange={e => setEditCrm((prev:any)=>({...prev, contactPhone: e.target.value}))} className={`w-full p-5 rounded-[1.8rem] text-xs font-mono font-black outline-none border-2 ${inputBg} focus:border-emerald-500 shadow-xl`} /></div></div>
             </div>
             <button onClick={saveCustomerCard} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-5 mt-6 uppercase tracking-widest text-base">{isSaving ? <Activity size={24} className="animate-spin"/> : <><Save size={24}/> Sync Unified Card</>}</button>
          </div>
        </aside>
      )}

      {theme === 'dark' && <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"><div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px]"></div><div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]"></div></div>}
    </div>
  );
}

function Clock({ size = 16, className = "" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
