import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy } from 'firebase/firestore';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Clock, Play, Sun, Moon,
  GitBranch, Terminal, Users, Printer, UserEdit, HardHat, Building, 
  MapPin, Phone, CreditCard, Power
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
  // --- States ניהול מערכת ---
  const [activeTab, setActiveTab] = useState<'GROUP_HUB' | 'SIMULATOR' | 'FLOW' | 'DNA'>('GROUP_HUB');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);

  // --- States נתונים ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  
  // --- States הזמנה ו-CRM ---
  const [isAiActive, setIsAiActive] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [editCrm, setEditCrm] = useState<any>({
    comaxId: '',
    projectName: '',
    projectAddress: '',
    contactName: '',
    contactPhone: '',
    photo: ''
  });

  // --- States צ'אט וסימולציה ---
  const [simMessages, setSimMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    document.title = "Saban OS | Unified Hub";
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // טעינת לקוחות/משתמשים מהקבוצה
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), limit(100)), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // האזנה להודעות הקבוצה בזמן אמת מהצינור הראשי (RTDB)
    const incomingRef = ref(dbRT, 'saban94/incoming');
    onValue(incomingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
        setGroupMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    const unsubFlow = onSnapshot(doc(dbFS, 'system', 'bot_flow_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      unsubCust();
      unsubFlow();
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setEditCrm({
        comaxId: selectedCustomer.comaxId || '',
        projectName: selectedCustomer.projectName || '',
        projectAddress: selectedCustomer.projectAddress || '',
        contactName: selectedCustomer.name || '',
        contactPhone: selectedCustomer.id || '',
        photo: selectedCustomer.photo || ''
      });
      // טעינת היסטוריה מה-Firestore עבור הלקוח הספציפי
      const q = query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc'));
      onSnapshot(q, (snap) => {
        setSimMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [simMessages, groupMessages, isThinking]);

  // --- לוגיקה ---
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const sendLiveMessage = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const msg = chatInput.trim();
    setChatInput('');

    // שליחה לצינור JONI
    await push(ref(dbRT, 'saban94/outgoing'), {
      number: selectedCustomer.id,
      message: msg,
      timestamp: Date.now()
    });

    // תיעוד ב-Firestore
    await setDoc(doc(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history')), {
      text: msg,
      type: 'out',
      timestamp: serverTimestamp()
    });

    if (isAiActive) {
        triggerSimulation(); // אם ה-AI פעיל, הוא מגיב
    }
  };

  const saveCustomerCard = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    await setDoc(doc(dbFS, 'customers', selectedCustomer.id), {
      ...editCrm,
      name: editCrm.contactName,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    setTimeout(() => setIsSaving(false), 800);
  };

  const triggerSimulation = async () => {
    setIsThinking(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          name: selectedCustomer?.name || 'אורח',
          senderPhone: selectedCustomer?.id,
          state: 'MENU'
        })
      });
      const data = await res.json();
      // שמירת תשובת ה-AI בצינור
      await push(ref(dbRT, 'saban94/outgoing'), {
        number: selectedCustomer.id,
        message: data.reply,
        timestamp: Date.now()
      });
    } catch (e) { console.error(e); }
    finally { setIsThinking(false); }
  };

  // --- רכיבי עיצוב ---
  const containerClass = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sidebarClass = theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200';
  const cardClass = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm';
  const inputBg = theme === 'dark' ? 'bg-black/40' : 'bg-white shadow-inner';

  // --- תצוגת הדפסה (הזמנה) ---
  if (isPrinting) {
    return (
      <div className="bg-white p-12 text-black font-serif h-screen overflow-auto" dir="rtl">
        <div className="max-w-4xl mx-auto border-4 border-black p-8">
            <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-6">
                <div>
                    <h1 className="text-4xl font-black italic">ח. סבן - חומרי בניין</h1>
                    <p className="text-lg font-bold">הזמנת עבודה דיגיטלית - {new Date().toLocaleDateString('he-IL')}</p>
                </div>
                <img src={BRAND_LOGO} className="w-24 h-24" alt="logo" />
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-100 p-4 border-2 border-black">
                <div>
                    <p className="font-bold">שם לקוח / פרויקט:</p>
                    <p className="text-xl">{editCrm.projectName || selectedCustomer?.name}</p>
                    <p className="font-bold mt-2">כתובת אספקה:</p>
                    <p>{editCrm.projectAddress}</p>
                </div>
                <div className="text-left">
                    <p className="font-bold">מספר לקוח (קומקס):</p>
                    <p>{editCrm.comaxId || '---'}</p>
                    <p className="font-bold mt-2">איש קשר:</p>
                    <p>{editCrm.contactName} ({editCrm.contactPhone})</p>
                </div>
            </div>

            <div className="border-2 border-black min-h-[400px]">
                <div className="bg-black text-white p-2 flex justify-between font-bold">
                    <span>תיאור המוצרים מהשיחה</span>
                    <span>כמות</span>
                </div>
                <div className="p-4 space-y-4">
                    {simMessages.filter(m => m.type === 'in' && m.text.length > 5).map((m, i) => (
                        <div key={i} className="flex justify-between border-b border-dotted border-black pb-2">
                            <span className="flex-1">{m.text}</span>
                            <span className="w-20 text-center">___</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
                {simMessages.filter(m => m.mediaUrl).map((m, i) => (
                    <div key={i} className="border border-black p-1">
                        <img src={m.mediaUrl} className="w-full h-32 object-cover" alt="product" />
                    </div>
                ))}
            </div>

            <div className="mt-12 pt-8 border-t-2 border-black flex justify-between italic text-sm">
                <span>חתימת מנהל פרויקט: _________________</span>
                <span>מאושר ע"י ראמי - מערכת SABAN OS</span>
            </div>
        </div>
        <button onClick={() => setIsPrinting(false)} className="fixed bottom-8 left-8 bg-black text-white px-6 py-3 rounded-full no-print">חזור לממשק</button>
        <button onClick={() => window.print()} className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-full no-print">הדפס עכשיו</button>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${containerClass}`} dir="rtl">
      
      {/* 1. סרגל ניווט ראשי (Desktop/Tablet) */}
      {!isMobile && (
        <aside className={`w-20 flex flex-col items-center py-8 border-l gap-8 shrink-0 z-30 ${sidebarClass}`}>
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="text-white" size={24} />
          </div>
          
          <nav className="flex flex-col gap-4">
            {[
              { id: 'GROUP_HUB', icon: Users, label: 'הזמנות קבוצה' },
              { id: 'SIMULATOR', icon: Smartphone, label: 'סימולטור' },
              { id: 'DNA', icon: BrainCircuit, label: 'אימון DNA' },
              { id: 'FLOW', icon: GitBranch, label: 'ענפי שיחה' }
            ].map((btn: any) => (
              <button 
                key={btn.id} onClick={() => setActiveTab(btn.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === btn.id ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:bg-emerald-500/10'}`}
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

      {/* 2. רשימת צ'אט הקבוצה בזמן אמת */}
      {(activeTab === 'GROUP_HUB' || activeTab === 'SIMULATOR') && (
        <aside className={`w-80 flex flex-col border-l shrink-0 z-20 ${sidebarClass}`}>
          <header className="p-6 border-b border-inherit bg-slate-900/5">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-400"/> הזמנות ללקוחות ח.סבן
             </h2>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {customers.map(c => (
              <button 
                key={c.id} onClick={() => setSelectedCustomer(c)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs relative ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-emerald-600'}`}>
                  {c.photo ? <img src={c.photo} className="w-full h-full rounded-full object-cover" /> : (c.name ? c.name[0] : '?')}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0f172a] rounded-full"></div>
                </div>
                <div className="text-right flex-1 overflow-hidden">
                   <div className="text-sm font-black truncate">{c.name || 'אורח'}</div>
                   <div className="text-[10px] opacity-50 font-mono">{c.id}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* 3. אזור העבודה המרכזי: צ'אט חי וניהול פנייה */}
      <main className="flex-1 relative flex flex-col bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        
        {selectedCustomer ? (
            <div className="flex-1 flex flex-col h-full">
                {/* Header עם כפתור AI */}
                <header className={`h-20 flex items-center justify-between px-8 border-b z-20 ${sidebarClass}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full overflow-hidden shadow-lg">
                            <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="p" />
                        </div>
                        <div>
                            <h2 className="font-black text-lg leading-none">{editCrm.projectName || selectedCustomer.name}</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{selectedCustomer.id} | מחובר לצינור JONI</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsAiActive(!isAiActive)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all ${isAiActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-500/10 text-slate-500'}`}
                        >
                            <Power size={16} /> {isAiActive ? 'AI מענה אוטומטי פעיל' : 'AI כבוי (מענה ידני)'}
                        </button>
                        <button onClick={() => setIsPrinting(true)} className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-all" title="הפק הזמנה להדפסה">
                            <Printer size={20} />
                        </button>
                    </div>
                </header>

                {/* תוכן הצ'אט */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 scroll-smooth">
                    {simMessages.map((m, i) => (
                        <motion.div 
                            initial={{ opacity: 0, x: m.type === 'in' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                            key={i} className={`flex flex-col max-w-[70%] ${m.type === 'in' ? 'self-start' : 'self-end'}`}
                        >
                            <div className={`p-4 rounded-2xl shadow-xl text-sm relative ${m.type === 'in' ? (theme === 'dark' ? 'bg-white/5 border border-white/10 text-slate-200 rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tr-none') : 'bg-emerald-600 text-white rounded-tl-none'}`}>
                                {m.mediaUrl && <img src={m.mediaUrl} className="mb-3 rounded-xl max-h-60 w-full object-cover" alt="product" />}
                                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                                <div className="text-[9px] mt-2 opacity-40 font-mono text-left">{new Date(m.timestamp?.seconds * 1000).toLocaleTimeString('he-IL')}</div>
                            </div>
                        </motion.div>
                    ))}
                    {isThinking && (
                        <div className="self-end bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl flex items-center gap-3 border border-emerald-500/20">
                            <Activity size={16} className="animate-spin" />
                            <span className="text-xs font-bold">המוח מנסח מענה אוטומטי...</span>
                        </div>
                    )}
                </div>

                {/* שורת קלט - מחוברת ל-JONI */}
                <footer className={`p-6 border-t z-20 ${sidebarClass}`}>
                    <div className={`flex items-center gap-3 p-3 rounded-3xl border transition-all ${inputBg} ${theme === 'dark' ? 'border-white/5' : 'border-slate-200 shadow-inner'}`}>
                        <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><ImageIcon size={22}/></button>
                        <input 
                            type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendLiveMessage()}
                            placeholder="כתוב הודעה ללקוח (יישלח ישירות לווצאפ)..." 
                            className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                        />
                        <button onClick={sendLiveMessage} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                            <Send size={20} className="transform rotate-180" />
                        </button>
                    </div>
                </footer>
            </div>
        ) : (
            <div className="m-auto flex flex-col items-center gap-4 text-slate-400 opacity-20">
                <MessageSquare size={120} />
                <h2 className="text-3xl font-black">SABAN OS COMMAND</h2>
            </div>
        )}
      </main>

      {/* 4. עמודה שמאלית: עריכת כרטיס משתמש (CRM) */}
      {!isMobile && selectedCustomer && (
        <aside className={`w-[400px] flex flex-col border-r shrink-0 z-20 ${sidebarClass}`}>
          <header className="p-6 border-b border-inherit bg-blue-500/5">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <UserEdit size={16} className="text-blue-400"/> כרטיס לקוח / פרויקט
             </h2>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-white/5">
                <div className="w-24 h-24 rounded-3xl bg-slate-800 overflow-hidden shadow-2xl border-4 border-emerald-500/20 relative group">
                    <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" alt="avatar" />
                    <button className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] font-black uppercase">החלף תמונה</button>
                </div>
                <div className="text-center">
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">לקוח VIP - מנהל פרויקט</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><CreditCard size={12}/> מספר לקוח בקומקס</label>
                    <input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-bold outline-none border-inherit ${inputBg}`} placeholder="למשל: 10045" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Building size={12}/> שם פרויקט / חברה</label>
                    <input value={editCrm.projectName} onChange={e => setEditCrm({...editCrm, projectName: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-bold outline-none border-inherit ${inputBg}`} placeholder="למשל: אורניל-מהלה" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> כתובת פרויקט</label>
                    <input value={editCrm.projectAddress} onChange={e => setEditCrm({...editCrm, projectAddress: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-bold outline-none border-inherit ${inputBg}`} placeholder="למשל: הירקון 12, תל אביב" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Users size={12}/> איש קשר</label>
                        <input value={editCrm.contactName} onChange={e => setEditCrm({...editCrm, contactName: e.target.value})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border-inherit ${inputBg}`} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Phone size={12}/> נייד</label>
                        <input value={editCrm.contactPhone} onChange={e => setEditCrm({...editCrm, contactPhone: e.target.value})} className={`w-full p-3 rounded-xl text-xs font-mono outline-none border-inherit ${inputBg}`} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><ImageIcon size={12}/> לינק לתמונת פרופיל</label>
                    <input value={editCrm.photo} onChange={e => setEditCrm({...editCrm, photo: e.target.value})} className={`w-full p-3 rounded-xl text-[10px] font-mono outline-none border-inherit ${inputBg}`} placeholder="https://..." />
                </div>
            </div>

            <button 
                onClick={saveCustomerCard} disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            >
                {isSaving ? <Activity size={18} className="animate-spin"/> : <><Save size={18}/> עדכן כרטיס לקוח</>}
            </button>

            <div className="pt-6">
                <div className={`p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs font-bold leading-relaxed`}>
                    💡 טיפ מהמאסטר: הנתונים שאתה מזין כאן יוזרקו אוטומטית למסמך ההזמנה המעוצב שתפיק להדפסה.
                </div>
            </div>
          </div>
        </aside>
      )}

      {/* Floating Ambient Lights (Dark Mode Only) */}
      {theme === 'dark' && (activeTab !== 'GROUP_HUB') && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]"></div>
        </div>
      )}
    </div>
  );
}

// קומפוננטת אייקון עזר לשיתוף
function MessageSquare({ size = 16, className = "" }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
}
