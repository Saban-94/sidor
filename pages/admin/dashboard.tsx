'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Truck, Users, 
  Search, Bell, Plus, ChevronLeft, MapPin, 
  Clock, AlertCircle, MessageSquare, Navigation,
  CheckCircle2, Phone, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// חיבור ל-Supabase - וודא שהגדרת את המפתחות ב-.env.local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SabanPremiumOS() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  
  // נתוני נהגים (ניתן למשוך בעתיד מטבלת drivers)
  const [drivers] = useState([
    { id: 1, name: 'איציק סבן', status: 'בדרך', location: 'טייבה', color: 'bg-blue-500' },
    { id: 2, name: 'מוחמד עיסא', status: 'פריקה', location: 'נתניה', color: 'bg-emerald-500' },
  ]);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    setupRealtime();
  }, []);

  // משיכת הזמנות ראשונית
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    if (error) console.error('Error fetching orders:', error);
  };

  // הפעלת Realtime וצליל התראה
  const setupRealtime = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // השמעת צליל בכל שינוי (INSERT/UPDATE)
          const audio = new Audio('/order-notification.mp3');
          audio.play().catch(() => console.log("צליל נחסם ע'י הדפדפן"));
          
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev]);
          } else {
            fetchOrders(); // רענון מלא במקרה של עדכון או מחיקה
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // פונקציית עדכון סטטוס מהירה
  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex overflow-hidden" dir="rtl">
      
      {/* Sidebar - Premium Glass Design */}
      <aside className="w-80 bg-white/70 backdrop-blur-2xl border-l border-white shadow-xl flex flex-col p-8 z-30">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck size={28} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black tracking-tighter">SABAN <span className="text-blue-600">OS</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === 'DASHBOARD'} icon={<LayoutDashboard/>} label="לוח סידור" onClick={() => setActiveTab('DASHBOARD')} />
          <NavItem active={activeTab === 'DRIVERS'} icon={<Truck/>} label="סטטוס נהגים" onClick={() => setActiveTab('DRIVERS')} />
          <NavItem active={activeTab === 'CUSTOMERS'} icon={<Users/>} label="ניהול לקוחות" onClick={() => setActiveTab('CUSTOMERS')} />
          <NavItem active={activeTab === 'AI'} icon={<MessageSquare/>} label="צ'אט עוזר AI" onClick={() => setActiveTab('AI')} />
        </nav>

        <div className="mt-auto bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 shadow-inner">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">מנהל מחובר</p>
          <p className="font-black text-[#0F172A] text-lg">רמי סבן</p>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-blue-600 bg-white w-fit px-3 py-1 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"/>
            מערכת פעילה בזמן אמת
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/30">
        
        {/* Top Header */}
        <header className="h-24 px-10 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/50 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black italic">ניהול סידור <span className="text-blue-600 underline decoration-4 underline-offset-8">LIVE</span></h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18}/>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לקוח או פרויקט..." 
                className="bg-white border-none shadow-sm p-3 pr-12 rounded-2xl w-80 font-bold text-sm focus:ring-4 ring-blue-500/10 transition-all outline-none" 
              />
            </div>
            <button className="bg-white p-3 rounded-2xl shadow-sm border border-white text-slate-600 hover:text-blue-600 hover:shadow-md transition-all relative">
              <Bell size={22}/>
              <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
            </button>
            <button className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
              <Plus size={20}/> הזמנה חדשה
            </button>
          </div>
        </header>

        {/* Scrolling Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-12 gap-10">
            
            {/* Orders Column (Left) */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-4">
                <h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em]">הזמנות להיום</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="font-black text-xs text-emerald-600 uppercase tracking-tighter italic">מעודכן כעת</span>
                </div>
              </div>
              
              <div className="grid gap-4">
                <AnimatePresence>
                  {orders.filter(o => JSON.stringify(o).includes(search)).map((order) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={order.id}
                      className="group bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-sm border border-white hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${order.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {order.status === 'done' ? <CheckCircle2 size={28}/> : <Clock size={28}/>}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-black text-2xl tracking-tight text-[#0F172A]">{order.name || 'לקוח מזדמן'}</h4>
                              <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-tighter italic text-slate-500">בטון B-300</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-slate-500 font-bold text-sm flex items-center gap-1 italic">
                                <MapPin size={14} className="text-blue-500"/> {order.project_address || 'ללא כתובת'}
                              </p>
                              <span className="text-slate-300">|</span>
                              <p className="text-slate-500 font-bold text-sm flex items-center gap-1">
                                <Phone size={14} className="text-emerald-500"/> {order.phone || '---'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                          <div className="text-left ml-6">
                            <p className="text-[10px] font-black text-slate-300 uppercase italic">סטטוס הזמנה</p>
                            <p className={`font-black uppercase text-xs tracking-widest ${order.status === 'done' ? 'text-emerald-500' : 'text-blue-600 animate-pulse'}`}>
                              {order.status === 'done' ? 'הושלם' : 'בתהליך'}
                            </p>
                          </div>
                          <button onClick={() => updateStatus(order.id, 'done')} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                            <CheckCircle2 size={22}/>
                          </button>
                          <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <ChevronLeft size={22}/>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Side Panel (Right) */}
            <div className="col-span-12 xl:col-span-4 space-y-8">
              
              {/* Drivers Card */}
              <section className="bg-[#0F172A] p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[80px] rounded-full"></div>
                <h3 className="font-black text-lg uppercase tracking-widest mb-8 flex items-center gap-3">
                  <Truck className="text-blue-400"/> נהגים פעילים
                </h3>
                
                <div className="space-y-6 relative z-10">
                  {drivers.map(driver => (
                    <div key={driver.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 ${driver.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Navigation size={22} className="text-white"/>
                        </div>
                        <div>
                          <p className="font-black text-xl leading-tight">{driver.name}</p>
                          <p className="text-xs font-bold text-slate-400 italic mt-1">{driver.location}</p>
                        </div>
                      </div>
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <span className="text-[10px] font-black uppercase text-blue-400">{driver.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* AI Assistant Insight */}
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-blue-50 relative group">
                <div className="absolute top-6 left-6 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity">
                  <BrainCircuit size={40}/>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <AlertCircle size={20} className="text-white"/>
                  </div>
                  <p className="font-black text-sm uppercase tracking-wider">המלצת מערכת</p>
                </div>
                <p className="text-lg font-black text-slate-800 leading-snug pr-4 border-r-4 border-emerald-500 mb-8 italic">
                  "זיהיתי עומס צפוי בנתניה. כדאי להקצות את איציק להזמנה הבאה בטייבה כדי לחסוך זמן דלק."
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2">
                    <MessageSquare size={16}/> שלח עדכון לנהג
                  </button>
                </div>
              </section>

              {/* Support/Admin Links */}
              <div className="px-8 flex justify-between">
                <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest">תמיכה טכנית</button>
                <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest">הגדרות מערכת</button>
              </div>
            </div>

          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 20px; }
        body { background-color: #F8FAFC; }
      `}</style>
    </div>
  );
}

// UI Helper Component
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
        active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 font-black' 
        : 'text-slate-400 hover:bg-white hover:text-slate-900 font-bold hover:shadow-sm'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'} transition-colors`}>
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <span className="text-sm uppercase tracking-tighter">{label}</span>
    </button>
  );
}

// Icon placeholder for Brain (Lucide doesn't have it by default in all versions)
function BrainCircuit({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.245 4 4 0 0 0 7.837 1.86A4.5 4.5 0 0 0 12 5Z"/>
      <path d="M13 22a4.5 4.5 0 0 1 0-9h.282a.75.75 0 0 0 .713-.51l.265-.826a.75.75 0 0 1 .713-.514H18"/>
      <path d="M18 11.5a4.5 4.5 0 1 1 0 9"/>
      <circle cx="18" cy="11.5" r="1.5"/>
      <circle cx="12" cy="5" r="1.5"/>
    </svg>
  );
}
