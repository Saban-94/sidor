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

  const [drivers] = useState([
    { id: 'd1', name: 'איציק סבן', status: 'בדרך', location: 'טייבה', color: 'bg-blue-600' },
    { id: 'd2', name: 'מוחמד עיסא', status: 'פריקה', location: 'נתניה', color: 'bg-emerald-600' },
  ]);

  useEffect(() => {
    setMounted(true);

    // הגנה קריטית ל-TypeScript ול-Build של Vercel
    if (!db) return;

    // מאזין Realtime ל-Firestore - מושך הזמנות וממיין לפי זמן
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: any[] = [];
      snapshot.forEach((docSnap) => {
        ordersData.push({ id: docSnap.id, ...docSnap.data() });
      });

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !snapshot.metadata.hasPendingWrites) {
          playNotification();
        }
      });

      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [mounted]);

  const playNotification = () => {
    const audio = new Audio('/order-notification.mp3');
    audio.play().catch(() => {});
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  };

  const handleCreateOrder = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'orders'), {
        name: 'לקוח חדש',
        project_address: 'טייבה - אתר בנייה',
        phone: '050-0000000',
        status: 'pending',
        created_at: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error creating order:", e);
    }
  };

  const markAsDone = async (id: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, { status: 'done' });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#0F172A] font-sans flex overflow-hidden" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-80 bg-white/80 backdrop-blur-2xl border-l border-white shadow-2xl flex flex-col p-8 z-30">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck size={28} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-[#0F172A]">Saban <span className="text-blue-600">OS</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'DASHBOARD'} icon={<LayoutDashboard/>} label="לוח סידור" onClick={() => setActiveTab('DASHBOARD')} />
          <SidebarBtn active={activeTab === 'DRIVERS'} icon={<Truck/>} label="סטטוס נהגים" onClick={() => setActiveTab('DRIVERS')} />
          <SidebarBtn active={activeTab === 'CUSTOMERS'} icon={<Users/>} label="לקוחות" onClick={() => setActiveTab('CUSTOMERS')} />
          <SidebarBtn active={activeTab === 'AI'} icon={<MessageSquare/>} label="צ'אט עוזר AI" onClick={() => setActiveTab('AI')} />
        </nav>

        <div className="mt-auto bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">מנהל מערכת</p>
          <p className="font-black text-[#0F172A] text-lg">רמי סבן</p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/20">
        <header className="h-24 px-10 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/50 z-20">
          <h2 className="text-2xl font-black italic">ניהול סידור <span className="text-blue-600 underline decoration-4 underline-offset-8">LIVE</span></h2>
          <div className="flex items-center gap-4">
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש מהיר..." 
              className="bg-white border-none shadow-sm p-3 pr-4 rounded-2xl w-64 font-bold text-sm outline-none" 
            />
            <button onClick={handleCreateOrder} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30 flex items-center gap-2">
              <Plus size={20}/> הזמנה חדשה
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <AnimatePresence>
                {orders.filter(o => JSON.stringify(o).includes(search)).map((order) => (
                  <motion.div 
                    layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={order.id}
                    className="bg-white/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-sm border border-white hover:border-blue-200 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${order.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {order.status === 'done' ? <CheckCircle2 size={24}/> : <Clock size={24}/>}
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-[#0F172A]">{order.name}</h4>
                        <p className="text-slate-500 font-bold text-sm italic">{order.project_address}</p>
                      </div>
                    </div>
                    <button onClick={() => markAsDone(order.id)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-emerald-600 hover:text-white transition-all">
                      <CheckCircle2 size={22}/>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white font-black shadow-lg' : 'text-slate-400 hover:bg-white hover:text-slate-900 font-bold'}`}>
      {icon} <span className="text-sm uppercase tracking-tighter">{label}</span>
    </button>
  );
}
