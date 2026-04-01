import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { processCommanderCommand } from '../lib/ai-commander-core';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, Layers, Bell } from 'lucide-react';
import OrderBoard from '../components/OrderBoard';

export default function CommanderApp() {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const handleCommand = async () => {
    const response = await processCommanderCommand(input, 'ראמי מסארווה');
    setLogs(prev => [`> ${input}`, `[AI]: ${response?.msg}`, ...prev]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-950 p-4 lg:p-8 overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[90vh]">
        
        {/* Layer 1: The Input & AI Console (צד ימין - המוח) */}
        <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col overflow-hidden">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2 italic font-black">
              <Zap className="text-emerald-400" /> COMMANDER AI
            </div>
            <Bell size={18} className="text-slate-400 animate-pulse" />
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2 opacity-60">
             {logs.map((log, i) => <div key={i} className={log.startsWith('[AI]') ? 'text-emerald-500' : 'text-slate-500'}>{log}</div>)}
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
            <div className="relative group">
              <input 
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                placeholder="פקודה למפקד..."
                className="w-full bg-white dark:bg-slate-950 p-5 rounded-2xl border-none shadow-inner font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button onClick={handleCommand} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-emerald-500 rounded-xl text-white shadow-lg active:scale-90 transition-all">
                <Send size={20} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* Layer 2: The Order Board (מרכז - לוח הזמנות) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           <OrderBoard />
        </div>
      </div>
    </div>
  );
}
