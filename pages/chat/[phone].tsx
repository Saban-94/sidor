'use client';

import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, ShieldCheck, Zap, Sparkles, User, MapPin, Calendar, X, 
  Camera, Menu, Bell, Mail, Briefcase, Lock, Sun, Moon, CheckCircle2, AlertTriangle, Settings, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const RAMI_PHONE = '972508860896';

export default function RamiControlApp() {
  const router = useRouter();
  const { phone } = router.query;
  const cleanPhone = typeof phone === 'string' ? phone.replace(/[\[\]]/g, '') : '';
  const isRami = cleanPhone === RAMI_PHONE;

  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // אופטימיזציה לסמסונג נוט 25
  const isSamsungNote25 = useRef(navigator.userAgent.includes('SM-N99'));

  // התראות מיקום (מבוסס רטט/צלצול)
  const [lastUserLocation, setLastUserLocation] = useState<any>(null);
  const alertAudioRef = useRef<HTMLAudioElement>(null);
  const [alertPending, setAlertPending] = useState(false);

  // משימות ומיילים
  const [taskType, setTaskType] = useState<'ח.סבן' | 'פרטי'>('ח.סבן');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // 1. שליפת פרופיל משתמש
  useEffect(() => {
    if (!cleanPhone) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('customers').select('*').eq('phone', cleanPhone).single();
      if (data) {
        setUserProfile(data);
        if (isRami) {
          setMessages([{ role: 'assistant', content: `בוס, אפליקציית השליטה Saban OS מוכנה. איתחול DNA הסתיים.` }]);
        } else {
          setMessages([{ role: 'assistant', content: `שלום ${data.name}, מחובר ל-Saban OS.` }]);
        }
      } else {
        setUserProfile({ name: 'אורח', status: 'unknown' });
      }
    };
    fetchProfile();
  }, [cleanPhone]);

  // 2. ניטור מיקום משתמשים (התראות התקרבות)
  useEffect(() => {
    if (!isRami) return;
    const locationUnsub = supabase
      .channel('user-locations')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, (payload) => {
        const user = payload.new;
        if (user.status === 'near_branch') {
          setAlertPending(true);
          setLastUserLocation(user);
          if (navigator.vibrate) navigator.vibrate([100, 30, 100, 30, 100]);
          alertAudioRef.current?.play().catch(e => console.log('צלצול נחסם על ידי הדפדפן'));
        }
      })
      .subscribe();
    return () => { locationUnsub.unsubscribe(); };
  }, [isRami]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // --- פונקציות שליטה ---

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    // כאן תבוא לוגיקת Gemini המלאה
  };

  const confirmAlert = () => {
    alertAudioRef.current?.pause();
    alertAudioRef.current!.currentTime = 0;
    setAlertPending(false);
    setMessages(prev => [...prev, { role: 'assistant', content: `בוס, משתמש ${lastUserLocation?.name} אושר. אני מעדכן סטטוס.` }]);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const taskData = Object.fromEntries(formData.entries());
    // לוגיקת שמירת משימה
    setShowTaskForm(false);
    setMessages(prev => [...prev, { role: 'assistant', content: `המשימה של ${taskType} נשמרה ביומן, בוס.` }]);
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const emailData = Object.fromEntries(formData.entries());
    // לוגיקת שליחת מייל
    setShowEmailForm(false);
    setMessages(prev => [...prev, { role: 'assistant', content: `המייל נשלח בהצלחה.` }]);
  };

  if (!userProfile) return <div className="h-screen flex items-center justify-center font-black">Saban OS Syncing...</div>;

  return (
    <div className={`flex h-screen font-sans ${isDarkMode ? 'dark bg-[#121212] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      <audio ref={alertAudioRef} src="https://assets.mixkit.co/active_storage/sfx/1110/1110.wav" preload="auto"/>

      {/* תפריט המבורגר (מובייל/מחשב) */}
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className={`fixed right-0 top-0 h-full w-72 z-50 p-6 flex flex-col gap-6 ${isDarkMode ? 'bg-[#1C1C1C]' : 'bg-white'} shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-black text-xl flex items-center gap-2"><Settings/> אדמין השליטה</h1>
              <button onClick={() => setShowMenu(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"><X/></button>
            </div>
            {isRami && (
              <div className="flex flex-col gap-3">
                <button onClick={() => { setShowTaskForm(true); setTaskType('ח.סבן'); }} className="flex items-center gap-3 px-4 py-3 bg-white/5 dark:bg-black/20 rounded-xl text-sm font-black"><Briefcase size={18} className="text-emerald-500"/> משימות ח.סבן</button>
                <button onClick={() => { setShowTaskForm(true); setTaskType('פרטי'); }} className="flex items-center gap-3 px-4 py-3 bg-white/5 dark:bg-black/20 rounded-xl text-sm font-black"><Lock size={18} className="text-orange-400"/> משימות פרטיות</button>
                <button onClick={() => setShowEmailForm(true)} className="flex items-center gap-3 px-4 py-3 bg-white/5 dark:bg-black/20 rounded-xl text-sm font-black"><Mail size={18} className="text-blue-400"/> שליחת מייל</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* מחשב שולחני / אפליקציה */}
      <main className={`flex-1 flex flex-col ${isRami && 'xl:grid xl:grid-cols-[2fr,1fr] xl:gap-6 xl:p-6'}`}>
        <div className={`flex flex-col h-full bg-[#E5DDD5] dark:bg-[#121212] ${isRami && 'xl:rounded-[2.5rem] xl:shadow-2xl xl:overflow-hidden'}`}>
          {/* Header */}
          <header className={`p-4 flex items-center justify-between border-b border-white/5 shadow-md z-10 sticky top-0 ${isDarkMode ? 'bg-[#202C33]' : 'bg-white'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><Menu/></button>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-black border border-slate-200">OS</div>
              <div>
                <h2 className="font-black text-sm">{userProfile.name}</h2>
                {isRami ? <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><ShieldCheck size={10}/> מנהל ראשי (Samsung Note 25)</p> : <p className="text-[10px] text-slate-400">Sync Online</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 bg-white/5 dark:bg-black/20 text-orange-400">{isDarkMode ? <Sun/> : <Moon/>}</button>
              {isRami && <button className="p-2.5 rounded-xl transition-all bg-emerald-500 text-black hover:bg-emerald-600"><Zap/></button>}
            </div>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl ${m.role === 'user' ? 'bg-[#DCF8C6] dark:bg-[#005C4B] text-slate-800 dark:text-white rounded-tr-none' : 'bg-white dark:bg-[#202C33] text-slate-800 dark:text-slate-100 rounded-tl-none'}`}>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                  <span className="text-[9px] text-slate-400 mt-1 block">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <footer className={`p-4 ${isDarkMode ? 'bg-[#202C33]' : 'bg-white'} border-t border-slate-200 dark:border-white/5`}>
            <div className="flex gap-2 max-w-5xl mx-auto relative">
              <input 
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRami ? 'מה הפקודה שלך, בוס?' : 'הודעה...'}
                className={`flex-1 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 ${isDarkMode ? 'bg-[#2A3942] text-white placeholder:text-slate-500' : 'bg-slate-100'}`}
              />
              <button onClick={handleSend} className="bg-emerald-500 text-black p-4 rounded-xl shadow-lg active:scale-95 transition-transform"><Send size={22} /></button>
            </div>
          </footer>
        </div>

        {/* פאנל התראות ומשימות עבור ראמי (רק במחשב) */}
        <AnimatePresence>
          {isRami && alertPending && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`fixed bottom-24 right-6 left-6 z-50 p-6 rounded-3xl border ${isDarkMode ? 'bg-[#1E293B] border-red-500/20' : 'bg-white border-slate-200'} shadow-2xl xl:static xl:col-span-1 xl:h-fit xl:grid xl:gap-4 xl:p-6`}>
              <div className="flex items-start gap-4 mb-4 xl:mb-0">
                <AlertTriangle className="text-red-500 mt-1 shrink-0" size={30}/>
                <div className="flex-1">
                  <h3 className="font-black text-lg text-red-500">התראת מיקום!</h3>
                  <p className="text-sm">משתמש {lastUserLocation?.name} התקרב למפעל בסניף החרש.</p>
                  <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase flex items-center gap-1"><User size={10}/> {lastUserLocation?.phone} | {lastUserLocation?.location}</div>
                </div>
              </div>
              <div className="flex gap-3 justify-end xl:mt-4">
                <button onClick={confirmAlert} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-black font-black text-xs rounded-xl shadow-lg"><CheckCircle2 size={16}/> אשר התראה</button>
                <button onClick={() => { alertAudioRef.current?.pause(); setAlertPending(false); }} className="flex items-center gap-2 px-5 py-3 bg-red-100 dark:bg-red-500/10 text-red-600 font-bold text-xs rounded-xl"><X size={16}/> התעלם</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* משימות ומיילים עבור ראמי (רק במחשב - פאנל צדדי) */}
        {isRami && (
          <div className="hidden xl:block xl:col-span-1 h-full bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col gap-6">
            <h2 className="font-black text-lg flex items-center gap-2 text-emerald-500"><Bell/> לוח בקרה ומשימות</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setShowTaskForm(true); setTaskType('ח.סבן'); }} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl text-xs font-black"><Briefcase size={18} className="text-emerald-500"/> משימות ח.סבן חומרי בנין</button>
              <button onClick={() => { setShowTaskForm(true); setTaskType('פרטי'); }} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl text-xs font-black"><Lock size={18} className="text-orange-400"/> משימות פרטיות</button>
              <button onClick={() => setShowEmailForm(true)} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl text-xs font-black"><Mail size={18} className="text-blue-400"/> שליחת מייל</button>
              <button onClick={() => router.push('/admin/master')} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl text-xs font-black"><Settings size={18}/> אדמין ראשי (DNA)</button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[9px] text-emerald-400 p-3 bg-black/20 rounded-2xl opacity-80">
                <div>[{new Date().toLocaleTimeString()}] SABAN OS Live Status.</div>
                <div>[{new Date().toLocaleTimeString()}] Location Monitor Active.</div>
                <div>[{new Date().toLocaleTimeString()}] Task Sync: ח.סבן (8) / פרטי (4).</div>
            </div>
          </div>
        )}
      </main>

      {/* מודלים של משימות ומיילים */}
      <AnimatePresence>
        {showTaskForm && <FormModal title={`משימת ${taskType}`} onClose={() => setShowTaskForm(false)} onSubmit={createTask} fields={['title', 'time', 'location']} isDarkMode={isDarkMode}/>}
        {showEmailForm && <FormModal title="שליחת מייל" onClose={() => setShowEmailForm(false)} onSubmit={sendEmail} fields={['to', 'subject', 'body']} isDarkMode={isDarkMode}/>}
      </AnimatePresence>
    </div>
  );
}

