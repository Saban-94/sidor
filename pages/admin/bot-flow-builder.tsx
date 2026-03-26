import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { database, db } from '../../lib/firebase'; // RTDB
import { ref, onValue } from 'firebase/database';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Firestore
import { app } from '../../lib/firebase';
import { 
  Save, Plus, Trash2, Zap, Layout, Cpu, Globe, 
  MessageSquare, ChevronRight, Settings, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const dbFS = getFirestore(app);
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function SabanStudio() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'online' | 'offline'>('offline');

  // 1. טעינת הקונפיגורציה הקיימת מה-Studio (Firestore)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(dbFS, 'system', 'bot_flow_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setNodes(data.nodes || []);
          setGlobalDNA(data.globalDNA || "");
        }
      } catch (err) {
        console.error("Studio Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();

    // בדיקת סטטוס Bridge בזמן אמת (RTDB)
    const statusRef = ref(database, 'system/bridge_status');
    return onValue(statusRef, (snapshot) => {
      setBridgeStatus(snapshot.val() === 'active' ? 'online' : 'offline');
    });
  }, []);

  // 2. שמירת שינויים ופרסום ל-AI
  const saveToStudio = async () => {
    setIsPublishing(true);
    try {
      await setDoc(doc(dbFS, 'system', 'bot_flow_config'), {
        nodes,
        globalDNA,
        updatedAt: new Date().toISOString(),
        publishedBy: "Admin"
      });
      alert("🚀 ה-DNA עודכן! ראמי מסתנכרן עם ההנחיות החדשות.");
    } catch (err) {
      alert("❌ שגיאה בשמירת הנתונים.");
    } finally {
      setIsPublishing(false);
    }
  };

  const addNode = () => {
    const newNode = {
      id: `NODE_${Date.now()}`,
      label: "ענף חדש",
      prompt: "מה הבוט צריך לעשות בשלב זה?",
      keywords: ""
    };
    setNodes([...nodes, newNode]);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans antialiased pb-20 text-right" dir="rtl">
      <Head><title>Saban Studio | AI Architect</title></Head>

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Cpu className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">STUDIO</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-bold">Bot Logic Architect</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${bridgeStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${bridgeStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            {bridgeStatus === 'online' ? 'BRIDGE ACTIVE' : 'BRIDGE OFFLINE'}
          </div>
          <button 
            onClick={saveToStudio}
            disabled={isPublishing}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {isPublishing ? 'מפרסם...' : 'שמור ופרסם'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* DNA & Global Config */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl border border-white/5 bg-[#0f172a] shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="text-emerald-500" />
              <h3 className="font-black text-lg text-white">DNA גלובלי</h3>
            </div>
            <textarea 
              value={globalDNA}
              onChange={(e) => setGlobalDNA(e.target.value)}
              placeholder="הגדר את האישיות של ראמי..."
              className="w-full h-64 p-4 rounded-2xl bg-[#020617] border border-white/5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-right"
            />
            <div className="mt-4 flex items-start gap-2 text-[11px] opacity-40 italic">
              <Info size={14} className="shrink-0 mt-0.5" />
              הנחיות אלו יוזרקו לכל שיחה ויגדירו את סגנון הדיבור והחוקים הבסיסיים.
            </div>
          </div>
        </div>

        {/* Flow Branches */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layout className="text-emerald-500" />
              <h3 className="font-black text-xl italic uppercase tracking-wider text-white">ענפי שיחה (Nodes)</h3>
            </div>
            <button onClick={addNode} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs">
              <Plus size={16} /> הוסף ענף
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {nodes.map((node, index) => (
                <motion.div 
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group p-6 rounded-3xl border border-white/5 bg-[#0f172a] hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">
                        {index + 1}
                      </div>
                      <input 
                        value={node.label}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].label = e.target.value;
                          setNodes(newNodes);
                        }}
                        className="bg-transparent border-none outline-none font-black text-white text-lg w-full"
                      />
                    </div>
                    <button 
                      onClick={() => setNodes(nodes.filter(n => n.id !== node.id))}
                      className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-black opacity-30 mb-2 block tracking-widest text-white">הנחיית ביצוע (AI Instruction)</label>
                      <textarea 
                        value={node.prompt}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].prompt = e.target.value;
                          setNodes(newNodes);
                        }}
                        className="w-full p-4 rounded-2xl bg-[#020617] border border-white/5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-right"
                        rows={3}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Preview Tooltip */}
      <div className="fixed bottom-8 left-8">
        <div className="w-72 bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <img src={BRAND_LOGO} className="w-10 h-10 rounded-full border border-white/10" alt="Rami" />
            <div>
              <h4 className="text-xs font-black text-white leading-none mb-1">תצוגה מקדימה</h4>
              <p className="text-[9px] text-emerald-500 font-bold uppercase">AI Active</p>
            </div>
          </div>
          <div className="p-4 text-[11px] opacity-50 italic">
            כאן תוכל לראות איך ה-AI יפרש את ההנחיות שבנית בסטודיו...
          </div>
        </div>
      </div>
    </div>
  );
}
