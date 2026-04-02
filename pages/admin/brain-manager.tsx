'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Brain, Database, Smartphone, RefreshCcw, Trash2, Edit3, Save, X } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BrainManager() {
  const [activeTab, setActiveTab] = useState<'inject' | 'simulator'>('inject');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '' });

  // State לסימולטור
  const [simMessages, setSimMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    const { data } = await supabase.from('ai_training').select('*').order('created_at', { ascending: false });
    if (data) setTrainingData(data);
  };

  const injectKnowledge = async () => {
    if (!question || !answer) return alert("אחי, תמלא את כל השדות");
    setIsTraining(true);
    const { error } = await supabase.from('ai_training').insert([{ question, answer, category: 'manual' }]);
    setIsTraining(false);
    if (!error) {
      setQuestion(''); setAnswer('');
      fetchTrainingData();
    }
  };

  const deleteRow = async (id: number) => {
    if (!confirm("בטוח שרוצה למחוק מהזיכרון?")) return;
    await supabase.from('ai_training').delete().eq('id', id);
    fetchTrainingData();
  };

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditForm({ question: row.question, answer: row.answer });
  };

  const saveEdit = async (id: number) => {
    await supabase.from('ai_training').update(editForm).eq('id', id);
    setEditingId(null);
    fetchTrainingData();
  };

  const testInSimulator = async () => {
    if (!simInput.trim()) return;
    const userMsg = simInput;
    setSimMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSimInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: 'simulator' })
      });
      const data = await res.json();
      setSimMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', content: "שגיאה בחיבור" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] font-sans flex flex-col" dir="rtl">
      
      {/* Header & Tabs */}
      <div className="p-4 bg-[#111b21] border-b border-white/5 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="text-emerald-500" size={24} />
            <h1 className="text-lg font-black italic uppercase">Brain Control V2.0</h1>
          </div>
        </div>
        <div className="flex p-1 bg-[#202c33] rounded-xl">
          <button onClick={() => setActiveTab('inject')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inject' ? 'bg-emerald-500 text-[#0b141a]' : 'text-[#8696a0]'}`}>הזרקה וניהול</button>
          <button onClick={() => setActiveTab('simulator')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'simulator' ? 'bg-emerald-500 text-[#0b141a]' : 'text-[#8696a0]'}`}>סימולטור</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === 'inject' && (
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Form */}
            <div className="bg-[#111b21] rounded-2xl p-5 border border-white/5">
              <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="מילת מפתח..." className="w-full p-4 bg-[#202c33] rounded-xl mb-4 font-bold outline-none focus:ring-1 focus:ring-emerald-500" />
              <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3} placeholder="תשובה..." className="w-full p-4 bg-[#202c33] rounded-xl mb-4 outline-none focus:ring-1 focus:ring-emerald-500" />
              <button onClick={injectKnowledge} disabled={isTraining} className="w-full py-4 bg-emerald-500 text-[#0b141a] rounded-xl font-black flex items-center justify-center gap-2">
                {isTraining ? <RefreshCcw className="animate-spin" /> : <Database size={18} />} הזרק לזיכרון
              </button>
            </div>

            {/* Live Data Table */}
            <div className="bg-[#111b21] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/5 bg-[#202c33]/50 font-bold text-emerald-500 flex items-center gap-2">
                <LayoutGrid size={16} /> זיכרון קיים במוח ({trainingData.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-[#202c33] text-[#8696a0] text-xs uppercase">
                    <tr>
                      <th className="p-4">מילת מפתח</th>
                      <th className="p-4">תשובה</th>
                      <th className="p-4 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trainingData.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-emerald-400">
                          {editingId === row.id ? 
                            <input value={editForm.question} onChange={e => setEditForm({...editForm, question: e.target.value})} className="bg-[#2a3942] p-1 rounded w-full outline-none border border-emerald-500" /> 
                            : row.question}
                        </td>
                        <td className="p-4 text-[#8696a0] max-w-[200px] truncate">
                          {editingId === row.id ? 
                            <textarea value={editForm.answer} onChange={e => setEditForm({...editForm, answer: e.target.value})} className="bg-[#2a3942] p-1 rounded w-full outline-none border border-emerald-500" /> 
                            : row.answer}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            {editingId === row.id ? (
                              <>
                                <button onClick={() => saveEdit(row.id)} className="text-emerald-500"><Save size={18} /></button>
                                <button onClick={() => setEditingId(null)} className="text-red-400"><X size={18} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(row)} className="text-[#8696a0] hover:text-white"><Edit3 size={18} /></button>
                                <button onClick={() => deleteRow(row.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={18} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Simulator (אותה לוגיקה מקודם) */}
        {activeTab === 'simulator' && (
          <div className="max-w-[400px] mx-auto h-[65vh] flex flex-col bg-[#111b21] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a]">
              {simMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[#202c33]' : 'bg-[#005c4b]'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <div className="p-3 bg-[#111b21] flex gap-2">
              <input value={simInput} onChange={e => setSimInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && testInSimulator()} placeholder="בדוק אותי..." className="flex-1 bg-[#2a3942] p-3 rounded-xl text-xs outline-none" />
              <button onClick={testInSimulator} className="bg-emerald-500 p-3 rounded-xl text-[#111b21]"><Send size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const LayoutGrid = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);