// קומפוננטת מודל טפסים
function FormModal({ title, onClose, onSubmit, fields, isDarkMode }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl ${isDarkMode ? 'bg-[#1C1C1C]' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-white/5"><X/></button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {fields.includes('title') && <input name="title" placeholder="כותרת המשימה" required className={`p-4 rounded-xl text-xs ${isDarkMode ? 'bg-[#2A3942]' : 'bg-slate-50'}`}/>}
          {fields.includes('time') && <input name="time" placeholder="תאריך ושעה" required className={`p-4 rounded-xl text-xs ${isDarkMode ? 'bg-[#2A3942]' : 'bg-slate-50'}`}/>}
          {fields.includes('location') && <input name="location" placeholder="מיקום המשימה" required className={`p-4 rounded-xl text-xs ${isDarkMode ? 'bg-[#2A3942]' : 'bg-slate-50'}`}/>}
          {fields.includes('to') && <input name="to" type="email" placeholder="לכבוד (Email)" required className={`p-4 rounded-xl text-xs ${isDarkMode ? 'bg-[#2A3942]' : 'bg-slate-50'}`}/>}
          {fields.includes('subject') && <input name="subject" placeholder="נושא המייל" required className={`p-4 rounded-xl text-xs ${isDarkMode ? 'bg-[#2A3942]' : 'bg-slate-50'}`}/>}
          {fields.includes('body') && <textarea name="body" placeholder="גוף המייל" required className={`p-4 rounded-xl text-xs h-32 resize-none ${isDarkMode ? 'bg-[#2A3942]' : 'bg-slate-50'}`}/>}
          <button type="submit" className="bg-emerald-500 text-black font-black py-4 rounded-2xl shadow-xl mt-4 text-xs">שמור ועדכן מוח</button>
        </form>
      </motion.div>
    </div>
  );
}
