import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Clock, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserCog, HardHat, Building, 
  MapPin, Phone, CreditCard, Power, X, Search, UserCheck, Truck, Crown, PackageSearch, Merge, CheckCircle2
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

export default function SabanUnifiedHub() {
  // --- ניהול תצוגה ומערכת ---
  const [activeTab, setActiveTab] = useState<'HUB' | 'CRM' | 'FLOW' | 'INVENTORY' | 'DISPATCH' | 'MASTER'>('HUB');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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

  // --- 🔥 פונקציית איחוד (UID) ---
  const normalizeId = (id: string) => {
      if (!id) return '';
      return id.replace(/\D/g, '').slice(-9);
  };

  // --- טעינת נתונים ראשונית ---
  useEffect(() => {
    document.title = "Saban HUB | Operational Command";
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);

    // 1. טעינת לקוחות מאוחדים
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

  // טעינת היסטוריה לקוח
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
  }, [selectedCustomer]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  // --- לוגיקת שליחה ושליטה (Takeover) ---
  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    setChatInput('');

    // 🔥 שליטה עוינת: השתקה אוטומטית של ה-AI ברגע שראמי מתערב
    if (isAiActive) setIsAiActive(false);

    await push(ref(dbRT, 'saban94/outgoing'), { 
      number: selectedCustomer.id, 
      message: txt, 
      timestamp: Date.now() 
    });

    await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), { 
      text: txt, 
      type: 'out', 
      timestamp: serverTimestamp(),
      source: 'hub'
    });
  };

  const toggleMessageSelection = (id: string) => {
      if (!isSelectionMode) return;
      setSelectedMsgIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const saveCrm = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    await setDoc(doc(dbFS, 'customers', selectedCustomer.id), {
      ...editCrm,
      name: editCrm.contactName,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    setTimeout(() => setIsSaving(false), 800);
  };

  // --- סגנונות עיצוב ---
  const themeClass = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sidebarBg = theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl';
  const inputBg = theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200 shadow-inner';
  const chatAreaBg = theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#efeae2]';

  // --- תצוגת הדפסה (הזמנה סלקטיבית) ---
  if (isPrinting) return (
    <div className="bg-white p-12 text-black font-serif min-h-screen overflow-auto" dir="rtl">
        <div className="max-w-4xl mx-auto border-[4px] border-black p-8 shadow-sm">
          <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter">ח. סבן - חומרי בניין</h1>
              <p className="text-xl font-bold uppercase">הזמנת עבודה דיגיטלית - {new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <img src={BRAND_LOGO} className="w-24 h-24 border-2 border-black object-cover" alt="logo" />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 border-2 border-black">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase text-slate-500 underline">פרטי פרויקט</p>
              <p className="text-xl font-black">{editCrm.projectName || "כללי"}</p>
              <p className="font-bold">{editCrm.projectAddress}</p>
            </div>
            <div className="text-left space-y-1">
              <p className="text-xs font-black uppercase text-slate-500 underline">פרטי לקוח</p>
              <p className="text-lg font-bold">קומקס: {editCrm.comaxId || "---"}</p>
              <p className="font-bold">מנהל: {editCrm.contactName}</p>
            </div>
          </div>

          <div className="border-2 border-black min-h-[400px]">
            <div className="bg-black text-white p-2 flex justify-between font-bold">
              <span>פריטים שנבחרו מהשיחה (תחסין)</span>
              <span className="w-32 text-center">כמות</span>
            </div>
            <div className="p-4 space-y-4">
              {messages.filter(m => selectedMsgIds.includes(m.id)).map((m, i) => (
                <div key={i} className="flex justify-between border-b border-dotted border-black pb-2 items-center">
                  <span className="flex-1 font-bold">{m.text}</span>
                  <span className="w-32 text-center border-b border-black"></span>
                </div>
              ))}
              {selectedMsgIds.length === 0 && <p className="text-center italic opacity-40 py-10">לא נבחרו הודעות להדפסה. חזור וסמן פריטים בצ'אט.</p>}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-3">
             {messages.filter(m => m.mediaUrl && selectedMsgIds.includes(m.id)).map((m, i) => (
               <img key={i} src={m.mediaUrl} className="border-2 border-black aspect-square object-cover" />
             ))}
          </div>

          <div className="mt-12 flex justify-between pt-8 border-t-2 border-black italic">
            <p>חתימת מנהל פרויקט: ________________</p>
            <p>Saban HUB Command - JONI Pipeline</p>
          </div>
        </div>
        <div className="fixed bottom-8 left-8 flex gap-4 no-print">
          <button onClick={() => setIsPrinting(false)} className="bg-slate-900 text-white px-8 py-4 rounded-full font-black shadow-2xl">חזרה לצ'אט</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-2"><Printer size={20}/> הדפס הזמנה</button>
        </div>
    </div>
  );

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-all duration-500 ${themeClass}`} dir="rtl">
      
      {/* --- 1. סרגל ניווט ראשי (Saban Style Sidebar) --- */}
      {!isMobile && (
        <aside className={`w-20 flex flex-col items-center py-8 border-l gap-8 shrink-0 z-30 ${sidebarBg}`}>
          <div onClick={() => setActiveTab('HUB')} className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform cursor-pointer overflow-hidden border-2 border-white/10">
            <img src={BRAND_LOGO} alt="Bot" className="w-full h-full object-cover" />
          </div>
          <nav className="flex flex-col gap-6 flex-1">
            {[
              { id: 'HUB', icon: MessageCircle, label: 'JONI HUB' },
              { id: 'CRM', icon: Users, label: 'לקוחות ו-DNA' },
              { id: 'DISPATCH', icon: Truck, label: 'סידור עבודה' },
              { id: 'INVENTORY', icon: PackageSearch, label: 'מלאי טכני' },
              { id: 'FLOW', icon: GitBranch, label: 'עץ ה-AI' },
              { id: 'MASTER', icon: Crown, label: 'מאסטר' }
            ].map((btn: any) => (
              <button 
                key={btn.id} onClick={() => setActiveTab(btn.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${activeTab === btn.id ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:bg-emerald-500/10'}`}
              >
                <btn.icon size={22} />
                <span className="absolute right-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{btn.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className="mt-auto w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10">
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </aside>
      )}

      {/* --- 2. רשימת שיחות (WhatsApp Web Interface) --- */}
      {(activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-80 flex flex-col border-l shrink-0 z-20 ${sidebarBg}`}>
          <header className="p-5 border-b border-inherit bg-emerald-500/5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <Smartphone size={18} className="text-emerald-500"/> צ'אט JONI
              </h2>
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">ONLINE</span>
            </div>
            <div className={`relative ${inputBg} rounded-xl overflow-hidden`}>
              <Search className="absolute right-3 top-2.5 text-slate-500" size={16}/>
              <input type="text" placeholder="חיפוש מנהל פרויקט..." className="w-full bg-transparent p-2.5 pr-10 text-xs border-none outline-none font-bold" />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {customers.map(c => (
              <button 
                key={c.id} onClick={() => setSelectedCustomer(c)}
                className={`w-full p-3 rounded-xl flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs relative overflow-hidden border-2 ${selectedCustomer?.id === c.id ? 'border-emerald-500 shadow-sm' : 'border-white/10 bg-slate-800'}`}>
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : (c.name ? c.name[0] : '?')}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-4 border-[#0f172a] rounded-full"></div>
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <div className="text-sm font-black truncate leading-none">{c.projectName || c.name || "אורח"}</div>
                  <div className="text-[10px] opacity-40 font-mono mt-1.5 truncate">{c.id}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* --- 3. אזור העבודה המרכזי (WhatsApp Style Chat) --- */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        
        {selectedCustomer && activeTab === 'HUB' ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Unified Header */}
            <header className={`h-20 flex items-center justify-between px-8 border-b z-20 ${sidebarBg}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-500/20">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="p" />
                </div>
                <div>
                   <h2 className="font-black text-lg leading-none italic">{editCrm.projectName || selectedCustomer.name}</h2>
                   <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">{selectedCustomer.id} | UNIFIED JONI CORE</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border ${isSelectionMode ? 'bg-orange-500 border-orange-400 text-white shadow-lg' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}
                >
                  <Activity size={16} /> {isSelectionMode ? 'סימון הודעות להזמנה' : 'מצב בחירה'}
                </button>
                <button 
                  onClick={() => setIsAiActive(!isAiActive)}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-black text-xs transition-all border-2 ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}
                >
                  <Power size={18} /> {isAiActive ? 'AI AUTO-MODE' : 'MANUAL CONTROL'}
                </button>
                <button onClick={() => setIsPrinting(true)} className="p-3 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600/20 border border-blue-600/20 shadow-lg">
                  <Printer size={22} />
                </button>
              </div>
            </header>

            {/* Chat Messages Body */}
            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-10 flex flex-col gap-5 scroll-smooth no-scrollbar ${chatAreaBg}`} style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: theme === 'dark' ? 'soft-light' : 'overlay', backgroundSize: '400px'}}>
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.type === 'in' ? 10 : -10 }} animate={{ opacity: 1, x: 0 }}
                  key={i} onClick={() => toggleMessageSelection(m.id)}
                  className={`flex flex-col max-w-[75%] ${m.type === 'in' ? 'self-start' : 'self-end items-end'} ${isSelectionMode ? 'cursor-pointer hover:scale-105' : ''} transition-all`}
                >
                  <div className={`p-4 rounded-2xl shadow-xl text-[13px] relative border ${m.type === 'in' ? (theme === 'dark' ? 'bg-[#202c33] border-none text-slate-100 rounded-tr-none' : 'bg-white border-none text-slate-800 rounded-tr-none') : 'bg-[#005c4b] text-white border-none rounded-tl-none shadow-emerald-500/10'}`}>
                    {isSelectionMode && (
                        <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${selectedMsgIds.includes(m.id) ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            <CheckCircle2 size={14}/>
                        </div>
                    )}
                    <div className="text-[9px] font-black opacity-40 mb-1 flex items-center gap-1 uppercase tracking-tighter">
                        {m.source === 'group' ? <Users size={10}/> : <Smartphone size={10}/>} {m.source === 'group' ? 'הודעת קבוצה' : 'אישי'}
                    </div>
                    {m.mediaUrl && <img src={m.mediaUrl} className="mb-4 rounded-xl max-h-80 w-full object-cover shadow-lg border border-white/10" alt="product" />}
                    <div className="whitespace-pre-wrap leading-relaxed font-bold tracking-tight">{m.text}</div>
                    <div className={`text-[9px] mt-2 opacity-30 font-mono flex items-center gap-1 ${m.type === 'in' ? 'justify-start' : 'justify-end'}`}>
                       <Clock size={10}/> {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) : 'עתה'}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isThinking && (
                <div className="self-end bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl flex items-center gap-4 border border-emerald-500/20">
                  <Activity size={18} className="animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest">JONI AI THINKING...</span>
                </div>
              )}
            </div>

            {/* Manual Input Footer */}
            <footer className={`p-8 border-t z-20 ${sidebarBg}`}>
              <div className={`flex items-center gap-4 p-4 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-[#2a3942] border-none' : 'bg-white border-slate-200 shadow-inner'}`}>
                 <button className="p-3 text-slate-500 hover:text-emerald-500 transition-all"><ImageIcon size={26}/></button>
                 <input 
                   type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSend()}
                   placeholder="הקש הודעה לניהול פרויקט (יכבה AI אוטומטית)..."
                   className="flex-1 bg-transparent border-none outline-none text-sm px-2 font-bold placeholder:text-slate-500"
                 />
                 <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-90 transition-all">
                    <Send size={24} className="transform rotate-180" />
                 </button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center gap-8 opacity-20 group">
             <div className="relative">
                <MessageCircle size={150} className="group-hover:scale-110 transition-transform duration-700" />
                <Bot size={50} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-bounce" />
             </div>
             <h2 className="text-5xl font-black italic tracking-tighter uppercase text-center leading-tight">SABAN HUB<br/>COMMAND CENTER</h2>
             <p className="text-sm font-bold tracking-[0.8em] text-center">OPERATIONAL INTERFACE v4.0</p>
          </div>
        )}
      </main>

      {/* --- 4. CRM Sidebar (Identity Unification) --- */}
      {!isMobile && selectedCustomer && (activeTab === 'CRM' || activeTab === 'HUB') && (
        <aside className={`w-[450px] flex flex-col border-r shrink-0 z-20 shadow-2xl ${sidebarBg}`}>
          <header className="p-8 border-b border-inherit bg-blue-600/5 flex justify-between items-center">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-3">
                <UserCog size={22} className="text-blue-500"/> כרטיס ניהול פרויקט
             </h2>
             <button onClick={() => {const t = prompt("UID?"); if(t) setEditCrm({...editCrm, comaxId: t})}} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all"><Merge size={12}/> איחוד ידני</button>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
             <div className="flex flex-col items-center gap-6 pb-8 border-b border-white/5">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 overflow-hidden shadow-2xl border-4 border-emerald-500/30 relative group">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                   <button onClick={() => { const p = prompt("לינק לתמונה:"); if(p) setEditCrm({...editCrm, photo: p}); }} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] font-black uppercase font-sans">Update Photo</button>
                </div>
                <div className="text-center space-y-1">
                   <h3 className="text-2xl font-black italic tracking-tight">{editCrm.contactName || selectedCustomer.name}</h3>
                   <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase border border-emerald-500/20">זהות מאוחדת (Master)</span>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> מספר לקוח בקומקס</label>
                   <input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5 focus:border-emerald-500' : 'bg-white border-slate-200'}`} />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building size={14}/> שם פרויקט / חברה</label>
                   <input value={editCrm.projectName} onChange={e => setEditCrm({...editCrm, projectName: e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5 focus:border-emerald-500' : 'bg-white border-slate-200'}`} />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> כתובת אספקה</label>
                   <input value={editCrm.projectAddress} onChange={e => setEditCrm({...editCrm, projectAddress: e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5 focus:border-emerald-500' : 'bg-white border-slate-200'}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCog size={14}/> איש קשר</label>
                      <input value={editCrm.contactName} onChange={e => setEditCrm({...editCrm, contactName: e.target.value})} className={`w-full p-4 rounded-2xl text-xs font-black outline-none border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200'}`} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Phone size={14}/> נייד</label>
                      <input value={editCrm.contactPhone} onChange={e => setEditCrm({...editCrm, contactPhone: e.target.value})} className={`w-full p-4 rounded-2xl text-xs font-mono outline-none border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200'}`} />
                   </div>
                </div>
             </div>

             <button 
               onClick={saveCrm} disabled={isSaving}
               className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 mt-4 disabled:opacity-50"
             >
                {isSaving ? <Activity className="animate-spin"/> : <><Save size={20}/> שמור וסנכרן כרטיס</>}
             </button>

             <div className="p-5 rounded-[2rem] border-2 border-dashed border-amber-500/30 bg-amber-500/5 text-amber-600 text-xs font-black leading-relaxed shadow-inner">
                💡 המערכת מאחדת כעת את כל הודעות "עלי אבו עיאדה" (קבוצה ופרטי) תחת מזהה הטלפון שלו. כל שינוי כאן ישפיע על כל ערוצי התקשורת שלו בצינור JONI.
             </div>
          </div>
        </aside>
      )}

      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]"></div>
        </div>
      )}
    </div>
  );
}
