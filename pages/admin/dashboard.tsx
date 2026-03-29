'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Database, BrainCircuit, 
  Menu, X, Plus, Edit2, Trash2, Clock, Calendar, 
  Search, Download, Save, ChevronRight, User, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanAdminOS() {
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ORDERS' | 'MEMORY'>('DASHBOARD');
  const [orders, setOrders] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const sub = supabase.channel('admin_live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: mems } = await supabase.from('customer_memory').select('*');
    if (ords) setOrders(ords);
    if (mems) setMemory(mems);
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
      
      {/* Sidebar - Mobile & Desktop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
            className="fixed lg:relative z-50 w-72 h-screen bg-[#111827] text-white p-6 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl text-black shadow-lg shadow-emerald-500/30"><ShieldCheck size={24}/></div>
                <h1 className="font-black text-xl tracking-tighter italic">SABAN <span className="text-emerald-500">ADMIN</span></h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2"><X/></button>
            </div>

            <nav className="flex-1 space-y-2">
              <AdminNavBtn active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<LayoutDashboard size={20}/>} label="מרכז שליטה" />
              <AdminNavBtn active={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} icon={<Database size={20}/>} label="טבלת הזמנות" />
              <AdminNavBtn active={activeTab === 'MEMORY'} onClick={() => setActiveTab('MEMORY')} icon={<BrainCircuit size={20}/>} label="זיכרון לקוחות" />
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10 opacity-50 text-[10px] font-bold text-center uppercase tracking-widest">
              Saban 1994 OS • v4.0.0
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu/></button>}
            <h2 className="font-black text-xl text-slate-800">{activeTab === 'DASHBOARD' ? 'מרכז שליטה' : activeTab === 'ORDERS' ? 'ניהול הזמנות' : 'ניהול זיכרון'}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Live Server Time</span>
              <span className="font-mono font-black text-lg">{new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-black text-black shadow-md shadow-emerald-500/20">R</div>
          </div>
        </header>

        {/* Dynamic View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="סה״כ הזמנות" value={orders.length} color="text-emerald-600" />
              <StatCard label="לקוחות רשומים" value={memory.length} color="text-blue-600" />
              <StatCard label="פעילות היום" value={orders.filter(o => o.delivery_date === new Date().toISOString().split('T')[0]).length} color="text-amber-600" />
            </div>
          )}

          {(activeTab === 'ORDERS' || activeTab === 'MEMORY') && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input 
                    placeholder="חיפוש מהיר במאגר..." 
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 pr-12 rounded-2xl outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
                <div className="flex gap-2">
                  <button className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"><Download size={16}/> אקסל</button>
                  <button onClick={() => {setEditingRow(null); setIsEditModal(true)}} className="bg-emerald-500 text-black px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"><Plus size={16}/> הוספה ידנית</button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="p-4">מזהה</th>
                      <th className="p-4">{activeTab === 'ORDERS' ? 'לקוח' : 'מזהה לקוח'}</th>
                      <th className="p-4">{activeTab === 'ORDERS' ? 'מיקום' : 'ידע שנצבר'}</th>
                      <th className="p-4">{activeTab === 'ORDERS' ? 'נהג' : 'עדכון אחרון'}</th>
                      <th className="p-4 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeTab === 'ORDERS' ? orders : memory).filter(item => JSON.stringify(item).includes(search)).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-xs font-mono opacity-50">{row.id.slice(0,8)}...</td>
                        <td className="p-4 font-black">{row.client_info || row.clientId}</td>
                        <td className="p-4 text-sm opacity-70 max-w-xs truncate">{row.location || row.accumulated_knowledge}</td>
                        <td className="p-4 font-bold text-emerald-600">{row.driver_name || new Date(row.last_update).toLocaleDateString('he-IL')}</td>
                        <td className="p-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {setEditingRow(row); setIsEditModal(true)}} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(activeTab === 'ORDERS' ? 'orders' : 'customer_memory', row.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
      <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">{label}</span>
      <span className={`text-4xl font-black ${color}`}>{value}</span>
    </div>
  );
}

function AdminNavBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}
