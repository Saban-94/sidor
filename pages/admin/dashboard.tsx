'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Database, BrainCircuit, 
  Menu, X, Plus, Edit2, Trash2, Search, Download, Save
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
  
  // State למודל עריכה
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    // האזנה לשינויים בזמן אמת - כדי שהטבלה תתעדכן לבד
    const sub = supabase.channel('admin_live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: mems } = await supabase.from('customer_memory').select('*');
    if (ords) setOrders(ords);
    if (mems) setMemory(mems);
  };

  // פונקציית מחיקה פעילה
  const handleDelete = async (table: string, id: string) => {
    if (confirm("בוס, למחוק לצמיתות מהמאגר?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  if (!mounted) return null;

  const currentData = activeTab === 'ORDERS' ? orders : memory;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex" dir="rtl">
      
      {/* Sidebar - תפריט צד פעיל */}
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
              <button onClick={() => setActiveTab('DASHBOARD')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'DASHBOARD' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <LayoutDashboard size={20}/> מרכז שליטה
              </button>
              <button onClick={() => setActiveTab('ORDERS')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'ORDERS' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Database size={20}/> טבלת הזמנות
              </button>
              <button onClick={() => setActiveTab('MEMORY')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'MEMORY' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <BrainCircuit size={20}/> זיכרון המוח
              </button>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - המבורגר פעיל */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu/></button>}
            <h2 className="font-black text-xl text-slate-800">
              {activeTab === 'DASHBOARD' ? 'מרכז שליטה' : activeTab === 'ORDERS' ? 'ניהול הזמנות' : 'זיכרון לקוחות'}
            </h2>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {activeTab === 'DASHBOARD' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest block mb-2">סה״כ הזמנות במאגר</span>
                <span className="text-5xl font-black text-emerald-600">{orders.length}</span>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest block mb-2">לקוחות בזיכרון המוח</span>
                <span className="text-5xl font-black text-blue-600">{memory.length}</span>
              </div>
              <button onClick={() => setActiveTab('ORDERS')} className="bg-white p-8 rounded-[2.5rem] border border-emerald-500/30 shadow-sm text-center hover:scale-105 transition-transform">
                <span className="text-emerald-500 font-black">לחץ לצפייה בטבלאות ➔</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Toolbar */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input 
                    placeholder="חיפוש חופשי..." 
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 pr-12 rounded-2xl outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
                <button onClick={() => {setEditingRow(null); setIsEditModal(true)}} className="bg-emerald-500 text-black px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-400">
                  <Plus size={18}/> הוסף ידנית
                </button>
              </div>

              {/* Table - מחיקה ועריכה פעילים */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="p-4">מזהה</th>
                      <th className="p-4">{activeTab === 'ORDERS' ? 'לקוח' : 'מזהה לקוח'}</th>
                      <th className="p-4">{activeTab === 'ORDERS' ? 'מיקום' : 'ידע בזיכרון'}</th>
                      <th className="p-4">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.filter(i => JSON.stringify(i).includes(search)).map((row) => (
                      <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 group">
                        <td className="p-4 text-xs font-mono opacity-30">{row.id.slice(0,5)}...</td>
                        <td className="p-4 font-black">{row.client_info || row.clientId}</td>
                        <td className="p-4 text-sm opacity-60 truncate max-w-xs">{row.location || row.accumulated_knowledge}</td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => {setEditingRow(row); setIsEditModal(true)}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(activeTab === 'ORDERS' ? 'orders' : 'customer_memory', row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
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
