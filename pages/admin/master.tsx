import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit } from 'firebase/firestore';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Cpu, Network, BrainCircuit, Plus, Trash2, Settings, Clock, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const EMOJIS = ["✨", "🏗️", "💎", "🚚", "📞", "🤝", "🔥", "🚀", "✅", "⚠️", "📊"];
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function App() {
  const [activeTab, setActiveTab] = useState<'DNA' | 'FLOW'>('DNA');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [simMessages, setSimMessages] = useState<any[]>([]);
  const [simInput, setSimInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  
  // States לניהול העץ (Flow)
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState<string>('');
  const [isSavingFlow, setIsSavingFlow] = useState<boolean>(false);
  const [dnaDraft, setDnaDraft] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Master Rami | Studio Pro";
    
    // טעינת לקוחות - תיקון TypeScript על ידי הגדרת generic type
    const qCust = query(collection(dbFS, 'customers'), limit(20));
    const unsubCust = onSnapshot(qCust, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // טעינת עץ התפריטים
    const unsubFlow = onSnapshot(doc(dbFS, 'system', 'bot_flow_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    return () => {
      unsubCust();
      unsubFlow();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [simMessages, isThinking]);

  const saveFlow = async () => {
    setIsSavingFlow(true);
    try {
      await setDoc(doc(dbFS, 'system', 'bot_flow_config'), { nodes, globalDNA }, { merge: true });
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setTimeout(() => setIsSavingFlow(false), 800);
    }
  };

  const addBranch = () => {
    const newNode = { 
      id: `BRANCH_${Date.now()}`, 
      title: 'ענף חדש', 
      trigger: '', 
      prompt: 'תאר מה ה-AI עונה כאן (למשל: בירור מלאי מול סופאבייס)...' 
    };
    setNodes([...nodes, newNode]);
  };

  const deleteBranch = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const updateNode = (id: string, key: string, val: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, [key]: val } : n));
  };

  const triggerSimulation = async (manualData: any = null) => {
    if (isThinking || (!simInput.trim() && !manualData)) return;
    
    const userText = manualData ? `[הזרקת ${manualData.type}]` : simInput.trim();
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
        role: 'ai', 
        text: data.reply, 
        mediaUrl: data.mediaUrl, 
        pdfUrl: data.pdfUrl, 
        actionButton: data.actionButton 
      }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', text: '⚠️ שגיאת תקשורת עם המוח המרכזי' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] font-sans text-slate-200 overflow-hidden" dir="rtl">
      
      {/* Sidebar: בחירת לקוחות ואימון */}
      <aside className="w-72 bg-[#0f172a] border-l border-white/5 flex flex-col shrink-0 z-20 shadow-2xl">
        <header className="p-6 bg-[#020617] border-b border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cpu size={24} />
            <h1 className="font-black text-xl italic tracking-tighter">SABAN PRO</h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">מעבדת אימון וניהול ענפים</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <label className="text-[10px] font-black text-slate-500 block uppercase tracking-wider">בחר לקוח לאימון DNA</label>
          {customers.length > 0 ? customers.map(c => (
            <button 
              key={c.id} onClick={() => setSelectedCustomer(c)}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-white/5 uppercase text-emerald-400">
                {c.name ? c.name[0] : '?'}
              </div>
              <div className="text-right flex-1 overflow-hidden">
                <div className="text-xs font-bold truncate">{c.name || 'אורח'}</div>
                <div className="text-[9px] text-slate-500 font-mono truncate">{c.id}</div>
              </div>
            </button>
          )) : (
            <div className="p-4 text-center text-slate-600 text-[10px] italic">טוען לקוחות מהמאגר...</div>
          )}
        </div>
      </aside>

      {/* Main Area: סימולטור iPhone יוקרתי */}
      <main className="flex-1 relative flex flex-col items-center justify-center bg-[#020617]" style={{ backgroundImage: 'radial-gradient(#1e293b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-[360px] h-[740px] bg-[#0f172a] rounded-[3.5rem] border-[12px] border-[#1e293b] shadow-[0_0_80px_rgba(16,185,129,0.1)] relative flex flex-col overflow-hidden ring-1 ring-white/5"
        >
          {/* Notch Area */}
          <div className="bg-[#1e293b] h-7 w-full flex justify-center items-end shrink-0">
            <div className="w-24 h-4 bg-[#0f172a] rounded-b-2xl border-x border-b border-white/5"></div>
          </div>
          
          <header className="bg-[#0f172a] p-4 border-b border-white/5 flex items-center gap-3 shrink-0 z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-500 overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <img src={BRAND_LOGO} alt="AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 italic">ראמי (JONI AI)</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live Mode</span>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 bg-[#020617] scroll-smooth no-scrollbar" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')", backgroundBlendMode: 'overlay' }}>
            <AnimatePresence initial={false}>
              {simMessages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  key={i} className={`max-w-[85%] p-3.5 rounded-2xl shadow-xl text-xs relative leading-relaxed ${m.role === 'ai' ? 'bg-[#1e293b] text-slate-200 self-start rounded-tr-none border border-white/5' : 'bg-emerald-600 text-white self-end rounded-tl-none'}`}
                >
                  {m.mediaUrl && <img src={m.mediaUrl} className="mb-3 rounded-xl border border-white/10 max-h-48 w-full object-cover shadow-lg" alt="media" />}
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.pdfUrl && (
                    <div className="mt-3 bg-black/40 p-2.5 rounded-xl flex items-center gap-3 border border-white/10 hover:bg-black/60 transition-all cursor-pointer">
                      <FileText size={16} className="text-red-500"/>
                      <span className="text-[9px] font-bold text-slate-300 truncate">SABAN_DOC_2026.pdf</span>
                    </div>
                  )}
                  {m.actionButton && (
                    <button className="w-full bg-white text-black font-black py-2.5 rounded-xl mt-3 text-[10px] shadow-lg active:scale-95 transition-transform">
                      {m.actionButton.text}
                    </button>
                  )}
                  <div className={`text-[8px] mt-2 opacity-30 font-mono ${m.role === 'ai' ? 'text-right' : 'text-left'}`}>
                    {new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isThinking && (
              <div className="self-start bg-[#1e293b] p-3 rounded-2xl rounded-tr-none flex items-center gap-3 border border-white/5">
                <Cpu size={14} className="text-emerald-400 animate-spin"/>
                <span className="text-[10px] font-bold text-slate-400">המוח מנתח ומעצב...</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#0f172a] border-t border-white/5 shrink-0 pb-10">
            <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded-[1.5rem] border border-white/5 focus-within:border-emerald-500/50 transition-all">
              <input 
                type="text" 
                value={simInput} 
                onChange={e => setSimInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && triggerSimulation()} 
                placeholder="כתוב שאלה לראמי..." 
                className="flex-1 bg-transparent border-none outline-none text-[13px] px-2 text-slate-100" 
              />
              <button onClick={() => triggerSimulation()} className="w-10 h-10 bg-emerald-600 text-white rounded-[1.1rem] flex items-center justify-center shadow-lg active:scale-90 transition-all">
                <Send size={18} className="transform rotate-180" />
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Right Sidebar: ניהול מרכזי (Tabs) */}
      <aside className="w-[450px] bg-[#0f172a] border-r border-white/5 flex flex-col shrink-0 z-20 shadow-2xl">
        <header className="bg-[#020617] border-b border-white/5 flex shrink-0">
          <button 
            onClick={() => setActiveTab('DNA')}
            className={`flex-1 p-5 flex items-center justify-center gap-3 font-black text-xs transition-all ${activeTab === 'DNA' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BrainCircuit size={20} /> אימון DNA
          </button>
          <button 
            onClick={() => setActiveTab('FLOW')}
            className={`flex-1 p-5 flex items-center justify-center gap-3 font-black text-xs transition-all ${activeTab === 'FLOW' ? 'text-blue-400 border-b-2 border-blue-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Network size={20} /> ניהול ענפים
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {activeTab === 'DNA' ? (
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400"/> הזרקת DNA ידנית
                  </label>
                  <div className="flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                     <span className="text-[9px] text-emerald-500 font-black">PROACTIVE</span>
                  </div>
                </div>
                <textarea 
                  value={dnaDraft} onChange={e => setDnaDraft(e.target.value)}
                  placeholder="כתוב פקודה ספציפית שה-AI יטמיע בשיחה הבאה..."
                  className="w-full h-48 bg-black/40 border border-white/10 rounded-[1.5rem] p-5 text-sm outline-none focus:border-emerald-500/50 transition-all resize-none leading-relaxed shadow-inner"
                />
                <button 
                  onClick={() => triggerSimulation({ type: 'DNA', reply: dnaDraft || "פקודה הוזרקה בהצלחה." })}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <Zap size={18} /> הזרק ואימן מוח
                </button>
              </section>

              <div className="h-px bg-white/5" />
              
              <section className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 space-y-4 shadow-inner">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ארגז כלים לדיבוג</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => triggerSimulation({ type: 'IMAGE', reply: "שלום אחי, הנה התמונה שביקשת:", mediaUrl: BRAND_LOGO })} className="p-3 bg-slate-800 rounded-xl text-[10px] font-bold hover:bg-slate-700 transition flex items-center gap-2 border border-white/5"><ImageIcon size={16}/> תמונה לווצאפ</button>
                  <button onClick={() => triggerSimulation({ type: 'PDF', reply: "מצרף לך מחירון ב-PDF:", pdfUrl: "https://example.com" })} className="p-3 bg-slate-800 rounded-xl text-[10px] font-bold hover:bg-slate-700 transition flex items-center gap-2 border border-white/5"><FileText size={16}/> קובץ PDF</button>
                  <button onClick={() => triggerSimulation({ type: 'LINK', reply: "כנס להצעת המחיר שלך כאן:", actionButton: { text: "צפייה בהצעה 💎", link: "https://sidor.vercel.app/start" } })} className="p-3 bg-slate-800 rounded-xl text-[10px] font-bold hover:bg-slate-700 transition flex items-center gap-2 border border-white/5 col-span-2 justify-center"><LinkIcon size={16}/> כפתור לינק קסם</button>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">מבנה ענפים (Real-Time)</label>
                <button onClick={addBranch} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition shadow-lg"><Plus size={20}/></button>
              </div>

              <div className="space-y-5">
                 <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-3 shadow-inner">
                    <label className="text-[10px] font-black text-blue-400 block uppercase">DNA גלובלי (אישיות הבוט)</label>
                    <textarea value={globalDNA} onChange={e => setGlobalDNA(e.target.value)} className="w-full h-28 bg-black/40 border border-white/10 rounded-xl p-4 text-xs outline-none focus:border-blue-500 leading-relaxed" placeholder="אתה ראמי, המוח הלוגיסטי..." />
                 </div>

                 {nodes.map(node => (
                   <div key={node.id} className="bg-slate-800/40 p-5 rounded-[1.5rem] border border-white/5 relative group hover:border-blue-500/40 transition-all shadow-lg">
                      <button onClick={() => deleteBranch(node.id)} className="absolute -left-2 -top-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 z-10"><Trash2 size={12}/></button>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-500 uppercase">שם הענף</span>
                            <input value={node.title} onChange={e => updateNode(node.id, 'title', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-[11px] font-black focus:border-blue-500 outline-none" />
                         </div>
                         <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-500 uppercase">פקודת כפתור (Trigger)</span>
                            <input value={node.trigger} onChange={e => updateNode(node.id, 'trigger', e.target.value)} placeholder="למשל: 1" className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-blue-400 focus:border-blue-500 outline-none" />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <span className="text-[9px] font-black text-slate-500 uppercase">הנחיית המוח לשלב זה</span>
                         <textarea value={node.prompt} onChange={e => updateNode(node.id, 'prompt', e.target.value)} className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] leading-relaxed resize-none focus:border-blue-500 outline-none" />
                      </div>
                   </div>
                 ))}
              </div>

              <button 
                onClick={saveFlow} disabled={isSavingFlow}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all mt-8 sticky bottom-0"
              >
                {isSavingFlow ? <Activity size={20} className="animate-spin" /> : <><Save size={20} /> שמור עץ ועדכן לקוחות (LIVE)</>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
