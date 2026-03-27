import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, set, onValue } from 'firebase/database';
// תיקון: הוספת Play לרשימת הייבוא
import { 
  GitBranch, Save, Plus, Trash2, Zap, 
  Package, Link as LinkIcon, MessageSquare, Monitor, Smartphone, Play 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanStudio() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'simulator'>('editor');
  const [testMessage, setTestMessage] = useState('');
  const [simResponse, setSimResponse] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const flowRef = ref(database, 'system/bot_flow_config');
    const unsub = onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    const fetchInv = async () => {
      const { data } = await supabase.from('inventory').select('*').limit(10);
      if (data) setInventory(data);
    };

    fetchInv();
    return () => unsub();
  }, []);

  const saveToBrain = async () => {
    try {
      await set(ref(database, 'system/bot_flow_config'), {
        nodes,
        globalDNA,
        lastUpdated: Date.now()
      });
      alert('✅ המוח סונכרן בהצלחה!');
    } catch (e) {
      alert('❌ תקלה בסנכרון');
    }
  };

  const runTest = async () => {
    if (!testMessage) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage, state: 'STUDIO_TEST', manualInjection: true })
      });
      const data = await res.json();
      setSimResponse(data);
    } catch (e) {
      setSimResponse({ reply: "תקלה בסימולציה." });
    }
    setIsProcessing(false);
  };

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN STUDIO | ניהול המוח</title></Head>

      <header className="p-6 border-b border-white/5 bg-[#0f172a] flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg"><GitBranch size={22}/></div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">SABAN STUDIO</h1>
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest text-emerald-500">System Core</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab(activeTab === 'editor' ? 'simulator' : 'editor')} className="lg:hidden p-3 bg-white/5 rounded-xl">
            {activeTab === 'editor' ? <Smartphone/> : <Monitor/>}
          </button>
          <button onClick={saveToBrain} className="px-6 py-3 bg-purple-600 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-lg flex items-center gap-2">
            <Save size={18}/> סנכרן מוח
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${activeTab === 'simulator' ? 'hidden lg:block' : 'block'}`}>
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-6 flex items-center gap-2"><Zap size={16}/> Global DNA</h3>
              <textarea 
                value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-3xl p-5 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
                placeholder="הגדר את אישיות ה-AI..."
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><MessageSquare size={16}/> ענפי שיחה</h3>
                <button onClick={() => setNodes([...nodes, { id: Date.now(), name: 'ענף חדש', prompt: '' }])} className="p-2 bg-emerald-500/20 text-emerald-500 rounded-full hover:scale-110 transition-transform"><Plus/></button>
              </div>
              {nodes.map((node, i) => (
                <div key={node.id} className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 group transition-all hover:border-purple-500/30">
                  <div className="flex justify-between mb-4">
                    <input value={node.name} className="bg-transparent font-black text-white outline-none" onChange={(e) => {
                      const n = [...nodes]; n[i].name = e.target.value; setNodes(n);
                    }} />
                    <button onClick={() => setNodes(nodes.filter(nd => nd.id !== node.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                  </div>
                  <textarea value={node.prompt} className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none" onChange={(e) => {
                    const n = [...nodes]; n[i].prompt = e.target.value; setNodes(n);
                  }} placeholder="לוגיקה לענף זה..." />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className={`w-full lg:w-[450px] bg-[#020617] border-r border-white/5 flex flex-col ${activeTab === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white">
              <Play size={14} className="text-emerald-500"/> Simulator
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-dot-pattern">
            {simResponse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-[13px] leading-relaxed text-emerald-50 shadow-xl">
                {simResponse.reply}
              </motion.div>
            )}
          </div>
          <div className="p-6 bg-[#0f172a] border-t border-white/5">
            <div className="flex gap-2 p-2 bg-black/40 rounded-full border border-white/10 px-4 focus-within:border-emerald-500/50 transition-all">
              <input 
                value={testMessage} onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTest()}
                className="flex-1 bg-transparent border-none outline-none text-sm p-2 text-white"
                placeholder="שלח הודעת בדיקה..."
              />
              <button onClick={runTest} disabled={isProcessing} className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-[#020617] shadow-lg active:scale-90 transition-all">
                {isProcessing ? <div className="w-4 h-4 border-2 border-[#020617] border-t-transparent rounded-full animate-spin"/> : <Zap size={18}/>}
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
