'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Copy, Check, Link as LinkIcon, 
  History, Package, MapPin, Truck, Brain, 
  ExternalLink, Edit3, Save, Plus, X, UserPlus, CreditCard
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function CustomerUnifiedManager() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    user_name: '',
    clientId: '',
    accumulated_knowledge: '',
    project_name: '',
    address: ''
  });

  // נתוני הכרטיס הנבחר
  const [customerData, setCustomerData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data } = await supabase
      .from('customer_memory')
      .select('clientId, user_name, updated_at')
      .order('updated_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  }

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
  };

  const handleCreateCustomer = async () => {
    setLoading(true);
    const { clientId, user_name, accumulated_knowledge, project_name, address } = formData;

    // 1. יצירת זיכרון לקוח
    await supabase.from('customer_memory').upsert({ clientId, user_name, accumulated_knowledge });
    
    // 2. יצירת פרויקט ראשון
    if (project_name) {
      await supabase.from('customer_projects').insert({ 
        customer_id: clientId, 
        project_name, 
        address 
      });
    }

    await loadCustomers();
    setIsModalOpen(false);
    setLoading(false);
    setFormData({ user_name: '', clientId: '', accumulated_knowledge: '', project_name: '', address: '' });
  };

  const copyLink = (phone: string) => {
    navigator.clipboard.writeText(`https://sidor.vercel.app/chat2/${phone}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans" dir="rtl">
      {/* Navbar יוקרתי */}
      <nav className="bg-[#0f172a] text-white p-4 sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter hidden sm:block">SABAN <span className="text-emerald-500">CONTROL</span></h1>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" placeholder="חיפוש מהיר..."
                className="bg-white/10 border border-white/10 rounded-2xl py-2 pr-10 pl-4 text-sm outline-none focus:ring-2 ring-emerald-500/50 w-64"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black transition-all shadow-lg shadow-emerald-500/20"
            >
              <UserPlus className="w-4 h-4" /> הקם לקוח
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar לקוחות */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">בריכת לקוחות</h2>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto no-scrollbar">
              {customers.filter(c => c.user_name?.includes(searchTerm) || c.clientId.includes(searchTerm)).map(c => (
                <button 
                  key={c.clientId} onClick={() => fetchFullCustomerData(c.clientId)}
                  className={`w-full text-right p-4 rounded-2xl transition-all border ${
                    selectedPhone === c.clientId 
                    ? 'bg-[#0f172a] text-white border-transparent shadow-xl translate-x-1' 
                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-white hover:border-emerald-500'
                  }`}
                >
                  <p className="font-bold text-sm truncate">{c.user_name || 'אורח'}</p>
                  <p className={`text-[10px] font-mono mt-1 ${selectedPhone === c.clientId ? 'text-emerald-400' : 'text-slate-400'}`}>{c.clientId}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* כרטיס לקוח מרכזי */}
        <main className="lg:col-span-9 space-y-6">
          {customerData ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              {/* Header כרטיס */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[#0f172a] rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                    {customerData.user_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">{customerData.user_name}</h2>
                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                      <CreditCard className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-mono uppercase tracking-widest">ID: {customerData.clientId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => copyLink(customerData.clientId)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-4 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all border border-emerald-100"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />} לינק קסם
                  </button>
                  <button className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-black text-lg text-[#0f172a]">זיכרון רויטל</h3>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed border border-slate-100 italic shadow-inner">
                    {customerData.accumulated_knowledge || 'ממתין לנתוני שיחה ראשונים...'}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-black text-lg text-[#0f172a]">אתרים ופרויקטים</h3>
                  </div>
                  <div className="space-y-3">
                    {projects.map((p, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-[#0f172a]">{p.project_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.address}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg"><MapPin className="w-3 h-3 text-emerald-500" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* טבלת לוגיסטיקה מעוצבת */}
              <div className="bg-[#0f172a] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-50"></div>
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-emerald-500" />
                    <h3 className="text-xl font-black text-white">מדד לוגיסטיקה ומכולות</h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <th className="pr-4">פעילות</th>
                        <th>פירוט לוגיסטי</th>
                        <th className="text-center">סטטוס</th>
                        <th className="pl-4 text-left">מועד</th>
                      </tr>
                    </thead>
                    <tbody>
                      {containers.map((c) => (
                        <tr key={c.id} className="bg-white/5 hover:bg-white/10 transition-all cursor-default group">
                          <td className="py-5 pr-6 rounded-r-2xl border-r border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="bg-emerald-500/20 p-2 rounded-lg"><Truck className="w-4 h-4 text-emerald-500" /></div>
                              <span className="font-black text-white text-xs uppercase tracking-tighter">{c.action_type}</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <p className="font-bold text-white text-sm">{c.container_size || '8 קוב'}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{c.delivery_address}</p>
                          </td>
                          <td className="py-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                              c.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/5'
                            }`}>
                              {c.is_active ? 'פעיל במערכת' : 'הסתיים'}
                            </span>
                          </td>
                          <td className="py-5 pl-6 text-left rounded-l-2xl border-l border-white/5 text-[11px] font-mono text-slate-500">
                            {new Date(c.start_date).toLocaleDateString('he-IL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
              <Users className="w-16 h-16 mb-6 opacity-10" />
              <p className="text-xl font-bold">בחר לקוח מהרשימה לצפייה בתיק המלא</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal הקמת לקוח חדש */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button onClick={() => setIsModalOpen(false)} className="absolute left-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20"><UserPlus className="w-6 h-6 text-white" /></div>
                <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">הקמת זהות לקוח</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input type="text" placeholder="שם הלקוח / חברה" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-500/50" value={formData.user_name} onChange={e => setFormData({...formData, user_name: e.target.value})} />
                  <input type="tel" placeholder="מספר נייד (clientId)" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-500/50 font-mono" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder="שם הפרויקט הראשון" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-500/50" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} />
                  <input type="text" placeholder="כתובת הפרויקט" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-500/50" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <textarea className="col-span-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-500/50 h-32" placeholder="זיכרון ראשוני לרויטל (למשל: עובד רק במזומן, פריקה רק עם מנוף...)" value={formData.accumulated_knowledge} onChange={e => setFormData({...formData, accumulated_knowledge: e.target.value})} />
              </div>

              <button 
                onClick={handleCreateCustomer}
                className="w-full mt-8 bg-[#0f172a] text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" /> צור זהות לקוח ופרויקט
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
