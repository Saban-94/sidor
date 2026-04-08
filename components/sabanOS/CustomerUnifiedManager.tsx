'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Copy, Check, Link as LinkIcon, 
  History, Package, MapPin, Truck, Brain, 
  ExternalLink, Edit3, Save, Plus, X, UserPlus, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // הייבוא החסר שתוקן
import { createClient } from '@supabase/supabase-js';

// הגדרת דף דינמי למניעת שגיאות Prerendering ב-Build
export const dynamic = 'force-dynamic';

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
    try {
      const { data } = await supabase
        .from('customer_memory')
        .select('clientId, user_name, updated_at')
        .order('updated_at', { ascending: false });
      if (data) setCustomers(data);
    } catch (e) {
      console.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
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

    await supabase.from('customer_memory').upsert({ 
      clientId, 
      user_name, 
      accumulated_knowledge,
      updated_at: new Date() 
    });
    
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

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.clientId.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900" dir="rtl">
      {/* Navbar */}
      <nav className="bg-[#0f172a] text-white p-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">SABAN <span className="text-emerald-500">CONTROL</span></h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black transition-all shadow-lg shadow-emerald-500/20"
            >
              <UserPlus className="w-4 h-4" /> הקם לקוח
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="relative mb-6">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" placeholder="חיפוש לקוח..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-10 pl-4 text-sm outline-none focus:border-emerald-500"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              {filteredCustomers.map(c => (
                <button 
                  key={c.clientId} onClick={() => fetchFullCustomerData(c.clientId)}
                  className={`w-full text-right p-4 rounded-2xl transition-all border ${
                    selectedPhone === c.clientId 
                    ? 'bg-[#0f172a] text-white border-transparent shadow-lg' 
                    : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-500'
                  }`}
                >
                  <p className="font-bold text-sm truncate">{c.user_name || 'אורח'}</p>
                  <p className="text-[10px] font-mono mt-1 opacity-60">{c.clientId}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-6">
          {customerData ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                    {customerData.user_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#0f172a]">{customerData.user_name}</h2>
                    <p className="text-slate-400 font-mono text-sm">{customerData.clientId}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => copyLink(customerData.clientId)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-4 rounded-2xl font-black text-xs border border-emerald-100"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />} לינק קסם
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Knowledge */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-[#0f172a]">
                    <Brain className="w-5 h-5 text-emerald-500" /> זיכרון רויטל
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-600 italic border border-slate-100 min-h-[100px]">
                    {customerData.accumulated_knowledge || 'אין מידע צבור...'}
                  </div>
                </div>

                {/* Projects */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-[#0f172a]">
                    <MapPin className="w-5 h-5 text-emerald-500" /> פרויקטים
                  </h3>
                  <div className="space-y-3">
                    {projects.map((p, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="font-bold text-sm">{p.project_name}</p>
                        <p className="text-[10px] text-slate-400">{p.address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logistics Table */}
              <div className="bg-[#0f172a] rounded-[2.5rem] p-8 shadow-2xl mt-6 overflow-hidden">
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                  <Truck className="w-6 h-6 text-emerald-500" /> מדד לוגיסטיקה
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                        <th className="pb-4">פעילות</th>
                        <th className="pb-4">פירוט</th>
                        <th className="pb-4 text-center">סטטוס</th>
                        <th className="pb-4 text-left">תאריך</th>
                      </tr>
                    </thead>
                    <tbody>
                      {containers.map((c) => (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-4 text-white font-bold">{c.action_type}</td>
                          <td className="py-4">
                            <p className="text-white text-xs">{c.container_size || '8 קוב'}</p>
                            <p className="text-[10px] text-slate-500">{c.delivery_address}</p>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black ${c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                              {c.is_active ? 'פעיל' : 'הסתיים'}
                            </span>
                          </td>
                          <td className="py-4 text-left text-slate-500 text-[11px]">{new Date(c.start_date).toLocaleDateString('he-IL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-slate-300 text-slate-300">
              <Users className="w-16 h-16 mb-4 opacity-10" />
              <p className="font-bold">בחר לקוח מהרשימה</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal הקמת לקוח */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl relative"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute left-6 top-6 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black mb-8 text-[#0f172a] flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-emerald-500" /> הקמת זהות לקוח
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="שם הלקוח" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500" value={formData.user_name} onChange={e => setFormData({...formData, user_name: e.target.value})} />
                <input type="tel" placeholder="מספר נייד" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} />
                <input type="text" placeholder="שם הפרויקט" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} />
                <input type="text" placeholder="כתובת" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                <textarea placeholder="זיכרון לרויטל..." className="col-span-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 h-24" value={formData.accumulated_knowledge} onChange={e => setFormData({...formData, accumulated_knowledge: e.target.value})} />
              </div>
              <button 
                onClick={handleCreateCustomer}
                className="w-full mt-6 bg-[#0f172a] text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl"
              >
                צור זהות לקוח
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
