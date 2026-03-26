import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, getDoc, limit } from 'firebase/firestore';
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
  const [activeTab, setActiveTab] = useState('DNA');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [simMessages, setSimMessages] = useState([]);
  const [simInput, setSimInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // States לניהול העץ (Flow)
  const [nodes, setNodes] = useState([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [dnaDraft, setDnaDraft] = useState('');

  const scrollRef = useRef(null);

  useEffect(() => {
    document.title = "Master Rami | Studio Pro";
    // טעינת לקוחות
    onSnapshot(query(collection(dbFS, 'customers'), limit(20)), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    // טעינת עץ התפריטים
    onSnapshot(doc(dbFS, 'system', 'bot_flow_config'), (snap) => {
      if (snap.exists()) {
        setNodes(snap.data().nodes || []);
        setGlobalDNA(snap.data().globalDNA || '');
      }
    });
  }, []);

  const saveFlow = async () => {
    setIsSavingFlow(true);
    await setDoc(doc(dbFS, 'system', 'bot_flow_config'), { nodes, globalDNA }, { merge: true });
    setTimeout(() => setIsSavingFlow(false), 1000);
  };

  const addBranch = () => {
    const newNode = { id: `BRANCH_${Date.now()}`, title: 'ענף חדש', trigger: '', prompt: 'תאר מה ה-AI עונה כאן...' };
    setNodes([...nodes, newNode]);
  };

  const deleteBranch = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const updateNode = (id, key, val) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, [key]: val } : n));
  };

  const triggerSimulation = async (manualData = null) => {
    if (isThinking || (!simInput.trim() && !manualData)) return;
    const userText = manualData ? `[הזרקה: ${manualData.type}]` : simInput.trim();
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
      setSimMessages(prev => [...prev, { role: 'ai', text: '⚠️ שגיאת חיבור' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] font-sans text-slate-200 overflow-hidden" dir="rtl">
      
      {/* Sidebar: לקוחות */}
      <aside className="w-72 bg-[#0f172a] border-l border-white/5 flex flex-col shrink-0 z-20 shadow-2xl">
        <header className="p-6 bg-[#020617] border-b border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cpu size={24} />
            <h1 className="font-black text-xl italic tracking-tighter">SABAN PRO</h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">מעבדת אימון וניהול</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <label className="text-[10px] font-black text-slate-500 block uppercase">בחר לקוח לאימון</label>
          {customers.map(c => (
            <button 
              key={c.id} onClick={() => setSelectedCustomer(c)}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-transparent'}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-white/5 uppercase">
                {c.name ? c.name[0] : '?'}
              </div>
              <div className="text-right flex-1 overflow-hidden">
                <div className="text-xs font-bold truncate">{c.name || 'אורח'}</div>
                <div className="text-[9px] text-slate-500 font-mono truncate">{c.id}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Area: סימולטור */}
      <main className="flex-1 relative flex flex-col items-center justify-center bg-[#020617]" style={{ backgroundImage: 'radial-gradient(#1e293b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-[360px] h-[740px] bg-[#0f172a] rounded-[3.5rem] border-[12px] border-[#1e293b] shadow-2xl relative flex flex-col overflow-hidden"
        >
          <div className="bg-[#1e293b] h-7 w-full flex justify-center items-end shrink-0"><div className="w-24 h-4 bg-[#0f172a] rounded-b-2xl"></div></div>
          
          <header className="bg-[#0f172a] p-4 border-b border-white/5 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500 overflow-hidden border border-white/10 shadow-lg">
              <img src={BRAND_LOGO} alt="AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-black">ראמי (JONI AI)</h2>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live Simulation</span></div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#020617] scroll-smooth no-scrollbar" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')", backgroundBlendMode: 'overlay' }}>
            <AnimatePresence>
              {simMessages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={i} className={`max-w-[85%] p-3 rounded-2xl shadow-lg text-xs relative ${m.role === 'ai' ? 'bg-[#1e293b] text-slate-200 self-start rounded-tr-none border border-white/5' : 'bg-emerald-600 text-white self-end rounded-tl-none'}`}
                >
                  {m.mediaUrl && <img src={m.mediaUrl} className="mb-2 rounded-xl border border-white/10 max-h-40 w-full object-cover" alt="media" />}
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.pdfUrl && <div className="mt-3 bg-black/40 p-2 rounded-xl flex items-center gap-2 border border-white/5"><FileText size={14} className="text-red-500"/><span className="text-[8px] font-bold">Price_List.pdf</span></div>}
                  {m.actionButton && <button className="w-full bg-white text-black font-black py-2 rounded-xl mt-3 text-[10px] shadow-lg">{m.actionButton.text}</button>}
                </motion.div>
              ))}
            </AnimatePresence>
            {isThinking && <div className="self-start bg-[#1e293b] p-3 rounded-2xl flex items-center gap-2"><Cpu size={12} className="text-emerald-400 animate-spin"/><span className="text-[10px] font-bold text-slate-400">המוח מנתח...</span></div>}
          </div>

          <div className="p-4 bg-[#0f172a] border-t border-white/5">
            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5">
              <input type="text" value={simInput} onChange={e => setSimInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && triggerSimulation()} placeholder="כתוב שאלה..." className="flex-1 bg-transparent border-none outline-none text-xs px-2" />
              <button onClick={() => triggerSimulation()} className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Send size={16} className="transform rotate-180" /></button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Right Sidebar: ניהול מרכזי (DNA & Flow) */}
      <aside className="w-96 bg-[#0f172a] border-r border-white/5 flex flex-col shrink-0 z-20 shadow-2xl">
        <header className="bg-[#020617] border-b border-white/5 flex">
          <button 
            onClick={() => setActiveTab('DNA')}
            className={`flex-1 p-5 flex items-center justify-center gap-2 font-black text-xs transition-all ${activeTab === 'DNA' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BrainCircuit size={18} /> אימון DNA
          </button>
          <button 
            onClick={() => setActiveTab('FLOW')}
            className={`flex-1 p-5 flex items-center justify-center gap-2 font-black text-xs transition-all ${activeTab === 'FLOW' ? 'text-blue-400 border-b-2 border-blue-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Network size={18} /> ניהול תפריטים
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'DNA' ? (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Sparkles size={12}/> הזרקת DNA ידנית</label>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black">ACTIVE</span>
                </div>
                <textarea 
                  value={dnaDraft} onChange={e => setDnaDraft(e.target.value)}
                  placeholder="כתוב פקודה שה-AI צריך לעבד עכשיו..."
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-emerald-500 transition-all resize-none leading-relaxed shadow-inner"
                />
                <button 
                  onClick={() => triggerSimulation({ type: 'DNA', reply: dnaDraft || "פקודה הוזרקה." })}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Zap size={16} /> הזרק ואימן מוח
                </button>
              </section>

              <hr className="border-white/5" />
              
              <section className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase">כלים מהירים לדיבוג</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => triggerSimulation({ type: 'IMAGE', reply: "הנה תמונה לדוגמה:", mediaUrl: BRAND_LOGO })} className="p-2 bg-slate-800 rounded-lg text-[9px] font-bold hover:bg-slate-700 transition flex items-center gap-2"><ImageIcon size={14}/> בדוק תמונה</button>
                  <button onClick={() => triggerSimulation({ type: 'PDF', reply: "הנה קובץ PDF:", pdfUrl: "https://example.com" })} className="p-2 bg-slate-800 rounded-lg text-[9px] font-bold hover:bg-slate-700 transition flex items-center gap-2"><FileText size={14}/> בדוק PDF</button>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ענפים ותפריטים (Production)</label>
                <button onClick={addBranch} className="bg-blue-600/20 text-blue-400 p-1.5 rounded-lg hover:bg-blue-600/30 transition shadow-sm"><Plus size={16}/></button>
              </div>

              <div className="space-y-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <label className="text-[9px] font-black text-slate-500 block uppercase">DNA גלובלי (האופי של המותג)</label>
                    <textarea value={globalDNA} onChange={e => setGlobalDNA(e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-blue-500" />
                 </div>

                 {nodes.map(node => (
                   <div key={node.id} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 relative group hover:border-blue-500/30 transition-all">
                      <button onClick={() => deleteBranch(node.id)} className="absolute -left-2 -top-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                         <input value={node.title} onChange={e => updateNode(node.id, 'title', e.target.value)} placeholder="שם הענף" className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] font-black" />
                         <input value={node.trigger} onChange={e => updateNode(node.id, 'trigger', e.target.value)} placeholder="טריגר (למשל: 1)" className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] font-mono text-blue-400" />
                      </div>
                      <textarea value={node.prompt} onChange={e => updateNode(node.id, 'prompt', e.target.value)} placeholder="מה ה-AI עונה או עושה כאן?" className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] leading-relaxed resize-none" />
                   </div>
                 ))}
              </div>

              <button 
                onClick={saveFlow} disabled={isSavingFlow}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-6"
              >
                {isSavingFlow ? <Activity size={18} className="animate-spin" /> : <><Save size={18} /> שמור עץ לשרת (Live)</>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
