import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { 
  Send, Crown, Map, Truck, ClipboardList, 
  Settings, Sun, Moon, Activity, PackageSearch,
  MessageSquare, Route
} from 'lucide-react';

export default function MasterBrainPWA() {
  const [messages, setMessages] = useState<{role: 'system'|'master', text: string, type?: string}[]>([
    { role: 'system', text: 'אהלן ראמי. מערכת המאסטר מחוברת. סנכרון למלאי, צי רכבים וגוגל מפות הופעל בהצלחה. מה הפקודה להיום?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const scrollRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  // פקודות קסם (Quick Actions)
  const magicCommands = [
    {
      id: 'morning-report',
      icon: <Truck size={18} />,
      label: 'דוח בוקר לנהגים',
      prompt: 'הכן דוח בוקר מסודר לווצאפ עבור הנהגים עלי וחכמת. חלק להם את ההובלות לפי אזורים (תל אביב / שרון). הוסף אזהרה לעלי לגבי שעות העומס באיילון (07:00-09:00 איסור משאיות מעל 15 טון).'
    },
    {
      id: 'parse-order',
      icon: <ClipboardList size={18} />,
      label: 'פענוח הזמנה מתחסין',
      prompt: 'קח את הטקסט הבא שתחסין שלח בווצאפ, חלץ ממנו את המוצרים, מצא להם מק"טים במלאי, תמחר אותם, וייצר הזמנה מסודרת לדחיפה ישירות להיסטוריה שלו ב-CRM: \n[הדבק טקסט כאן]'
    },
    {
      id: 'route-check',
      icon: <Route size={18} />,
      label: 'בדיקת ציר למשאית',
      prompt: 'חשב זמן הגעה ממוצע ממשאבת הבטון לכתובת "ויצמן 50, תל אביב" עם משאית 15 טון. קח בחשבון עומסי תנועה והגבלות משקל במסלול.'
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
      // כאן הולכת הקריאה ל- API של המאסטר (api/master.ts שנסביר בהמשך)
      // לבינתיים, סימולציה של החשיבה מול גוגל וה-CRM
      setTimeout(() => {
        let reply = '';
        if (cmd.includes('דוח בוקר')) {
          reply = `*דוח בוקר - ח. סבן 🚚*\n\n*עלי (משאית 15 טון):*\n1. יפו, פרויקט אנדרומדה - פריקת 2 משטחי טיט.\n⚠️ *שים לב עלי:* נסיעה דרך איילון אסורה לך עד 09:00, סע דרך כביש 44.\n\n*חכמת (רכב קל):*\n1. הרצליה פיתוח - השלמת חומרי איטום לאורניל.\n\nסעו בזהירות, ראמי.`;
        } else if (cmd.includes('תל אביב')) {
          reply = `🗺️ *ניתוח ציר (Google Directions API):*\nהגעה לויצמן 50, תל אביב.\n- זמן משוער: 45 דקות.\n- מסלול מומלץ: כביש 5 -> נמיר (עוקף את הגבלת המשקל באיילון מרכז).\n- מזג אוויר ביעד: 24 מעלות, בהיר.`;
        } else {
          reply = "הפקודה התקבלה, ראמי. מעדכן את המערכת ורץ על הנתונים. משהו נוסף?";
        }

        setMessages(prev => [...prev, { role: 'system', text: reply }]);
        setIsThinking(false);
      }, 2000);

    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: 'שגיאת מערכת. השרת לא הגיב.' }]);
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
        {/* הגדרות PWA לאייפון/אנדרואיד */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* תפריט צד (במסכים גדולים) / עליון (בנייד) */}
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
          <h2 className={`text-xs font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>פקודות מערכת (Macros)</h2>
          
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
          
          <div className={`mt-8 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center gap-2 font-bold text-emerald-500 mb-2">
              <Activity size={18} /> סטטוס חיבורים
            </div>
            <ul className={`text-xs space-y-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              <li className="flex justify-between"><span>Supabase (מלאי)</span> <span className="text-emerald-500">מחובר</span></li>
              <li className="flex justify-between"><span>Google Directions</span> <span className="text-emerald-500">מחובר</span></li>
              <li className="flex justify-between"><span>CRM (לקוחות)</span> <span className="text-emerald-500">מחובר</span></li>
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
                m.role === 'master' ? 'bg-amber-500 text-white ml-3' : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 mr-3'
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
                מחשב נתונים, שולף ממפות ומלאי...
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
              placeholder="פקודת מאסטר (למשל: תעצב הזמנה לתחסין או תבדוק ציר לתל אביב)..."
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
