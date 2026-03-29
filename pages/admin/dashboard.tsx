'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, query, onSnapshot, orderBy, 
  addDoc, serverTimestamp, updateDoc, doc 
} from 'firebase/firestore';
import { 
  ShieldCheck, LayoutDashboard, Truck, Users, 
  Search, Bell, Plus, ChevronLeft, MapPin, 
  Clock, AlertCircle, MessageSquare, CheckCircle2, Phone, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanPremiumDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // נתוני נהגים לסימולציה (ניתן למשוך מ-Firestore באותו אופן)
  const [drivers] = useState([
    { id: 'd1', name: 'איציק סבן', status: 'בדרך', location: 'טייבה', color: 'bg-blue-600' },
    { id: 'd2', name: 'מוחמד עיסא', status: 'פריקה', location: 'נתניה', color: 'bg-emerald-600' },
  ]);

  useEffect(() => {
    setMounted(true);

    // מאזין Realtime ל-Firestore - מושך הזמנות וממיין לפי זמן
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: any[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });

      // בדיקה אם נוספה הזמנה חדשה להפעלת צליל
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !snapshot.metadata.hasPendingWrites) {
          playNotification();
        }
      });

      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const playNotification = () => {
    const audio = new Audio('/order-notification.mp3');
    audio.play().catch(() => console.log("צליל נחסם עקב הגדרות דפדפן"));
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  };

  // פונקציית יצירת הזמנה בזמן אמת
  const handleCreateOrder = async () => {
    try {
      await addDoc(collection(db, 'orders'), {
        name: 'לקוח חדש',
        project_address: 'טייבה - אתר בנייה',
        phone: '050-0000000',
        status: 'pending',
        created_at: serverTimestamp(),
      });
    } catch (e) {
      console.error("שגיאה ביצירת הזמנה:", e);
    }
  };

  const markAsDone = async (id: string) => {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, { status: 'done' });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#0F172A] font-sans flex overflow-hidden" dir="rtl">
      
      {/* Sidebar - Glassmorphism Premium */}
      <aside className="w-80 bg-white/80 backdrop-blur-2xl border-l border-white shadow-2xl flex flex-col p-8 z-30">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck size={28} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Saban <span className="text-blue-600">OS</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'DASHBOARD'} icon={<LayoutDashboard/>} label="לוח סידור" onClick={() => setActiveTab('DASHBOARD')} />
          <SidebarBtn active={activeTab === 'DRIVERS'} icon={<Truck/>} label="סטטוס נהגים" onClick={() => setActiveTab('DRIVERS')} />
          <SidebarBtn active={activeTab === 'CUSTOMERS'} icon={<Users/>} label="לקוחות" onClick={() => setActiveTab('CUSTOMERS')} />
          <SidebarBtn active={activeTab === 'AI'} icon={<MessageSquare/>} label="צ'אט עוזר AI" onClick={() => setActiveTab('AI')} />
        </nav>

        <div className="mt-auto bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 shadow-inner">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">מנהל מערכת</p>
          <p className="font-black text-[#0F172A] text-lg">רמי סבן</p>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-blue-600 bg-white w-fit px-3 py-1 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"/>
            Firebase Realtime Active
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/20">
        
        {/* Top Header */}
        <header className="h-24 px-10 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/50 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black italic">ניהול סידור <span className="text-blue-600 underline decoration-4 underline-offset-8">LIVE</span></h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש מהיר במאגר..." 
                className="bg-white border-none shadow-sm p-3 pr-12 rounded-2xl w-80 font-bold text-sm focus:ring-4 ring-blue-500/10 outline-none transition-all" 
              />
            </div>
            <button className="bg-white p-3 rounded-2xl shadow-sm border border-white text-slate-600 hover:text-blue-600 transition-all relative">
              <Bell size={22}/>
              <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
            </button>
            <button onClick={handleCreateOrder} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
              <Plus size={20}/> הזמנה חדשה
            </button>
          </div>
        </header>

        {/* Dynamic Board */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-12 gap-10">
            
            {/* Orders Column */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-4">
                <h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em]">הזמנות פעילות</h3>
                <span className="font-black text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase italic">סנכרון מיידי</span>
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
                      className="group bg-white/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-sm border border-white hover:border-blue-200 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${order.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {order.status === 'done' ? <CheckCircle2 size={28}/> : <Clock size={28}/>}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-black text-2xl tracking-tight text-[#0F172A]">{order.name}</h4>
                              <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-tighter italic text-slate-500">בטון B-300</span>
                            </div>
                            <p className="text-slate-500 font-bold text-sm flex items-center gap-1 mt-1 italic">
                              <MapPin size={14} className="text-blue-500"/> {order.project_address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left ml-6">
                            <p className="text-[10px] font-black text-slate-300 uppercase italic leading-none">סטטוס</p>
                            <p className={`font-black uppercase text-xs tracking-widest ${order.status === 'done' ? 'text-emerald-500' : 'text-blue-600 animate-pulse'}`}>
                              {order.status === 'done' ? 'הושלם' : 'בביצוע'}
                            </p>
                          </div>
                          <button onClick={() => markAsDone(order.id)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
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

            {/* Drivers Panel */}
            <div className="col-span-12 xl:col-span-4 space-y-8">
              
              <section className="bg-[#0F172A] p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[80px] rounded-full"></div>
                <h3 className="font-black text-lg uppercase tracking-widest mb-8 flex items-center gap-3">
                  <Truck className="text-blue-400"/> נהגים בדרכים
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

              {/* AI Insight Card */}
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-blue-50 relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 text-white">
                    <AlertCircle size={20}/>
                  </div>
                  <p className="font-black text-sm uppercase">המלצת AI</p>
                </div>
                <p className="text-lg font-black text-slate-800 leading-snug pr-4 border-r-4 border-emerald-500 mb-8 italic">
                  "זיהיתי הזמנה חדשה בטייבה. איציק סבן הכי קרוב לאזור כרגע."
                </p>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg">
                  אשר ושלח פקודה
                </button>
              </section>
            </div>

          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 20px; }
      `}</style>
    </div>
  );
}

function SidebarBtn({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
        active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 font-black' 
        : 'text-slate-400 hover:bg-white hover:text-slate-900 font-bold hover:shadow-sm'
      }`}
    >
      {React.cloneElement(icon, { size: 22 })}
      <span className="text-sm uppercase tracking-tighter">{label}</span>
    </button>
  );
}
