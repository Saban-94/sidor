import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Bot, User, ArrowRight } from 'lucide-react';

// אתחול Firebase (נשען על משתני הסביבה הקיימים שלך)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default function MagicChat() {
  const router = useRouter();
  const { phone } = router.query; // שולף את המספר מהלינק

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. טעינת פרופיל איש הקשר מ-Firestore (מזהה מי הוא ואיך ראמי מכיר אותו)
  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString();
    const docRef = doc(dbFS, "customers", cleanPhone);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        // אם אין לו פרופיל עדיין, נייצר לו פרופיל זמני בזיכרון
        setProfile({ id: cleanPhone, name: "אורח", relation: "לקוח כללי", isNew: true });
      }
    });
    return () => unsubscribe();
  }, [phone]);

  // 2. טעינת היסטוריית השיחות עם המוח
  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString();
    const q = query(collection(dbFS, "customers", cleanPhone, "chat_history"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });
    return () => unsubscribe();
  }, [phone]);

  // 3. שליחת הודעה מאיש הקשר למוח ה-AI
  const handleSend = async () => {
    if (!inputText.trim() || !profile || isLoading) return;
    const userMsg = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // א. שמירת הודעת הלקוח ב-Firestore כדי שראמי יראה ב-CRM
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: userMsg,
        type: 'in', // נכנס מהלקוח
        timestamp: serverTimestamp()
      });

      // ב. הגדרת ההקשר (Context) למוח - הזרקת הפרופיל
      const aiContext = `
        אתה העוזר הלוגיסטי והאישי של ראמי מחברת "ח. סבן".
        המשתמש שאתה מדבר איתו עכשיו הוא: ${profile.name || "לקוח"}.
        הקשר לראמי: ${profile.relation || "לקוח כללי"}.
        התאם את השפה שלך אליו (אם הוא חבר - דבר פתוח, אם קבלן - תהיה חד ועסקי).
        ענה קצר ולעניין.
      `;

      // ג. קריאה ל-Gemini דרך ה-API שלך
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          senderPhone: profile.id,
          context: aiContext
        })
      });
      
      const data = await response.json();
      const aiReply = data.reply || "הייתה לי שגיאה קטנה במוח, אפשר לנסות שוב?";

      // ד. שמירת תגובת ה-AI ב-Firestore
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: aiReply,
        type: 'out', // יוצא מהמערכת
        timestamp: serverTimestamp()
      });

    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return <div className="flex h-screen items-center justify-center font-bold text-blue-900 animate-pulse">פותח ערוץ מאובטח...</div>;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans" dir="rtl">
      <Head>
        <title>צ'אט אישי | העוזר של ראמי</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* הדר העליון (מותאם למובייל) */}
      <header className="h-[70px] bg-slate-900 text-white p-4 flex items-center justify-between shadow-md shrink-0 rounded-b-3xl z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-700 shadow-lg">
              <Bot size={24} className="text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-lg leading-tight">העוזר של ראמי</h1>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">מחובר ומאזין ל- {profile.name}</span>
          </div>
        </div>
      </header>

      {/* אזור השיחה */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="m-auto text-center space-y-3 opacity-50">
            <Bot size={48} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-500">
              אהלן {profile.name}, אני העוזר החכם של ראמי. <br/>
              איך אפשר לעזור היום?
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] p-4 text-sm shadow-sm ${m.type === 'in' ? 'bg-slate-800 text-white rounded-2xl rounded-tr-none self-end' : 'bg-white text-slate-800 rounded-2xl rounded-tl-none self-start border border-slate-100'}`}>
            <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            <div className={`text-[10px] mt-2 text-left ${m.type === 'in' ? 'text-slate-400' : 'text-slate-400'}`}>
              {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="self-start bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none text-sm text-slate-500 flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          </div>
        )}
      </main>

      {/* אזור ההקלדה */}
      <footer className="p-4 bg-white border-t border-slate-100 shrink-0 pb-8 md:pb-4">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder="כתוב הודעה לעוזר..."
            className="flex-1 bg-slate-50 p-4 rounded-2xl border-none outline-none text-sm shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300"
          >
            <Send size={20} className="transform rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
