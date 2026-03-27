import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, set, onValue } from 'firebase/database';
import { 
  Plus, Save, GitBranch, MessageSquare, 
  Play, Trash2, Zap, Settings, Share2 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AIStudio = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [saving, setSaving] = useState(false);

  // טעינת מבנה העץ הקיים מ-Firebase
  useEffect(() => {
    const flowRef = ref(database, 'system/bot_flow_config');
    return onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });
  }, []);

  const addNode = () => {
    const newNode = {
      id: `NODE_${Date.now()}`,
      name: 'ענף חדש',
      prompt: 'מה ה-AI צריך לעשות כאן?',
      action: 'NONE',
      trigger: ''
    };
    setNodes([...nodes, newNode]);
  };

  const saveFlow = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'system/bot_flow_config'), {
        nodes,
        globalDNA,
        lastUpdated: Date.now()
      });
      alert('הסטודיו סונכרן למוח בהצלחה!');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] text-white p-6 overflow-hidden font-sans" dir="rtl">
      {/* Header הסטודיו */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <GitBranch size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">RAMI <span className="text-purple-500">STUDIO</span></h1>
            <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Logic & Flow Builder</p>
          </div>
        </div>
        <button 
          onClick={saveFlow} disabled={saving}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-[#020617] font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
        >
          <Save size={18} /> {saving ? 'מסנכרן...' : 'עדכן מוח'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        {/* הגדרות DNA גלובליות */}
        <div className="col-span-4 space-y-6">
          <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-purple-500">
              <Zap size={16} /> Global DNA
            </h3>
            <textarea 
              value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)}
              placeholder="הגדר את האישיות הבסיסית של ראמי..."
              className="w-full h-40 bg-black/20 border border-white/10 rounded-2xl p-4 text-xs leading-relaxed outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          
          <button onClick={addNode} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl opacity-40 hover:opacity-100 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2 font-bold text-sm">
            <Plus size={18} /> הוסף ענף שיחה
          </button>
        </div>

        {/* עץ הענפים */}
        <div className="col-span-8 overflow-y-auto space-y-4 custom-scrollbar pb-20">
          {nodes.map((node, index) => (
            <motion.div 
              key={node.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 relative group"
            >
              <div className="flex items-center justify-between mb-4">
                <input 
                  value={node.name} onChange={(e) => {
                    const newNodes = [...nodes];
                    newNodes[index].name = e.target.value;
                    setNodes(newNodes);
                  }}
                  className="bg-transparent font-black text-emerald-500 outline-none w-1/2"
                />
                <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-widest">Logic / Prompt</label>
                  <input 
                    value={node.prompt} onChange={(e) => {
                      const newNodes = [...nodes];
                      newNodes[index].prompt = e.target.value;
                      setNodes(newNodes);
                    }}
                    className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-emerald-500/30"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
