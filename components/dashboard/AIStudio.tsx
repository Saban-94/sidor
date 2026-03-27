import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, set, onValue } from 'firebase/database';
import { Plus, Save, GitBranch, Zap, Trash2, Package, Link as LinkIcon } from 'lucide-react';

// הגדרה מפורשת של ה-Props - קריטי למניעת שגיאת ה-Build
interface AIStudioProps {
  customerId?: string;
}

export const AIStudio: React.FC<AIStudioProps> = ({ customerId }) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // טעינת ה-Flow
    const flowRef = ref(database, 'system/bot_flow_config');
    const unsubFlow = onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });

    // טעינת מלאי ללינקי קסם
    const fetchInv = async () => {
      const { data } = await supabase.from('inventory').select('sku, product_name').limit(5);
      if (data) setInventory(data);
    };

    fetchInv();
    return () => unsubFlow();
  }, [customerId]); // מאזין לשינוי לקוח

  const saveFlow = async () => {
    setSaving(true);
    await set(ref(database, 'system/bot_flow_config'), { nodes, globalDNA, lastUpdated: Date.now() });
    setSaving(false);
    alert('סונכרן!');
  };

  return (
    <div className="h-full bg-[#0f172a]/30 p-6 overflow-y-auto" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-black italic text-white">SABAN STUDIO</h2>
        <button onClick={saveFlow} className="p-2 bg-emerald-500 rounded-lg"><Save size={18}/></button>
      </div>
      
      {/* תצוגת המלאי עם לינקי קסם */}
      <div className="space-y-2">
        {inventory.map(item => (
          <div key={item.sku} className="p-2 bg-white/5 rounded flex justify-between items-center text-[10px]">
            <span className="text-white/70">{item.product_name}</span>
            <a href={`/product/${item.sku}`} target="_blank" className="text-emerald-500"><LinkIcon size={12}/></a>
          </div>
        ))}
      </div>
    </div>
  );
};
