import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Bot, Calculator, PackageSearch, Youtube } from 'lucide-react';

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

  // טעינת פרופיל לקוח (כולל הזהות והחוקים מה-CRM)
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

  // טעינת היסטוריית צ'אט
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

  // שליחת הודעה ל-AI
  const handleSend = async () => {
    if (!inputText.trim() || !profile || isLoading) return;
    const userMsg = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // 1. שמירת ההודעה הנכנסת
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: userMsg,
        type: 'in',
        timestamp: serverTimestamp()
      });

      // 2. חילוץ חכם של הזהות והחוקים מתוך ה-CRM
      let dynamicIdentity = 'אתה העוזר הלוגיסטי של ראמי מ"ח. סבן".';
      let dynamicRules = '';

      try {
        if (profile.relation && profile.relation.startsWith('{')) {
          const parsed = JSON.parse(profile.relation);
          if (parsed.identity) dynamicIdentity = parsed.identity;
          if (parsed.rules && Array.isArray(parsed.rules)) {
            dynamicRules = parsed.rules.map((r: any) => `- ${r.title}: ${r.content}`).join('\n');
          }
        } else if (profile.relation) {
          dynamicIdentity = profile.relation; // תאימות לאחור
        }
      } catch (e) {
        console.warn("Could not parse profile relation, using defaults.");
      }

      // 3. הרכבת הפרומפט האולטימטיבי (זהות אישית + חוק שליפת המוצר)
      const aiContext = `
        זהות וסגנון התקשורת שלך:
        ${dynamicIdentity}
        
        הלקוח מולך: ${profile.name || "לקוח"}.
        
        חוקי התנהגות מול הלקוח:
        ${dynamicRules}

        **חוק מוצרים קריטי (חובה לציית):** אם המערכת מצאה מוצר רלוונטי במלאי, אל תכתוב מפרטים טכניים ארוכים! ענה קצר ובדיוק לפי סגנון התקשורת שהוגדר לך, ותמיד הוסף בסוף המשפט את השורה הבאה: "צירפתי לך למטה את כרטיס המוצר עם תמונה, סרטון ומחשבון כמויות."
      `;

      // 4. שליחה למוח
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
      const aiReply = data.reply || "שגיאה במוח.";
      const attachedProducts = data.products && data.products.length > 0 ? data.products : [];

      // 5. תיעוד תשובת ה-AI ב-Firestore (כולל מוצרים אם יש)
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: aiReply,
        type: 'out',
        attachedProducts: attachedProducts,
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
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">מאזין ל- {profile.name}</span>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col max-w-[85%] ${m.type === 'in' ? 'self-end' : 'self-start'}`}>
            
            <div className={`p-4 text-sm shadow-sm ${m.type === 'in' ? 'bg-slate-800 text-white rounded-2xl rounded-tr-none' : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>

            {/* 🔥 כרטיס המוצר המלא (תמונה, יוטיוב, מחשבון) */}
            {m.attachedProducts && m.attachedProducts.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {m.attachedProducts.map((product: any, idx: number) => (
                  <div key={idx} className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-md w-[280px]">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <PackageSearch size={24} className="text-slate-300" />
                        )}
                      </div>
                      
                      <div className="flex flex-col justify-between flex-1 overflow-hidden">
                        <div>
                          <h3 className="font-black text-sm text-slate-800 leading-tight truncate">{product.product_name}</h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">מק"ט: {product.sku}</p>
                        </div>
                        <span className="text-emerald-600 font-black text-sm mt-1">{product.price ? `₪${product.price}` : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                      {product.youtube_url && (
                        <a 
                          href={product.youtube_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-red-50 text-red-600 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition"
                        >
                          <Youtube size={14} />
                          צפה בסרטון
                        </a>
                      )}
                      
                      <Link href={`/product/${product.sku}`} className="flex-1">
                        <div className="w-full flex items-center justify-center gap-1 text-[11px] bg-emerald-50 text-emerald-600 py-2 rounded-xl font-bold hover:bg-emerald-500 hover:text-white transition">
                          <Calculator size={14} />
                          מחשבון וכמויות
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="self-start bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none text-sm text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
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
            className="flex-1 bg-slate-50 p-4 rounded-2xl border-none outline-none text-sm shadow-inner focus:ring-2 focus:ring-emerald-500/20"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Send size={20} className="transform rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
