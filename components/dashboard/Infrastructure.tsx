import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { 
  Database, Zap, Shield, RefreshCcw, 
  Layers, Activity, Globe, cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

// תיקון ה-Export: הפיכת הרכיב ל-Named Export כדי שה-Dashboard יזהה אותו
export const Infrastructure: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [dbStatus, setDbStatus] = useState({ firebase: 'connecting', supabase: 'connecting' });
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // בדיקת Latency וחיבור Firebase (מבוסס על הלוגיקה החכמה של הקובץ הישן)
    const start = Date.now();
    const statusRef = ref(database, '.info/connected');
    
    const unsubFirebase = onValue(statusRef, (snapshot) => {
      setLatency(Date.now() - start);
      setDbStatus(prev => ({ ...prev, firebase: snapshot.val() ? 'active' : 'offline' }));
    });

    // בדיקת חיבור Supabase
    const checkSupabase = async () => {
      const { error } = await supabase.from('inventory').select('id', { count: 'exact', head: true }).limit(1);
      setDbStatus(prev => ({ ...prev, supabase: error ? 'error' : 'active' }));
    };

    checkSupabase();
    return () => unsubFirebase();
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#020617] text-slate-200 font-sans p-6 overflow-y-auto custom-scrollbar" dir="rtl">
      
      {/* Header יוקרתי - סטטוס מערכת הוליסטי */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl mb-8 gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-inner">
            <Layers size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">CORE</span></h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">Infrastructure & Brain Sync</p>
          </div>
        </div>
        
        <div className="flex gap-8">
          <StatusItem label="Firebase RT" status={dbStatus.firebase} value={`${latency}ms`} />
          <StatusItem label="Supabase DB" status={dbStatus.supabase} value="MAPPED" />
          <StatusItem label="AI Worker" status="active" value="READY" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* טבלת זיכרון ומאגרים (Supabase) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Database size={16} className="text-emerald-500" /> מאגרי מידע ב-Supabase
            </h3>
            <button className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500">
              <RefreshCcw size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataCard title="ai_knowledge_base" desc="מאגר ידע טכני ומוצרים" status="Synced" />
            <DataCard title="customer_memory" desc="זיכרון לקוחות ו-DNA אישי" status="Active" highlight />
            <DataCard title="dispatch_orders" desc="סידור עבודה ולוגיסטיקה" status="Live" />
            <DataCard title="ai_rules" desc="ספר חוקי הבית של ראמי" status="Protected" />
          </div>
        </div>

        {/* פאנל ניטור הצינור (Pipeline) */}
        <div className="lg:col-span-4 bg-[#0f172a] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="absolute -top-10 -right-10 opacity-[0.03] text-emerald-500">
            <Zap size={200} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
              <Shield size={18} className="text-emerald-500" /> AI Execution Pipe
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-40 font-bold uppercase">Processing Mode</span>
                <span className="text-emerald-500 font-black italic">ULTRA-LOW LATENCY</span>
              </div>
              
              <div className="p-5 bg-black/30 rounded-3xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Activity size={14} className="text-emerald-500" />
                  <span>ניתוח זרם הודעות</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-60">
                  ה-AI סורק כעת את כל 12 הטבלאות המחוברות ומסנכרן בין דרישות לקוח לסידור העבודה.
                </p>
              </div>
            </div>
          </div>

          <button className="relative z-10 w-full mt-8 py-5 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all uppercase text-[10px] tracking-widest">
            Force Rebuild Memory
          </button>
        </div>
      </div>
    </div>
  );
};

// רכיבי עזר מעוצבים
const StatusItem = ({ label, status, value }: { label: string, status: string, value: string }) => (
  <div className="flex flex-col items-start md:items-end">
    <span className="text-[9px] font-black opacity-30 uppercase tracking-tighter mb-1">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-white/80">{value}</span>
      <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
    </div>
  </div>
);

const DataCard = ({ title, desc, status, highlight = false }: { title: string, desc: string, status: string, highlight?: boolean }) => (
  <div className={`p-5 rounded-3xl border transition-all cursor-pointer group ${highlight ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-white/[0.03] border-white/5 hover:border-emerald-500/20'}`}>
    <div className="flex justify-between items-center mb-3">
      <code className="text-[10px] font-mono text-emerald-500/70">{title}</code>
      <div className={`w-1.5 h-1.5 rounded-full ${highlight ? 'bg-emerald-500' : 'bg-slate-700 group-hover:bg-emerald-500'}`} />
    </div>
    <h4 className="font-bold text-sm mb-1 text-white">{desc}</h4>
    <div className="flex items-center justify-between mt-4">
      <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">{status}</span>
      <Zap size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
    </div>
  </div>
);
