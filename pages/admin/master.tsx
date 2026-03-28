'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Users, BrainCircuit, Save, Activity, 
  Trash2, Edit3, UserPlus, Copy, ExternalLink, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול קליינטים
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SabanMaster() {
  const [activeTab, setActiveTab] = useState<'CRM' | 'DNA'>('CRM');
  const [customers, setCustomers] = useState<any[]>([]);
  const [botConfig, setBotConfig] = useState({ name: '', instructions: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // טעינת DNA מ-Firebase
    const unsubDNA = onSnapshot(doc(dbFS, 'settings', 'bot-dna'), (d) => {
      if (d.exists()) setBotConfig(d.data() as any);
    });

    // טעינת משתמשים מסופבייס
    fetchUsers();
    return () => unsubDNA();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('customers').select('*').order('last_seen', { ascending: false });
    if (data) setCustomers(data);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const userData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      brain_notes: formData.get('notes'),
      status: 'active'
    };

    try {
      if (editingUser) {
        await supabase.from('customers').update(userData).eq('id', editingUser.id);
      } else {
        await supabase.from('customers').insert([userData]);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) { alert("שגיאה בשמירה"); }
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("למחוק משתמש?")) return;
    await supabase.from('customers').delete().eq('id', id);
    fetchUsers();
  };

  const copyMagicLink = (phone: string) => {
    // ניקוי פורמט טלפון והצמדת הלינק שביקשת
    const cleanPhone = phone.replace(/\D/g, '');
    const link = `https://sidor.vercel.app/chat/[${cleanPhone}]`;
    navigator.clipboard.writeText(link);
    alert("לינק קסם הועתק!");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg"><ShieldCheck size={24} /></div>
          <h1 className="font-black text-slate-800 tracking-tight uppercase">Saban OS Control</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('CRM')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'CRM' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>ניהול משתמשים</button>
          <button onClick={() => setActiveTab('DNA')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'DNA' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>המוח (DNA)</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {activeTab === 'CRM' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-emerald-500"/> מאגר המשתמשים</h2>
              <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-emerald-500 text-white px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-md">
                <UserPlus size={18}/> הוסף משתמש
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase">
                    <th className="p-5">שם ופרטים</th>
                    <th className="p-5">מידע למוח</th>
                    <th className="p-5 text-center">לינק קסם</th>
                    <th className="p-5 text-left">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-xs text-slate-500 max-w-[200px] truncate italic">{c.brain_notes || 'אין מידע נוסף'}</div>
                      </td>
                      <td className="p-5 text-center">
                        <button onClick={() => copyMagicLink(c.phone)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all" title="העתק לינק קסם">
                          <Copy size={18}/>
                        </button>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingUser(c); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-500"><Edit3 size={18}/></button>
                          <button onClick={() => deleteUser(c.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* DNA View - זהה לקוד הקודם */
          <div className="bg-white border rounded-[2rem] p-8 shadow-sm max-w-2xl mx-auto">
             <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><BrainCircuit className="text-emerald-500"/> הנחיות ליבת המוח</h2>
             <textarea 
               className="w-full h-80 bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-emerald-500/10 text-sm leading-relaxed"
               value={botConfig.instructions}
               onChange={(e) => setBotConfig({...botConfig, instructions: e.target.value})}
               placeholder="כתוב כאן איך המוח צריך להתנהג..."
             />
             <button onClick={async () => {
               setLoading(true);
               await setDoc(doc(dbFS, 'settings', 'bot-dna'), { ...botConfig, updatedAt: serverTimestamp() });
               setLoading(false);
               alert("ה-DNA עודכן!");
             }} className="w-full mt-6 bg-emerald-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
               {loading ? <Activity className="animate-spin"/> : <Save size={20}/>} שמור הגדרות מוח
             </button>
          </div>
        )}
      </main>

      {/* Modal עריכה והוספה */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10">
              <h3 className="text-xl font-black mb-6">{editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</h3>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <input name="name" defaultValue={editingUser?.name} placeholder="שם מלא" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" required />
                <input name="phone" defaultValue={editingUser?.phone} placeholder="טלפון (למשל 97250...)" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" required />
                <textarea name="notes" defaultValue={editingUser?.brain_notes} placeholder="מידע מיוחד למוח על הלקוח הזה..." className="w-full p-4 bg-slate-50 border rounded-2xl outline-none h-32 resize-none" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg">
                  {loading ? 'שומר...' : 'אשר ושמור'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
