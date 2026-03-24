import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { getDatabase, ref, push } from 'firebase/database';
import { Send, FileUp, Bot, User, Phone } from 'lucide-react';

// אתחול Firebase בטוח (שואב ממשתני סביבה בוורסל)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);
const rtdb = getDatabase(app);

// קבועים (כמו שהיה ב-HTML)
const RAMI_BIZ = "+972508860896";
const RAMI_PRIV = "+972508861080";

export default function CrmStudio() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת רשימת לקוחות
  useEffect(() => {
    const q = query(collection(dbFS, "customers"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const custData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(custData);
    });
    return () => unsubscribe();
  }, []);

  // טעינת היסטוריית צ'אט בעת בחירת לקוח
  useEffect(() => {
    if (!activeCustomer) return;
    const q = query(collection(dbFS, "customers", activeCustomer.id, "chat_history"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });
    return () => unsubscribe();
  }, [activeCustomer]);

  // שליחת הודעה + הפעלת המוח (API)
  const handleSend = async () => {
    if (!inputText.trim() || !activeCustomer || isLoading) return;
    const userMsg = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // 1. קריאה מאובטחת למוח (Gemini) דרך ה-API הפנימי
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          senderPhone: RAMI_PRIV,
          context: "הזמנות חומרי בניין ח. סבן"
        })
      });
      
      const data = await response.json();
      const aiReply = data.reply || "שגיאה במוח. אנא נסה שוב.";

      // 2. שליחה לצינור JONI דרך RTDB
      await push(ref(rtdb, 'saban94/send'), {
        to: activeCustomer.id,
        text: aiReply,
        from: RAMI_PRIV,
        timestamp: Date.now()
      });

      // 3. תיעוד ב-Firestore תחת הלקוח
      await addDoc(collection(dbFS, "customers", activeCustomer.id, "chat_history"), {
        text: `[Saban AI]: ${aiReply}`,
        type: 'out',
        timestamp: serverTimestamp()
      });

    } catch (err) {
      console.error("Error sending message:", err);
      alert("שגיאה בתקשורת. וודא שמשתני הסביבה מוגדרים.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row h-screen w-full bg-[#f0f2f5] font-sans" dir="rtl">
      <Head><title>Saban AI Studio</title></Head>

      {/* תפריט צדדי (Sidebar הלקוחות) */}
      <aside className="w-[350px] bg-white border-l flex flex-col shrink-0 shadow-lg z-10">
        <header className="p-4 bg-[#f0f2f5] border-b flex justify-between items-center">
          <h1 className="font-bold text-xl text-slate-800 italic">הזמנות ח. סבן</h1>
          <button className="text-gray-500 hover:text-green-600 transition" title="ייבוא CSV">
            <FileUp size={20} />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {customers.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setActiveCustomer(c)}
              className={`p-4 border-b cursor-pointer flex items-center gap-3 transition ${activeCustomer?.id === c.id ? 'bg-slate-100 border-r-4 border-green-500' : 'hover:bg-slate-50 border-r-4 border-transparent'}`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-green-600 text-white flex items-center justify-center font-bold text-lg">
                {c.photo ? <img src={c.photo} alt={c.name} /> : <User size={24} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-sm text-slate-800">{c.name || c.id}</div>
                <div className="text-[10px] text-gray-400 font-mono">{c.id}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* אזור הצ'אט */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#e5ddd5]" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: "overlay" }}>
        
        {/* כותרת הצ'אט */}
        <header className="h-[60px] bg-[#f0f2f5] border-b p-3 flex items-center gap-3 shrink-0 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden text-sm">
            {activeCustomer ? (activeCustomer.photo ? <img src={activeCustomer.photo} /> : <User size={20}/>) : <Bot size={20}/>}
          </div>
          <div>
            <span className="font-bold text-sm block leading-tight">{activeCustomer ? activeCustomer.name : 'בחר לקוח'}</span>
            <span className="text-[10px] text-gray-500 font-mono italic">{activeCustomer ? activeCustomer.id : 'מערכת סנכרון JONI'}</span>
          </div>
        </header>

        {/* חלון ההודעות */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {!activeCustomer && (
            <div className="m-auto bg-white/80 p-4 rounded-xl text-center text-sm font-bold text-slate-500 shadow-sm backdrop-blur-sm">
              בחר לקוח מהרשימה כדי להתחיל לנהל את ההזמנה 🚚
            </div>
          )}
          
          {messages.map((m) => (
            <div key={m.id} className={`p-3 max-w-[85%] text-sm shadow-sm ${m.type === 'in' ? 'bg-white rounded-tl-none self-start rounded-2xl' : 'bg-[#dcf8c6] rounded-tr-none self-end rounded-2xl'}`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="text-[9px] text-gray-400 mt-1 text-left">
                {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
              </div>
            </div>
          ))}
          {isLoading && <div className="self-end bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none text-sm text-gray-500 animate-pulse">המוח חושב...</div>}
        </div>

        {/* שורת הקלדה */}
        <footer className="p-3 bg-[#f0f2f5] flex items-center gap-3 shrink-0">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!activeCustomer || isLoading}
            placeholder={activeCustomer ? "הקלד הודעה לסידור (דרך ה-AI)..." : "בחר לקוח קודם..."}
            className="flex-1 p-3 rounded-xl border-none outline-none text-sm shadow-sm disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!activeCustomer || !inputText.trim() || isLoading}
            className="bg-[#00a884] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:bg-gray-400"
          >
            <Send size={18} className="transform rotate-180" />
          </button>
        </footer>
      </main>
    </div>
  );
}
