import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit, serverTimestamp, orderBy, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { getDatabase, ref, push, onValue, set, update, remove } from 'firebase/database';
import { 
  Bot, Send, Image as ImageIcon, MessageCircle, Save, Activity, Smartphone, ShieldCheck, 
  Users, Printer, UserCog, Building, MapPin, Phone, CreditCard, Power, X, Search, 
  Truck, Crown, PackageSearch, Merge, CheckCircle2, WifiOff, Heart, QrCode, Clock, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Init ---
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
  const [activeTab, setActiveTab] = useState('HUB');
  const [theme, setTheme] = useState('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState({ online: false, lastSeen: 0, qr: null as string | null });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showQrModal, setShowQrModal] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);

  const [editCrm, setEditCrm] = useState<any>({ 
    comaxId: '', projectName: '', projectAddress: '', contactName: '', contactPhone: '', photo: '', dnaContext: '' 
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // עזר לנורמליזציה ויזואלית בלבד
  const normalizeId = (id: string) => {
    if (!id) return '';
    const clean = id.replace(/\D/g, '');
    return clean.length >= 9 ? clean.slice(-9) : id;
  };

  const timeDiff = currentTime - (serverStatus.lastSeen || 0);
  const isTrulyOnline = serverStatus.online && (timeDiff < 90000);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    // מאזין סטטוס וברקוד
    onValue(ref(dbRT, 'saban94/status'), (snap) => {
      const data = snap.val();
      if (data) {
        setServerStatus({ online: data.online || false, lastSeen: data.lastSeen || 0, qr: data.qr || null });
        if (data.qr && !data.online) setShowQrModal(true);
        if (data.online) setShowQrModal(false);
      }
    });

    // איחוד לקוחות אוטומטי
    const unsubCust = onSnapshot(query(collection(dbFS, 'customers'), orderBy('lastUpdated', 'desc'), limit(150)), (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unifiedMap = new Map();
      raw.forEach((curr: any) => {
          const uid = normalizeId(curr.id);
          const existing = unifiedMap.get(uid);
          if (!existing) {
            unifiedMap.set(uid, { ...curr, uid, allIds: [curr.id] });
          } else {
            const isCurrRealPhone = curr.id.startsWith('972') && !curr.id.includes('-');
            unifiedMap.set(uid, {
              ...(isCurrRealPhone ? curr : existing),
              uid,
              allIds: Array.from(new Set([...existing.allIds, curr.id]))
            });
          }
      });
      setCustomers(Array.from(unifiedMap.values()));
    });

    return () => { clearInterval(timer); unsubCust(); };
  }, []);

  // סנכרון היסטוריה
  useEffect(() => {
    if (!selectedCustomer) return;
    setEditCrm({ 
      comaxId: selectedCustomer.comaxId || '', 
      projectName: selectedCustomer.projectName || '', 
      projectAddress: selectedCustomer.projectAddress || '', 
      contactName: selectedCustomer.name || '', 
      contactPhone: selectedCustomer.id || '', 
      photo: selectedCustomer.photo || '',
      dnaContext: selectedCustomer.dnaContext || ''
    });

    const unsubHistory = onSnapshot(query(collection(dbFS, 'customers', selectedCustomer.id, 'chat_history'), orderBy('timestamp', 'asc')), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubHistory();
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 🔥 שליחה מאובטחת לצינור - שולח ID מקורי מלא
  const handleSend = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    const txt = chatInput.trim();
    const targetId = selectedCustomer.id; 
    setChatInput('');

    // Optimistic Update
    const tempId = "temp-" + Date.now();
    setMessages(prev => [...prev, { id: tempId, text: txt, type: 'out', timestamp: { seconds: Date.now()/1000 }, isSending: true }]);

    try {
      // 1. דחיפה ל-Realtime DB (תור היציאה של השרת במשרד)
      await push(ref(dbRT, 'saban94/outgoing'), {
        number: targetId,
        message: txt,
        timestamp: Date.now()
      });

      // 2. תיעוד ב-Firestore
      await setDoc(doc(collection(dbFS, 'customers', targetId, 'chat_history')), { 
        text: txt, type: 'out', timestamp: serverTimestamp(), source: 'manual-rami' 
      });

      await updateDoc(doc(dbFS, 'customers', targetId), { lastUpdated: serverTimestamp() });
    } catch (e) { console.error("Send Error:", e); }
  };

  const handleResetConnection = async () => {
    if (window.confirm("ריסטרט לשרת במשרד?")) {
      await update(ref(dbRT, 'saban94/status'), { online: false, qr: null, reset_command: true, lastSeen: Date.now() });
      setShowQrModal(true);
    }
  };

  const handleMergeManual = async () => {
    const targetPhone = prompt("הכנס מספר טלפון יעד (למשל: 972542276631):");
    if (!targetPhone || !selectedCustomer || targetPhone === selectedCustomer.id) return;
    
    if (window.confirm(`להעביר הכל מ-${selectedCustomer.id} ל-${targetPhone} ולמחוק את הישן?`)) {
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
        batch.set(doc(dbFS, 'customers', targetPhone), { ...selectedCustomer, id: targetPhone, lastUpdated: serverTimestamp() }, { merge: true });
        batch.delete(doc(dbFS, 'customers', oldId));
        await batch.commit();
        alert("האיחוד הושלם.");
        setSelectedCustomer(null);
      } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
    }
  };

  const saveProfile = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    await setDoc(doc(dbFS, 'customers', selectedCustomer.id), { ...editCrm, lastUpdated: serverTimestamp() }, { merge: true });
    setIsSaving(false);
    alert("סונכרן!");
  };

  const filtered = customers.filter(c => (c.projectName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      
      {/* Sidebar רשימה */}
      <aside className={`w-96 flex flex-col border-l ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
        <header className="p-6 border-b border-inherit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg flex items-center gap-2 text-emerald-500"><MessageCircle/> JONI HUB</h2>
            <div className={`w-3 h-3 rounded-full ${isTrulyOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-slate-500" size={16}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש מנהל פרויקט..." className="w-full bg-black/20 p-3 rounded-xl border-none outline-none text-sm font-bold shadow-inner" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${selectedCustomer?.uid === c.uid ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-transparent hover:bg-white/5'}`}>
              <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0">
                {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <UserCog className="m-auto mt-3 text-slate-500"/>}
              </div>
              <div className="text-right flex-1 overflow-hidden">
                <div className="text-sm font-black truncate">{c.projectName || c.name || "לקוח חדש"}</div>
                <div className="text-[10px] opacity-40 font-mono">ID: {normalizeId(c.id)}</div>
              </div>
              {c.allIds?.length > 1 && <div className="bg-blue-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-black shrink-0">Merged</div>}
            </button>
          ))}
        </div>
      </aside>

      {/* אזור צ'אט */}
      <main className="flex-1 flex flex-col relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'soft-light' }}>
        {selectedCustomer ? (
          <>
            <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black italic">{editCrm.projectName || selectedCustomer.name}</h2>
                <div className={`px-2 py-1 rounded text-[10px] font-mono ${isTrulyOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isTrulyOnline ? 'LIVE CONNECTED' : 'BRIDGE DISCONNECTED'}
                </div>
              </div>
              <button onClick={() => setIsAiActive(!isAiActive)} className={`px-5 py-2 rounded-xl font-black text-xs border-2 transition-all ${isAiActive ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                {isAiActive ? 'AI BOT ON' : 'MANUAL CONTROL'}
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-xl relative ${m.type === 'in' ? 'bg-[#202c33] text-white self-start rounded-tr-none' : 'bg-[#005c4b] text-white self-end rounded-tl-none'}`}>
                  <div className="font-bold leading-relaxed">{m.text}</div>
                  <div className="text-[9px] opacity-40 text-left mt-2 font-mono flex justify-end gap-1 items-center">
                    {m.isSending ? 'משגר...' : (m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '...')}
                    {!m.type && <CheckCircle2 size={10} className="text-emerald-400 ml-1"/>}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 bg-slate-900/80 border-t border-white/5 flex gap-4 z-10">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="הקלד הודעה ללקוח..." className="flex-1 bg-black/40 p-4 rounded-2xl border-none outline-none font-bold text-white focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" />
              <button onClick={handleSend} className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-emerald-500 shadow-emerald-500/20"><Send className="rotate-180"/></button>
            </footer>
          </>
        ) : (
          <div className="m-auto opacity-10 flex flex-col items-center gap-6 text-white"><MessageCircle size={200}/><h1 className="text-5xl font-black italic tracking-tighter">SABAN HUB COMMAND</h1></div>
        )}
      </main>

      {/* CRM Sidebar */}
      {selectedCustomer && (
        <aside className={`w-[450px] flex flex-col p-8 border-r ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white'} overflow-y-auto no-scrollbar`}>
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <h3 className="font-black flex items-center gap-2 text-blue-400 text-lg"><UserCog/> כרטיס CRM</h3>
            <button onClick={handleMergeManual} className="bg-blue-600 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase flex items-center gap-2 hover:bg-blue-500 transition-all"><Merge size={14}/> איחוד</button>
          </div>
          
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 overflow-hidden border-4 border-emerald-500/20 shadow-2xl relative group">
                  <img src={editCrm.photo || BRAND_LOGO} className="w-full h-full object-cover" />
                  <div onClick={() => {const u = prompt("URL?"); if(u) setEditCrm({...editCrm, photo: u})}} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer font-black text-[10px] uppercase text-white">החלף תמונה</div>
                </div>
                <div className="text-center">
                    <h4 className="text-2xl font-black text-white">{editCrm.contactName || selectedCustomer.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">REAL ID: {selectedCustomer.id}</p>
                </div>
            </div>

            <div className="grid gap-5 text-white">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12}/> מספר לקוח קומקס</label><input value={editCrm.comaxId} onChange={e => setEditCrm({...editCrm, comaxId: e.target.value})} className="w-full bg-black/20 p-4 rounded-xl outline-none border border-white/5 focus:border-emerald-500 font-bold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building size={12}/> שם פרויקט</label><input value={editCrm.projectName} onChange={e => setEditCrm({...editCrm, projectName: e.target.value})} className="w-full bg-black/20 p-4 rounded-xl outline-none border border-white/5 focus:border-blue-500 font-bold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Bot size={12}/> DNA אישי (פקודות AI)</label><textarea value={editCrm.dnaContext} onChange={e => setEditCrm({...editCrm, dnaContext: e.target.value})} rows={4} className="w-full bg-black/20 p-4 rounded-xl outline-none border border-white/5 focus:border-purple-500 font-bold text-xs resize-none" placeholder="הנחיות לבוט..." /></div>
            </div>

            <button onClick={saveProfile} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg">
              {isSaving ? <Activity className="animate-spin"/> : <><Save size={24}/> שמור וסנכרן</>}
            </button>

            <div className={`mt-8 p-5 rounded-2xl border-2 border-dashed flex justify-between items-center ${isTrulyOnline ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest"><Heart size={16} className={isTrulyOnline ? 'animate-pulse' : ''}/> JONI PULSE</div>
                <div className="text-[10px] font-mono">{(timeDiff/1000).toFixed(1)}s LAG</div>
            </div>
          </div>
        </aside>
      )}

      {/* מודל ברקוד */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-2xl">
             <div className="bg-white rounded-[3.5rem] p-12 max-w-md w-full text-center shadow-2xl relative border-4 border-amber-500/30">
                <button onClick={() => setShowQrModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={32}/></button>
                <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl text-white animate-pulse"><QrCode size={40} /></div>
                <h2 className="text-3xl font-black text-slate-900 italic mb-2 tracking-tighter">חיבור צינור JONI</h2>
                <p className="text-slate-500 font-bold mb-8 text-sm">השרת ממתין לסריקה מהטלפון שלך.</p>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border-4 border-dashed border-slate-200 mb-8 aspect-square flex items-center justify-center overflow-hidden shadow-inner">
                    {serverStatus.qr ? (
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(serverStatus.qr)}`} className="w-full h-full shadow-2xl rounded-2xl transform hover:scale-105 transition-transform border-4 border-white" alt="QR" />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Activity size={48} className="animate-spin text-amber-500" />
                            <span className="text-xs font-black uppercase">מייצר ברקוד...</span>
                        </div>
                    )}
                </div>
                <button onClick={handleResetConnection} className="w-full bg-red-600/10 text-red-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-600/20 active:scale-95">ריסטרט לשרת במשרד</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
