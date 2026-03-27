import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, set, onValue } from 'firebase/database';
import { 
  Plus, Save, GitBranch, Zap, Trash2, 
  Package, Link as LinkIcon, Search, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

// הגדרת Props תקינה למניעת שגיאת ה-Build ב-Dashboard
interface AIStudioProps {
  customerId?: string;
}

export const AIStudio: React.FC<AIStudioProps> = ({ customerId }) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 1. טעינת ה-Flow מה-Firebase
    const flowRef = ref(database, 'system/bot_flow_config');
    const unsubFlow = onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    // 2. שליפת מלאי מ-Supabase לצורך לינקי קסם
    const fetchInv = async () => {
      const { data } = await supabase
        .from('inventory')
        .select('sku, product_name, price, image_url')
        .limit(10);
      if (data) setInventory(data);
    };

    fetchInv();
    return () => unsubFlow();
  }, []);

  const saveFlow = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'system/bot_flow_config'), {
        nodes,
        globalDNA,
        lastUpdated: Date.now()
      });
      alert('המוח סונכרן בהצלחה!');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col bg-[#0f172a]/30 border-r border-white/5 text-white font-sans p-6 overflow-y-auto custom-scrollbar" dir="rtl">
      
      {/* Header סטודיו */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <GitBranch size={22} className="text-white" />
          </div>
          <h2 className="font-black italic tracking-tighter">SABAN <span className="text-purple-400">STUDIO</span></h2>
        </div>
        <button 
          onClick={saveFlow} disabled={saving}
          className="p-2 bg-emerald-500 text-slate-900 rounded-lg hover:scale-105 transition-all shadow-lg"
        >
          <Save size={18} />
        </button>
      </div>

      {/* DNA Section */}
      <div className="mb-8 space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
          <Zap size={14} /> Global Brain DNA
        </label>
        <textarea 
          value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)}
          className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-purple-500/50 transition-all"
          placeholder="אישיות המוח..."
        />
      </div>

      {/* Nodes Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Conversation Nodes</h3>
          <button 
            onClick={() => setNodes([...nodes, { id: Date.now(), name: 'ענף חדש', prompt: '' }])}
            className="text-emerald-500 hover:scale-110 transition-transform"
          ><Plus size={20} /></button>
        </div>

        {nodes.map((node, i) => (
          <div key={node.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 group">
            <div className="flex justify-between">
              <input 
                value={node.name} 
                onChange={(e) => {
                  const n = [...nodes]; n[i].name = e.target.value; setNodes(n);
                }}
                className="bg-transparent font-bold text-sm text-emerald-400 outline-none"
              />
              <button onClick={() => setNodes(nodes.filter(nd => nd.id !== node.id))} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                <Trash2 size={14} />
              </button>
            </div>
            <textarea 
              value={node.prompt} 
              onChange={(e) => {
                const n = [...nodes]; n[i].prompt = e.target.value; setNodes(n);
              }}
              className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-[11px] outline-none"
              placeholder="פקודה למוח בענף זה..."
            />
          </div>
        ))}
      </div>

      {/* Inventory Quick View (חיבור מלאי) */}
      <div className="mt-10 pt-10 border-t border-white/5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
          <Package size={14} /> Inventory & Magic Links
        </h3>
        <div className="space-y-3">
          {inventory.map((item) => (
            <div key={item.sku} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                {item.image_url && <img src={item.image_url} className="w-8 h-8 rounded-lg object-cover" />}
                <div>
                  <p className="text-[10px] font-bold text-white/80">{item.product_name}</p>
                  <p className="text-[9px] text-emerald-500 font-mono">{item.sku}</p>
                </div>
              </div>
              <a 
                href={`/product/${item.sku}`} 
                target="_blank"
                className="p-1.5 bg-white/5 rounded-lg text-white/40 hover:text-emerald-500 transition-colors"
              >
                <LinkIcon size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
