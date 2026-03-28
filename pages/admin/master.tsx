'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Users, BrainCircuit, Save, Activity, Search, 
  Trash2, Edit3, UserPlus, Copy, Heart, Mail, UsersCircle, 
  Smartphone, Bot, Send, User, ChevronRight, Database, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- אתחול קליינטים ---
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

export default function SabanOSMaster() {
  const [activeTab, setActiveTab] = useState<'CRM' | 'DNA'>('CRM');
  const [customers, setCustomers] = useState<any[]>([]);
  const [botConfig, setBotConfig] = useState({ name: '', instructions: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // --- סימולטור ---
  const [selectedUserForChat, setSelectedUserForChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [simInput, setSimInput] = useState('');

  useEffect(() => {
    // סנכרון DNA מ-Firebase
    const unsubDNA = onSnapshot(doc(dbFS, 'settings', 'bot-dna'), (d) => {
      if (d.exists()) setBotConfig(d.data() as any);
    });

    fetchUsers();
    return () => unsubDNA();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (!error) setCustomers(data);
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const userData = Object.fromEntries(formData.entries());

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

  const startSim = (user: any) => {
    setSelectedUserForChat(user);
    setChatMessages([
      { role: 'system', content: `איתחול סימולציה. ה-DNA הוטמע. הנחיה ספציפית: ${user.brain_dna_notes || 'אין'}` },
      { role: 'assistant', content: `אהלן ${user.name}, כאן המוח של סבן OS. איך אני יכול לעזור?` }
    ]);
  };

  const sendSimMsg = () => {
    if (!simInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', content: simInput }]);
    const currentInput = simInput;
    setSimInput('');
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `בהתאם ל-DNA שלי ולמידע עליך (${selectedUserForChat.hobbies || 'כללי'}), אני עונה על: ${currentInput}` }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white"><ShieldCheck size={24} /></div>
          <h1 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Saban High-Core OS</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('CRM')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'CRM' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>ניהול & סימולטור</button>
          <button onClick={() => setActiveTab('DNA')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'DNA' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>ליבת המוח</button>
        </div>
      </nav>

      <main className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
        {/* CRM TABLE */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2"><Users className="text-emerald-500" /> מאגר מוחות ומשתמשים</h2>
            <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all">
              הוסף פרופיל חדש +
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="p-5">שם ופרטים</th>
                  <th className="p-5">פרופיל & קשרים</th>
                  <th className="p-5 text-center">לינק קסם</th>
                  <th className="p-5 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map(c => (
                  <tr key={c.id} onClick={() => startSim(c)} className={`hover:bg-emerald-50/30 transition-all cursor-pointer ${selectedUserForChat?.id === c.id ? 'bg-emerald-50/80 border-r-4 border-r-emerald-500' : ''}`}>
                    <td className="p-5">
                      <div className="font-black text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
                    </td>
                    <td className="p-5 space-y-1">
                      {c.family_relation && <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-full inline-block font-bold">{c.family_relation} לרמי</div>}
                      {c.hobbies && <div className="text-[10px] text-slate-500 italic flex items-center gap-1"><Heart size={10} className="text-red-400"/> {c.hobbies}</div>}
                    </td>
                    <td className="p-5 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => {
                        const link = `https://sidor.vercel.app/chat/[${c.phone.replace(/\D/g, '')}]`;
                        navigator.clipboard.writeText(link);
                        alert("הועתק!");
                      }} className="p-2.5 bg-white border rounded-xl text-slate-400 hover:text-blue-500 transition-all"><Copy size={18}/></button>
                    </td>
                    <td className="p-5" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingUser(c); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-emerald-500"><Edit3 size={18}/></button>
                        <button onClick={() => { if(confirm("למחוק?")) supabase.from('customers').delete().eq('id', c.id).then(fetchUsers); }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* IPHONE SIMULATOR */}
        <div className="xl:col-span-1 flex justify-center">
           <div className="w-[300px] h-[600px] bg-black rounded-[50px] border-[10px] border-black shadow-2xl relative overflow-hidden flex flex-col p-2">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-xl z-20" />
              {selectedUserForChat ? (
                <div className="flex-1 bg-[#E5DDD5] rounded-[30px] overflow-hidden flex flex-col">
                  <div className="bg-[#075E54] p-3 pt-5 text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-[#075E54] text-xs">{selectedUserForChat.name[0]}</div>
                    <div className="text-xs font-bold">{selectedUserForChat.name}</div>
                  </div>
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto text-[10px]">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'assistant' ? 'justify-start' : 'justify-center'}`}>
                        <div className={`max-w-[85%] p-2 rounded-lg ${m.role === 'user' ? 'bg-[#DCF8C6]' : m.role === 'assistant' ? 'bg-white' : 'bg-blue-50 text-blue-500 italic'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#F0F0F0] p-2 flex gap-1">
                    <input value={simInput} onChange={e => setSimInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendSimMsg()} className="flex-1 p-2 bg-white rounded-full text-[10px] outline-none" placeholder="הודעה למוח..." />
                    <button onClick={sendSimMsg} className="p-2 bg-[#075E54] text-white rounded-full"><Send size={14}/></button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-slate-900 rounded-[30px] flex flex-col items-center justify-center p-6 text-center text-slate-600 gap-4">
                  <Smartphone size={40}/>
                  <div className="text-[10px] font-bold">לחץ על משתמש בטבלה כדי להתחיל סימולציה חיה של המוח</div>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-black mb-6">ניהול פרופיל מוח - Saban OS</h3>
              <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" label="שם מלא" defaultValue={editingUser?.name} required />
                <Input name="phone" label="טלפון (972...)" defaultValue={editingUser?.phone} required />
                <Input name="email" label="אימייל (לשליחת מייל)" defaultValue={editingUser?.email} type="email" />
                <Input name="family_relation" label="קשר משפחתי לרמי" defaultValue={editingUser?.family_relation} />
                <Input name="hobbies" label="תחביבים (לשימוח המוח)" defaultValue={editingUser?.hobbies} />
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-emerald-600 uppercase">הנחיה ספציפית למוח עבורו</label>
                  <textarea name="brain_dna_notes" defaultValue={editingUser?.brain_dna_notes} className="w-full h-24 p-3 bg-slate-50 border rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-200" placeholder="למשל: דבר איתו בחופשיות על עסקים..." />
                </div>
                <button type="submit" className="md:col-span-2 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg mt-4">{editingUser ? 'עדכן פרופיל' : 'צור והטמע במוח'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Input = ({ label, name, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase">{label}</label>
    <input name={name} {...props} className="w-full p-3.5 bg-slate-50 border rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-200 transition-all" />
  </div>
);
