'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Database, BrainCircuit, Users,
  Menu, X, Plus, Edit2, Trash2, Search, Download, Save, Phone, MapPin, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanAdminOS() {
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ORDERS' | 'CUSTOMERS' | 'MEMORY'>('DASHBOARD');
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Edit Modal States
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: custs } = await supabase.from('customers').select('*').order('id', { ascending: true });
    const { data: mems } = await supabase.from('customer_memory').select('*');
    if (ords) setOrders(ords);
    if (custs) setCustomers(custs);
    if (mems) setMemory(mems);
  };

  // פונקציית שמירה/עריכה פעילה
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = activeTab === 'CUSTOMERS' ? 'customers' : activeTab === 'ORDERS' ? 'orders' : 'customer_memory';
    
    if (editingRow.id) {
      const { error } = await supabase.from(table).update(editingRow).eq('id', editingRow.id);
      if (!error) {
        setIsEditModal(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from(table).insert([editingRow]);
      if (!error) {
        setIsEditModal(false);
        fetchData();
      }
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (confirm("בוס, למחוק לצמיתות?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex" dir="rtl">
      
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="fixed lg:relative z-50 w-72 h-screen bg-[#111827] text-white p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl text-black shadow-lg shadow-emerald-500/30"><ShieldCheck size={24}/></div>
                <h1 className="font-black text-xl italic text-white">SABAN <span className="text-emerald-500 text-sm">OS</span></h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2"><X/></button>
            </div>

            <nav className="flex-1 space-y-2">
              <NavBtn active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<LayoutDashboard size={20}/>} label="דאשבורד" />
              <NavBtn active={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} icon={<Database size={20}/>} label="ניהול הזמנות" />
              <NavBtn active={activeTab === 'CUSTOMERS'} onClick={() => setActiveTab('CUSTOMERS')} icon={<Users size={20}/>} label="טבלת לקוחות" />
              <NavBtn active={activeTab === 'MEMORY'} onClick={() => setActiveTab('MEMORY')} icon={<BrainCircuit size={20}/>} label="זיכרון המוח" />
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg"><Menu/></button>}
            <h2 className="font-black text-xl">
              {activeTab === 'CUSTOMERS' ? 'ניהול לקוחות' : activeTab === 'ORDERS' ? 'ניהול הזמנות' : 'מערכת אדמין'}
            </h2>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          
          <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input placeholder="חיפוש חופשי..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-50 border p-3 pr-12 rounded-2xl outline-none focus:border-emerald-500" />
              </div>
              <button onClick={() => {setEditingRow({}); setIsEditModal(true)}} className="bg-emerald-500 text-black px-6 py-3 rounded-2xl font-black flex items-center gap-2">
                <Plus size={18}/> הוסף לקוח/שורה
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b">
                    {activeTab === 'CUSTOMERS' ? (
                      <>
                        <th className="p-4 italic"># מספר</th>
                        <th className="p-4">שם לקוח</th>
                        <th className="p-4">פרויקט</th>
                        <th className="p-4">כתובת</th>
                        <th className="p-4">איש קשר</th>
                        <th className="p-4">נייד</th>
                      </>
                    ) : (
                      <th className="p-4">מידע</th>
                    )}
                    <th className="p-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === 'CUSTOMERS' ? customers : activeTab === 'ORDERS' ? orders : memory)
                    .filter(i => JSON.stringify(i).includes(search)).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 group transition-colors">
                      {activeTab === 'CUSTOMERS' ? (
                        <>
                          <td className="p-4 font-mono text-emerald-600 font-bold">{row.customer_number || '---'}</td>
                          <td className="p-4 font-black">{row.name}</td>
                          <td className="p-4 text-sm font-medium">{row.project_name}</td>
                          <td className="p-4 text-sm opacity-60 italic">{row.project_address}</td>
                          <td className="p-4 font-bold">{row.contact_person}</td>
                          <td className="p-4 font-mono text-blue-600">{row.phone}</td>
                        </>
                      ) : (
                        <td className="p-4 font-black">{row.client_info || row.accumulated_knowledge}</td>
                      )}
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => {setEditingRow(row); setIsEditModal(true)}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(activeTab === 'CUSTOMERS' ? 'customers' : 'orders', row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal - חלונית עריכה פעילה */}
      <AnimatePresence>
        {isEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-black text-2xl tracking-tighter italic uppercase text-slate-800">SABAN <span className="text-emerald-500">EDITOR</span></h3>
                <button onClick={() => setIsEditModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
              </div>
              <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="שם לקוח" value={editingRow?.name || ''} onChange={(v) => setEditingRow({...editingRow, name: v})} icon={<Users size={18}/>} />
                <Input label="מספר לקוח" value={editingRow?.customer_number || ''} onChange={(v) => setEditingRow({...editingRow, customer_number: v})} icon={<Database size={18}/>} />
                <Input label="שם פרויקט" value={editingRow?.project_name || ''} onChange={(v) => setEditingRow({...editingRow, project_name: v})} icon={<Briefcase size={18}/>} />
                <Input label="כתובת פרויקט" value={editingRow?.project_address || ''} onChange={(v) => setEditingRow({...editingRow, project_address: v})} icon={<MapPin size={18}/>} />
                <Input label="איש קשר" value={editingRow?.contact_person || ''} onChange={(v) => setEditingRow({...editingRow, contact_person: v})} icon={<ShieldCheck size={18}/>} />
                <Input label="נייד" value={editingRow?.phone || ''} onChange={(v) => setEditingRow({...editingRow, phone: v})} icon={<Phone size={18}/>} />
                <div className="md:col-span-2 mt-4 flex gap-4">
                  <button type="submit" className="flex-1 bg-emerald-500 text-black py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"><Save size={20}/> שמור שינויים</button>
                  <button type="button" onClick={() => setIsEditModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">ביטול</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// UI Components
function NavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}

function Input({ label, value, onChange, icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">{icon}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border p-3 pr-12 rounded-xl outline-none focus:border-emerald-500 font-bold" />
      </div>
    </div>
  );
}
