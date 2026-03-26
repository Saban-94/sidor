import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy } from 'firebase/firestore';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Clock, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserCog, HardHat, Building, 
  MapPin, Phone, CreditCard, Power, X, Search, UserCheck
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
  const [activeTab, setActiveTab] = useState<'GROUP_HUB' | 'SIMULATOR' | 'FLOW' | 'DNA'>('GROUP_HUB');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // --- נתוני לקוחות וענפים ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  
  // --- ניהול צ'אט ו-AI ---
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- עריכת כרטיס לקוח (CRM) ---
  const [editCrm, setEditCrm] = useState<any>({
    comaxId: '', projectName: '', projectAddress: '', contactName: '', contactPhone: '', photo: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- טעינת נתונים ראשונית ---
  useEffect(() => {
    document.title = "Saban OS | Unified Command";
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);

    // טעינת לקוחות עם לוגיקת איחוד לפי טלפון
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), limit(100)), (snap) => {
      const rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // איחוד כפילויות ברמת הקליינט ליתר ביטחון
      const unified = rawData.reduce((acc: any[], current: any) => {
        const phoneMatch = current.id.replace(/\D/g, '').slice(-9); // זיהוי לפי 9 ספרות אחרונות
        const existing = acc.find(item => item.id.includes(phoneMatch));
        if (!existing) acc.push(current);
        return acc;
      }, []);

      setCustomers(unified);
    });

    // טעינת עץ ענפים
    const unsubFlow = onSnapshot(doc(dbFS, 'system', 'bot_flow_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    return () => {
      window.removeEventListener('resize', checkSize);
      unsubCust();
      unsubFlow();
    };
  }, []);

  // --- טעינת היסטוריה לקוח ספציפי ---
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

  // --- פונקציות ביצוע ---
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const msgText = chatInput.trim();
    setChatInput('');

    // שליחה לצינור RTDB (JONI)
    await push(ref(dbRT, 'saban94/outgoing'), {
      number: selectedCustomer.id,
      message: msgText,
      timestamp: Date.now()
    });

    // שמירה בהיסטוריה Firestore - תמיד תחת מזהה הטלפון המאוחד
    await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), {
      text: msgText,
      type: 'out',
      timestamp: serverTimestamp(),
      source: 'hub'
    });

    if (isAiActive) triggerAi(msgText);
  };

  const triggerAi = async (userMsg: string) => {
    setIsThinking(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          name: selectedCustomer?.name,
          senderPhone: selectedCustomer?.id,
          state: 'MENU'
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
    } catch (e) { console.error(e); }
    finally { setIsThinking(false); }
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

  // --- עיצוב מותנה ---
  const baseBg = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sideBg = theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200 shadow-xl';
  const itemBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200';
  const chatAreaBg = theme === 'dark' ? 'bg-[#020617]' : 'bg-[#e5ddd5]';

  // --- תצוגת הדפסה ---
  if (isPrinting) {
    return (
      <div className="bg-white p-12 text-black font-serif min-h-screen" dir="rtl">
        <div className="max-w-4xl mx-auto border-[4px] border-black p-8">
          <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-black italic">ח. סבן - חומרי בניין</h1>
              <p className="text-xl font-bold uppercase mt-1">הזמנת עבודה דיגיטלית - {new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <img src={BRAND_LOGO} className="w-24 h-24 border-2 border-black" alt="logo" />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 border-2 border-black shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase text-slate-500 underline">פרטי פרויקט</p>
              <p className="text-xl font-black">{editCrm.projectName || "פרויקט כללי"}</p>
              <p className="font-bold">{editCrm.projectAddress || "נא להזין כתובת"}</p>
            </div>
            <div className="text-left space-y-1">
              <p className="text-xs font-black uppercase text-slate-500 underline">פרטי לקוח</p>
              <p className="text-lg font-bold">קומקס: {editCrm.comaxId || "---"}</p>
              <p className="font-bold">מנהל: {editCrm.contactName || "תחסין"}</p>
              <p className="font-mono text-sm">{editCrm.contactPhone}</p>
            </div>
          </div>

          <div className="border-2 border-black min-h-[400px]">
            <div className="bg-black text-white p-2 flex justify-between font-bold">
              <span>תיאור הפריטים מההודעה</span>
              <span className="w-32 text-center">כמות</span>
            </div>
            <div className="p-4 space-y-4">
              {messages.filter(m => m.type === 'in' && m.text.length > 5).map((m, i) => (
                <div key={i} className="flex justify-between border-b border-dotted border-black pb-2">
                  <span className="flex-1 leading-relaxed">{m.text}</span>
                  <span className="w-32 text-center border-b border-black"></span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-3">
             {messages.filter(m => m.mediaUrl).map((m, i) => (
               <img key={i} src={m.mediaUrl} className="border-2 border-black aspect-square object-cover" alt="site-photo" />
             ))}
          </div>

          <div className="mt-12 flex justify-between pt-8 border-t-2 border-black italic">
            <p>חתימת מנהל פרויקט: ________________</p>
            <p>מאושר ע"י Saban OS Hub</p>
          </div>
        </div>
        <div className="fixed bottom-8 left-8 flex gap-4 no-print">
          <button onClick={() => setIsPrinting(false)} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold">ביטול</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2"><Printer size={20}/> הדפס עכשיו</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-all duration-500 ${baseBg}`} dir="rtl">
      
      {/* --- 1. סרגל ניווט ראשי --- */}
      {!isMobile && (
        <aside className={`w-20 flex flex-col items-center py-8 border-l gap-8 shrink-0 z-30 ${sideBg}`}>
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="text-white" size={26} />
          </div>
          <nav className="flex flex-col gap-5">
            {[
              { id: 'GROUP_HUB', icon: Users, label: 'הזמנות קבוצה' },
              { id: 'SIMULATOR', icon: Smartphone, label: 'סימולטור' },
              { id: 'DNA', icon: BrainCircuit, label: 'אימון DNA' },
              { id: 'FLOW', icon: GitBranch, label: 'ניהול ענפים' }
            ].map((btn: any) => (
              <button 
                key={btn.id} onClick={() => setActiveTab(btn.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === btn.id ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                title={btn.label}
              >
                <btn.icon size={22} />
              </button>
            ))}
          </nav>
          <button onClick={toggleTheme} className="mt-auto w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10">
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </aside>
      )}

      {/* --- 2. רשימת לקוחות חיים (מאוחדת) --- */}
      {(activeTab === 'GROUP_HUB' || activeTab === 'SIMULATOR') && (
        <aside className={`w-80 flex flex-col border-l shrink-0 z-20 ${sideBg}`}>
          <header className="p-6 border-b border-inherit bg-emerald-500/5 flex justify-between items-center">
            <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <MessageCircle size={18} className="text-emerald-500"/> לקוחות מאוחדים
            </h2>
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">LIVE</span>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {customers.map(c => (
              <button 
                key={c.id} onClick={() => setSelectedCustomer(c)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs relative overflow-hidden border-2 ${selectedCustomer?.id === c.id ? 'border-emerald-500' : 'border-white/10 bg-slate-800'}`}>
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : (c.name ? c.name[0] : '?')}
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <div className="text-sm font-black truncate">{c.projectName || c.name || "אורח"}</div>
                  <div className="text-[10px] opacity-40 font-mono truncate">{c.id}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* --- 3. אזור העבודה המרכזי --- */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        
        {selectedCustomer && (activeTab === 'GROUP_HUB' || activeTab === 'SIMULATOR') ? (
          <div className="flex-1 flex flex-col h-full">
            <header className={`h-20 flex items-center justify-between px-8 border-b z-20 ${sideBg}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl overflow-hidden shadow-2xl">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="p" />
                </div>
                <div>
                   <h2 className="font-black text-lg leading-none italic">{editCrm.projectName || selectedCustomer.name}</h2>
                   <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">{selectedCustomer.id} | JONI UNIFIED PIPE</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAiActive(!isAiActive)}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl font-black text-xs transition-all ${isAiActive ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-500/10 text-slate-500'}`}
                >
                  <Power size={18} /> {isAiActive ? 'AI מענה פעיל' : 'מענה ידני'}
                </button>
                <button onClick={() => setIsPrinting(true)} className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600/20 transition-all border border-blue-600/20">
                  <Printer size={22} />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-8 flex flex-col gap-6 scroll-smooth no-scrollbar ${chatAreaBg}`} style={theme !== 'dark' ? {backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'cover', backgroundBlendMode: 'overlay'} : {}}>
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={i} className={`flex flex-col max-w-[75%] ${m.type === 'in' ? 'self-start' : 'self-end items-end'}`}
                >
                  <div className={`p-5 rounded-3xl shadow-xl text-[13px] relative border ${m.type === 'in' ? (theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-200 rounded-tr-none' : 'bg-white border-slate-100 text-slate-800 rounded-tr-none') : 'bg-emerald-600 text-white border-emerald-500 rounded-tl-none shadow-emerald-500/20'}`}>
                    <div className="text-[9px] font-black opacity-40 mb-1 flex items-center gap-1">
                        {m.source === 'group' ? <Users size={10}/> : <Smartphone size={10}/>}
                        {m.source === 'group' ? 'הודעת קבוצה' : 'שיחה פרטית'}
                    </div>
                    {m.mediaUrl && <img src={m.mediaUrl} className="mb-4 rounded-2xl max-h-80 w-full object-cover shadow-lg border-2 border-white/10" alt="product" />}
                    <div className="whitespace-pre-wrap leading-relaxed font-medium">{m.text}</div>
                    <div className={`text-[9px] mt-2 opacity-40 font-mono flex items-center gap-1 ${m.type === 'in' ? 'justify-start' : 'justify-end'}`}>
                       <Clock size={10}/> {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) : 'עכשיו'}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isThinking && (
                <div className="self-end bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl flex items-center gap-4 border border-emerald-500/20">
                  <Activity size={18} className="animate-spin" />
                  <span className="text-xs font-black uppercase">JONI AI IS THINKING...</span>
                </div>
              )}
            </div>

            <footer className={`p-8 border-t z-20 ${sideBg}`}>
              <div className={`flex items-center gap-4 p-4 rounded-[2.5rem] border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200 shadow-inner'}`}>
                 <button className="p-3 text-slate-500 hover:text-emerald-500 transition-all"><ImageIcon size={26}/></button>
                 <input 
                   type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && sendMessage()}
                   placeholder="הקש הודעה למנהל הפרויקט..."
                   className="flex-1 bg-transparent border-none outline-none text-sm px-2 font-bold"
                 />
                 <button onClick={sendMessage} className="w-14 h-14 bg-emerald-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-90 transition-all">
                    <Send size={24} className="transform rotate-180" />
                 </button>
              </div>
            </footer>
          </div>
        ) : activeTab === 'FLOW' ? (
          <div className="flex-1 overflow-y-auto p-12">
             <header className="flex justify-between items-center mb-10">
                <div>
                   <h1 className="text-4xl font-black italic tracking-tighter">BUILDER <span className="text-blue-500">PRO</span></h1>
                   <p className="text-sm font-bold opacity-60">ניהול עץ הענפים והזרקת DNA למערכת</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setNodes([...nodes, {id: `BNCH_${Date.now()}`, title: 'ענף חדש', trigger: '', prompt: ''}])} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all"><Plus size={20}/> ענף חדש</button>
                   <button onClick={async () => { setIsSaving(true); await setDoc(doc(dbFS, 'system', 'bot_flow_config'), {nodes, globalDNA}, {merge: true}); setIsSaving(false); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 transition-all">{isSaving ? <Activity className="animate-spin"/> : <><Save size={20}/> שמור הכל</>}</button>
                </div>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {nodes.map(node => (
                  <div key={node.id} className={`p-8 rounded-[2.5rem] border relative group hover:shadow-2xl transition-all ${itemBg}`}>
                    <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} className="absolute -left-2 -top-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 z-10"><Trash2 size={16}/></button>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black opacity-50 uppercase tracking-widest">שם הענף</label>
                          <input value={node.title} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, title: e.target.value} : n))} className={`w-full p-4 rounded-xl text-xs font-black outline-none ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-white border-slate-200'}`} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black opacity-50 uppercase tracking-widest">פקודת טריגר</label>
                          <input value={node.trigger} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, trigger: e.target.value} : n))} className={`w-full p-4 rounded-xl text-xs font-mono text-blue-500 outline-none ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-white border-slate-200'}`} placeholder="למשל: 1" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black opacity-50 uppercase tracking-widest">הוראת DNA</label>
                       <textarea value={node.prompt} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, prompt: e.target.value} : n))} className={`w-full h-32 p-4 rounded-xl text-[11px] leading-relaxed resize-none outline-none ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-white border-slate-200'}`} placeholder="מה ה-AI עונה כאן..." />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center gap-6 opacity-20">
             <MessageCircle size={150} />
             <h2 className="text-5xl font-black italic tracking-tighter uppercase">SABAN HUB COMMAND</h2>
          </div>
        )}
      </main>

      {/* --- 4. עמודה שמאלית: כרטיס ניהול פרויקט (CRM) --- */}
      {!isMobile && selectedCustomer && (activeTab === 'GROUP_HUB' || activeTab === 'SIMULATOR') && (
        <aside className={`w-[450px] flex flex-col border-r shrink-0 z-20 shadow-2xl ${sideBg}`}>
          <header className="p-8 border-b border-inherit bg-blue-600/5 flex justify-between items-center">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-3">
                <UserCog size={22} className="text-blue-500"/> כרטיס ניהול פרויקט
             </h2>
             <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">SABAN UNIFIED</div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
             <div className="flex flex-col items-center gap-6 pb-8 border-b border-white/5">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 overflow-hidden shadow-2xl border-4 border-emerald-500/30 relative group">
                   <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                   <button onClick={() => { const p = prompt("לינק לתמונה:"); if(p) setEditCrm({...editCrm, photo: p}); }} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] font-black uppercase">החלף תמונה</button>
                </div>
                <div className="text-center space-y-1">
                   <h3 className="text-2xl font-black italic tracking-tight">{editCrm.contactName || selectedCustomer.name}</h3>
                   <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase border border-emerald-500/20">זהות מאוחדת (קבוצה+פרטי)</span>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> מספר לקוח בקומקס</label>
                   <input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5 focus:border-emerald-500' : 'bg-white border-slate-200'}`} placeholder="10045" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building size={14}/> שם פרויקט / חברה</label>
                   <input value={editCrm.projectName} onChange={e => setEditCrm({...editCrm, projectName: e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5 focus:border-emerald-500' : 'bg-white border-slate-200'}`} placeholder="אורניל-מהלה" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> כתובת מדויקת לאספקה</label>
                   <input value={editCrm.projectAddress} onChange={e => setEditCrm({...editCrm, projectAddress: e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5 focus:border-emerald-500' : 'bg-white border-slate-200'}`} placeholder="הירקון 12, תל אביב" />
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
                <div className="flex items-center gap-2 mb-2"><Zap size={16}/> הנחיית מערכת:</div>
                כעת המערכת מאחדת היסטוריה מהקבוצות ומהפרטי לפי מזהה הטלפון הייחודי.
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

function MessageSquare({ size = 16, className = "" }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
}
