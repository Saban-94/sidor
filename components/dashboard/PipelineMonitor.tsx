'use client';

import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Activity, ArrowDownLeft, ArrowUpRight, Zap, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PipelineMonitor: React.FC = () => {
  const [packets, setPackets] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // הגנה ל-TypeScript ול-Build של Vercel
    if (!database) {
      setIsLive(false);
      return;
    }

    try {
      // האזנה לחבילות מידע נכנסות ויוצאות ב-Realtime
      const incomingRef = ref(database, 'rami/incoming');
      const outgoingRef = ref(database, 'rami/outgoing');

      const unsubscribeIncoming = onValue(incomingRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const newPacket = { id: Date.now(), type: 'incoming', ...data };
          setPackets(prev => [newPacket, ...prev].slice(0, 10));
          setIsLive(true);
        }
      });

      return () => {
        unsubscribeIncoming();
      };
    } catch (error) {
      console.error("Pipeline Monitor Error:", error);
      setIsLive(false);
    }
  }, []);

  return (
    <div className="bg-[#0f172a]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Activity className="text-blue-500" size={24} />
          </div>
          <div>
            <h3 className="text-white font-black text-lg">PIPELINE MONITOR</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saban AI Logic Flow</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            {isLive ? 'Live Sync' : 'Standby'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {packets.map((packet) => (
            <motion.div
              key={packet.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${packet.type === 'incoming' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {packet.type === 'incoming' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <p className="text-xs font-black text-white">{packet.type === 'incoming' ? 'INCOMING DATA' : 'AI RESPONSE'}</p>
                  <p className="text-[10px] font-bold text-slate-500 italic truncate w-40">{packet.payload || 'Processing packet...'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-blue-400/50">0.02ms</p>
                <Zap size={12} className="text-yellow-500/50 inline-block" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {packets.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
            <Terminal size={40} className="mb-4 text-slate-400" />
            <p className="text-sm font-bold text-slate-400">Waiting for data stream...</p>
          </div>
        )}
      </div>
    </div>
  );
};
