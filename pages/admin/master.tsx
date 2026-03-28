import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, query, onSnapshot, doc, setDoc, 
  updateDoc, deleteDoc, orderBy, limit 
} from 'firebase/firestore';
import { 
  Bot, Send, User, Users, BrainCircuit, Network, 
  Save, Activity, Trash2, Plus, Search, ShieldCheck,
  MessageSquare, Zap, Settings, Clock, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function MasterControl() {
  const [activeTab, setActiveTab] = useState<'CRM' | 'DNA' | 'FLOW'>('CRM');
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // נתוני המוח (DNA)
  const [botConfig, setBotConfig] = useState({
    name: "סבן AI",
    role: "נציג מכירות בכיר",
    tone: "מקצועי וחברי",
    instructions: ""
  });

  // ניהול זרימה (Flow Nodes)
  const [flowNodes, setFlowNodes] = useState<any[]>([]);

  // טעינת נתונים בזמן אמת
  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('lastSeen', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // טעינת הגדרות בוט
    onSnapshot(doc(db, 'settings', 'bot-dna'), (doc) => {
      if (doc.exists()) setBotConfig(doc.data() as any);
    });

    // טעינת Flow
    onSnapshot(collection(db, 'bot-flow'), (snapshot) => {
      setFlowNodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  const saveBotDNA = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'bot-dna'), botConfig);
      alert("המוח עודכן בהצלחה!");
    } finally {
      setIsSaving(false);
    }
  };

  const addFlowNode = async () => {
    const newNode = {
      title: "שלב חדש",
      trigger: "",
      prompt: "",
      order: flowNodes.length
    };
    await setDoc(doc(collection(db, 'bot-flow')), newNode);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-emerald-500/30" dir="rtl">
      {/* Header סטטי */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-white">SABAN OS</h1>
              <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">Master Control v2.0</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {['CRM', 'DNA', 'FLOW'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab ? 'bg-emerald-500 text-black shadow-lg' : 'hover:bg-white/5 text-slate-400'
                }`}
              >
                {tab === 'CRM' && 'ניהול משתמשים'}
                {tab === 'DNA' && 'הגדרות מוח'}
                {tab === 'FLOW' && 'תרשים זרימה'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* ניהול משתמשים (CRM) */}
          {activeTab === 'CRM' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="חיפוש לקוח לפי שם או טלפון..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-emerald-500/50 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.filter(c => c.name?.includes(searchQuery) || c.phone?.includes(searchQuery)).map(customer => (
                  <div key={customer.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <User size={24} />
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-bold">פעיל</span>
                    </div>
                    <h3 className="font-bold text-white mb-1">{customer.name || 'לקוח ללא שם'}</h3>
                    <p className="text-sm text-slate-500 font-mono mb-4">{customer.phone}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-white/5 hover:bg-emerald-500 hover:text-black py-2 rounded-xl text-xs font-bold transition-all">פרופיל מלא</button>
                      <button className="px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* הגדרות מוח (DNA) */}
          {activeTab === 'DNA' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-8">
                  <BrainCircuit className="text-emerald-500" size={32} />
                  <h2 className="text-xl font-bold text-white">הגדרות ליבת הבינה</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">שם הבוט</label>
                    <input 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 outline-none focus:border-emerald-500"
                      value={botConfig.name}
                      onChange={e => setBotConfig({...botConfig, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">הנחיות יסוד (System Prompt)</label>
                    <textarea 
                      className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 outline-none focus:border-emerald-500 resize-none leading-relaxed"
                      value={botConfig.instructions}
                      onChange={e => setBotConfig({...botConfig, instructions: e.target.value})}
                      placeholder="תאר כאן איך הבוט צריך להתנהג..."
                    />
                  </div>
                  <button 
                    onClick={saveBotDNA}
                    disabled={isSaving}
                    className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Activity className="animate-spin" /> : <Save size={20} />}
                    שמור שינויים במוח
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* תרשים זרימה (FLOW) */}
          {activeTab === 'FLOW' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Network className="text-blue-400" /> מבנה שיחה דינמי
                </h2>
                <button onClick={addFlowNode} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                  <Plus size={18} /> הוסף שלב חדש
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {flowNodes.map((node, index) => (
                  <div key={node.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-6 items-start group">
                    <div className="bg-blue-500/20 text-blue-400 w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        className="bg-transparent text-white font-bold text-lg outline-none border-b border-transparent focus:border-blue-500/50 pb-1"
                        value={node.title}
                        onChange={e => {/* update logic */}}
                      />
                      <input 
                        className="bg-white/5 border border-white/5 rounded-lg px-3 py-1 text-xs font-mono text-blue-400"
                        placeholder="טריגר (למשל: 1)"
                        value={node.trigger}
                      />
                      <textarea 
                        className="md:col-span-2 bg-black/30 border border-white/5 rounded-xl p-3 text-sm h-24 outline-none focus:border-blue-500/30"
                        placeholder="מה הבוט צריך לעשות בשלב הזה?"
                        value={node.prompt}
                      />
                    </div>
                    <button className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-white/5 text-center">
        <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
          Saban OS Infrastructure • Secured with Firebase
        </p>
      </footer>
    </div>
  );
}
