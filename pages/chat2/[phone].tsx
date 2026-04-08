'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CalendarDays, Sun, Moon, Search, Settings, Star, AlertCircle, Clock3, Users, LayoutGrid, Package, MessageSquareShare } from 'lucide-react';

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

// --- דאטה מדומה למערכת האימייל ---
const mockEmails = [
  { id: 1, sender: "רויטל AI", subject: "📝 הזמנה חדשה - אתר טייבה", preview: "אח שלי, נקלטה הזמנה של 4 טיט ו-2 משטחי בלוק 20...", time: "10:30", type: "order" },
  { id: 2, sender: "ראמי מסארוה", subject: "🏗️ משימה: בדיקת סידור נהגים", preview: "ודאי בבקשה שמוחמד ויוסף בסידור למחר ב-8:00.", time: "09:45", type: "task" },
  { id: 3, sender: "מערכת SabanOS", subject: "📊 סקר שביעות רצון - קבלני איטום", preview: "הסקר היומי מוכן, נותח ע\"י רויטל, 98% מרוצים.", time: "08:15", type: "report" },
  { id: 4, sender: "ספק ברזל", subject: "🚛 אישור משלוח - מוטות 12 מ\"מ", preview: "המשטח בדרך, צפוי להגיע למגרש תוך שעתיים.", time: "היום", type: "logistic" },
];

export default function SabanOSWorkspace() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'mail' | 'calendar'>('mail');
  const [showSplash, setShowSplash] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(mockEmails[0].id);

  // אתחול מצב תאורה
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    const storedTheme = localStorage.getItem('saban_theme');
    if (storedTheme) setIsDarkMode(storedTheme === 'dark');
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    localStorage.setItem('saban_theme', isDarkMode ? 'light' : 'dark');
    setIsDarkMode(!isDarkMode);
  };

  const themeBg = isDarkMode ? "bg-[#0b141a] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]";
  const cardBg = isDarkMode ? "bg-[#202c33]/80 backdrop-blur-lg" : "bg-white/80 backdrop-blur-lg shadow-sm";
  const darkFilter = isDarkMode ? "invert(90%) hue-rotate(180deg) brightness(1.1)" : "none";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeBg}`} dir="rtl">
      <Head>
        <title>SabanOS Workspace | מרכז שליטה</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={SABAN_LOGO} className="w-28 h-28 rounded-3xl shadow-2xl shadow-emerald-500/20"/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* רקע דקורטיבי */}
      <div className="fixed inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-5 pointer-events-none z-0" />

      {/* Header - Glassmorphism */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-[#202c33]/90 border-white/5' : 'bg-white/90 border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <Menu size={22} className="text-slate-400 cursor-pointer" />
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-black/5">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Saban Workspace</span>
          <img src={SABAN_LOGO} className="w-8 h-8 rounded-full border border-emerald-500/30 object-cover shadow-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Search size={22} className="text-slate-400 cursor-pointer" />
          <Settings size={22} className="text-slate-400 cursor-pointer" />
        </div>
      </header>

      {/* Main Container - Flex Row for Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Sidebar - נקי ותמציתי */}
        <aside className={`w-16 flex flex-col items-center py-6 border-l ${isDarkMode ? 'bg-[#202c33] border-white/5' : 'bg-white border-black/5'}`}>
          <button onClick={() => setActiveTab('mail')} className={`p-3 rounded-xl mb-4 transition-all ${activeTab === 'mail' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400'}`}>
            <Mail size={22} />
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`p-3 rounded-xl mb-4 transition-all ${activeTab === 'calendar' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400'}`}>
            <CalendarDays size={22} />
          </button>
          <div className="mt-auto flex flex-col items-center gap-4 text-slate-400">
             <LayoutGrid size={20}/>
             <Package size={20}/>
             <MessageSquareShare size={20}/>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden">
          
          {/* 1. Mail Mode - שילוב רשימה ותוכן אימייל */}
          <AnimatePresence>
            {activeTab === 'mail' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex overflow-hidden">
                
                {/* Mail List */}
                <div className={`w-2/5 border-l overflow-y-auto no-scrollbar ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                  {mockEmails.map((e, i) => (
                    <div 
                      key={e.id} 
                      onClick={() => setSelectedEmail(e.id)}
                      className={`p-4 border-b cursor-pointer transition-colors relative ${e.id === selectedEmail ? (isDarkMode ? 'bg-[#2a3942]' : 'bg-emerald-50') : (isDarkMode ? 'border-white/5 hover:bg-[#2a3942]/50' : 'border-black/5 hover:bg-slate-50')}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>{e.sender}</span>
                        <span className="text-xs text-slate-400">{e.time}</span>
                      </div>
                      <p className="font-bold text-xs text-emerald-500 mb-1 line-clamp-1">{e.subject}</p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{e.preview}</p>
                      {i < 2 && <motion.div animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute top-4 right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full"/>}
                    </div>
                  ))}
                </div>

                {/* Mail Detail - הודעת וואטסאפ מדומה */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  {selectedEmail && (
                    <div className={`${cardBg} p-6 rounded-[2rem] border border-white/5 shadow-xl leading-relaxed`}>
                      <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <img src={SABAN_LOGO} className="w-10 h-10 rounded-full border border-emerald-500/30" />
                          <div>
                            <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>{mockEmails.find(e => e.id === selectedEmail)?.sender}</p>
                            <p className="text-xs text-slate-400">נשלח אליך ב-{mockEmails.find(e => e.id === selectedEmail)?.time}</p>
                          </div>
                        </div>
                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                      </div>
                      
                      <h3 className="text-lg font-black text-emerald-500 mb-4">{mockEmails.find(e => e.id === selectedEmail)?.subject}</h3>
                      
                      <div className={`space-y-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <p className="text-sm">בוס היקר,</p>
                        <p className="text-sm">רק מעדכנת שסגרתי את כל הפרטים מול הלקוח לגבי ההזמנה של הטיט והבלוקים. האישור הועבר לנהג דרך מערכת SabanOS. הכל רשום בגיליון לוגיסטיקה ובסידור היומי. ראמי כבר מעודכן וממתין לפריקה.</p>
                        <p className="text-sm">תיעוד מלא נחת בגיליון Logs לסקרים היומיים.</p>
                        <p className="text-sm">רויטל כאן לכל סגירה. 🏗️</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. Calendar Mode - יומן חי מתוך Google Calendar */}
          <AnimatePresence>
            {activeTab === 'calendar' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className={`${cardBg} flex-1 rounded-[2rem] border border-white/5 shadow-xl overflow-hidden`}>
                  
                  {/* כתובת ה-Embed של היומן שלך */}
                  <iframe 
                    src="https://calendar.google.com/calendar/embed?src=hsaban2025%40gmail.com&ctz=Asia%2FJerusalem" 
                    style={{ border: 0, filter: darkFilter }} 
                    className="w-full h-full"
                    frameBorder="0" 
                    scrolling="no"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { background: #0b141a; font-family: sans-serif; }
      `}</style>
    </div>
  );
}
