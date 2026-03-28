'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Users, BrainCircuit, Save, Activity, Search, 
  Trash2, Edit3, UserPlus, Copy, Heart, Mail, UsersCircle, 
  Settings, Bot, Send, User, ChevronRight, CornerDownLeft, Paperclip
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

// --- קומפוננטת עזר: כפתור טאב מעוצב ---
const TabButton = ({ active, children, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${active ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
    <Icon size={16} /> {children}
  </button>
);

export default function SabanOSHighCore() {
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
  const [simPrompt, setSimPrompt] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // טעינת DNA מ-Firebase (חי)
    const unsubDNA = onSnapshot(doc(dbFS, 'settings', 'bot-dna'), (d) => {
      if (d.exists()) setBotConfig(d.data() as any);
    });

    // טעינת משתמשים מסופבייס (חי)
    const unsubSB = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchUsers)
      .subscribe();

    fetchUsers();
    return () => { unsubDNA(); unsubSB.unsubscribe(); };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data);
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
    } catch (err) { alert("שגיאה בשמירה/טלפון קיים"); }
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("למחוק משתמש זה לצמיתות?")) return;
    await supabase.from('customers').delete().eq('id', id);
    fetchUsers();
  };

  const startSimulator = (user: any) => {
    setSelectedUserForChat(user);
    setChatMessages([
      { role: 'system', content: `איתחול סימולציה עבור ${user.name}. ה-DNA הכללי הוטמע. הנחיות ספציפיות הוטמעו: ${user.brain_dna_notes || 'אין'}.` },
      { role: 'assistant', content: `שלום ${user.name}, איך אוכל לעזור היום?` }
    ]);
  };

  const sendMessageToSim = () => {
    if (!simPrompt.trim()) return;
    const newMessages = [...chatMessages, { role: 'user', content: simPrompt }];
    setChatMessages(newMessages);
    setSimPrompt('');

    // דימוי תשובת מוח (בעתיד יחובר ל-API)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `הבנתי, שאלת לגבי "${simPrompt}". בהתאם ל-DNA שלי, אני עונה בצורה מקצועית וחברית.` }]);
    }, 1000);
  };

  const copyMagicLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    navigator.clipboard.writeText(`https://sidor.vercel.app/chat/[${cleanPhone}]`);
    alert("לינק קסם הועתק!");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-900 font-sans selection:bg-emerald-100" dir="rtl">
      {/* --- נביגציה --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100"><ShieldCheck size={22} /></div>
          <div>
            <h1 className="font-black text-xl text-slate-950 tracking-tighter uppercase">Saban High-Core OS</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Central Intelligence & CRM</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <TabButton active={activeTab === 'CRM'} onClick={() => setActiveTab('CRM')} icon={Users}>ניהול משתמשים & סימולטור</TabButton>
          <TabButton active={activeTab === 'DNA'} onClick={() => setActiveTab('DNA')} icon={BrainCircuit}>ליבת המוח (DNA)</TabButton>
        </div>
      </nav>

      <main className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* --- אזור CRM וניהול --- */}
        <div className={`xl:col-span-2 space-y-6 ${selectedUserForChat ? 'hidden xl:block' : ''}`}>
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <h2 className="text-2xl font-black text-slate-950 flex items-center gap-3"><LayoutGrid className="text-emerald-500" /> מרכז שליטה במאגר</h2>
            <div className="flex gap-3">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="חיפוש לפי שם/טלפון..." className="bg-white border rounded-xl py-2.5 pr-10 pl-4 text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-emerald-200" onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100">
                <UserPlus size={18}/> הוסף פרופיל
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-5">שם ופרטי התקשרות</th>
                  <th className="p-5 hidden md:table-cell">פרופיל & קשרים</th>
                  <th className="p-5 text-center">לינק קסם</th>
                  <th className="p-5 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.filter(c => c.name.includes(search) || c.phone.includes(search)).map(c => (
                  <tr key={c.id} className={`hover:bg-emerald-50/50 transition-colors cursor-pointer ${selectedUserForChat?.id === c.id ? 'bg-emerald-50 border-r-4 border-r-emerald-500' : ''}`} onClick={() => startSimulator(c)}>
                    <td className="p-5">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{c.phone}</div>
                      {c.email && <div className="text-xs text-blue-600 font-mono mt-1 flex items-center gap-1"><Mail size={12}/> {c.email}</div>}
                    </td>
                    <td className="p-5 hidden md:table-cell space-y-1.5">
                      {c.family_relation && <div className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 font-medium"><UsersCircle size={14}/> {c.family_relation} לרמי</div>}
                      {c.hobbies && <div className="text-xs text-slate-500 italic flex items-center gap-1.5"><Heart size={14} className="text-red-400"/> {c.hobbies}</div>}
                    </td>
                    <td className="p-5 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => copyMagicLink(c.phone)} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600" title="העתק לינק קסם">
                        <Copy size={18}/>
                      </button>
                    </td>
                    <td className="p-5" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
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

        {/* --- סימולטור אייפון (מוצג ב-XL או כשנבחר משתמש) --- */}
        <div className={`xl:col-span-1 flex justify-center ${selectedUserForChat ? '' : 'hidden xl:flex'}`}>
          <div className="w-[320px] h-[650px] bg-black rounded-[50px] border-[12px] border-black shadow-2xl relative overflow-hidden flex flex-col p-2">
            {/* גריל וכפתור */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20 flex justify-center gap-2 items-center">
                <div className="w-10 h-1 bg-slate-800 rounded-full"/>
                <div className="w-2 h-2 bg-slate-800 rounded-full"/>
            </div>
            
            {selectedUserForChat ? (
              <div className="flex-1 bg-[#E5DDD5] rounded-[36px] overflow-hidden flex flex-col font-sans">
                {/* Header צאט */}
                <div className="bg-[#075E54] p-3 pt-6 text-white flex items-center gap-3">
                  <button onClick={() => setSelectedUserForChat(null)} className="xl:hidden"><ChevronRight/></button>
                  <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center font-bold text-[#075E54]">{selectedUserForChat.name[0]}</div>
                  <div>
                    <div className="font-bold text-sm">{selectedUserForChat.name}</div>
                    <div className="text-[10px] opacity-80 font-mono">Simulating with OS Brain</div>
                  </div>
                </div>
                
                {/* הודעות צאט */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto text-[11px] leading-relaxed">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'assistant' ? 'justify-start' : 'justify-center'}`}>
                      <div className={`max-w-[80%] p-2 rounded-xl ${m.role === 'user' ? 'bg-[#DCF8C6] rounded-bl-none' : m.role === 'assistant' ? 'bg-white rounded-br-none' : 'bg-blue-100 text-blue-700 text-center text-[9px]'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                
                {/* קלט צאט */}
                <div className="bg-[#F0F0F0] p-2 flex gap-2 items-center">
                  <input type="text" value={simPrompt} onChange={e => setSimPrompt(e.target.value)} placeholder="כתוב הודעה..." className="flex-1 p-2 bg-white rounded-full text-xs outline-none" onKeyPress={e => e.key === 'Enter' && sendMessageToSim()} />
                  <button onClick={sendMessageToSim} className="p-2 bg-[#075E54] text-white rounded-full"><Send size={16}/></button>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-slate-900 rounded-[36px] flex flex-col items-center justify-center p-6 text-center text-slate-600 gap-4">
                <Bot size={48}/>
                <div className="font-bold text-xs">לחץ על משתמש בטבלה כדי להתחיל סימולציה חיה בתוך עטיפת אייפון.</div>
              </div>
            )}
          </div>
        </div>

        {/* --- הגדרות DNA (מוצג בטאב נפרד) --- */}
        {activeTab === 'DNA' && (
          <div className="xl:col-span-2 max-w-2xl mx-auto w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border rounded-[2rem] p-8 shadow-sm space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-3"><BrainCircuit size={28} className="text-emerald-500"/> ליבת ההתנהגות של המוח</h2>
              <p className="text-sm text-slate-500 leading-relaxed">הממשק הזה קובע את תרבות והתנהגות המוח הכללית. ההנחיות כאן ישפיעו על כל שיחה עם כל לקוח, אלא אם הוגדרו הנחיות ספציפיות בפרופיל המשתמש.</p>
              
              <textarea 
                className="w-full h-96 bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-emerald-500/10 text-sm leading-relaxed font-mono"
                value={botConfig.instructions}
                onChange={(e) => setBotConfig({...botConfig, instructions: e.target.value})}
                placeholder="כתוב כאן את ה-DNA הכללי של המוח..."
              />
              <button onClick={async () => {
                setLoading(true);
                await setDoc(doc(dbFS, 'settings', 'bot-dna'), { ...botConfig, updatedAt: serverTimestamp() });
                setLoading(false);
                alert("ה-DNA הכללי עודכן והוטמע במוח!");
              }} className="w-full bg-slate-950 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                {loading ? <Activity className="animate-spin"/> : <Save size={20}/>} שמור והטמע DNA כללי
              </button>
            </motion.div>
          </div>
        )}
      </main>

      {/* --- מודל עריכה/הוספה (פרופיל מלא) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black mb-8">{editingUser ? `עריכת פרופיל: ${editingUser.name}` : 'הוספת פרופיל משתמש חדש'}</h3>
              <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* שדות חובה */}
                <InputField name="name" label="שם מלא" defaultValue={editingUser?.name} required placeholder="ישראל ישראלי" />
                <InputField name="phone" label="טלפון ראשי (972...)" defaultValue={editingUser?.phone} required placeholder="97250..." />
                
                {/* שדות מקצועיים של סבן OS */}
                <InputField name="email" label="אימייל (לשליחת מייל אוטומטי)" defaultValue={editingUser?.email} icon={Mail} placeholder="example@mail.com" type="email" />
                <InputField name="secondary_phone" label="טלפון נוסף (לשימוש רמי)" defaultValue={editingUser?.secondary_phone} placeholder="052..." />
                <InputField name="family_relation" label="קשר משפחתי/חברי לרמי" defaultValue={editingUser?.family_relation} icon={UsersCircle} placeholder="למשל: אח, דוד, חבר קרוב" />
                <InputField name="hobbies" label="תחביבים ותחומי עניין (לשימוח המוח)" defaultValue={editingUser?.hobbies} icon={Heart} placeholder="למשל: כדורגל, נדלן, בישול" />
                
                {/* הנחיה ספציפית למוח */}
                <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3">
                  <label className="text-sm font-bold text-emerald-900 flex items-center gap-2"><Bot size={18}/> הנחיה ספציפית למוח עבור משתמש זה</label>
                  <p className="text-xs text-emerald-700">הגדר למוח איך להתייחס ואיך יענה ספציפית לאדם זה (למשל: "דבר איתו רק על כדורגל ותהיה מאוד חברותי", או "תהיה רשמי וענייני").</p>
                  <textarea name="brain_dna_notes" defaultValue={editingUser?.brain_dna_notes} className="w-full h-24 p-3 bg-white border border-emerald-100 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-200" placeholder="הנחיה ספציפית..." />
                </div>

                <div className="md:col-span-2 pt-4 flex gap-3">
                    <button type="submit" disabled={loading} className="flex-1 bg-slate-950 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2">
                        {loading ? <Activity className="animate-spin"/> : editingUser ? <Check/> : <UserPlus/>} 
                        {editingUser ? 'עדכן פרופיל' : 'צור פרופיל והטמע'}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl">ביטול</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// קומפוננטת עזר לשדות קלט מעוצבים
const InputField = ({ name, label, icon: Icon, required, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
      {Icon && <Icon size={14} className="text-emerald-500" />} {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input name={name} {...props} required={required} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200 transition-all" />
  </div>
);
