'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Settings, 
  LayoutDashboard, 
  Bell, 
  Search,
  Plus
} from 'lucide-react';
import CustomerUnifiedManager from '@/components/sabanOS/CustomerUnifiedManager';
import OrdersManager from '@/components/sabanOS/OrdersManager'; // רכיב ניהול הזמנות חדש

export const dynamic = 'force-dynamic';

export default function AdminAiPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'customers' | 'orders'>('orders');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex" dir="rtl">
      {/* Sidebar - ניווט מקצועי צדי */}
      <aside className="w-64 bg-[#0f172a] text-white hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            SabanOS Admin
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="לוח בקרה" 
            active={false} 
          />
          <SidebarItem 
            icon={<ClipboardList size={20} />} 
            label="ניהול הזמנות" 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')}
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="מאגר לקוחות" 
            active={activeTab === 'customers'} 
            onClick={() => setActiveTab('customers')}
          />
          <SidebarItem 
            icon={<TrendingUp size={20} />} 
            label="אנליטיקה" 
            active={false} 
          />
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <SidebarItem icon={<Settings size={20} />} label="הגדרות מערכת" active={false} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="חיפוש מהיר של הזמנה, לקוח או מק״ט..."
                className="w-full bg-slate-100 border-none rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-white">
              ר
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'orders' ? 'ניהול הזמנות בזמן אמת' : 'ניהול לקוחות AI'}
              </h1>
              <p className="text-slate-500 mt-1 font-medium italic">
                {activeTab === 'orders' ? 'ערוך מק"טים, כתובות וסטטוסים שיקפצו ללקוח במעקב.' : 'צפייה, עריכה וניהול מאוחד של מאגר הלקוחות.'}
              </p>
            </div>
            
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
              <Plus size={20} />
              <span>הזמנה ידנית חדשה</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col justify-center items-center h-[50vh]"
              >
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold animate-pulse">טוען נתונים מהמחסן...</p>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden"
              >
                {activeTab === 'orders' ? <OrdersManager /> : <CustomerUnifiedManager />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Sidebar Component Helper
function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
