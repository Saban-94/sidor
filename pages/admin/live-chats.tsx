import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, limit } from 'firebase/firestore';
import { getDatabase, ref, push, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { Bot, User, Clock, Search, ShieldCheck, MessageCircle, Send, Users, Edit3, Image as ImageIcon, Bell, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';

// 🔥 אתחול Firebase (כולל Firestore לנתונים ו-RTDB לשיגור הודעות)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/"
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);
const dbRT = getDatabase(app);

export default function LiveChatCRM() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [inputMsg, setInputMsg] = useState('');
  
  // State לניהול פרופיל הלקוח (DNA ומשימות)
  const [editName, setEditName] = useState('');
  const [editDNA, setEditDNA] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [newTask, setNewTask] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. שאיבת כל השיחות והקבוצות מ-Firestore
  useEffect(() => {
    const q = query(collection(dbFS, 'customers'), orderBy('lastMessageAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
      
      // עדכון הצ'אט הפעיל אם השתנה משהו ברקע (כמו שינוי סטטוס)
      if (activeChat) {
        const updatedActive = data.find(c => c.id === activeChat.id);
        if (updatedActive) setActiveChat(updatedActive);
      }
    });
    return () => unsub();
  }, [activeChat?.id]);

  // 2. שאיבת היסטוריית השיחה ללקוח הפעיל
  useEffect(() => {
    if (!activeChat) return;
    setEditName(activeChat.name || '');
    setEditDNA(activeChat.dnaContext || '');
    setEditAvatar(activeChat.avatar || '');

    const q = query(collection(dbFS, 'customers', activeChat.id, 'chat_history'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });
    return () => unsub();
  }, [activeChat?.id]);

  // 🔥 3. שמירת פרופיל הלקוח (DNA)
  const saveCustomerProfile = async () => {
    if (!activeChat) return;
    await setDoc(doc(dbFS, 'customers', activeChat.id), {
      name: editName,
      dnaContext: editDNA,
      avatar: editAvatar
    }, { merge: true });
    alert('✅ פרופיל ו-DNA עודכנו בהצלחה!');
  };

  // 🔥 4. כיבוי/הדלקה של ה-AI ללקוח ספציפי (Takeover)
  const toggleBotState = async () => {
    if (!activeChat) return;
    const newState = activeChat.botState === 'HUMAN_RAMI' ? 'MENU' : 'HUMAN_RAMI';
    await setDoc(doc(dbFS, 'customers', activeChat.id), { botState: newState }, { merge: true });
  };

  // 🔥 5. שליחת הודעה ידנית מהממשק (ישר לווצאפ!)
  const sendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeChat) return;

    // מכבים את ה-AI אוטומטית ברגע שאתה מתערב
    if (activeChat.botState !== 'HUMAN_RAMI') {
        await setDoc(doc(dbFS, 'customers', activeChat.id), { botState: 'HUMAN_RAMI' }, { merge: true });
    }

    // דוחפים לתור השידור של השרת המקומי
    await push(ref(dbRT, 'saban94/outgoing'), {
      number: activeChat.id,
      message: inputMsg.trim(),
      timestamp: rtdbTimestamp()
    });

    // שומרים בהיסטוריה המקומית כדי שזה יקפוץ מיד ב-UI
    const chatRef = collection(dbFS, 'customers', activeChat.id, 'chat_history');
    await setDoc(doc(chatRef), {
      text: inputMsg.trim(),
      type: 'out',
      timestamp: new Date() // זמני עד שהשרת יעדכן
    });
    
    setInputMsg('');
  };

  // 🔥 6. ניהול משימות נודניק
  const addNagTask = async () => {
    if (!newTask.trim() || !activeChat) return;
    const tasks = activeChat.tasks || [];
    await setDoc(doc(dbFS, 'customers', activeChat.id), {
      tasks: [...tasks, { id: Date.now(), text: newTask, done: false, date: new Date().toISOString() }]
    }, { merge: true });
    setNewTask('');
  };

  const toggleTask = async (taskId: number) => {
    if (!activeChat) return;
    const updatedTasks = activeChat.tasks.map((t: any) => t.id === taskId ? { ...t, done: !t.done } : t);
    await setDoc(doc(dbFS, 'customers', activeChat.id), { tasks: updatedTasks }, { merge: true });
  };

  const filteredCustomers = customers.filter(c => c.id.includes(search) || (c.name && c.name.includes(search)));

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-sans overflow-hidden" dir="rtl">
      <Head><title>Master Rami | WhatsApp CRM</title></Head>

      {/* טור ימין: רשימת שיחות */}
      <aside className="w-80 bg-white border-l shadow-lg flex flex-col shrink-0 z-20">
        <header className="p-5 bg-slate-900 text-white flex flex-col gap-2">
          <h1 className="font-black text-xl flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" /> חמ"ל ווצאפ
          </h1>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" placeholder="חיפוש איש קשר/קבוצה..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border-none text-white pr-9 pl-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map(c => {
            const isGroup = c.id.includes('@g.us') || c.id.includes('-');
            return (
              <div 
                key={c.id} onClick={() => setActiveChat(c)}
                className={`p-3 border-b border-slate-50 cursor-pointer flex items-center gap-3 transition-colors ${activeChat?.id === c.id ? 'bg-emerald-50 border-r-4 border-r-emerald-500' : 'hover:bg-slate-50 border-r-4 border-r-transparent'}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex justify-center items-center shrink-0 border border-slate-300">
                  {c.avatar ? <img src={c.avatar} alt="avatar" className="w-full h-full object-cover" /> : (isGroup ? <Users size={20} className="text-slate-500" /> : <User size={20} className="text-slate-500" />)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-slate-800 text-sm truncate flex justify-between">
                    {c.name || c.id}
                    {c.botState === 'HUMAN_RAMI' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-black">ידני</span>}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{c.id.replace('@c.us','').replace('@g.us','')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* טור אמצע: חלון השיחה */}
      <main className="flex-1 flex flex-col relative bg-[#e5ddd5]" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay' }}>
        {!activeChat ? (
          <div className="m-auto flex flex-col items-center gap-4 text-slate-400 opacity-60">
            <MessageCircle size={80} />
            <h2 className="text-xl font-bold">בחר שיחה מהחמ"ל כדי להתחיל לנהל</h2>
          </div>
        ) : (
          <>
            <header className="bg-white p-3 shadow-sm flex items-center gap-4 shrink-0 z-10">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex justify-center items-center border">
                 {activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-500" />}
              </div>
              <div className="flex-1">
                <h2 className="font-black text-slate-800">{activeChat.name || activeChat.id}</h2>
                <p className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    סטטוס AI: 
                    <span className={`font-bold ${activeChat.botState === 'HUMAN_RAMI' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {activeChat.botState === 'HUMAN_RAMI' ? 'כבוי (ראמי שולט)' : activeChat.botState || 'MENU (פעיל)'}
                    </span>
                </p>
              </div>
              <button 
                onClick={toggleBotState}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeChat.botState === 'HUMAN_RAMI' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                {activeChat.botState === 'HUMAN_RAMI' ? <ToggleLeft size={20}/> : <ToggleRight size={20}/>}
                {activeChat.botState === 'HUMAN_RAMI' ? 'הדלק AI' : 'השתלט (כבה AI)'}
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm relative ${m.type === 'in' ? 'bg-white text-slate-800 rounded-tr-none self-start' : 'bg-[#dcf8c6] text-slate-900 rounded-tl-none self-end'}`}>
                  <div className={`text-[10px] font-black mb-1 ${m.type === 'in' ? 'text-blue-500' : 'text-emerald-600'}`}>
                    {m.type === 'in' ? (activeChat.name || 'לקוח') : 'המערכת / ראמי'}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  <div className="text-[9px] text-slate-400 mt-2 flex items-center justify-end gap-1">
                    <Clock size={10} />
                    {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : 'עכשיו'}
                  </div>
                </div>
              ))}
            </div>

            {/* שורת הקלדה לראמי */}
            <div className="bg-[#f0f2f5] p-3 shrink-0">
              <form onSubmit={sendManualMessage} className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200 focus-within:border-emerald-500">
                <input 
                  type="text" 
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="כתוב הודעה אישית ללקוח (יכבה את ה-AI אוטומטית)..." 
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  dir="auto"
                />
                <button type="submit" disabled={!inputMsg.trim()} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* טור שמאל: CRM ו-DNA */}
      {activeChat && (
        <aside className="w-80 bg-white border-r shadow-xl flex flex-col shrink-0 z-20 overflow-y-auto">
          <header className="p-4 border-b bg-slate-50 flex items-center gap-2 text-slate-800">
            <Edit3 size={18} className="text-blue-500" />
            <h3 className="font-black">פרופיל CRM ואימון AI</h3>
          </header>

          <div className="p-4 flex flex-col gap-5">
            {/* הגדרות DNA */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">שם הלקוח / קבוצה</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><ImageIcon size={12}/> קישור לתמונת פרופיל</label>
                <input type="text" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-left" dir="ltr" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Bot size={12}/> הוראות ספציפיות ל-AI (DNA)</label>
                <textarea 
                  value={editDNA} onChange={e => setEditDNA(e.target.value)} 
                  placeholder="למשל: 'לקוח VIP מקבל מחירי קבלן, לדבר איתו בכבוד'..."
                  className="w-full h-24 bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <button onClick={saveCustomerProfile} className="w-full bg-slate-800 text-white font-bold text-sm py-2 rounded-lg hover:bg-slate-900 transition-colors">
                שמור פרופיל
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* משימות נודניק */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-800 flex items-center gap-1 text-sm"><Bell size={16} className="text-amber-500"/> משימות "נודניק"</h4>
              <div className="flex gap-2">
                <input 
                  type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="הוסף תזכורת ללקוח..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-amber-500"
                  onKeyDown={e => e.key === 'Enter' && addNagTask()}
                />
                <button onClick={addNagTask} className="bg-amber-100 text-amber-700 px-3 rounded-lg hover:bg-amber-200 font-bold">+</button>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {activeChat.tasks?.map((task: any) => (
                  <div key={task.id} className={`flex items-start gap-2 p-2 rounded-lg border text-sm transition-all ${task.done ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-amber-100 shadow-sm'}`}>
                    <button onClick={() => toggleTask(task.id)} className="mt-0.5">
                      <CheckCircle2 size={16} className={task.done ? 'text-slate-300' : 'text-amber-500'} />
                    </button>
                    <div className="flex-1 leading-tight">
                        <span className={task.done ? 'line-through text-slate-500' : 'text-slate-700 font-medium'}>{task.text}</span>
                        <div className="text-[9px] text-slate-400 mt-1">{new Date(task.date).toLocaleDateString('he-IL')}</div>
                    </div>
                  </div>
                ))}
                {(!activeChat.tasks || activeChat.tasks.length === 0) && (
                    <div className="text-xs text-slate-400 text-center py-4">אין משימות פתוחות ללקוח זה.</div>
                )}
              </div>
            </div>

          </div>
        </aside>
      )}
    </div>
  );
}
