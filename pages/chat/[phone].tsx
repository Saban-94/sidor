import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Bot, Calculator, PackageSearch, Youtube, ArrowRight, Paperclip, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default function PremiumClientChat() {
  const router = useRouter();
  const { phone } = router.query;

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString();
    
    // שליפת פרופיל
    const unsubProfile = onSnapshot(doc(dbFS, "customers", cleanPhone), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({ id: cleanPhone, name: "אורח", relation: "לקוח כללי", isNew: true });
      }
    });

    // שליפת הודעות
    const q = query(collection(dbFS, "customers", cleanPhone, "chat_history"), orderBy("timestamp", "asc"));
    const unsubChat = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => { unsubProfile(); unsubChat(); };
  }, [phone]);

  const handleSend = async () => {
    if (!inputText.trim() || !profile || isLoading) return;
    const userMsg = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: userMsg,
        type: 'in',
        timestamp: serverTimestamp()
      });

      let dynamicContext = 'לקוח כללי';
      try {
        if (profile.relation && profile.relation.startsWith('{')) {
          const parsed = JSON.parse(profile.relation);
          dynamicContext = `זהות: ${parsed.identity}\nחוקים: ${parsed.rules.map((r:any)=>r.content).join(' ')}`;
        }
      } catch (e) {}

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: dynamicContext
        })
      });
      
      const data = await response.json();
      
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: data.reply || "שגיאת מערכת.",
        type: 'out',
        attachedProducts: data.products || [],
        timestamp: serverTimestamp()
      });

    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  };

  if (!profile) return <div className="h-screen flex items-center justify-center font-black text-emerald-500 animate-pulse bg-slate-50">מתחבר לערוץ מאובטח...</div>;

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] font-sans" dir="rtl">
      <Head>
        <title>העוזר של ראמי</title>
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Header Premium */}
      <header className="bg-slate-900/95 backdrop-blur-md text-white p-4 flex items-center justify-between shadow-xl shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/start')} className="p-2 -mr-2 text-slate-300 hover:text-white transition rounded-full hover:bg-white/10">
            <ArrowRight size={20} />
          </button>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center border-2 border-slate-800 shadow-lg">
              <Bot size={24} className="text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-lg leading-tight tracking-wide">העוזר של ראמי</h1>
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
              {profile.name} <span className="w-1 h-1 bg-slate-500 rounded-full"></span> מחובר
            </span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white p-2">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 relative" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundBlendMode: 'soft-light' }}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={m.id} 
              className={`flex flex-col max-w-[85%] md:max-w-[70%] ${m.type === 'in' ? 'self-end' : 'self-start'}`}
            >
              <div className={`p-4 text-sm shadow-md relative ${
                m.type === 'in' 
                  ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100'
              }`}>
                {/* צ'ופצ'יק להודעה */}
                <div className={`absolute top-0 w-4 h-4 ${m.type === 'in' ? '-right-2 bg-emerald-600' : '-left-2 bg-white border-l border-t border-slate-100'}`} style={{ clipPath: m.type === 'in' ? 'polygon(0 0, 0% 100%, 100% 0)' : 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                
                <div className="whitespace-pre-wrap leading-relaxed relative z-10 font-medium">{m.text}</div>
              </div>

              {/* כרטיסי מוצר מעוצבים עשירים */}
              {m.attachedProducts && m.attachedProducts.length > 0 && (
                <div className="mt-3 flex flex-col gap-3 w-full sm:w-[320px]">
                  {m.attachedProducts.map((product: any, idx: number) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      {/* תמונה ופרטים ראשוניים */}
                      <div className="flex gap-4 p-4 border-b border-slate-50">
                        <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 shadow-inner">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <PackageSearch size={28} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <span className="text-[10px] text-slate-400 font-mono font-bold mb-1 bg-slate-100 w-max px-2 py-0.5 rounded uppercase">SKU: {product.sku}</span>
                          <h3 className="font-black text-sm text-slate-800 leading-tight line-clamp-2">{product.product_name}</h3>
                          {product.price && <span className="text-emerald-600 font-black text-base mt-2">₪{product.price}</span>}
                        </div>
                      </div>

                      {/* כפתורי פעולה */}
                      <div className="flex items-center p-2 gap-2 bg-slate-50/50">
                        {product.youtube_url && (
                          <a href={product.youtube_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center gap-1 bg-white text-red-500 py-2.5 rounded-xl font-bold shadow-sm border border-slate-100 hover:border-red-200 hover:bg-red-50 transition">
                            <Youtube size={18} />
                            <span className="text-[10px]">הדרכה</span>
                          </a>
                        )}
                        <Link href={`/product/${product.sku}`} className="flex-[2]">
                          <div className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold shadow-md hover:bg-emerald-600 hover:shadow-emerald-500/20 transition-all">
                            <Calculator size={16} />
                            <span className="text-xs">מחשבון כמויות והזמנה</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm text-slate-500 flex items-center gap-2 relative">
             <div className="absolute top-0 -left-2 w-4 h-4 bg-white border-l border-t border-slate-100" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </motion.div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-slate-200 shrink-0 pb-8 md:pb-4 z-20">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-50 rounded-2xl transition-colors shrink-0">
            <Paperclip size={20} />
          </button>
          <div className="flex-1 bg-slate-100 rounded-2xl p-2 flex items-center shadow-inner border border-slate-200/50 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 transition-all">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isLoading}
              placeholder="כתוב הודעה לראמי..."
              className="w-full bg-transparent px-3 py-2 text-sm outline-none resize-none max-h-24 min-h-[40px] font-medium text-slate-800"
              rows={1}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shrink-0"
          >
            <Send size={18} className="transform rotate-180 -ml-1" />
          </button>
        </div>
      </footer>
    </div>
  );
}
