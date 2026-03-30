'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Database, BrainCircuit, Users,
  Menu, X, Plus, Edit2, Trash2, Search, Save, Phone, MapPin, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanAdminMaster() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ORDERS' | 'CUSTOMERS' | 'MEMORY'>('DASHBOARD');
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // State למודל עריכה
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [activeTab]); // טעינה מחדש בכל החלפת טאב

  const fetchData = async () => {
    if (activeTab === 'ORDERS' || activeTab === 'DASHBOARD') {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);
    }
    if (activeTab === 'CUSTOMERS' || activeTab === 'DASHBOARD') {
      const { data } = await supabase.from('customers').select('*').order('customer_number', { ascending: true });
      if (data) setCustomers(data);
    }
    if (activeTab === 'MEMORY' || activeTab === 'DASHBOARD') {
      const { data } = await supabase.from('customer_memory').select('*');
      if (data) setMemory(data);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = activeTab === 'CUSTOMERS' ? 'customers' : activeTab === 'ORDERS' ? 'orders' : 'customer_memory';
    
    // מניעת שליחת שדות שלא קיימים בטבלה הספציפית
    const payload = { ...editingRow };
    delete payload.id;
    delete payload.created_at;

    const { error } = editingRow.id 
      ? await supabase.from(table).update(payload).eq('id', editingRow.id)
      : await supabase.from(table).insert([payload]);

    if (!error) {
      setIsEditModal(false);
      fetchData();
    } else {
      alert("שגיאה בשמירה: " + error.message);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-72 bg-[#111827] text-white p-6 hidden lg:flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-500 p-2 rounded-xl text-black shadow-lg"><ShieldCheck size={24}/></div>
          <h1 className="font-black text-xl italic uppercase">Saban <span className="text-emerald-500">Admin</span></h1>
        </div>
        <nav className="space-y-2">
          <NavBtn active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<LayoutDashboard size={18}/>} label="דאשבורד" />
          <NavBtn active={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} icon={<Database size={18}/>} label="הזמנות" />
          <NavBtn active={activeTab === 'CUSTOMERS'} onClick={() => setActiveTab('CUSTOMERS')} icon={<Users size={18}/>} label="לקוחות" />
          <NavBtn active={activeTab === 'MEMORY'} onClick={() => setActiveTab('MEMORY')} icon={<BrainCircuit size={18}/>} label="זיכרון" />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
          <h2 className="font-black text-xl tracking-tight uppercase">Control Center</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-40 italic">{new Date().toLocaleDateString('he-IL')}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
            <div className="p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input placeholder="חיפוש חופשי..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border p-3 pr-12 rounded-2xl outline-none focus:border-emerald-500 transition-all shadow-sm" />
              </div>
              <button onClick={() => {setEditingRow({}); setIsEditModal(true)}} className="bg-emerald-500 text-black px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
                <Plus size={18}/> הוסף ידנית
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b">
                    {activeTab === 'CUSTOMERS' ? (
                      <>
                        <th className="p-4"># מספר</th>
                        <th className="p-4">לקוח</th>
                        <th className="p-4">פרויקט</th>
                        <th className="p-4">כתובת</th>
                        <th className="p-4">נייד</th>
                      </>
                    ) : (
                      <th className="p-4">מידע כללי</th>
                    )}
                    <th className="p-4 text-center">ניהול</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === 'CUSTOMERS' ? customers : activeTab === 'ORDERS' ? orders : memory)
                    .filter(i => JSON.stringify(i).includes(search)).map((row) => (
                    <tr key={row.id} className="hover:bg-emerald-50/30 transition-colors group">
                      {activeTab === 'CUSTOMERS' ? (
                        <>
                          <td className="p-4 font-mono text-emerald-600 font-bold">{row.customer_number}</td>
                          <td className="p-4 font-black">{row.name}</td>
                          <td className="p-4 text-sm font-medium">{row.project_name}</td>
                          <td className="p-4 text-xs opacity-50 italic">{row.project_address}</td>
                          <td className="p-4 font-mono text-blue-600">{row.phone}</td>
                        </>
                      ) : (
                        <td className="p-4 font-black">{row.client_info || row.clientId || row.accumulated_knowledge}</td>
                      )}
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => {setEditingRow(row); setIsEditModal(true)}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"><Edit2 size={18}/></button>
                        <button onClick={async () => { if(confirm("למחוק?")) { await supabase.from(activeTab === 'CUSTOMERS' ? 'customers' : 'orders').delete().eq('id', row.id); fetchData(); }}} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal - עריכה ידנית */}
      <AnimatePresence>
        {isEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-black text-2xl tracking-tighter italic uppercase">Edit <span className="text-emerald-500">Record</span></h3>
                <button onClick={() => setIsEditModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-4">
                {activeTab === 'CUSTOMERS' ? (
                  <>
                    <InputItem label="שם לקוח" value={editingRow?.name || ''} onChange={(v)=>setEditingRow({...editingRow, name: v})} icon={<Users size={16}/>}/>
                    <InputItem label="מספר לקוח" value={editingRow?.customer_number || ''} onChange={(v)=>setEditingRow({...editingRow, customer_number: v})} icon={<Database size={16}/>}/>
                    <InputItem label="פרויקט" value={editingRow?.project_name || ''} onChange={(v)=>setEditingRow({...editingRow, project_name: v})} icon={<Briefcase size={16}/>}/>
                    <InputItem label="כתובת" value={editingRow?.project_address || ''} onChange={(v)=>setEditingRow({...editingRow, project_address: v})} icon={<MapPin size={16}/>}/>
                    <InputItem label="נייד" value={editingRow?.phone || ''} onChange={(v)=>setEditingRow({...editingRow, phone: v})} icon={<Phone size={16}/>}/>
                  </>
                ) : (
                  <InputItem label="תוכן" value={editingRow?.client_info || editingRow?.accumulated_knowledge || ''} onChange={(v)=>setEditingRow({...editingRow, client_info: v})} icon={<Sparkles size={16}/>}/>
                )}
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-emerald-500 text-black py-5 rounded-[1.5rem] font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"><Save size={20} className="inline ml-2"/> שמור שינויים</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}

function InputItem({ label, value, onChange, icon }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest mr-2">{label}</label>
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">{icon}</div>
        <input value={value} onChange={(e)=>onChange(e.target.value)} className="w-full bg-slate-50 border p-4 pr-12 rounded-2xl outline-none focus:border-emerald-500 font-bold" />
      </div>
    </div>
  );
}
