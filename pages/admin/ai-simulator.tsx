'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Zap, Search, ShieldCheck, Play, 
  MessageSquare, Terminal, RefreshCw, Cpu, Database, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiSimulator() {
  const [rules, setRules] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchedRule, setMatchedRule] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('ai_rules').select('*').eq('is_active', true);
    setRules(data || []);
  };

  const runSimulation = () => {
    if (!query.trim()) return;
    setIsSimulating(true);
    setMatchedRule(null);
    setAiResponse('');

    // סימולציה של מנוע החוקים
    setTimeout(() => {
      const found = rules.find(r => 
        query.includes(r.action_type) || 
        (r.condition && query.includes(r.condition))
      );

      if (found) {
        setMatchedRule(found);
        setAiResponse(`זיהיתי חוק פעיל: "${found.instruction}". אני עוצר את הפעולה ומבקש אישור מנהל או דורש מסמכים נוספים.`);
      } else {
        setAiResponse("לא נמצאו חוקים מגבילים. הפעולה תבוצע ותוזרק ל-DB באופן אוטומטי.");
      }
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8F9FA] pb-20" dir="rtl">
        <Head>
          <title>SABAN OS | AI Simulator</title>
        </Head>

        {/* Header - PWA Style */}
        <div className="bg-white border-b border-slate-200 p-6 pt-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 italic">
                <Cpu className="text-emerald-600" size={28} /> סימולטור חוקי מוח
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">בדיקת לוגיקה בזמן אמת</p>
            </div>
            <div className="flex gap-2 items-center">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Engine Live</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6 mt-6">
          
          {/* אזור הקלט - כהה ויוקרתי */}
          <section className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white border-b-4 border-emerald-500">
            <label className="text-[11px] font-black text-emerald-400 uppercase mb-4 block tracking-[0.2em]">הזן שאילתה לבדיקת חוקים</label>
            <div className="flex gap-3">
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="למשל: 'תוסיף הובלה ללקוח חדש'..."
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
              />
              <button 
                onClick={runSimulation}
                disabled={isSimulating}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-2xl font-black flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-lg"
              >
                {isSimulating ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" size={18} />}
              </button>
            </div>
          </section>

          {/* לוח התוצאות */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* סטטוס המנוע */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-48">
              <div className="flex justify-between">
                <Terminal className="text-slate-400" size={24} />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Log</span>
              </div>
              <div className="mt-4">
                {isSimulating ? (
                  <p className="text-sm font-bold text-emerald-600 animate-pulse">סורק טבלת ai_rules...</p>
                ) : matchedRule ? (
                  <p className="text-sm font-bold text-red-500 flex items-center gap-2">
                    <AlertCircle size={16} /> נמצאה התאמה לחוק #{matchedRule.id.slice(0,4)}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-400">ממתין לפקודה...</p>
                )}
              </div>
              <div className="flex gap-1 mt-4">
                <div className={`h-1 flex-1 rounded-full ${isSimulating ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${matchedRule ? 'bg-amber-500' : 'bg-slate-100'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${aiResponse ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
              </div>
            </div>

            {/* תגובת ה-AI המשוערת */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-48">
              <div className="flex justify-between mb-4">
                <MessageSquare className="text-emerald-500" size={24} />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">AI Output</span>
              </div>
              <p className="text-sm font-black text-slate-700 leading-relaxed italic">
                {aiResponse || "הזן שאילתה כדי לראות איך המוח יגיב לצוות בשטח..."}
              </p>
            </div>
          </div>

          {/* טבלת חוקים פעילים - שליפה מהירה */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-black text-slate-800 flex items-center gap-2 italic">
                <Database size={18} className="text-slate-400" /> מאגר חוקים נוכחי
              </h2>
              <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 shadow-sm">{rules.length} חוקים פעילים</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                    <th className="p-6">פעולה</th>
                    <th className="p-6">תנאי</th>
                    <th className="p-6 text-emerald-600">הנחיית המוח</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6 text-xs font-black text-slate-900 uppercase">{rule.action_type}</td>
                      <td className="p-6 text-xs font-bold text-slate-500">{rule.condition || '—'}</td>
                      <td className="p-6 text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{rule.instruction}</td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-slate-300 font-bold text-sm">אין חוקים מוגדרים במערכת</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
