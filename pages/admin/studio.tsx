import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, set, onValue, push } from 'firebase/database';
import { 
  GitBranch, Play, Save, Plus, Trash2, Zap, 
  Package, Link as LinkIcon, MessageSquare, Smartphone, Monitor, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanStudio() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [simResponse, setSimResponse] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'simulator'>('editor');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. טעינת Flow מ-Firebase
    const flowRef = ref(database, 'system/bot_flow_config');
    onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    // 2. טעינת מלאי מ-Supabase לצורך קישור מוצרים
    const fetchInventory = async () => {
      const { data } = await supabase.from('inventory').select('*').limit(20);
      if (data) setInventory(data);
    };
    fetchInventory();
  }, []);

  const saveFlow = async () => {
    await set(ref(database, 'system/bot_flow_config'), {
      nodes, globalDNA, lastUpdated: Date.now()
    });
    alert('המוח סונכרן בהצלחה!');
  };

  const runSimulation = async () => {
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
    } catch (e) { console.error(e); }
    setIsProcessing(false);
  };

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white font-sans overflow-hidden" dir="rtl">
      {/* Header סטודיו יוקרתי */}
      <header className="p-6 border-b border-white/5 bg-[#0f172a] flex justify-between items-center shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500 rounded-2xl shadow-lg shadow-purple-500/20 text-[#020617]"><GitBranch size={24}/></div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-purple-500">STUDIO</span></h1>
            <p className="text-[10px] font-bold opacity-40 tracking-[0.3em]">AI Flow & Inventory Orchestrator</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('editor')} className={`p-3 rounded-xl transition-all ${activeTab === 'editor' ? 'bg-purple-500 text-black' : 'hover:bg-white/5'}`}><Monitor size={20}/></button>
          <button onClick={() => setActiveTab('simulator')} className={`p-3 rounded-xl transition-all ${activeTab === 'simulator' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}><Smartphone size={20}/></button>
          <button onClick={saveFlow} className="px-6 py-3 bg-white text-black font-black rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-2"><Save size={18}/> סנכרן מוח</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${activeTab === 'simulator' ? 'hidden lg:block' : 'block'}`}>
          <div className="max-w-4xl mx-auto space-y-10">
            {/* DNA SECTION */}
            <section className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
              <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6 flex items-center gap-2"><Zap size={16}/> Global Brain DNA</h3>
              <textarea 
                value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-3xl p-5 text-sm outline-none focus:border-purple-500/50 transition-all leading-relaxed"
                placeholder="הגדר את האישיות והחוקים הגלובליים של ראמי..."
              />
            </section>

            {/* FLOW NODES */}
            <section className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><MessageSquare size={16}/> ענפי שיחה (Nodes)</h3>
                <button onClick={() => setNodes([...nodes, { id: Date.now(), name: 'ענף חדש', prompt: '', action: 'NONE' }])} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full hover:bg-emerald-500 hover:text-black transition-all"><Plus/></button>
              </div>
              
              {nodes.map((node, i) => (
                <div key={node.id} className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 group hover:border-purple-500/30 transition-all">
                  <div className="flex justify-between mb-4">
                    <input value={node.name} className="bg-transparent font-black text-white outline-none" onChange={(e) => {
                      const n = [...nodes]; n[i].name = e.target.value; setNodes(n);
                    }} />
                    <button onClick={() => setNodes(nodes.filter(nd => nd.id !== node.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                  </div>
                  <textarea value={node.prompt} className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-xs outline-none" onChange={(e) => {
                    const n = [...nodes]; n[i].prompt = e.target.value; setNodes(n);
                  }} placeholder="מה ה-AI יעשה בענף זה?" />
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Live Simulator Panel */}
        <aside className={`w-full lg:w-[450px] bg-[#020617] border-r border-white/5 flex flex-col ${activeTab === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Play size={14} className="text-emerald-500"/> Real-time Simulator</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-dot-pattern">
            <AnimatePresence>
              {simResponse && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl text-sm leading-relaxed text-emerald-50">
                    {simResponse.reply}
                  </div>
                  {simResponse.mediaUrl && <img src={simResponse.mediaUrl} className="rounded-2xl w-full h-40 object-cover border border-white/10" />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-[#0f172a] border-t border-white/5">
            <div className="flex gap-2 p-2 bg-black/40 rounded-3xl border border-white/10 items-center px-4">
              <input 
                value={testMessage} onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
                className="flex-1 bg-transparent border-none outline-none text-sm p-2"
                placeholder="שלח הודעת בדיקה למוח..."
              />
              <button onClick={runSimulation} className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-lg"><Zap size={18}/></button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
