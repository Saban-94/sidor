'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Truck, Users, 
  Search, Bell, Plus, ChevronLeft, MapPin, 
  Clock, CheckCircle2, AlertCircle, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanPremiumOS() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'איציק סבן', status: 'בדרך', location: 'טייבה', color: 'bg-blue-500' },
    { id: 2, name: 'מוחמד עיסא', status: 'פריקה', location: 'נתניה', color: 'bg-emerald-500' },
  ]);

  useEffect(() => {
    fetchOrders();
    setupRealtime();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const setupRealtime = () => {
    supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const audio = new Audio('/order-notification.mp3');
        audio.play().catch(() => {}); // הפעלת צליל בקבלת הזמנה
        fetchOrders();
      })
      .subscribe();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex overflow-hidden" dir="rtl">
      
      {/* Sidebar - Glassmorphism */}
      <aside className="w-80 bg-white/70 backdrop-blur-2xl border-l border-white/40 shadow-[10px_0_30px_rgba(0,0,0,0.02)] flex flex-col p-8 z-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck size={28} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black tracking-tighter">SABAN <span className="text-blue-600">OS</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active icon={<LayoutDashboard/>} label="לוח סידור" />
          <NavItem icon={<Truck/>} label="סטטוס נהגים" />
          <NavItem icon={<Users/>} label="ניהול לקוחות" />
          <NavItem icon={<MessageSquare/>} label="צ'אט עוזר AI" />
        </nav>

        <div className="mt-auto bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">משתמש פעיל</p>
          <p className="font-black text-[#0F172A]">רמי סבן</p>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"/>
            מחובר למערכת
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="h-24 px-10 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/50">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black">לוח סידור דינאמי</h2>
            <div className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black italic">
              LIVE MONITORING
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input placeholder="חיפוש מהיר..." className="bg-white border-none shadow-sm p-3 pr-12 rounded-2xl w-64 font-bold text-sm focus:ring-2 ring-blue-500/20" />
            </div>
            <button className="bg-white p-3 rounded-2xl shadow-sm border border-white text-slate-600 hover:text-blue-600 transition-colors relative">
              <Bell size={22}/>
              <span className="absolute top-2 left-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
              הזמנה חדשה +
            </button>
          </div>
        </header>

        {/* Dynamic Board Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-12 gap-8">
            
            {/* Orders Column */}
            <div className="col-span-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-lg text-slate-400 uppercase tracking-widest">הזמנות פתוחות</h3>
                <span className="font-bold text-sm">{orders.length} סה"כ</span>
              </div>
              
              <div className="space-y-4">
                {orders.map((order, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    key={order.id}
                    className="group bg-white p-6 rounded-[2.5rem] shadow-sm border border-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                          <Clock size={24}/>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-xl">{order.name || 'לקוח מזדמן'}</h4>
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-tighter italic">בטון B-300</span>
                          </div>
                          <p className="text-slate-400 font-bold text-sm flex items-center gap-1 mt-1 italic">
                            <MapPin size={14}/> {order.project_address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <div className="text-left">
                          <p className="text-[10px] font-black text-slate-300 uppercase italic">נהג משובץ</p>
                          <p className="font-black text-blue-600">טרם נקבע</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ChevronLeft size={20}/>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Drivers Status Panel */}
            <div className="col-span-4 space-y-6">
              <h3 className="font-black text-lg text-slate-400 uppercase tracking-widest px-2">סטטוס נהגים</h3>
              <div className="bg-[#1E293B] p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full"></div>
                
                <div className="space-y-8 relative z-10">
                  {drivers.map(driver => (
                    <div key={driver.id} className="flex items-center justify-between border-b border-white/10 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${driver.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <Truck size={20} className="text-white"/>
                        </div>
                        <div>
                          <p className="font-black text-lg leading-tight">{driver.name}</p>
                          <p className="text-xs font-bold text-slate-400 italic">{driver.location}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400">
                          {driver.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick AI Action Card */}
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-blue-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <AlertCircle size={20} className="text-white"/>
                  </div>
                  <p className="font-black text-sm uppercase">המלצת סידור AI</p>
                </div>
                <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-r-4 border-emerald-500 pr-4 mb-6">
                  "מומלץ לשלוח את איציק להזמנה בטייבה, הוא הכי קרוב לאתר כרגע."
                </p>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg">
                  אשר ושלח וואטסאפ לנהג
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active = false }: any) {
  return (
    <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 font-black' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-bold'}`}>
      {React.cloneElement(icon, { size: 22 })}
      <span className="text-sm uppercase tracking-tighter">{label}</span>
    </button>
  );
}
