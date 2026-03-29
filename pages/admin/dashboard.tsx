'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase'; // וודא שקובץ ה-Config שלך מיוצא כ-db
import { 
  collection, query, onSnapshot, orderBy, 
  addDoc, updateDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { 
  ShieldCheck, LayoutDashboard, Truck, Users, 
  Search, Bell, Plus, ChevronLeft, MapPin, 
  Clock, AlertCircle, MessageSquare, CheckCircle2, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanFirebaseOS() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // נהגים בסימולציה (ניתן להעביר ל-Firestore בקלות)
  const [drivers] = useState([
    { id: 'd1', name: 'איציק סבן', status: 'בדרך', location: 'טייבה', color: 'bg-blue-600' },
    { id: 'd2', name: 'מוחמד עיסא', status: 'פריקה', location: 'נתניה', color: 'bg-emerald-600' },
  ]);

  useEffect(() => {
    setMounted(true);
    
    // חיבור Realtime של Firebase - משכפל את טבלת orders מ-Supabase
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData: any[] = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      
      setOrders(ordersData);
      
      // השמעת צליל התראה בקבלת הזמנה חדשה
      if (mounted) {
        const audio = new Audio('/order-notification.mp3');
        audio.play().catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [mounted]);

  // פונקציית הוספת הזמנה (כתיבה ל-Firestore)
  const createNewOrder = async () => {
    try {
      await addDoc(collection(db, 'orders'), {
        name: 'לקוח חדש',
        project_address: 'כתובת זמנית',
        status: 'pending',
        created_at: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // עדכון סטטוס (שינוי ב-Firestore)
  const markAsDone = async (id: string) => {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, { status: 'done' });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex overflow-hidden" dir="rtl">
      
      {/* Sidebar - Premium Glass */}
      <aside className="w-80 bg-white/80 backdrop-blur-2xl border-l border-white shadow-2xl flex flex-col p-8 z-30">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck size={28} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Saban <span className="text-blue-600">OS</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === 'DASHBOARD'} icon={<LayoutDashboard/>} label="לוח סידור" onClick={() => setActiveTab('DASHBOARD')} />
          <NavItem active={activeTab === 'DRIVERS'} icon={<Truck/>} label="סטטוס נהגים" onClick={() => setActiveTab('DRIVERS')} />
          <NavItem active={activeTab === 'CUSTOMERS'} icon={<Users/>} label="לקוחות" onClick={() => setActiveTab('CUSTOMERS')} />
          <NavItem active={activeTab === 'AI'} icon={<MessageSquare/>} label="AI Assistant" onClick={() => setActiveTab('AI')} />
        </nav>

        <div className="mt-auto bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">מצב מערכת</p>
          <p className="font-black text-[#0F172A] text-lg">Firebase Live</p>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"/>
            מסד נתונים מסונכרן
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/20">
        
        {/* Header */}
        <header className="h-24 px-10 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/50 z-20">
          <h2 className="text-2xl font-black italic">לוח בקרה <span className="text-blue-600 underline decoration-4">SABAN-94</span></h2>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש מהיר ב-Firestore..." 
                className="bg-white border-none shadow-sm p-3 pr-12 rounded-2xl w-80 font-bold text-sm focus:ring-4 ring-blue-500/10 outline-none" 
              />
            </div>
            <button onClick={createNewOrder} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center gap-2">
              <Plus size={20}/> הוסף הזמנה
            </button>
          </div>
        </header>

        {/* Dynamic Board */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-12 gap-10">
            
            {/* Orders List */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest px-4">הזמנות פעילות בסידור</h3>
              
              <div className="grid gap-4">
                <AnimatePresence>
                  {orders.filter(o => JSON.stringify(o).includes(search)).map((order) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={order.id}
                      className="bg-white/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-sm border border-white hover:border-blue-200 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${order.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {order.status === 'done' ? <CheckCircle2 size={28}/> : <Clock size={28}/>}
                          </div>
                          <div>
                            <h4 className="font-black text-2xl tracking-tight">{order.name}</h4>
                            <p className="text-slate-500 font-bold text-sm flex items-center gap-1 mt-1 italic">
                              <MapPin size={14} className="text-blue-500"/> {order.project_address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
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
                <h3 className="font-black text-lg uppercase mb-8 flex items-center gap-3">
                  <Truck className="text-blue-400"/> סטטוס נהגים
                </h3>
                <div className="space-y-6 relative z-10">
                  {drivers.map(driver => (
                    <div key={driver.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${driver.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <Phone size={20} className="text-white"/>
                        </div>
                        <div>
                          <p className="font-black text-lg">{driver.name}</p>
                          <p className="text-xs font-bold text-slate-400 italic">{driver.location}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-blue-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        {driver.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* AI Assistant Insight */}
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-blue-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 text-white">
                    <AlertCircle size={20}/>
                  </div>
                  <p className="font-black text-sm uppercase">המלצת סידור AI</p>
                </div>
                <p className="text-lg font-black text-slate-800 leading-snug italic border-r-4 border-emerald-500 pr-4 mb-8">
                  "זיהיתי כפילות בהזמנות בנתניה. מומלץ לאחד הובלות במידת האפשר."
                </p>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg">
                   שלח פקודה לנהגים
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

function NavItem({ icon, label, active, onClick }: any) {
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
