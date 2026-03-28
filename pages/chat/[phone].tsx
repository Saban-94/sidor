'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Bot, Calculator, PackageSearch, Youtube, ArrowRight, Paperclip, MoreVertical, Sparkles, X, Moon, Sun, User, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const RAMI_PHOTO = "https://media-mrs2-2.cdn.whatsapp.net/v/t61.24694-24/620186722_866557896271587_5747987865837500471_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AGQ9shhGnpJRK2LfpVKtpt92zECw4seRimjrbZIOOJ_aQ&oe=69D2356B&_nc_sid=5e03e0&_nc_cat=111";

export default function PremiumAdaptiveApp() {
  const router = useRouter();
  const { phone } = router.query;

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. זיהוי לקוח וניקוי מזהים מהלינק
  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString().replace(/[\[\]\s]/g, ""); // תיקון לוגיקת סוגריים

    const unsubProfile = onSnapshot(doc(dbFS, "customers", cleanPhone), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({ id: cleanPhone, name: "אורח VIP", relation: "לקוח כללי", image_url: null });
      }
    });

    const q = query(collection(dbFS, "customers", cleanPhone, "chat_history"), orderBy("timestamp", "asc"));
    const unsubChat = onSnapshot(q, (snap) => {
      const newMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // הפעלת צליל אם ההודעה האחרונה היא מה-AI
      if (newMsgs.length > messages.length && newMsgs[newMsgs.length - 1].type === 'out') {
        playNotification();
      }
      
      setMessages(newMsgs);
      scrollToBottom();
    });

    return () => { unsubProfile(); unsubChat(); };
  }, [phone]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !profile || isLoading) return;
    const userMsg = inputText.trim();
    const cleanPhone = profile.id;
    setInputText('');
    setIsLoading(true);
    setIsTypingEffect(true);

    try {
      await addDoc(collection(dbFS, "customers", cleanPhone, "chat_history"), {
        text: userMsg,
        type: 'in',
        timestamp: serverTimestamp()
      });

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: cleanPhone, context: profile.relation })
      });
      
      const data = await response.json();
      
      await addDoc(collection(dbFS, "customers", cleanPhone, "chat_history"), {
        text: data.reply,
        type: 'out',
        attachedProducts: data.products || [],
        timestamp: serverTimestamp()
      });

    } catch (err) { console.error(err); }
    finally { 
      setIsLoading(false); 
      setIsTypingEffect(false);
    }
  };

  if (!profile) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#020617]">
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
        <Bot size={50} className="text-emerald-500" />
      </motion.div>
      <div className="mt-4 h-1 w-32 bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5 }} className="h-full w-1/2 bg-emerald-500" />
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen w-full transition-all duration-700 font-sans overflow-hidden relative ${
      isDarkMode ? 'bg-[#050a14] text-white' : 'bg-[#f4f7f9] text-slate-900'
    }`} dir="rtl">
      <Head>
        <title>Saban AI | {profile.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" />

      {/* Background Brand Image */}
      <div className="absolute inset-0 opacity-[0.04] grayscale pointer-events-none bg-center bg-cover" style={{ backgroundImage: `url(${RAMI_PHOTO})` }} />

      {/* Modern Header */}
      <header className={`relative z-30 pt-12 pb-4 px-6 border-b backdrop-blur-xl flex items-center justify-between shadow-2xl transition-colors ${
        isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => router.push('/start')}>
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-emerald-500/20 shadow-lg group-active:scale-90 transition-transform">
              <img src={RAMI_PHOTO} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#050a14]">
              <Sparkles size={10} className="text-black animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter uppercase leading-none">Rami <span className="text-emerald-500 font-black">AI</span></h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">{profile.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-2xl transition-all shadow-lg ${
            isDarkMode ? 'bg-white/5 text-amber-400 border border-white/10' : 'bg-white text-slate-500 border border-slate-100'
          }`}>
            {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
          {profile.image_url && (
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 overflow-hidden">
               <img src={profile.image_url} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-20 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div 
              key={m.id || i}
              initial={{ opacity: 0, x: m.type === 'in' ? 20 : -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={`flex flex-col ${m.type === 'in' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-xl relative transition-all ${
                m.type === 'in' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : isDarkMode ? 'bg-white/10 backdrop-blur-md border border-white/5 text-white rounded-tl-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-slate-200/50'
              }`}>
                {/* Typewriter Effect simulate for last AI message */}
                <p className="text-[14px] leading-relaxed font-bold whitespace-pre-wrap">{m.text}</p>
                <div className="text-[8px] mt-2 opacity-50 font-black tracking-widest uppercase">
                  {m.timestamp?.toDate ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'צפייה'}
                </div>
              </div>

              {/* Product Cards */}
              {m.attachedProducts?.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 w-full max-w-[280px]">
                  {m.attachedProducts.map((p: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProduct(p)}
                      className={`rounded-3xl overflow-hidden border shadow-2xl cursor-pointer group transition-all ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <img src={p.image_url || RAMI_PHOTO} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="text-xs font-black truncate max-w-[120px]">{p.product_name}</h3>
                          <span className="text-emerald-500 font-black text-sm block mt-1">₪{p.price}</span>
                        </div>
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black">
                           <Calculator size={18} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing/Thinking Indicator */}
        {(isLoading || isTypingEffect) && (
          <div className="flex items-center gap-3 bg-emerald-500/10 p-4 rounded-3xl rounded-tl-none border border-emerald-500/20 w-max">
            <div className="flex gap-1.5">
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic animate-pulse">המוח חושב...</span>
          </div>
        )}
      </main>

      {/* Product Popup Quick View */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className={`w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border ${
              isDarkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white"><X size={24}/></button>
              <img src={selectedProduct.image_url} className="w-full h-72 object-cover" />
              <div className="p-8 text-center">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedProduct.product_name}</h2>
                <p className="text-emerald-500 font-mono text-2xl font-black mt-2">₪{selectedProduct.price}</p>
                <Link href={`/product/${selectedProduct.sku}`} className="mt-8 bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
                  <Calculator size={20}/> מעבר למחשבון הזמנה
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Field - App Dock */}
      <footer className={`relative z-30 p-6 pt-2 border-t backdrop-blur-2xl transition-all ${
        isDarkMode ? 'bg-black/60 border-white/5 pb-10' : 'bg-white/90 border-slate-200 pb-8'
      }`}>
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <button className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${
            isDarkMode ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
          }`}>
            <Paperclip size={20} />
          </button>
          
          <div className={`flex-1 rounded-[2rem] px-5 py-3 flex items-center transition-all border focus-within:ring-2 focus-within:ring-emerald-500/30 ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="כתוב הודעה לראמי..."
              className="w-full bg-transparent border-none outline-none text-[15px] font-bold resize-none py-1 max-h-32"
              rows={1}
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-14 h-14 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-90 transition-all disabled:opacity-50"
          >
            <Send size={24} className="transform rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
