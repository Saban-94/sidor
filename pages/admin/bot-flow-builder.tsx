import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp } from 'firebase/firestore';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, 
  BrainCircuit, Plus, Trash2, Settings, Clock, Play, Sun, Moon,
  LayoutDashboard, GitBranch, Terminal, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- אתחול Firebase ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);



export default function App() {
  // --- States ניהול מערכת ---
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'FLOW' | 'DNA'>('SIMULATOR');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);

  // --- States נתונים ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  
  // --- States סימולציה ---
  const [simMessages, setSimMessages] = useState<any[]>([]);
  const [simInput, setSimInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [dnaDraft, setDnaDraft] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    document.title = "Saban OS | Unified Hub";
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), limit(15)), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [simMessages, isThinking]);

  // --- לוגיקה ---
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const saveFlow = async () => {
    setIsSaving(true);
    await setDoc(doc(dbFS, 'system', 'bot_flow_config'), { nodes, globalDNA, lastUpdated: serverTimestamp() }, { merge: true });
    setTimeout(() => setIsSaving(false), 800);
  };

  const triggerSimulation = async (manualData: any = null) => {
    if (isThinking || (!simInput.trim() && !manualData)) return;
    const userText = manualData ? `[Action: ${manualData.type}]` : simInput.trim();
    if (!manualData) {
      setSimMessages(prev => [...prev, { role: 'user', text: userText }]);
      setSimInput('');
    }
    setIsThinking(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: manualData ? "" : userText,
          name: selectedCustomer?.name || 'אורח',
          senderPhone: selectedCustomer?.id || 'simulator',
          state: 'MENU',
          manualInjection: manualData || null
        })
      });
      const data = await res.json();
      setSimMessages(prev => [...prev, { 
        role: 'ai', text: data.reply, mediaUrl: data.mediaUrl, pdfUrl: data.pdfUrl, actionButton: data.actionButton 
      }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', text: '⚠️ שגיאת חיבור למוח' }]);
    } finally {
      setIsThinking(false);
    }
  };

  // --- רכיבי עיצוב ---
  const containerClass = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800';
  const sidebarClass = theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200';
  const cardClass = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm';
  const inputBg = theme === 'dark' ? 'bg-black/40' : 'bg-white shadow-inner';

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${containerClass}`} dir="rtl">
      
      {/* 1. סרגל ניווט ראשי (Desktop/Tablet) */}
      {!isMobile && (
        <aside className={`w-20 flex flex-col items-center py-8 border-l gap-8 shrink-0 z-30 ${sidebarClass}`}>
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="text-white" size={24} />
          </div>
          
          <nav className="flex flex-col gap-4">
            {[
              { id: 'SIMULATOR', icon: Smartphone, label: 'סימולטור' },
              { id: 'DNA', icon: BrainCircuit, label: 'אימון DNA' },
              { id: 'FLOW', icon: GitBranch, label: 'ענפי שיחה' }
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

      {/* 2. רשימת לקוחות ואימון DNA (נראה בטאבלט/מחשב) */}
      {!isMobile && (activeTab === 'SIMULATOR' || activeTab === 'DNA') && (
        <aside className={`w-80 flex flex-col border-l shrink-0 z-20 ${sidebarClass}`}>
          <header className="p-6 border-b border-inherit">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <Users size={16} className="text-emerald-400"/> בחר יעד לאימון
             </h2>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {customers.map(c => (
              <button 
                key={c.id} onClick={() => setSelectedCustomer(c)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-transparent border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-emerald-600'}`}>
                  {c.name ? c.name[0] : '?'}
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

      {/* 3. אזור העבודה המרכזי */}
      <main className="flex-1 relative flex flex-col items-center justify-center bg-transparent z-10" style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#1e293b 0.5px, transparent 0.5px)' : 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
        
        {/* PWA Mobile Header */}
        {isMobile && (
          <header className={`fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 border-b z-40 ${sidebarClass}`}>
            <h1 className="font-black italic text-emerald-500">SABAN HUB</h1>
            <div className="flex gap-2">
               <button onClick={() => setActiveTab('SIMULATOR')} className={`p-2 rounded-lg ${activeTab === 'SIMULATOR' ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400'}`}><Smartphone size={20}/></button>
               <button onClick={() => setActiveTab('FLOW')} className={`p-2 rounded-lg ${activeTab === 'FLOW' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400'}`}><GitBranch size={20}/></button>
               <button onClick={toggleTheme} className="p-2 text-slate-400">{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>
            </div>
          </header>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'SIMULATOR' || activeTab === 'DNA' ? (
            <motion.div 
              key="sim" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-[400px] h-[800px] max-h-[90vh] rounded-[3.5rem] border-[12px] shadow-2xl relative flex flex-col overflow-hidden transition-all ${theme === 'dark' ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-300'}`}
            >
               {/* Notch Area */}
               <div className={`${theme === 'dark' ? 'bg-[#1e293b]' : 'bg-slate-300'} h-8 w-full flex justify-center items-end shrink-0`}><div className={`w-28 h-5 rounded-b-2xl ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}></div></div>
               
               {/* Chat Header */}
               <header className={`p-4 border-b flex items-center gap-3 shrink-0 ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className="w-12 h-12 rounded-full bg-emerald-500 overflow-hidden shadow-lg border-2 border-white/10">
                    <img src={BRAND_LOGO} alt="AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-black">ראמי (JONI AI)</h2>
                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">LIVE SIMULATION</span></div>
                  </div>
               </header>

               <div ref={scrollRef} className={`flex-1 overflow-y-auto p-5 flex flex-col gap-5 scroll-smooth no-scrollbar ${theme === 'dark' ? 'bg-[#020617]' : 'bg-[#e5ddd5]'}`} style={theme !== 'dark' ? {backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'cover'} : {}}>
                  <AnimatePresence>
                    {simMessages.map((m, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i}
                        className={`max-w-[85%] p-4 rounded-2xl shadow-xl text-xs relative leading-relaxed ${m.role === 'ai' ? (theme === 'dark' ? 'bg-[#1e293b] text-slate-200 self-start rounded-tr-none border border-white/5' : 'bg-white text-slate-800 self-start rounded-tr-none border border-slate-100') : 'bg-emerald-600 text-white self-end rounded-tl-none'}`}
                      >
                        {m.mediaUrl && <img src={m.mediaUrl} className="mb-3 rounded-xl border border-white/10 shadow-lg max-h-48 w-full object-cover" alt="media" />}
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        {m.pdfUrl && <div className="mt-4 bg-black/20 p-2.5 rounded-xl flex items-center gap-3 border border-white/5 cursor-pointer"><FileText size={18} className="text-red-500"/><span className="text-[9px] font-bold">Price_List_Saban.pdf</span></div>}
                        {m.actionButton && <button className="w-full bg-white text-black font-black py-3 rounded-2xl mt-4 text-[11px] shadow-lg active:scale-95 transition-all">{m.actionButton.text}</button>}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isThinking && <div className="self-start bg-slate-800/50 p-3 rounded-2xl flex items-center gap-3 border border-white/5"><Cpu size={14} className="text-emerald-400 animate-spin"/><span className="text-[10px] font-bold text-slate-400">המוח מנתח ומעצב...</span></div>}
               </div>

               {/* Toolbar & Input */}
               <div className={`p-5 shrink-0 pb-10 border-t ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className={`flex items-center gap-2.5 p-2.5 rounded-[1.5rem] border focus-within:border-emerald-500/50 transition-all ${inputBg} ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
                    <input 
                      type="text" value={simInput} onChange={e => setSimInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && triggerSimulation()}
                      placeholder="כתוב שאלה מהלקוח..." className="flex-1 bg-transparent border-none outline-none text-[13px] px-2"
                    />
                    <button onClick={() => triggerSimulation()} className="w-11 h-11 bg-emerald-600 text-white rounded-[1.1rem] flex items-center justify-center shadow-lg active:scale-90 transition-all">
                      <Send size={20} className="transform rotate-180" />
                    </button>
                  </div>
               </div>
            </motion.div>
          ) : (
            /* 4. עורך ענפי שיחה (Flow Builder) */
            <motion.div 
              key="flow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-5xl h-full flex flex-col p-8 gap-8 overflow-y-auto mt-16 lg:mt-0"
            >
               <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-black italic tracking-tighter">BUILDER <span className="text-blue-500 uppercase">Pro</span></h1>
                    <p className="text-sm font-bold opacity-60">ניהול עץ הענפים והזרקת ה-DNA של המותג</p>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => setNodes([...nodes, { id: `BNCH_${Date.now()}`, title: 'ענף חדש', trigger: '', prompt: '' }])} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                        <Plus size={18}/> ענף חדש
                     </button>
                     <button onClick={saveFlow} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                        {isSaving ? <Activity size={18} className="animate-spin"/> : <><Save size={18}/> שמור עץ LIVE</>}
                     </button>
                  </div>
               </header>

               <div className={`p-6 rounded-[2.5rem] border ${cardClass}`}>
                  <label className="text-xs font-black uppercase text-blue-500 mb-3 block tracking-[0.2em]">DNA גלובלי של ראמי</label>
                  <textarea 
                    value={globalDNA} onChange={e => setGlobalDNA(e.target.value)}
                    className={`w-full h-32 p-5 rounded-2xl text-sm outline-none focus:border-blue-500 leading-relaxed transition-all ${inputBg} border-inherit`}
                    placeholder="אתה ראמי, המוח הלוגיסטי... דבר קצר ויוקרתי..."
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {nodes.map(node => (
                   <div key={node.id} className={`p-6 rounded-[2rem] border relative group transition-all hover:shadow-2xl ${cardClass}`}>
                      <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} className="absolute -left-2 -top-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"><Trash2 size={14}/></button>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className="space-y-1">
                            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">שם הענף</span>
                            <input value={node.title} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, title: e.target.value} : n))} className={`w-full p-3 rounded-xl text-xs font-black outline-none border-inherit ${inputBg}`} />
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">פקודה (Trigger)</span>
                            <input value={node.trigger} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, trigger: e.target.value} : n))} placeholder="למשל: 1" className={`w-full p-3 rounded-xl text-xs font-mono text-blue-400 outline-none border-inherit ${inputBg}`} />
                         </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">הוראת ה-DNA לענף זה</span>
                        <textarea 
                          value={node.prompt} onChange={e => setNodes(nodes.map(n => n.id === node.id ? {...n, prompt: e.target.value} : n))}
                          className={`w-full h-24 p-3 rounded-xl text-[11px] leading-relaxed outline-none border-inherit resize-none ${inputBg}`}
                          placeholder="מה ה-AI עונה בשלב זה..."
                        />
                      </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. עמודה שמאלית: אימון DNA וכלים (נראה רק במחשב) */}
      {!isMobile && activeTab !== 'FLOW' && (
        <aside className={`w-[400px] flex flex-col border-r shrink-0 z-20 ${sidebarClass}`}>
          <header className="p-6 border-b border-inherit">
             <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400"/> שרטוט DNA בזמן אמת
             </h2>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section className="space-y-4">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">הזרקת DNA אישית</label>
               <textarea 
                  value={dnaDraft} onChange={e => setDnaDraft(e.target.value)}
                  placeholder="כתוב פקודה ספציפית שהמוח יטמיע בשיחה הבאה..."
                  className={`w-full h-48 p-5 rounded-[1.5rem] text-sm outline-none focus:border-emerald-500/50 leading-relaxed shadow-inner border-inherit ${inputBg}`}
               />
               <button onClick={() => triggerSimulation({ type: 'DNA', reply: dnaDraft })} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Zap size={18}/> הזרק ואימן מוח
               </button>
            </section>

            <div className="h-px bg-white/5" />

            <section className="space-y-4">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">דיבוג אלמנטים יוקרתיים</label>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => triggerSimulation({ type: 'IMAGE', reply: "הנה כרטיס מוצר עם תמונה:" , mediaUrl: BRAND_LOGO })} className={`p-4 rounded-2xl text-[10px] font-black flex flex-col items-center gap-2 transition-all border border-inherit hover:border-emerald-500/30 ${cardClass}`}>
                    <ImageIcon size={20} className="text-blue-500" /> בדוק תמונה
                  </button>
                  <button onClick={() => triggerSimulation({ type: 'PDF', reply: "מצרף לך את המחירון ב-PDF:" , pdfUrl: "https://example.com" })} className={`p-4 rounded-2xl text-[10px] font-black flex flex-col items-center gap-2 transition-all border border-inherit hover:border-emerald-500/30 ${cardClass}`}>
                    <FileText size={20} className="text-red-500" /> בדוק PDF
                  </button>
                  <button onClick={() => triggerSimulation({ type: 'LINK', reply: "כנס להזמנה האישית שלך:" , actionButton: { text: "צפייה בהצעה 💎", link: "https://sidor.vercel.app/start" } })} className={`p-4 rounded-2xl text-[10px] font-black flex flex-col items-center gap-2 transition-all border border-inherit hover:border-emerald-500/30 col-span-2 ${cardClass}`}>
                    <LinkIcon size={20} className="text-amber-500" /> בדוק כפתור לינק קסם
                  </button>
               </div>
            </section>
          </div>
        </aside>
      )}

      {/* Floating Ambient Lights (Dark Mode Only) */}
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]"></div>
        </div>
      )}
    </div>
  );
}

// קומפוננטת אייקון עזר
function Users({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
