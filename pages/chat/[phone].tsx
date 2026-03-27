'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Bot, Calculator, PackageSearch, Youtube, ArrowRight, Paperclip, MoreVertical, Sparkles, X, Moon, Sun, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const RAMI_PHOTO = "https://media-mrs2-2.cdn.whatsapp.net/v/t61.24694-24/620186722_866557896271587_5747987865837500471_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AGQ9shhGnpJRK2LfpVKtpt92zECw4seRimjrbZIOOJ_aQ&oe=69D2356B&_nc_sid=5e03e0&_nc_cat=111";

export default function PremiumAdaptiveChat() {
  const router = useRouter();
  const { phone } = router.query;

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // ברירת מחדל יוקרתית כהה
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. זיהוי לקוח מלינק וניקוי מזהים
  useEffect(() => {
    if (!phone) return;
    
    // ניקוי סוגריים מרובעים או תווים מיותרים מה-URL
    const cleanPhone = phone.toString().replace(/[\[\]\s]/g, "");
    
    // שליפת פרופיל לקוח בזמן אמת
    const unsubProfile = onSnapshot(doc(dbFS, "customers", cleanPhone), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({ id: cleanPhone, name: "אורח VIP", relation: "לקוח כללי", image_url: null });
      }
    });

    // שליפת היסטוריית צ'אט
    const q = query(collection(dbFS, "customers", cleanPhone, "chat_history"), orderBy("timestamp", "asc"));
    const unsubChat = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 300);
    });

    return () => { unsubProfile(); unsubChat(); };
  }, [phone]);

  const handleSend = async () => {
    if (!inputText.trim() || !profile || isLoading) return;
    const userMsg = inputText.trim();
    const cleanPhone = profile.id;
    setInputText('');
    setIsLoading(true);

    try {
      // שמירת הודעת לקוח
      await addDoc(collection(dbFS, "customers", cleanPhone, "chat_history"), {
        text: userMsg,
        type: 'in',
        timestamp: serverTimestamp()
      });

      // פנייה למוח (API)
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          senderPhone: cleanPhone,
          context: profile.relation 
        })
      });
      
      const data = await response.json();
      
      // שמירת מענה AI
      await addDoc(collection(dbFS, "customers", cleanPhone, "chat_history"), {
        text: data.reply,
        type: 'out',
        attachedProducts: data.products || [],
        timestamp: serverTimestamp()
      });

    } catch (err) { console.error("Chat Error:", err); }
    finally { setIsLoading(false); }
  };

  if (!profile) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#020617]">
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
        <Sparkles size={40} className="text-emerald-500" />
      </motion.div>
      <p className="text-emerald-500 font-black mt-4 tracking-[0.3em] uppercase text-[10px]">Initializing Secure Channel</p>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen w-full transition-colors duration-500 font-sans overflow-hidden relative ${
      isDarkMode ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-900'
    }`} dir="rtl">
      <Head>
        <title>Saban AI | {profile.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* תמונת רקע של רמי בהטמעה עדינה */}
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none grayscale bg-cover bg-center`} style={{ backgroundImage: `url(${RAMI_PHOTO})` }} />

      {/* Header Premium - Glassmorphism */}
      <header className={`relative z-30 pt-10 pb-4 px-6 border-b backdrop-blur-2xl shadow-2xl flex items-center justify-between ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg">
                <img src={RAMI_PHOTO} className="w-full h-full object-cover" />
             </div>
             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#020617]">
                <Bot size={10} className="text-black" />
             </div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-lg tracking-tighter uppercase leading-none italic">Saban <span className="text-emerald-500">AI</span></h1>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{profile.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-amber-400' : 'bg-slate-100 text-slate-500'}`}>
              {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
           </button>
           {profile.image_url && (
              <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-sm">
                 <img src={profile.image_url} className="w-full h-full object-cover" />
              </div>
           )}
        </div>
      </header>

      {/* Chat Stage */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-20 custom-scrollbar pt-8">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.type === 'in' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-xl relative ${
                m.type === 'in' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : isDarkMode ? 'bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-tl-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{m.text}</p>
                <div className="text-[8px] mt-2 opacity-40 font-black text-left">
                  {m.timestamp?.toDate ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'כרגע'}
                </div>
              </div>

              {/* כרטיסי מוצר מעוצבים */}
              {m.attachedProducts?.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 w-full max-w-[280px]">
                  {m.attachedProducts.map((p: any, idx: number) => (
                    <motion.div 
                      whileTap={{ scale: 0.98 }}
                      key={idx} 
                      onClick={() => setSelectedProduct(p)}
                      className={`rounded-3xl overflow-hidden border shadow-2xl cursor-pointer group ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                       <div className="aspect-video w-full overflow-hidden bg-black/20">
                          <img src={p.image_url || RAMI_PHOTO} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       </div>
                       <div className="p-4">
                          <h3 className="text-[12px] font-black leading-tight truncate">{p.product_name}</h3>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                             <span className="text-emerald-500 font-black text-sm">₪{p.price}</span>
                             <span className="text-[9px] font-mono opacity-50 uppercase tracking-tighter">SKU: {p.sku}</span>
                          </div>
                       </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Product Popup Quick View */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
             <motion.div initial={{ y: 100, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className={`w-full max-w-sm rounded-[3.5rem] overflow-hidden shadow-2xl relative border ${
               isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
             }`}>
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-3 bg-black/20 rounded-full text-white z-50"><X size={24}/></button>
                <div className="aspect-square bg-slate-800">
                   <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                </div>
                <div className="p-8 text-center">
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedProduct.product_name}</h2>
                   <p className="text-emerald-500 font-mono text-xl font-black mt-2">₪{selectedProduct.price}</p>
                   <div className="grid grid-cols-1 gap-3 mt-8">
                      <Link href={`/product/${selectedProduct.sku}`} className="bg-emerald-500 text-black py-5 rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                         <Calculator size={18}/> מחשבון כמויות והזמנה
                      </Link>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Field - App Dock Style */}
      <footer className={`relative z-30 p-6 pt-2 shrink-0 border-t backdrop-blur-2xl transition-colors ${
        isDarkMode ? 'bg-white/5 border-white/10 pb-10' : 'bg-white/80 border-slate-200 pb-8'
      }`}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
            isDarkMode ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            <Paperclip size={20} />
          </button>
          <div className={`flex-1 rounded-[2rem] px-5 py-3 flex items-center transition-all focus-within:ring-2 focus-within:ring-emerald-500/30 ${
            isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'
          }`}>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="כתוב הודעה לראמי..."
              className="w-full bg-transparent border-none outline-none text-[14px] font-bold resize-none max-h-24 py-1"
              rows={1}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-14 h-14 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Send size={22} className="transform rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
