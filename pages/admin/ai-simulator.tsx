'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Cpu, Send, ShieldAlert, CheckCircle2, 
  Terminal, BarChart3, Info, Zap, Search, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiStudioSimulator() {
  const [rules, setRules] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [accuracy, setAccuracy] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('ai_rules').select('*').eq('is_active', true);
    setRules(data || []);
  };

  const runAdvancedSimulation = () => {
    if (!query.trim()) return;
    setIsProcessing(true);
    setSimulationResult(null);

    // דימוי חשיבה של המוח
    setTimeout(() => {
      const matched = rules.find(r => 
        query.includes(r.action_type) || (r.condition && query.includes(r.condition))
      );

      const score = matched ? 98 : 85; // מדד דיוק משוער
      setAccuracy(score);

      setSimulationResult({
        matched: !!matched,
        rule: matched,
        response: matched 
          ? matched.instruction 
          : "✅ הפקודה תקינה. המוח יזריק נתונים לטבלת " + (query.includes('מכולה') ? 'containers' : 'orders') + ".",
        suggestion: matched 
          ? "נסה לנסח שוב ללא המגבלה או הוסף אישור מנהל." 
          : "נוסח פקודה אופטימלי: '[פעולה] [לקוח] [זמן/מיקום]'"
      });
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <Layout>
      <Head>
        <title>SABAN AI | Studio Simulator</title>
      </Head>

      <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans p-4 lg:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Side Panel: Metrics & Rules */}
          <div className="lg:col-span-4 space-y-6">
            {/* Accuracy Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-[2rem] p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <BarChart3 className="text-emerald-400" size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Metrics</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white">{accuracy}%</span>
                <span className="text-emerald-400 font-bold text-sm mb-2">דיוק חיזוי</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${accuracy}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                />
              </div>
            </div>

            {/* Compact Rules Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-[2rem] overflow-hidden backdrop-blur-xl">
              <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-black text-sm flex items-center gap-2 italic">
                  <Terminal size={18} className="text-slate-500" /> תמצית חוקי מוח
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">{rules.length} חוקים</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-[11px] text-right">
                  <tbody className="divide-y divide-slate-700">
                    {rules.map(r => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-black text-emerald-500 w-20">{r.action_type}</td>
                        <td className="p-3 text-slate-400 italic">{r.instruction.slice(0, 40)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Main Content: Chat Simulator */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
              
              {/* Chat Header */}
              <header className="p-6 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/20">
                    <Cpu className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-white leading-none italic">SABAN AI STUDIO</h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1 tracking-widest animate-pulse">Simulator Active</p>
                  </div>
                </div>
                <Zap className="text-slate-600" size={20} />
              </header>

              {/* Chat Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <AnimatePresence>
                  {query && !isProcessing && simulationResult && (
                    <>
                      {/* User Bubble */}
                      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex justify-start">
                        <div className="bg-slate-700 text-white p-4 rounded-2xl rounded-tr-none max-w-[80%] font-bold shadow-lg border border-slate-600">
                          {query}
                        </div>
                      </motion.div>

                      {/* AI Response Bubble */}
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex justify-end">
                        <div className={`p-5 rounded-2xl rounded-tl-none max-w-[85%] shadow-2xl border-2 ${
                          simulationResult.matched ? 'bg-red-950/40 border-red-500 text-red-100' : 'bg-emerald-950/40 border-emerald-500 text-emerald-100'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {simulationResult.matched ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                              {simulationResult.matched ? 'Rule Triggered' : 'Action Approved'}
                            </span>
                          </div>
                          <p className="text-sm font-black leading-relaxed">{simulationResult.response}</p>
                          
                          {/* עזרה בצורת נוסח פקודה */}
                          <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2">
                            <HelpCircle size={14} className="mt-1 opacity-50" />
                            <div>
                              <p className="text-[10px] font-bold opacity-50 uppercase mb-1">טיפ לניסוח פקודה:</p>
                              <p className="text-[11px] font-medium bg-black/30 p-2 rounded-lg italic text-blue-300">{simulationResult.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                
                {isProcessing && (
                  <div className="flex justify-center py-10">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="text-emerald-500 animate-spin" size={32} />
                      <span className="text-xs font-black text-emerald-500/50 animate-pulse tracking-widest uppercase">Analyzing Logic...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                <div className="max-w-3xl mx-auto flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      value={query} onChange={(e) => setQuery(e.target.value)}
                      placeholder="הזן פקודה לבדיקה (למשל: תמחק הזמנה)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={runAdvancedSimulation}
                    disabled={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 rounded-2xl font-black shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
                  >
                    <Send size={20} className="rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

function RefreshCw({ className, size }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
    </svg>
  );
}
