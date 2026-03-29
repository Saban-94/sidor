'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Database, BrainCircuit, Users,
  Menu, X, Plus, Edit2, Trash2, Search, Bell, Truck, 
  ChevronRight, MessageSquare, Calendar, Navigation
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const playNotificationSound = () => {
  const audio = new Audio('/order-notification.mp3'); // וודא שהקובץ קיים ב-public
  audio.play().catch(e => console.log("Audio play blocked by browser"));
};
export default function SabanPremiumOS() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'איציק סבן', status: 'בדרך ללקוח', location: 'טייבה' },
    { id: 2, name: 'מוחמד עיסא', status: 'פריקה', location: 'נתניה' },
  ]);

  useEffect(() => {
    setMounted(true);
    fetchData();
    setupNotifications();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const setupNotifications = () => {
    // לוגיקת PWA להתראות וצליל
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const playOrderSound = () => {
    const audio = new Audio('/order-notification.mp3');
    audio.play();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1E293B] font-sans flex" dir="rtl">
      {/* Sidebar - Glass Design */}
      <aside className="w-24 lg:w-72 bg-white/80 backdrop-blur-xl border-l border-white shadow-2xl flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck size={28}/>
          </div>
          <h1 className="font-black text-2xl tracking-tighter hidden lg:block text-[#0F172A]">
            SABAN <span className="text-blue-600">OS</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-3">
          <SidebarItem active={activeTab === 'DASHBOARD'} icon={<LayoutDashboard/>} label="לוח בקרה" onClick={() => setActiveTab('DASHBOARD')} />
          <SidebarItem active={activeTab === 'SIDOR'} icon={<Calendar/>} label="סידור עבודה" onClick={() => setActiveTab('SIDOR')} />
          <SidebarItem active={activeTab === 'DRIVERS'} icon={<Truck/>} label="סטטוס נהגים" onClick={() => setActiveTab('DRIVERS')} />
          <SidebarItem active={activeTab === 'CUSTOMERS'} icon={<Users/>} label="לקוחות" onClick={() => setActiveTab('CUSTOMERS')} />
        </nav>

        <div className="mt-auto p-4 bg-blue-50 rounded-3xl border border-blue-100 hidden lg:block">
          <p className="text-[10px] font-black uppercase text-blue-400 mb-1">מחובר כעת</p>
          <p className="text-sm font-bold text-blue-900">רמי סבן - מנהל מערכת</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header - Ultra Clean */}
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-white px-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              placeholder="חיפוש חכם (לקוח, נהג, פרויקט)..." 
              className="w-full bg-white border-none shadow-inner p-3 pr-12 rounded-2xl text-sm font-bold focus:ring-2 ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 relative">
              <Bell size={20}/>
              <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform">
              הזמנה חדשה +
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-12 gap-8">
            
            {/* סידור עבודה דינאמי (Drag & Drop Concept) */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <section className="bg-white/70 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-[#0F172A]">לוח סידור דינאמי</h3>
                  <div className="flex gap-2">
                    <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black">12 הזמנות פעילות</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {orders.slice(0, 4).map((order, idx) => (
                    <div key={idx} className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-[#0F172A]">{order.name || 'לקוח מזדמן'}</h4>
                          <p className="text-sm text-slate-400 font-bold flex items-center gap-1">
                            <Navigation size={14}/> {order.project_address || 'כתובת לא הוזנה'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-left">
                          <p className="text-[10px] font-black text-slate-300 uppercase italic">סטטוס</p>
                          <p className="text-sm font-black text-blue-600">בטיפול AI</p>
                        </div>
                        <button className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ChevronRight size={20}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* מצב נהגים - Side Panel */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <section className="bg-[#1E293B] p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                   <Truck className="text-blue-400"/> מצב נהגים
                </h3>
                <div className="space-y-6">
                  {drivers.map(driver => (
                    <div key={driver.id} className="relative pr-4 border-r-2 border-blue-500/30">
                      <p className="font-black text-lg">{driver.name}</p>
                      <p className="text-blue-400 text-sm font-bold">{driver.status}</p>
                      <p className="text-slate-400 text-[11px] mt-1 italic">{driver.location}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* AI Assistant Chat Bubble */}
              <section className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-blue-100 relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <BrainCircuit size={20}/>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400">עוזר אישי</p>
                    <p className="text-sm font-black text-[#0F172A]">איך לעזור לך בסידור היום?</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 flex gap-2">
                  <input placeholder="כתוב פקודה..." className="bg-transparent border-none flex-1 text-sm font-bold outline-none"/>
                  <button className="text-blue-600 p-1"><MessageSquare size={20}/></button>
                </div>
              </section>
            </div>

          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        input::placeholder { color: #94A3B8; font-weight: 700; }
      `}</style>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
        active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 font-black' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-bold'
      }`}
    >
      {React.cloneElement(icon, { size: 22 })}
      <span className="hidden lg:block text-sm">{label}</span>
    </button>
  );
}
