import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Bot, User, Calculator, ArrowLeft, PackageSearch } from 'lucide-react';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default function MagicChat() {
  const router = useRouter();
  const { phone } = router.query;

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת פרופיל איש הקשר
  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString();
    const docRef = doc(dbFS, "customers", cleanPhone);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({ id: cleanPhone, name: "אורח", relation: "לקוח כללי", isNew: true });
      }
    });
    return () => unsubscribe();
  }, [phone]);

  // טעינת היסטוריית השיחות עם המוח
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

  // שליחת הודעה + קבלת תשובה ומוצרים מצורפים
  const handleSend = async () => {
    if (!inputText.trim() || !profile || isLoading) return;
    const userMsg = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // 1. שמירת הודעת הלקוח
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: userMsg,
        type: 'in',
        timestamp: serverTimestamp()
      });

      // 2. פקודת ההזרקה למוח (מוסיפים לו הוראה שיגיד שהוא צירף כרטיס אם מצא מוצר)
      const aiContext = `
        אתה העוזר הלוגיסטי של ראמי מ"ח. סבן".
        הלקוח מולך: ${profile.name || "לקוח"}. קשר: ${profile.relation || "כללי"}.
        **חוק חשוב:** אם הלקוח שואל על מוצר ספציפי (כמו פלסטומר 603) והמערכת מצאה אותו במלאי, אל תכתוב לו מפרטים ארוכים. תכתוב תשובה קצרה וציין: "צירפתי לך כאן למטה את כרטיס המוצר המלא עם מחשבון כמויות."
      `;

      // 3. קריאה ל-API
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
      
      // ה"קסם": שולפים את המוצרים שה-API מצא (inv מ-Supabase)
      const attachedProducts = data.products && data.products.length > 0 ? data.products : [];

      // 4. שמירת התשובה ב-Firestore יחד עם המידע על המוצרים!
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: aiReply,
        type: 'out',
        attachedProducts: attachedProducts, // שומרים את האובייקטים של המוצרים
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
          <div key={m.id} className={`flex flex-col max-w-[85%] ${m.type === 'in' ? 'self-end' : 'self-start'}`}>
            
            {/* בועת טקסט רגילה */}
            <div className={`p-4 text-sm shadow-sm ${m.type === 'in' ? 'bg-slate-800 text-white rounded-2xl rounded-tr-none' : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              <div className={`text-[10px] mt-2 text-left ${m.type === 'in' ? 'text-slate-400' : 'text-slate-400'}`}>
                {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
              </div>
            </div>

            {/* 🔥 כרטיס מוצר UI - מופיע רק אם ה-API שלח מוצרים */}
            {m.attachedProducts && m.attachedProducts.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {m.attachedProducts.map((product: any, idx: number) => (
                  <Link href={`/product/${product.sku}`} key={idx}>
                    <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-md hover:shadow-lg transition-all flex gap-3 cursor-pointer group w-[280px]">
                      {/* תמונה מוקטנת */}
                      <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <PackageSearch size={24} className="text-slate-300" />
                        )}
                      </div>
                      
                      {/* פרטים */}
                      <div className="flex flex-col justify-between flex-1 overflow-hidden">
                        <div>
                          <h3 className="font-black text-sm text-slate-800 leading-tight truncate">{product.product_name}</h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">מק"ט: {product.sku}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-emerald-600 font-black text-sm">{product.price ? `₪${product.price}` : ''}</span>
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-bold group-hover:bg-emerald-500 group-hover:text-white transition">
                            <Calculator size={12} />
                            מחשבון
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
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

      <footer className="p-4 bg-white border-t border-slate-100 shrink-0 pb-8 md:pb-4">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder="שאל על חומר, כמות או מחיר..."
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
