import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy } from 'firebase/firestore';
import { getDatabase, ref, push, onValue } from 'firebase/database';
// הסרת הייבוא הישיר שגרם לשגיאה בסביבת הפיתוח, נשתמש במימוש חלופי או בדיקה
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Clock, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserCog, HardHat, Building, 
  MapPin, Phone, CreditCard, Power, X, Search, UserCheck, Truck, Crown, PackageSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- אתחול תשתיות (Firebase) ---
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

  // --- נתוני ליבה ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [dispatch, setDispatch] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  
  // --- ניהול צ'אט ו-AI ---
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // --- CRM & Master States ---
  const [editCrm, setEditCrm] = useState<any>({ 
    comaxId: '', 
    projectName: '', 
    projectAddress: '', 
    contactName: '', 
    contactPhone: '', 
    photo: '' 
  });
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- פונקציית עזר לאיחוד משתמשים (פרטי וקבוצה) ---
  const normalizeId = (id: string) => id.replace(/\D/g, '').slice(-9);

  // --- טעינת נתונים ---
  useEffect(() => {
    document.title = "Saban HUB | Unified Command";
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);

    // 1. טעינת לקוחות מאוחדים מ-Firestore
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), limit(100)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unified = raw.reduce((acc: any[], curr: any) => {
        const phone = normalizeId(curr.id);
        if (!acc.find(i => normalizeId(i.id) === phone)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      setCustomers(unified);
    });

    // 2. טעינת הגדרות AI
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

  // טעינת היסטוריית צ'אט לקוח ספציפי
  useEffect(() => {
    if (!selectedCustomer) return;
    
    // סנכרון נתוני CRM לטופס
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // --- לוגיקה עסקית ---
  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    setChatInput('');

    // שליחה לצינור JONI ב-RTDB
    await push(ref(dbRT, 'saban94/outgoing'), { 
      number: selectedCustomer.id, 
      message: txt, 
      timestamp: Date.now() 
    });

    // תיעוד היסטוריה ב-Firestore
    await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), { 
      text: txt, 
      type: 'out', 
      timestamp: serverTimestamp(),
      source: 'hub'
    });

    if (isAiActive) {
      setIsThinking(true);
      try {
        const res = await fetch('/api/gemini', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            message: txt, 
            senderPhone: selectedCustomer.id, 
            state: 'MENU',
            name: selectedCustomer.name || 'אורח'
          }) 
        });
        const data = await res.json();
        if (data.reply) {
          await push(ref(dbRT, 'saban94/outgoing'), { 
            number: selectedCustomer.id, 
            message: data.reply, 
            timestamp: Date.now() 
          });
        }
      } catch (e) {
        console.error("AI Error:", e);
      } finally {
        setIsThinking(false);
      }
    }
  };

  const saveCustomerCard = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    await setDoc(doc(dbFS, 'customers', selectedCustomer.id), {
      ...editCrm,
      name: editCrm.contactName || selectedCustomer.name,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    setTimeout(() => setIsSaving(false), 800);
  };

  // --- הגדרות עיצוב ---
  const themeClass = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sidebarBg = theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl';
  const itemBg = theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200';
  const inputBg = theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200 shadow-inner';
  const chatBg = theme === 'dark' ? 'bg-[#020617]' : 'bg-[#e5ddd5]';

  // --- תצוגת הדפסת הזמנה (תחסין) ---
  if (isPrinting) return (
    <div className="bg-white p-12 text-black font-serif min-h-screen overflow-auto" dir="rtl">
        <div className="max-w-4xl mx-auto border-[6px] border-double border-black p-10 shadow-2xl">
          <div className="flex justify-between items-center border-b-4 border-black pb-8 mb-8">
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter">ח. סבן - חומרי בניין</h1>
              <p className="text-xl font-bold uppercase mt-2">טופס הזמנת עבודה דיגיטלי - {new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <img src={BRAND_LOGO} className="w-28 h-28 border-4 border-black object-cover" alt="logo" />
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10 bg-slate-50 p-6 border-2 border-black shadow-lg">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase text-slate-500 underline underline-offset-4">פרטי פרויקט</p>
              <p className="text-2xl font-black">{editCrm.projectName || "פרויקט כללי"}</p>
              <p className="font-bold flex items-center gap-2"><MapPin size={16}/> {editCrm.projectAddress || "נא להזין כתובת אספקה"}</p>
            </div>
            <div className="text-left space-y-2">
              <p className="text-xs font-black uppercase text-slate-500 underline underline-offset-4">פרטי לקוח</p>
              <p className="text-xl font-bold">קומקס: {editCrm.comaxId || "---"}</p>
              <p className="font-bold">מנהל פרויקט: {editCrm.contactName || "תחסין"}</p>
              <p className="font-mono text-sm">{editCrm.contactPhone}</p>
            </div>
          </div>

          <div className="border-2 border-black min-h-[500px] flex flex-col shadow-inner">
            <div className="bg-black text-white p-3 flex justify-between font-black text-lg">
              <span>תיאור הפריטים (מתוך היסטוריית JONI)</span>
              <span className="w-32 text-center">כמות לאספקה</span>
            </div>
            <div className="p-6 space-y-6 flex-1">
              {messages.filter(m => m.type === 'in' && m.text.length > 5).map((m, i) => (
                <div key={i} className="flex justify-between border-b-2 border-slate-200 pb-4 last:border-0 items-center">
                  <span className="flex-1 leading-relaxed font-medium">{m.text}</span>
                  <span className="w-40 text-center border-b-2 border-black h-8"></span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <p className="font-black text-sm uppercase text-slate-500 mb-4 underline underline-offset-4">צילומי שטח / מוצרים מהשיחה</p>
            <div className="grid grid-cols-4 gap-4">
              {messages.filter(m => m.mediaUrl).map((m, i) => (
                <div key={i} className="border-2 border-black aspect-square overflow-hidden bg-slate-100">
                  <img src={m.mediaUrl} className="w-full h-full object-cover" alt="product-site" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex justify-between items-end pt-10 border-t-4 border-black italic">
            <div className="text-center space-y-2">
              <div className="w-48 border-b-2 border-black mx-auto h-12"></div>
              <p className="font-black text-sm uppercase">חתימת מנהל (תחסין)</p>
            </div>
            <div className="text-center opacity-60">
              <p className="text-xs">הופק ע"י Saban OS Unified Command</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-48 border-b-2 border-black mx-auto h-12"></div>
              <p className="font-black text-sm uppercase">אישור מחסן ח. סבן</p>
            </div>
          </div>
        </div>
        <div className="fixed bottom-10 left-10 flex gap-6 no-print">
          <button onClick={() => setIsPrinting(false)} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl hover:scale-105 transition-all">חזרה למערכת</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-8 py-4 rounded-3xl font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
            <Printer size={22}/> הדפס הזמנה
          </button>
        </div>
    </div>
  );

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-all duration-500 ${themeClass}`} dir="rtl">
      
      {/* --- 1. סרגל ניווט ראשי (Sidebar) --- */}
      {!isMobile && (
        <aside className={`w-24 flex flex-col items-center py-10 border-l gap-10 shrink-0 z-40 ${sidebarBg}`}>
          <div className="w-16 h-16 bg-emerald-500 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 active:scale-95 transition-transform cursor-pointer overflow-hidden border-2 border-white/20">
            <img src={BRAND_LOGO} alt="Bot" className="w-full h-full object-cover" />
          </div>
          
          <nav className="flex flex-col gap-6 flex-1">
            {[
              { id: 'HUB', icon: Users, label: 'הזמנות קבוצה' },
              { id: 'CRM', icon: BrainCircuit, label: 'אימון DNA' },
              { id: 'DISPATCH', icon: Truck, label: 'סידור עבודה' },
              { id: 'FLOW', icon: GitBranch, label: 'עץ ה-AI' },
              { id: 'INVENTORY', icon: PackageSearch, label: 'ניהול מלאי' },
              { id: 'MASTER', icon: Crown, label: 'מאסטר ראמי' }
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

          <button onClick={toggleTheme} className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10 transition-all border border-transparent hover:border-slate-500/20">
            {theme === 'dark' ? <Sun size={26} /> : <Moon size={26} />}
          </button>
        </aside>
      )}

      {/* --- 2. תפריט רשימת פניות משני --- */}
      {!isMobile && (activeTab === 'HUB' || activeTab === 'CRM' || activeTab === 'INVENTORY') && (
        <aside className={`w-85 flex flex-col border-l shrink-0 z-30 ${sidebarBg}`}>
          <header className="p-7 border-b border-inherit flex flex-col gap-4 bg-emerald-500/5">
            <div className="flex justify-between items-center">
                <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    {activeTab === 'INVENTORY' ? <PackageSearch size={18} className="text-amber-500"/> : <MessageCircle size={18} className="text-emerald-500"/>}
                    {activeTab === 'INVENTORY' ? 'חיפוש מלאי טכני' : 'צ\'אט פניות JONI'}
                </h2>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase text-emerald-500">Live Hub</span>
                </div>
            </div>
            <div className={`relative ${inputBg} rounded-2xl overflow-hidden border border-white/10 shadow-lg`}>
                <Search className="absolute right-4 top-3 text-slate-500" size={16}/>
                <input type="text" placeholder="חיפוש מהיר..." className="w-full bg-transparent p-3 pr-11 text-xs border-none outline-none font-bold" />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {activeTab === 'INVENTORY' ? (
               inventory.map(p => (
                <button key={p.sku} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border border-transparent ${itemBg}`}>
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-amber-500 font-bold border border-white/5 overflow-hidden">
                      {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover"/> : p.sku}
                    </div>
                    <div className="text-right flex-1 overflow-hidden">
                      <div className="text-sm font-black truncate">{p.product_name}</div>
                      <div className="text-[10px] font-mono text-emerald-500">₪{p.price}</div>
                    </div>
                </button>
               ))
            ) : (
                customers.map(c => (
                    <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-[1.8rem] flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30 shadow-2xl scale-[1.02]' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm relative overflow-hidden border-2 ${selectedCustomer?.id === c.id ? 'border-emerald-500 shadow-lg' : 'border-white/10 bg-slate-800 text-slate-400'}`}>
                        {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : (c.name ? c.name[0] : '?')}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0f172a] rounded-full"></div>
                      </div>
                      <div className="text-right flex-1 overflow-hidden">
                        <div className="text-sm font-black truncate leading-tight">{c.projectName || c.name || "אורח"}</div>
                        <div className="text-[10px] opacity-40 font-mono mt-1 truncate">{c.id}</div>
                      </div>
                    </button>
                  ))
            )}
          </div>
        </aside>
      )}

      {/* --- 3. אזור העבודה המרכזי (Dynamic Workspace) --- */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        
        {activeTab === 'HUB' && selectedCustomer ? (
            <div className="flex-1 flex flex-col h-full">
                {/* Header מחוזק */}
                <header className={`h-24 flex items-center justify-between px-12 border-b z-20 ${sidebarBg}`}>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-500 rounded-3xl overflow-hidden shadow-2xl relative group border-4 border-emerald-500/20">
                            <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"><UserCog size={20} className="text-white"/></div>
                        </div>
                        <div>
                            <h2 className="font-black text-2xl italic tracking-tighter leading-none">{editCrm.projectName || selectedCustomer.name}</h2>
                            <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {selectedCustomer.id} | UNIFIED JONI CORE
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">AI Response Logic</span>
                           <button onClick={() => setIsAiActive(!isAiActive)} className={`flex items-center gap-4 px-7 py-3 rounded-[1.4rem] font-black text-xs transition-all border-2 ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                             <Power size={20} /> {isAiActive ? 'AI AUTO-MODE ON' : 'MANUAL CONTROL'}
                           </button>
                        </div>
                        <button onClick={() => setIsPrinting(true)} className="p-4 bg-blue-600/10 text-blue-500 rounded-[1.5rem] hover:bg-blue-600/20 transition-all border border-blue-600/20 shadow-xl group">
                          <Printer size={28} className="group-hover:scale-110 transition-transform"/>
                        </button>
                    </div>
                </header>

                {/* תוכן הצ'אט האמיתי */}
                <div ref={scrollRef} className={`flex-1 overflow-y-auto p-12 flex flex-col gap-10 scroll-smooth no-scrollbar ${chatBg}`}>
                    {messages.map((m, i) => (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col max-w-[70%] ${m.type === 'in' ? 'self-start' : 'self-end items-end'}`}>
                            <div className={`p-6 rounded-[2.2rem] shadow-2xl text-[14px] relative border leading-relaxed ${m.type === 'in' ? (theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-200 rounded-tr-none' : 'bg-white border-slate-200 text-slate-800 rounded-tr-none') : 'bg-emerald-600 text-white border-emerald-500 rounded-tl-none shadow-emerald-500/40'}`}>
                                <div className="text-[9px] font-black opacity-30 mb-2 flex items-center gap-2 uppercase tracking-tighter">
                                    {m.source === 'group' ? <Users size={12}/> : <Smartphone size={12}/>}
                                    {m.source === 'group' ? 'הודעת קבוצה' : 'שיחה אישית'}
                                </div>
                                {m.mediaUrl && <img src={m.mediaUrl} className="mb-5 rounded-[1.5rem] max-h-96 w-full object-cover shadow-2xl border-2 border-white/10" alt="img" />}
                                <div className="whitespace-pre-wrap font-bold">{m.text}</div>
                                <div className={`text-[10px] mt-4 opacity-40 font-mono flex items-center gap-2 ${m.type === 'in' ? 'justify-start' : 'justify-end'}`}>
                                  <Clock size={12} /> {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : 'ממש עכשיו'}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isThinking && (
                      <div className="self-end bg-emerald-500/10 text-emerald-400 p-5 rounded-[2rem] flex items-center gap-5 border border-emerald-500/20 shadow-2xl">
                        <Activity size={24} className="animate-spin" />
                        <span className="text-sm font-black uppercase tracking-widest">JONI AI IS FORMULATING...</span>
                      </div>
                    )}
                </div>

                {/* שורת קלט לניהול JONI */}
                <footer className={`p-10 border-t z-20 ${sidebarBg}`}>
                    <div className={`flex items-center gap-5 p-5 rounded-[2.8rem] border transition-all ${inputBg} shadow-2xl`}>
                        <button className="p-3 text-slate-500 hover:text-emerald-500 transition-all hover:scale-125"><ImageIcon size={28}/></button>
                        <input 
                          type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} 
                          onKeyDown={e => e.key === 'Enter' && handleSend()} 
                          placeholder="הקש הודעה לניהול פרויקט (יישלח ישירות)..." 
                          className="flex-1 bg-transparent border-none outline-none text-base px-3 font-bold placeholder:text-slate-600" 
                        />
                        <button onClick={handleSend} className="w-16 h-16 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all hover:bg-emerald-500">
                          <Send size={28} className="transform rotate-180" />
                        </button>
                    </div>
                </footer>
            </div>
        ) : activeTab === 'FLOW' ? (
            /* --- מצב עורך ענפי ה-AI --- */
            <div className="flex-1 overflow-y-auto p-16 flex flex-col gap-12">
                <header className="flex justify-between items-center">
                    <div>
                      <h1 className="text-5xl font-black italic tracking-tighter uppercase">AI Branch <span className="text-blue-500">Studio</span></h1>
                      <p className="text-sm font-bold opacity-60 mt-2 uppercase tracking-widest">תכנות המוח המרכזי והזרקת DNA פונקציונלי</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setNodes([...nodes, { id: `BNCH_${Date.now()}`, title: 'ענף חדש', trigger: '', prompt: '' }])} className="bg-blue-600 text-white px-10 py-5 rounded-[1.8rem] font-black text-sm shadow-2xl active:scale-95 transition-all flex items-center gap-3"><Plus size={24}/> ענף חדש</button>
                        <button onClick={async () => { setIsSaving(true); await setDoc(doc(dbFS, 'system', 'bot_flow_config'), { nodes, globalDNA }, { merge: true }); setTimeout(()=>setIsSaving(false), 800); }} className="bg-slate-900 text-white px-10 py-5 rounded-[1.8rem] font-black text-sm shadow-2xl flex items-center gap-3 transition-all">
                          {isSaving ? <Activity className="animate-spin"/> : <><Save size={24}/> שמור ענפים LIVE</>}
                        </button>
                    </div>
                </header>
                <div className={`p-10 rounded-[3.5rem] border ${sidebarBg} bg-blue-600/5 shadow-inner`}>
                  <label className="text-xs font-black uppercase text-blue-500 mb-4 block tracking-[0.3em]">DNA גלובלי (זהות ראמי המוח הלוגיסטי)</label>
                  <textarea value={globalDNA} onChange={e => setGlobalDNA(e.target.value)} className={`w-full h-40 p-6 rounded-[2rem] text-sm font-bold outline-none focus:border-blue-500 leading-relaxed transition-all shadow-inner ${inputBg}`} placeholder="הגדר את אישיות הבוט..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {nodes.map(node => (
                    <div key={node.id} className={`p-10 rounded-[3rem] border relative group hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
                      <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} className="absolute -left-2 -top-2 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-110 z-10"><Trash2 size={20}/></button>
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <label className="text-[10px] font-black opacity-50 uppercase tracking-widest block mb-2">שם הענף</label>
                          <input value={node.title} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, title: e.target.value} : n))} className={`w-full p-4 rounded-2xl text-xs font-black outline-none border-2 focus:border-blue-500 transition-all ${inputBg}`} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black opacity-50 uppercase tracking-widest block mb-2">פקודת טריגר</label>
                          <input value={node.trigger} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, trigger: e.target.value} : n))} className={`w-full p-4 rounded-2xl text-xs font-mono text-blue-400 outline-none border-2 focus:border-blue-500 transition-all ${inputBg}`} placeholder="למשל: 1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-50 uppercase tracking-widest">הוראות DNA למצב זה</label>
                        <textarea value={node.prompt} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, prompt: e.target.value} : n))} className={`w-full h-40 p-5 rounded-[1.8rem] text-[12px] font-medium leading-relaxed resize-none outline-none border-2 focus:border-blue-500 transition-all ${inputBg}`} placeholder="מה ה-AI עונה בשלב זה..." />
                      </div>
                    </div>
                  ))}
                </div>
            </div>
        ) : (
          /* --- מצב המתנה / שער כניסה --- */
          <div className="m-auto flex flex-col items-center gap-10 opacity-20 group">
             <div className="relative">
                <MessageCircle size={200} className="group-hover:scale-110 transition-transform duration-700" />
                <Bot size={70} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-bounce" />
             </div>
             <h2 className="text-6xl font-black italic tracking-tighter uppercase text-center leading-tight">SABAN HUB<br/>COMMAND CENTER</h2>
             <p className="text-sm font-bold tracking-[0.8em] text-center uppercase">Secure Operating System v3.0</p>
          </div>
        )}
      </main>

      {/* --- 4. עמודה שמאלית: כרטיס CRM ניהול פרויקט --- */}
      {!isMobile && selectedCustomer && (activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-[480px] flex flex-col border-r shrink-0 z-20 shadow-2xl ${sidebarBg}`}>
          <header className="p-8 border-b border-inherit bg-blue-600/5 flex justify-between items-center">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-3">
                <UserCog size={24} className="text-blue-500"/> כרטיס ניהול פרויקט
             </h2>
             <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">SABAN MASTER</div>
          </header>
          <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
             <div className="flex flex-col items-center gap-8 pb-10 border-b border-white/5">
                <div className="w-40 h-40 rounded-[3.5rem] bg-slate-800 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border-4 border-emerald-500/30 relative group transform hover:rotate-3 transition-all duration-500">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="p-photo" />
                   <button onClick={() => { const p = prompt("לינק לתמונה:"); if(p) setEditCrm({...editCrm, photo: p}); }} className="absolute inset-0 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                     <ImageIcon size={28}/>
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">Update Identity</span>
                   </button>
                </div>
                <div className="text-center space-y-3">
                   <h3 className="text-3xl font-black italic tracking-tighter">{editCrm.contactName || selectedCustomer.name}</h3>
                   <div className="flex justify-center gap-3">
                     <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-5 py-2 rounded-full uppercase border border-emerald-500/30">מנהל פרויקט VIP</span>
                     <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-5 py-2 rounded-full uppercase border border-blue-500/30">אורניל-מהלה</span>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-emerald-500"/> מספר לקוח בקומקס</label>
                   <input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className={`w-full p-5 rounded-[1.8rem] text-sm font-black outline-none border-2 transition-all ${inputBg} focus:border-emerald-500 shadow-xl`} placeholder="למשל: 10045" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building size={14} className="text-blue-500"/> שם פרויקט / חברה</label>
                   <input value={editCrm.projectName} onChange={e => setEditCrm({...editCrm, projectName: e.target.value})} className={`w-full p-5 rounded-[1.8rem] text-sm font-black outline-none border-2 transition-all ${inputBg} focus:border-blue-500 shadow-xl`} placeholder="אורניל-מהלה" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-red-500"/> כתובת מדויקת לאספקה</label>
                   <input value={editCrm.projectAddress} onChange={e => setEditCrm({...editCrm, projectAddress: e.target.value})} className={`w-full p-5 rounded-[1.8rem] text-sm font-black outline-none border-2 transition-all ${inputBg} focus:border-red-500 shadow-xl`} placeholder="הירקון 12, תל אביב" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14} className="text-indigo-500"/> שם איש קשר</label>
                      <input value={editCrm.contactName} onChange={e => setEditCrm({...editCrm, contactName: e.target.value})} className={`w-full p-5 rounded-[1.8rem] text-xs font-black outline-none border-2 ${inputBg} focus:border-indigo-500 shadow-xl`} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Phone size={14} className="text-emerald-400"/> נייד ליצירת קשר</label>
                      <input value={editCrm.contactPhone} onChange={e => setEditCrm({...editCrm, contactPhone: e.target.value})} className={`w-full p-5 rounded-[1.8rem] text-xs font-mono font-black outline-none border-2 ${inputBg} focus:border-emerald-500 shadow-xl`} />
                   </div>
                </div>
             </div>

             <button 
               onClick={saveCrm} disabled={isSaving}
               className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex items-center justify-center gap-5 mt-6 disabled:opacity-50 text-base uppercase tracking-widest"
             >
                {isSaving ? <Activity size={24} className="animate-spin"/> : <><Save size={24}/> Update & Sync Card</>}
             </button>

             <div className="p-7 rounded-[3rem] border-4 border-dashed border-amber-500/30 bg-amber-500/5 text-amber-600 text-xs font-black leading-relaxed shadow-inner">
                <div className="flex items-center gap-3 mb-3 text-sm italic underline decoration-amber-500/30"><Zap size={20}/> JONI SYSTEM LOGIC:</div>
                נתוני הכרטיס המאוחדים הללו יוזרקו אוטומטית לטופס ההזמנה הדיגיטלי של "תחסין" בכל הפקת מסמך. המערכת תדע לאחד את הפניות מהקבוצה ומהפרטי תחת זהות זו.
             </div>
          </div>
        </aside>
      )}

      {/* רקע אורות אמביינט (Dark Mode בלבד) */}
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[180px]"></div>
        </div>
      )}
    </div>
  );
}
