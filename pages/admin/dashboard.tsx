'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Database, BrainCircuit, Users,
  Menu, X, Plus, Edit2, Trash2, Search, Bell, Truck, 
  ChevronRight, MessageSquare, Calendar, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// חיבור ללקוח Supabase מהגדרות הסביבה שלך
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SabanRealtimeOS() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchInitialData();
    
    // הפעלת המאזין בזמן אמת
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('שינוי זוהה בסידור!', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialData = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  // פונקציה שמטפלת בעדכון ומשמיעה צליל
  const handleRealtimeUpdate = (payload: any) => {
    // השמעת צליל ההתראה שהגדרנו ב-PWA
    const audio = new Audio('/order-notification.mp3');
    audio.play().catch(() => console.log("צליל נחסם ע'י הדפדפן"));

    if (payload.eventType === 'INSERT') {
      setOrders(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setOrders(prev => prev.map(order => order.id === payload.new.id ? payload.new : order));
    } else if (payload.eventType === 'DELETE') {
      setOrders(prev => prev.filter(order => order.id !== payload.old.id));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1E293B] flex" dir="rtl">
      {/* Sidebar - עיצוב זכוכית פרימיום */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-l border-white shadow-2xl flex flex-col p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck size={28}/>
          </div>
          <h1 className="font-black text-2xl tracking-tighter text-[#0F172A]">SABAN <span className="text-blue-600">OS</span></h1>
        </div>
        <nav className="space-y-3">
          <SidebarItem active={activeTab === 'DASHBOARD'} icon={<LayoutDashboard/>} label="לוח סידור" onClick={() => setActiveTab('DASHBOARD')} />
          <SidebarItem active={activeTab === 'DRIVERS'} icon={<Truck/>} label="נהגים בדרכים" onClick={() => setActiveTab('DRIVERS')} />
          <SidebarItem active={activeTab === 'CUSTOMERS'} icon={<Users/>} label="לקוחות" onClick={() => setActiveTab('CUSTOMERS')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-white px-8 flex items-center justify-between">
          <h2 className="text-xl font-black italic uppercase">מצב סידור - <span className="text-blue-600 underline">LIVE</span></h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                placeholder="חיפוש מהיר..." 
                className="bg-white border-none shadow-inner p-2.5 pr-10 rounded-xl text-sm font-bold"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg">חדש +</button>
          </div>
        </header>

        {/* לוח ההזמנות - מתעדכן בזמן אמת */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 gap-4">
            {orders.filter(o => JSON.stringify(o).includes(search)).map((order) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id} 
                className="bg-white p-5 rounded-[2rem] border border-white shadow-sm flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-3 h-12 rounded-full ${order.status === 'done' ? 'bg-green-400' : 'bg-blue-500'}`} />
                  <div>
                    <h4 className="font-black text-lg">{order.name || 'לקוח ללא שם'}</h4>
                    <p className="text-sm text-slate-400 font-bold">{order.project_address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase">נהג</p>
                    <p className="text-sm font-black text-slate-700">{order.driver_name || 'טרם שובץ'}</p>
                  </div>
                  <button className="p-3 bg-slate-50 rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                    <ChevronRight size={20}/>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 font-black' : 'text-slate-400 hover:bg-white hover:text-slate-900 font-bold'}`}>
      {React.cloneElement(icon, { size: 22 })}
      <span className="text-sm">{label}</span>
    </button>
  );
}
