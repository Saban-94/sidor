import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy } from 'firebase/firestore';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { createClient } from '@supabase/supabase-js';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Clock, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserCog, HardHat, Building, 
  MapPin, Phone, CreditCard, Power, X, Search, UserCheck, Truck, Crown, PackageSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- אתחול תשתיות (Firebase + Supabase) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/"
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);
const dbRT = getDatabase(app);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

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
  const [editCrm, setEditCrm] = useState<any>({ comaxId: '', projectName: '', projectAddress: '', contactName: '', contactPhone: '', photo: '' });
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- אפקטים וטעינת מידע ---
  useEffect(() => {
    document.title = "Saban HUB | Unified Command";
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);

    // 1. טעינת לקוחות מאוחדים
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), limit(100)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unified = raw.reduce((acc: any[], curr: any) => {
        const phone = curr.id.replace(/\D/g, '').slice(-9);
        if (!acc.find(i => i.id.includes(phone))) acc.push(curr);
        return acc;
      }, []);
      setCustomers(unified);
    });

    // 2. טעינת מלאי (Supabase)
    const fetchInv = async () => {
      const { data } = await supabase.from('inventory').select('*');
      if (data) setInventory(data);
    };
    fetchInv();

    // 3. טעינת סידור עבודה
    const fetchDispatch = async () => {
      const { data } = await supabase.from('saban_dispatch').select('*').limit(20);
      if (data) setDispatch(data);
    };
    fetchDispatch();

    // 4. טעינת הגדרות AI
    onSnapshot(doc(dbFS, 'system', 'bot_flow_config'), (snap) => {
      if (snap.exists()) {
        setNodes(snap.data().nodes || []);
        setGlobalDNA(snap.data().globalDNA || '');
      }
    });

    return () => {
      window.removeEventListener('resize', checkSize);
      unsubCust();
    };
  }, []);

  // טעינת היסטוריית צ'אט
  useEffect(() => {
    if (!selectedCustomer) return;
    setEditCrm({ comaxId: selectedCustomer.comaxId || '', projectName: selectedCustomer.projectName || '', projectAddress: selectedCustomer.projectAddress || '', contactName: selectedCustomer.name || '', contactPhone: selectedCustomer.id || '', photo: selectedCustomer.photo || '' });
    const q = query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedCustomer]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  // --- פונקציות ביצוע ---
  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    setChatInput('');
    await push(ref(dbRT, 'saban94/outgoing'), { number: selectedCustomer.id, message: txt, timestamp: Date.now() });
    await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), { text: txt, type: 'out', timestamp: serverTimestamp() });
    if (isAiActive) {
      setIsThinking(true);
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: txt, senderPhone: selectedCustomer.id, state: 'MENU' }) });
      const data = await res.json();
      if (data.reply) await push(ref(dbRT, 'saban94/outgoing'), { number: selectedCustomer.id, message: data.reply, timestamp: Date.now() });
      setIsThinking(false);
    }
  };

  // --- עיצוב ---
  const containerClass = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sidebarClass = theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl';
  const inputClass = theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200 shadow-inner';

  if (isPrinting) return (
    <div className="bg-white p-12 text-black font-serif min-h-screen" dir="rtl">
        <div className="max-w-4xl mx-auto border-[4px] border-black p-8">
          <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
            <h1 className="text-4xl font-black italic">ח. סבן - הזמנה דיגיטלית</h1>
            <img src={BRAND_LOGO} className="w-24 h-24 border-2 border-black" />
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 border-2 border-black shadow-sm">
            <div><p className="text-xs font-black uppercase underline">פרויקט</p><p className="text-xl font-black">{editCrm.projectName}</p><p>{editCrm.projectAddress}</p></div>
            <div className="text-left"><p className="text-xs font-black uppercase underline">לקוח</p><p className="text-lg font-bold">קומקס: {editCrm.comaxId}</p><p>{editCrm.contactName}</p></div>
          </div>
          <div className="border-2 border-black min-h-[400px]">
            <div className="bg-black text-white p-2 flex justify-between font-bold"><span>פריט מהשיחה</span><span>כמות</span></div>
            <div className="p-4 space-y-4">{messages.filter(m => m.type === 'in' && m.text.length > 5).map((m, i) => (<div key={i} className="flex justify-between border-b border-dotted border-black pb-2"><span>{m.text}</span><span className="w-32 text-center border-b border-black"></span></div>))}</div>
          </div>
          <div className="mt-8 grid grid-cols-4 gap-3">{messages.filter(m => m.mediaUrl).map((m, i) => (<img key={i} src={m.mediaUrl} className="border-2 border-black aspect-square object-cover" />))}</div>
          <div className="mt-12 flex justify-between pt-8 border-t-2 border-black italic"><p>חתימת מנהל (תחסין): ________________</p><p>Saban Operational Hub</p></div>
        </div>
        <div className="fixed bottom-8 left-8 flex gap-4 no-print"><button onClick={() => setIsPrinting(false)} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold">ביטול</button><button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2"><Printer size={20}/> הדפס</button></div>
    </div>
  );

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-all duration-500 ${containerClass}`} dir="rtl">
      
      {/* --- 1. סרגל ניווט ראשי (Sidebar מבוסס תמונה) --- */}
      {!isMobile && (
        <aside className={`w-24 flex flex-col items-center py-10 border-l gap-10 shrink-0 z-40 ${sidebarClass}`}>
          <div className="w-16 h-16 bg-emerald-500 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 active:scale-95 transition-transform cursor-pointer">
            <Bot className="text-white" size={32} />
          </div>
          
          <nav className="flex flex-col gap-6 flex-1">
            {[
              { id: 'HUB', icon: Users, label: 'הזמנות קבוצה' },
              { id: 'CRM', icon: BrainCircuit, label: 'אימון DNA' },
              { id: 'DISPATCH', icon: Truck, label: 'סידור עבודה' },
              { id: 'FLOW', icon: GitBranch, label: 'עץ ה-AI' },
              { id: 'INVENTORY', icon: PackageSearch, label: 'מלאי טכני' },
              { id: 'MASTER', icon: Crown, label: 'פקודות מאסטר' }
            ].map((btn: any) => (
              <button 
                key={btn.id} onClick={() => setActiveTab(btn.id)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative group ${activeTab === btn.id ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
              >
                <btn.icon size={26} />
                <span className="absolute right-20 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{btn.label}</span>
              </button>
            ))}
          </nav>

          <button onClick={toggleTheme} className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10 transition-all">
            {theme === 'dark' ? <Sun size={26} /> : <Moon size={26} />}
          </button>
        </aside>
      )}

      {/* --- 2. תפריט רשימה משני (Customers / Inventory / Orders) --- */}
      {!isMobile && (activeTab === 'HUB' || activeTab === 'CRM' || activeTab === 'INVENTORY') && (
        <aside className={`w-85 flex flex-col border-l shrink-0 z-30 ${sidebarClass}`}>
          <header className="p-7 border-b border-inherit flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    {activeTab === 'INVENTORY' ? <PackageSearch size={18} className="text-amber-500"/> : <MessageCircle size={18} className="text-emerald-500"/>}
                    {activeTab === 'INVENTORY' ? 'ניהול מלאי ו-DNA' : 'צ\'אט והזמנות'}
                </h2>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-black animate-pulse uppercase tracking-tighter">Live System</span>
            </div>
            <div className={`relative ${inputClass} rounded-xl overflow-hidden`}>
                <Search className="absolute right-3 top-2.5 text-slate-500" size={16}/>
                <input type="text" placeholder="חיפוש מהיר..." className="w-full bg-transparent p-2.5 pr-10 text-xs border-none outline-none" />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {activeTab === 'INVENTORY' ? (
               inventory.map(p => (
                <button key={p.sku} onClick={() => setActiveTab('INVENTORY')} className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all border border-transparent hover:bg-white/5 hover:border-amber-500/20">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-amber-500 font-bold border border-white/5">{p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded-lg"/> : p.sku}</div>
                    <div className="text-right flex-1 overflow-hidden"><div className="text-sm font-black truncate">{p.product_name}</div><div className="text-[10px] opacity-40 font-mono">₪{p.price}</div></div>
                </button>
               ))
            ) : (
                customers.map(c => (
                    <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm relative overflow-hidden border-2 ${selectedCustomer?.id === c.id ? 'border-emerald-500' : 'border-white/5 bg-slate-800 text-slate-400'}`}>
                        {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : (c.name ? c.name[0] : '?')}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0f172a] rounded-full"></div>
                      </div>
                      <div className="text-right flex-1 overflow-hidden"><div className="text-sm font-black truncate">{c.projectName || c.name || "אורח"}</div><div className="text-[10px] opacity-40 font-mono truncate">{c.id}</div></div>
                    </button>
                  ))
            )}
          </div>
        </aside>
      )}

      {/* --- 3. אזור העבודה המרכזי (צ'אט / פלואו / סידור) --- */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        
        {activeTab === 'HUB' && selectedCustomer ? (
            /* --- מצב HUB: ניהול הזמנות חיות --- */
            <div className="flex-1 flex flex-col h-full">
                <header className={`h-22 flex items-center justify-between px-10 border-b z-20 ${sidebarClass}`}>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl overflow-hidden shadow-2xl relative group">
                            <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><UserCog size={18} className="text-white"/></div>
                        </div>
                        <div>
                            <h2 className="font-black text-xl italic tracking-tighter leading-none">{editCrm.projectName || selectedCustomer.name}</h2>
                            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {selectedCustomer.id} | JONI UNIFIED PIPE
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsAiActive(!isAiActive)} className={`flex items-center gap-3 px-6 py-2.5 rounded-[1.2rem] font-black text-xs transition-all border-2 ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-slate-500/10 text-slate-500'}`}><Power size={18} /> {isAiActive ? 'AI מענה דולק' : 'AI במצב המתנה'}</button>
                        <button onClick={() => setIsPrinting(true)} className="p-3.5 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600/20 transition-all border border-blue-600/20 shadow-lg"><Printer size={24} /></button>
                    </div>
                </header>

                <div ref={scrollRef} className={`flex-1 overflow-y-auto p-10 flex flex-col gap-8 scroll-smooth no-scrollbar ${chatAreaBg}`}>
                    {messages.map((m, i) => (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col max-w-[75%] ${m.type === 'in' ? 'self-start' : 'self-end items-end'}`}>
                            <div className={`p-5 rounded-[2rem] shadow-2xl text-[13px] relative border ${m.type === 'in' ? (theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-200 rounded-tr-none' : 'bg-white border-slate-100 text-slate-800 rounded-tr-none') : 'bg-emerald-600 text-white border-emerald-500 rounded-tl-none'}`}>
                                {m.mediaUrl && <img src={m.mediaUrl} className="mb-4 rounded-2xl max-h-80 w-full object-cover shadow-lg" />}
                                <div className="whitespace-pre-wrap leading-relaxed font-medium">{m.text}</div>
                                <div className={`text-[9px] mt-3 opacity-40 font-mono flex items-center gap-1 ${m.type === 'in' ? 'justify-start' : 'justify-end'}`}><Clock size={10} /> {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL') : 'עתה'}</div>
                            </div>
                        </motion.div>
                    ))}
                    {isThinking && <div className="self-end bg-emerald-500/10 text-emerald-400 p-4 rounded-[1.5rem] flex items-center gap-4 border border-emerald-500/20 animate-pulse"><Activity size={20} className="animate-spin" /><span className="text-xs font-black uppercase">JONI AI FORMULATING...</span></div>}
                </div>

                <footer className={`p-8 border-t z-20 ${sidebarClass}`}>
                    <div className={`flex items-center gap-4 p-4 rounded-[2.2rem] border transition-all ${inputClass}`}>
                        <button className="p-3 text-slate-500 hover:text-emerald-500 transition-all hover:scale-110"><ImageIcon size={26}/></button>
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="הקש הודעה לניהול פרויקט..." className="flex-1 bg-transparent border-none outline-none text-sm px-3 font-bold placeholder:text-slate-500" />
                        <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-white rounded-[1.6rem] flex items-center justify-center shadow-xl active:scale-90 transition-all"><Send size={24} className="transform rotate-180" /></button>
                    </div>
                </footer>
            </div>
        ) : activeTab === 'FLOW' ? (
            /* --- מצב FLOW: עורך ענפי ה-AI --- */
            <div className="flex-1 overflow-y-auto p-12 flex flex-col gap-10">
                <header className="flex justify-between items-center">
                    <div><h1 className="text-4xl font-black italic tracking-tighter">AI BRANCH <span className="text-blue-500 uppercase">Builder</span></h1><p className="text-sm font-bold opacity-60">עיצוב עץ התפריטים והזרקת פקודות DNA למוח המרכזי</p></div>
                    <div className="flex gap-4"><button onClick={() => setNodes([...nodes, { id: `BNCH_${Date.now()}`, title: 'ענף חדש', trigger: '', prompt: '' }])} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"><Plus size={20}/> ענף חדש</button><button onClick={async () => { setIsSaving(true); await setDoc(doc(dbFS, 'system', 'bot_flow_config'), { nodes, globalDNA }, { merge: true }); setTimeout(()=>setIsSaving(false), 800); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 transition-all">{isSaving ? <Activity className="animate-spin"/> : <><Save size={20}/> שמור עץ LIVE</>}</button></div>
                </header>
                <div className={`p-8 rounded-[2.5rem] border ${sidebarClass} bg-blue-500/5`}><label className="text-xs font-black uppercase text-blue-500 mb-3 block tracking-[0.2em]">DNA גלובלי (אישיות ראמי)</label><textarea value={globalDNA} onChange={e => setGlobalDNA(e.target.value)} className={`w-full h-32 p-5 rounded-2xl text-sm outline-none focus:border-blue-500 leading-relaxed transition-all ${inputClass}`} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{nodes.map(node => (
                    <div key={node.id} className={`p-8 rounded-[2.5rem] border relative group hover:shadow-2xl transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}><button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} className="absolute -left-2 -top-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 z-10"><Trash2 size={16}/></button><div className="grid grid-cols-2 gap-6 mb-6"><div><label className="text-[10px] font-black opacity-50 uppercase tracking-widest block mb-1">שם הענף</label><input value={node.title} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, title: e.target.value} : n))} className={`w-full p-4 rounded-xl text-xs font-black outline-none ${inputClass}`} /></div><div><label className="text-[10px] font-black opacity-50 uppercase tracking-widest block mb-1">טריגר (1, 2, 3)</label><input value={node.trigger} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, trigger: e.target.value} : n))} className={`w-full p-4 rounded-xl text-xs font-mono text-blue-400 outline-none ${inputClass}`} /></div></div><div className="space-y-1"><label className="text-[10px] font-black opacity-50 uppercase tracking-widest">פקודת DNA לענף זה</label><textarea value={node.prompt} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, prompt: e.target.value} : n))} className={`w-full h-32 p-4 rounded-xl text-[11px] leading-relaxed resize-none outline-none ${inputClass}`} /></div></div>
                ))}</div>
            </div>
        ) : activeTab === 'DISPATCH' ? (
            /* --- מצב DISPATCH: סידור עבודה חי --- */
            <div className="flex-1 overflow-y-auto p-12 flex flex-col gap-10">
                <header className="flex justify-between items-center"><div><h1 className="text-4xl font-black italic tracking-tighter uppercase">Dispatch <span className="text-orange-500">Center</span></h1><p className="text-sm font-bold opacity-60">מעקב הובלות וציוד קצה בזמן אמת</p></div><div className="bg-orange-500/10 text-orange-500 px-6 py-2 rounded-full font-black text-xs animate-pulse">ACTIVE LIVE SYNC</div></header>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{['חכמת', 'עלי'].map(driver => (
                    <div key={driver} className={`p-8 rounded-[3rem] border ${sidebarClass}`}><div className="flex items-center gap-6 mb-8"><div className="w-20 h-20 bg-slate-800 rounded-3xl overflow-hidden border-4 border-orange-500/20 shadow-2xl"><img src={driver === 'חכמת' ? 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' : 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'} className="w-full h-full object-cover" /></div><div><h3 className="text-2xl font-black text-slate-100">{driver}</h3><p className="text-xs font-bold text-orange-500 uppercase tracking-widest">{driver === 'חכמת' ? 'משאית מנוף 🏗️' : 'פריקה ידנית 🚚'}</p></div></div><div className="space-y-4">{dispatch.filter(o => o.driver_name === driver).map(order => (
                        <div key={order.id} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'} flex justify-between items-center`}><div className="space-y-1"><div className="text-sm font-black">{order.customer_name}</div><div className="flex items-center gap-2 text-[10px] opacity-60 font-bold"><MapPin size={12}/> {order.address}</div></div><div className="text-left"><div className="text-[10px] font-mono font-black bg-orange-500/10 text-orange-500 px-2 py-1 rounded mb-2">{order.scheduled_time?.slice(0,5) || '10:00'}</div><div className="text-[8px] font-bold opacity-40 uppercase">{order.warehouse_source}</div></div></div>
                    ))}</div></div>
                ))}</div>
            </div>
        ) : (
            <div className="m-auto flex flex-col items-center gap-8 opacity-20"><div className="relative"><MessageCircle size={150} /><Bot size={50} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500" /></div><h2 className="text-5xl font-black italic tracking-tighter uppercase text-center leading-tight">SABAN HUB<br/>COMMAND CENTER</h2><p className="text-sm font-bold tracking-[0.5em] text-center">INTERFACE UNIFIED BY MASTER RAMI</p></div>
        )}
      </main>

      {/* --- 4. עמודה שמאלית: כרטיס CRM / אימון DNA (נראה במחשב) --- */}
      {!isMobile && selectedCustomer && (activeTab === 'HUB' || activeTab === 'CRM') && (
        <aside className={`w-[450px] flex flex-col border-r shrink-0 z-20 shadow-2xl ${sidebarClass}`}>
          <header className="p-8 border-b border-inherit bg-blue-600/5 flex justify-between items-center"><h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-3"><UserCog size={22} className="text-blue-500"/> כרטיס ניהול פרויקט</h2><div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">SABAN UNIFIED</div></header>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
             <div className="flex flex-col items-center gap-6 pb-8 border-b border-white/5"><div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 overflow-hidden shadow-2xl border-4 border-emerald-500/30 relative group"><img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" /><button onClick={()=>{const p=prompt("קישור:");if(p)setEditCrm({...editCrm,photo:p})}} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] font-black uppercase">החלף תמונה</button></div><div className="text-center space-y-1"><h3 className="text-2xl font-black italic tracking-tight">{editCrm.contactName || selectedCustomer.name}</h3><span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase border border-emerald-500/20">זהות מאוחדת (Master)</span></div></div>
             <div className="space-y-6">
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> מספר לקוח בקומקס</label><input value={editCrm.comaxId} onChange={e=>setEditCrm({...editCrm,comaxId:e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${inputClass}`} /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building size={14}/> שם פרויקט / חברה</label><input value={editCrm.projectName} onChange={e=>setEditCrm({...editCrm,projectName:e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${inputClass}`} /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> כתובת אספקה</label><input value={editCrm.projectAddress} onChange={e=>setEditCrm({...editCrm,projectAddress:e.target.value})} className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${inputClass}`} /></div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCog size={14}/> איש קשר</label><input value={editCrm.contactName} onChange={e=>setEditCrm({...editCrm,contactName:e.target.value})} className={`w-full p-4 rounded-2xl text-xs font-black outline-none border ${inputClass}`} /></div><div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Phone size={14}/> נייד</label><input value={editCrm.contactPhone} onChange={e=>setEditCrm({...editCrm,contactPhone:e.target.value})} className={`w-full p-4 rounded-2xl text-xs font-mono outline-none border ${inputClass}`} /></div></div>
             </div>
             <button onClick={saveCrm} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 mt-4">{isSaving ? <Activity className="animate-spin"/> : <><Save size={20}/> שמור וסנכרן כרטיס</>}</button>
             <div className="p-5 rounded-[2rem] border-2 border-dashed border-amber-500/30 bg-amber-500/5 text-amber-600 text-xs font-black leading-relaxed shadow-inner"><div className="flex items-center gap-2 mb-2"><Zap size={16}/> הזרקת DNA:</div>נתונים אלה מוזרקים אוטומטית לטופס ההזמנה של תחסין (מנהל הפרויקט) בכל הדפסה.</div>
          </div>
        </aside>
      )}

      {/* רקע אורות אמביינט */}
      {theme === 'dark' && <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"><div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]"></div><div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]"></div></div>}
    </div>
  );
}

// קומפוננטות עזר
const chatAreaBg = "bg-[#020617]";
function MessageSquare({ size = 16, className = "" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
