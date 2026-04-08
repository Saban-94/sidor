'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Copy, Check, Link as LinkIcon, 
  History, Package, MapPin, Truck, Brain, 
  ExternalLink, Edit3, Save, Plus, ArrowRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function CustomerUnifiedCard() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // נתוני הכרטיס הנבחר
  const [customerData, setCustomerData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);

  // 1. שליפת רשימת לקוחות ראשונית
  useEffect(() => {
    async function loadInitialData() {
      const { data } = await supabase
        .from('customer_memory')
        .select('clientId, user_name, updated_at')
        .order('updated_at', { ascending: false });
      if (data) setCustomers(data);
      setLoading(false);
    }
    loadInitialData();
  }, []);

  // 2. שליפת כרטיס לקוח מאוחד (3 טבלאות)
  const fetchFullCustomerData = async (phone: string) => {
    setLoading(true);
    setSelectedPhone(phone);
    
    const [memory, projs, conts] = await Promise.all([
      supabase.from('customer_memory').select('*').eq('clientId', phone).single(),
      supabase.from('customer_projects').select('*').eq('customer_id', phone),
      supabase.from('container_management').select('*').eq('client_phone', phone)
    ]);

    setCustomerData(memory.data);
    setProjects(projs.data || []);
    setContainers(conts.data || []);
    setLoading(false);
    setIsEditing(false);
  };

  const generateMagicLink = (phone: string) => `https://sidor.vercel.app/chat2/${phone}`;

  const copyLink = (phone: string) => {
    navigator.clipboard.writeText(generateMagicLink(phone));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !selectedPhone) return <div className="h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900 font-bold">טוען מערכת...</div>;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900" dir="rtl">
      {/* Navigation Header */}
      <nav className="bg-[#0f172a] text-white p-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">SABAN CRM</h1>
          </div>
          <div className="relative w-48 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="חיפוש לקוח..."
              className="w-full bg-white/10 border border-white/10 rounded-xl py-2 pr-9 pl-4 text-sm outline-none focus:bg-white/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar - רשימת לקוחות (מובייל: נפתח/נסגר, דסקטופ: קבוע) */}
        <aside className="lg:col-span-3 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">לקוחות אחרונים</h2>
          <div className="space-y-2 overflow-y-auto max-h-[70vh] no-scrollbar">
            {customers.filter(c => c.user_name?.includes(searchTerm) || c.clientId.includes(searchTerm)).map(c => (
              <button 
                key={c.clientId}
                onClick={() => fetchFullCustomerData(c.clientId)}
                className={`w-full text-right p-4 rounded-2xl transition-all border ${
                  selectedPhone === c.clientId 
                  ? 'bg-[#0f172a] text-white border-transparent shadow-md' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500'
                }`}
              >
                <p className="font-bold text-sm truncate">{c.user_name || 'אורח'}</p>
                <p className={`text-[10px] ${selectedPhone === c.clientId ? 'text-emerald-400' : 'text-slate-400'}`}>{c.clientId}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content - כרטיס לקוח מאוחד */}
        <main className="lg:col-span-9 space-y-6">
          {customerData ? (
            <>
              {/* Header כרטיס */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                    {customerData.user_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#0f172a]">{customerData.user_name || 'לקוח לא מזוהה'}</h2>
                    <p className="text-slate-500 font-mono text-sm">{customerData.clientId}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => copyLink(customerData.clientId)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all border border-emerald-200"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                    לינק קסם
                  </button>
                  <button className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all border border-slate-200">
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grid נתונים */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* זיכרון רויטל */}
                <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4 text-[#0f172a]">
                    <Brain className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-black text-lg">בריכת ידע (רויטל)</h3>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed italic border border-slate-100">
                    {customerData.accumulated_knowledge || 'אין מידע צבור עדיין...'}
                  </div>
                </section>

                {/* פרויקטים פעילים */}
                <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4 text-[#0f172a]">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-black text-lg">אתרי עבודה / פרויקטים</h3>
                  </div>
                  <div className="space-y-3">
                    {projects.length > 0 ? projects.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="bg-white p-2 rounded-lg shadow-sm"><MapPin className="w-4 h-4 text-slate-400" /></div>
                        <div>
                          <p className="font-bold text-sm text-[#0f172a]">{p.project_name}</p>
                          <p className="text-[10px] text-slate-500">{p.address}</p>
                        </div>
                      </div>
                    )) : <p className="text-xs text-slate-400 text-center py-4">לא נמצאו פרויקטים רשומים</p>}
                  </div>
                </section>
              </div>

              {/* טבלת היסטוריה חכמה - מכולות והזמנות */}
              <section className="bg-[#0f172a] rounded-[2rem] p-6 shadow-xl text-white overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-black text-lg">מדד הזמנות ולוגיסטיקה</h3>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30 uppercase">
                    Full History
                  </span>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-white/5 uppercase text-[10px] font-black tracking-widest">
                        <th className="pb-4 pr-2">סוג</th>
                        <th className="pb-4">תיאור / פריטים</th>
                        <th className="pb-4 text-center">סטטוס</th>
                        <th className="pb-4 text-left pl-2">תאריך</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {/* שורות מכולות מ-container_management */}
                      {containers.map((c) => (
                        <tr key={c.id} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4 pr-2 text-emerald-500 font-black flex items-center gap-2">
                            <Truck className="w-3 h-3" />
                            מכולה
                          </td>
                          <td className="py-4">
                            <p className="text-white font-bold">{c.action_type === 'PLACEMENT' ? 'הצבה' : 'פינוי'} - {c.container_size || '8 קוב'}</p>
                            <p className="text-[10px] text-slate-500">{c.delivery_address}</p>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-black border ${
                              c.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {c.is_active ? 'פעיל' : 'הסתיים'}
                            </span>
                          </td>
                          <td className="py-4 text-left pl-2 text-slate-500 text-[11px] font-mono">{new Date(c.start_date).toLocaleDateString('he-IL')}</td>
                        </tr>
                      ))}
                      {/* כאן יתווספו שורות מ-orders בעתיד */}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-300">
              <Users className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold">בחר לקוח כדי לצפות בכרטיס המאוחד</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
