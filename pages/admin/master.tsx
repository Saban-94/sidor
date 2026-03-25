import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Send, Crown, Map, Truck, ClipboardList, 
  Settings, Sun, Moon, Activity, PackageSearch,
  MessageSquare, Route, CalendarPlus, Calculator,
  Tags, X, Plus
} from 'lucide-react';

// 1. אתחול Firebase לשמירת היסטוריית פקודות והגדרות מערכת
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default function MasterBrainPWA() {
  const [messages, setMessages] = useState<{role: 'system'|'master', text: string, type?: string}[]>([
    { role: 'system', text: 'אהלן ראמי. מערכת המאסטר מחוברת. סנכרון למלאי, צי רכבים, יומן פגישות וגוגל מפות הופעל בהצלחה. מה הפקודה להיום?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const scrollRef = useRef<HTMLDivElement>(null);

  // סטייטים לניהול דינאמי של מילות הסינון (Stop Words)
  const [stopWords, setStopWords] = useState<string[]>([]);
  const [newStopWord, setNewStopWord] = useState('');

  // גלילה אוטומטית
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  // האזנה בלייב למילות הסינון ב-Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(dbFS, "system", "search_config"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().stopWords) {
        setStopWords(docSnap.data().stopWords);
      } else {
        // רשימת ברירת מחדל אם טרם הוגדר במסד הנתונים
        const defaults = ['רוצה', 'להזמין', 'לקנות', 'יש', 'לכם', 'אני', 'צריך', 'מחפש', 'האם', 'איפה', 'מה', 'כמה', 'איך', 'לי', 'לו', 'את', 'של', 'על', 'עם', 'ב', 'ל', 'ה', 'ו', 'תביא', 'תארגן', 'מקט', 'מק"ט'];
        setStopWords(defaults);
        setDoc(doc(dbFS, "system", "search_config"), { stopWords: defaults }, { merge: true });
      }
    });
    return () => unsub();
  }, []);

  const handleAddStopWord = async () => {
    if (!newStopWord.trim()) return;
    const updated = [...new Set([...stopWords, newStopWord.trim()])];
    await setDoc(doc(dbFS, "system", "search_config"), { stopWords: updated }, { merge: true });
    setNewStopWord('');
  };

  const handleRemoveStopWord = async (word: string) => {
    const updated = stopWords.filter(w => w !== word);
    await setDoc(doc(dbFS, "system", "search_config"), { stopWords: updated }, { merge: true });
  };

  // פקודות קסם (Quick Actions)
  const magicCommands = [
    {
      id: 'create-dispatch',
      icon: <Truck size={18} />,
      label: 'דחוף הזמנה לסידור',
      prompt: 'צור הזמנה חדשה למחר בבוקר: 5 משטחי מלט לכתובת הרצל 10 תל אביב, לקוח: יוסי קבלנות. דחוף את ההזמנה ישירות ללוח הסידור (טבלת saban_dispatch) ושבץ את חכמת.'
    },
    {
      id: 'schedule-meeting',
      icon: <CalendarPlus size={18} />,
      label: 'קבע פגישה + לינק',
      prompt: 'קבע פגישה עם הראל המנכ"ל לשעה 16:00. שלח לו אוטומטית לינק קסם לווצאפ שיכניס אותו ישירות לחדר הצ\'אט המאובטח שלנו, ושים לי תזכורת.'
    },
    {
      id: 'analyze-boq',
      icon: <Calculator size={18} />,
      label: 'ניתוח כתב כמויות',
      prompt: 'נתח את כתב הכמויות הבא שהלקוח המזדמן הדביק בלינק הקסם. חשב כמויות לפי המלאי שלנו (Supabase), תמחר הכל, ותוציא לי רשימה מעוצבת ומוכנה לאישור הלקוח: \n[הדבק כתב כמויות כאן]'
    },
    {
      id: 'morning-report',
      icon: <ClipboardList size={18} />,
      label: 'דוח בוקר לנהגים',
      prompt: 'הכן דוח בוקר מסודר לווצאפ עבור הנהגים עלי וחכמת. חלק להם את ההובלות לפי אזורים והוסף אזהרה לעלי לגבי הגבלות משקל באיילון.'
    }
  ];

  const handleCommandClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    
    const cmd = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'master', text: cmd }]);
    setIsThinking(true);

    try {
      // 2. שמירת היסטוריית הפקודות של המאסטר ב-Firebase
      await addDoc(collection(dbFS, "master_history"), {
        command: cmd,
        timestamp: serverTimestamp(),
        executor: "Rami",
        status: "processing"
      });

      // סימולציה של פעולות ה-API המורכבות
      setTimeout(() => {
        let reply = '';
        
        if (cmd.includes('צור הזמנה') || cmd.includes('סידור')) {
          reply = `✅ *הזמנה נוצרה ונדחפה בהצלחה!*\nהלקוח: יוסי קבלנות\nכתובת: הרצל 10, ת"א\nנהג משובץ: חכמת (מנוף)\n\nההזמנה הוזרקה בהצלחה לטבלת \`saban_dispatch\` ומופיעה עכשיו במסך ה-LIVE של הסידור.`;
        } else if (cmd.includes('פגישה') || cmd.includes('הראל')) {
          reply = `📅 *פגישה נקבעה - 16:00*\nלינק קסם מאובטח נשלח כרגע להראל לווצאפ:\n\`https://sidor.vercel.app/start?ref=harel_ceo\`\n\nשמתי לך תזכורת למערכת ל-15:55 לקפוץ לחדר הצ'אט איתו.`;
        } else if (cmd.includes('כתב כמויות') || cmd.includes('נתח')) {
          reply = `📊 *ניתוח כתב כמויות אוטומטי*\nסרקתי את הטקסט והצלבתי עם מלאי \`Supabase\`:\n\n1. **פלסטומר 603 (מק"ט 11511)** - נדרשים 40 שקים. (₪1,200)\n2. **סיקה טופ סיל 107** - נדרשות 5 ערכות. (₪850)\n3. **רשת אינטרגלס** - 2 גלילים. (₪300)\n\n*סה"כ הצעת מחיר:* ₪2,350 לפני מע"מ.\nהעברתי את זה לפורמט PDF מעוצב. לשלוח ללקוח המזדמן ללינק הקסם שלו?`;
        } else {
          reply = "הפקודה נרשמה בהיסטוריה, מעדכן את המערכת ורץ על הנתונים. משהו נוסף?";
        }

        setMessages(prev => [...prev, { role: 'system', text: reply }]);
        setIsThinking(false);
      }, 2500);

    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: 'שגיאת מערכת בשמירת ההיסטוריה. השרת לא הגיב.' }]);
      setIsThinking(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-[#09090b]' : 'bg-slate-100';
  const textClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
  const panelClass = theme === 'dark' ? 'bg-[#18181b] border-white/5' : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen h-screen flex flex-col md:flex-row font-sans transition-colors duration-300 ${bgClass} ${textClass}`} dir="rtl">
      <Head>
        <title>Saban Master Command</title>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* תפריט צד */}
      <aside className={`w-full md:w-80 flex flex-col shrink-0 border-b md:border-b-0 md:border-l z-10 ${panelClass}`}>
        <header className="p-6 flex items-center justify-between border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
              <Crown size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">SABAN <span className="text-amber-500">MASTER</span></h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                System Online
              </div>
            </div>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl hover:bg-white/10 transition">
            {theme === 'dark' ? <Sun size={20} className="text-slate-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </header>

        {/* פקודות מהירות (Quick Actions) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className={`text-xs font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>פקודות מאסטר מהירות</h2>
          
          {magicCommands.map(cmd => (
            <button 
              key={cmd.id}
              onClick={() => handleCommandClick(cmd.prompt)}
              className={`w-full flex flex-col gap-2 p-4 rounded-2xl text-right transition-all group ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30' 
                  : 'bg-slate-50 hover:bg-white border border-slate-200 hover:border-amber-500/30 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-amber-500">
                {cmd.icon} {cmd.label}
              </div>
              <p className={`text-xs leading-relaxed line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {cmd.prompt}
              </p>
            </button>
          ))}
          
          {/* 🔥 ניהול דינאמי של מילות סינון (Stop Words) */}
          <div className={`mt-8 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#1e1e24] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-blue-500 text-sm">
                <Tags size={16} /> מילות סינון למוח AI
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 max-h-32 overflow-y-auto pr-1">
              {stopWords.map(w => (
                <span key={w} className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  {w} 
                  <button onClick={() => handleRemoveStopWord(w)} className="hover:text-red-500 transition-colors">
                    <X size={10}/>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newStopWord} 
                onChange={e => setNewStopWord(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStopWord()}
                placeholder="הוסף מילת התעלמות..."
                className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'bg-black/40 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-800'}`}
              />
              <button 
                onClick={handleAddStopWord} 
                className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 active:scale-95 transition-all"
                title="הוסף מילה"
              >
                <Plus size={16}/>
              </button>
            </div>
          </div>

          {/* סטטוס חיבורים */}
          <div className={`mt-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center gap-2 font-bold text-emerald-500 mb-2">
              <Activity size={18} /> סנכרון חי (Live Sync)
            </div>
            <ul className={`text-xs space-y-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              <li className="flex justify-between"><span>Firebase (הגדרות סינון)</span> <span className="text-emerald-500">מחובר</span></li>
              <li className="flex justify-between"><span>Supabase (לוח סידור)</span> <span className="text-emerald-500">מחובר</span></li>
              <li className="flex justify-between"><span>מערכת לינקים (Magic Links)</span> <span className="text-emerald-500">פעיל</span></li>
            </ul>
          </div>
        </div>
      </aside>

      {/* אזור הצ'אט הראשי */}
      <main className="flex-1 flex flex-col h-[calc(100vh-100px)] md:h-screen relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex max-w-[85%] md:max-w-[70%] ${m.role === 'master' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                m.role === 'master' ? 'bg-amber-500 text-white ml-3 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 mr-3'
              }`}>
                {m.role === 'master' ? <Crown size={16} /> : <Activity size={16} />}
              </div>
              
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                m.role === 'master' 
                  ? 'bg-amber-500 text-slate-900 font-medium rounded-tl-none' 
                  : theme === 'dark' 
                    ? 'bg-[#27272a] text-slate-200 border border-white/5 rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tr-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex max-w-[85%] ml-auto">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30 mr-3 flex items-center justify-center shrink-0">
                <Activity size={16} className="animate-spin" />
              </div>
              <div className={`p-4 rounded-2xl text-sm ${theme === 'dark' ? 'bg-[#27272a] text-slate-400 border border-white/5' : 'bg-white text-slate-500 border border-slate-200'} rounded-tr-none flex items-center gap-2`}>
                מנתח פקודה, מתחבר לטבלאות ושומר היסטוריה...
              </div>
            </div>
          )}
        </div>

        {/* שורת פקודה תחתונה */}
        <div className={`p-4 shrink-0 border-t ${panelClass} pb-8 md:pb-4`}>
          <div className="max-w-4xl mx-auto flex items-end gap-2 relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="הכנס פקודת מאסטר (למשל: נתח כתב כמויות או דחוף הזמנה)..."
              disabled={isThinking}
              className={`flex-1 min-h-[60px] max-h-[200px] p-4 pr-12 rounded-2xl resize-none outline-none font-medium text-sm transition-all shadow-inner focus:ring-2 focus:ring-amber-500/50 ${
                theme === 'dark' ? 'bg-black/50 text-white border-white/10' : 'bg-slate-100 text-slate-900 border-slate-200'
              } border`}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="absolute right-4 bottom-4 w-10 h-10 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center shadow-lg hover:bg-amber-400 active:scale-95 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 transition-all"
            >
              <Send size={18} className="rotate-180 -ml-1" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
