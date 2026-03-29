'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, set, onValue } from 'firebase/database';
import { Plus, Save, GitBranch, Zap, Trash2, Package, Link as LinkIcon } from 'lucide-react';

interface AIStudioProps {
  customerId?: string;
}

export const AIStudio: React.FC<AIStudioProps> = ({ customerId }) => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (!database || !customerId) return;

    const configRef = ref(database, `ai_config/${customerId}`);
    const unsubscribe = onValue(configRef, (snapshot) => {
      setConfig(snapshot.val() || { enabled: true, mode: 'auto' });
    });

    return () => unsubscribe();
  }, [customerId]);

  const saveConfig = async () => {
    if (!database || !customerId) return;
    const configRef = ref(database, `ai_config/${customerId}`);
    await set(configRef, config);
    alert('הגדרות AI נשמרו בהצלחה');
  };

  if (!customerId) return (
    <div className="h-full flex items-center justify-center text-slate-500 font-bold italic">
      בחר לקוח כדי לערוך הגדרות AI
    </div>
  );

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Zap className="text-yellow-400" /> AI STUDIO PRO
        </h3>
        <button onClick={saveConfig} className="p-2 bg-brand rounded-lg text-white">
          <Save size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-black text-slate-400 uppercase">מצב פעולה</label>
        <select 
          value={config?.mode} 
          onChange={(e) => setConfig({...config, mode: e.target.value})}
          className="w-full bg-slate-800 border-white/10 p-3 rounded-xl text-white outline-none"
        >
          <option value="auto">אוטומטי מלא</option>
          <option value="assist">עוזר אישי (אישור ידני)</option>
          <option value="off">כבוי</option>
        </select>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
        <p className="text-sm font-bold text-blue-400">ה-AI מנתח כרגע היסטוריית הזמנות כדי לייעל את הסידור הבא.</p>
      </div>
    </div>
  );
};
