import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { 
  Database, Zap, Shield, RefreshCcw, 
  Layers, Activity, Globe, Cpu 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Named Export קבוע - מונע שגיאת Build ב-Dashboard
export const Infrastructure: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [dbStatus, setDbStatus] = useState({ firebase: 'connecting', supabase: 'connecting' });
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // בדיקת Latency וחיבור Firebase
    const start = Date.now();
    const statusRef = ref(database, '.info/connected');
    
    const unsubFirebase = onValue(statusRef, (snapshot) => {
      setLatency(Date.now() - start);
      setDbStatus(prev => ({ ...prev, firebase: snapshot.val() ? 'active' : 'offline' }));
    });

    const checkSupabase = async () => {
      try {
        const { error } = await supabase.from('inventory').select('sku').limit(1);
        setDbStatus(prev => ({ ...prev, supabase: error ? 'error' : 'active' }));
      } catch (e) {
        setDbStatus(prev => ({ ...prev, supabase: 'error' }));
      }
    };

    checkSupabase();
    return () => unsubFirebase();
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#020617] text-slate-200 font-sans p-6 overflow-y-auto custom-scrollbar" dir="rtl">
      
      {/* Header פרימיום - המוח הלוגיסטי */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between bg-[#0f172a] p-8 rounded-[3rem] border border-white/5 shadow-2xl mb-10 gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="p-5 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-inner ring-1 ring-emerald-500/20">
            <Layers size={36} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white">SABAN <span className="text-emerald-500">CORE</span></h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30 mt-1">Infrastructure Control Center</p>
          </div>
        </div>
        
        <div className="flex gap-10">
          <StatusItem label="Firebase RT" status={dbStatus.firebase} value={`${latency}ms`} />
          <StatusItem label="Supabase DB" status={dbStatus.supabase} value="MAPPED" />
          <StatusItem label="AI Processor" status="active" value="READY" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* טבלאות זיכרון ומאגרים */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-white/90">
              <Database size={18} className="text-emerald-500" /> Supabase Brain Storage
            </h3>
            <div className="flex items-center gap-2 text-[10px] opacity-30 font-bold uppercase">
              <RefreshCcw size={14} className="animate-spin-slow" />
              Live Sync
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataCard title="ai_knowledge_base" desc="מאגר ידע טכני ומוצרים" status="Synced" />
            <DataCard title="customer_memory" desc="זיכרון לקוחות ו-DNA אישי" status="Active" highlight />
            <DataCard title="dispatch_orders" desc="סידור עבודה ולוגיסטיקה" status="Live" />
            <DataCard title="ai_rules" desc="ספר חוקי הבית של ראמי" status="Locked" />
          </div>
        </div>

        {/* פאנל ביצוע (AI Execution) */}
        <div className="lg:col-span-4 bg-[#0f172a] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden flex flex-col justify-between shadow-2xl group">
          <div className="absolute -top-12 -right-12 opacity-[0.02] text-emerald-500 group-hover:opacity-[0.05] transition-opacity">
            <Zap size={250} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-3 text-white">
              <Shield size={20} className="text-emerald-500" /> AI Action Pipeline
            </h3>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between text-[10px]">
                <span className="opacity-30 font-bold uppercase tracking-widest">Core Status</span>
                <span className="text-emerald-500 font-black italic tracking-tighter">OPERATIONAL</span>
              </div>
              
              <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 space-y-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-black text-white italic">
                  <Activity size={16} className="text-emerald-500" />
                  <span>Real-time Stream Analysis</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-50 font-medium">
                  המערכת מבצעת כעת סנכרון רציף בין ה-CRM לסידור העבודה, תוך אופטימיזציה של Gemini למניעת Latency.
                </p>
              </div>
            </div>
          </div>

          <button className="relative z-10 w-full mt-10 py-5 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]">
            Clear Brain Cache
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ label, status, value }: { label: string, status: string, value: string }) => (
  <div className="flex flex-col items-start md:items-end">
    <span className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">{label}</span>
    <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
      <span className="text-[11px] font-black text-white tracking-tighter">{value}</span>
      <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`} />
    </div>
  </div>
);

const DataCard = ({ title, desc, status, highlight = false }: { title: string, desc: string, status: string, highlight?: boolean }) => (
  <div className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${highlight ? 'bg-emerald-500/5 border-emerald-500/30 shadow-2xl shadow-emerald-500/5' : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.04]'}`}>
    <div className="flex justify-between items-center mb-4">
      <code className="text-[10px] font-mono text-emerald-500/60 font-bold">{title}</code>
      <div className={`w-2 h-2 rounded-full ${highlight ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800 group-hover:bg-emerald-500'}`} />
    </div>
    <h4 className="font-black text-[15px] mb-2 text-white/90">{desc}</h4>
    <div className="flex items-center justify-between mt-6">
      <span className="text-[10px] font-black uppercase opacity-20 tracking-[0.2em] group-hover:opacity-50 transition-opacity">{status}</span>
      <Cpu size={14} className="opacity-0 group-hover:opacity-100 transition-all text-emerald-500 translate-x-2 group-hover:translate-x-0" />
    </div>
  </div>
);
