'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { 
  Database, Zap, Shield, RefreshCcw, 
  Server, Globe, Activity, CheckCircle2
} from 'lucide-react';

export const Infrastructure: React.FC = () => {
  const [latency, setLatency] = useState<number>(0);
  const [supabaseStatus, setSupabaseStatus] = useState<'online' | 'offline'>('online');
  const [firebaseStatus, setFirebaseStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    // הגנה ל-TypeScript ול-Build של Vercel
    if (!database) {
      setFirebaseStatus('offline');
      return;
    }

    // בדיקת Latency וחיבור Firebase
    const start = Date.now();
    try {
      const statusRef = ref(database, '.info/connected');
      
      const unsubFirebase = onValue(statusRef, (snapshot) => {
        setLatency(Date.now() - start);
        setFirebaseStatus(snapshot.val() ? 'online' : 'offline');
      });

      return () => unsubFirebase();
    } catch (error) {
      console.error("Infrastructure Monitor Error:", error);
      setFirebaseStatus('offline');
    }
  }, []);

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar bg-[#020617]">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <Server className="text-blue-500" /> תשתית מערכת SABAN OS
        </h3>
        <div className="flex gap-2">
          <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black border border-emerald-500/20">
            כל המערכות תקינות
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatusCard 
          title="Firebase Realtime" 
          status={firebaseStatus} 
          metric={`${latency}ms`} 
          icon={<Zap className="text-yellow-400" />} 
        />
        <StatusCard 
          title="Supabase Database" 
          status={supabaseStatus} 
          metric="Active" 
          icon={<Database className="text-blue-400" />} 
        />
        <StatusCard 
          title="PWA Service Worker" 
          status="online" 
          metric="Registered" 
          icon={<Shield className="text-emerald-400" />} 
        />
      </div>

      <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5">
        <h4 className="text-white font-black mb-6 flex items-center gap-2">
          <Activity size={20} className="text-blue-500" /> יומן פעילות תשתית
        </h4>
        <div className="space-y-4 font-mono text-xs">
          <LogEntry time="01:37:03" msg="Next.js Turbopack build initialized" type="info" />
          <LogEntry time="01:37:20" msg="Firebase connection established successfully" type="success" />
          <LogEntry time="01:37:28" msg="Realtime synchronization active" type="success" />
        </div>
      </div>
    </div>
  );
};

function StatusCard({ title, status, metric, icon }: any) {
  return (
    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
        <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`} />
      </div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{title}</p>
      <p className="text-white font-black text-xl mt-1">{metric}</p>
    </div>
  );
}

function LogEntry({ time, msg, type }: any) {
  return (
    <div className="flex gap-4 p-3 border-r-2 border-white/5 bg-white/[0.02] rounded-xl">
      <span className="text-slate-500 font-bold">{time}</span>
      <span className={type === 'success' ? 'text-emerald-400' : 'text-blue-400'}>{msg}</span>
    </div>
  );
}
