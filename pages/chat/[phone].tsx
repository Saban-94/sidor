'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Bot, Calculator, PackageSearch, Youtube, ArrowRight, Paperclip, MoreVertical, Sparkles, X, Info, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const RAMI_BG = "https://media-mrs2-2.cdn.whatsapp.net/v/t61.24694-24/620186722_866557896271587_5747987865837500471_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AGQ9shhGnpJRK2LfpVKtpt92zECw4seRimjrbZIOOJ_aQ&oe=69D2356B&_nc_sid=5e03e0&_nc_cat=111";

export default function PremiumMobileApp() {
  const router = useRouter();
  const { phone } = router.query;

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString();
    
    const unsubProfile = onSnapshot(doc(dbFS, "customers", cleanPhone), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({ id: cleanPhone, name: "אורח VIP", relation: "לקוח חדש", isNew: true });
      }
    });

    const q = query(collection(dbFS, "customers", cleanPhone, "chat_history"), orderBy("timestamp", "asc"));
    const unsubChat = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context: profile.relation })
      });
      
      const data = await response.json();
      
      await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
        text: data.reply,
        type: 'out',
        attachedProducts: data.products || [],
        timestamp: serverTimestamp()
      });

    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  if (!profile) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
        <Bot size={48} className="text-emerald-500" />
      </motion.div>
      <p className="text-emerald-500 font-black mt-4 tracking-widest uppercase text-xs">Saban AI Connecting...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white overflow-hidden relative font-sans">
      <Head>
        <title>Saban AI | Premium Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* רקע רמי ממותג - שכבה תחתונה */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center grayscale pointer-events-none"
        style={{ backgroundImage: `url(${RAMI_BG})` }}
      />
      
      {/* Header Glassmorphism */}
      <header className="relative z-30 pt-12 pb-4 px-6 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 shadow-2xl shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full">
              <ArrowRight size={20} />
            </button>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <img src={RAMI_BG} className="w-full h-full object-cover" alt="Rami" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <Sparkles size={10} className="text-emerald-400" />
                </motion.div>
              </div>
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase leading-none">Rami <span className="text-emerald-500">Brain</span></h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.name}</span>
              </div>
            </div>
          </div>
          <button className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
            <MoreVertical size={20} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 relative z-20 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col ${m.type === 'in' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-2xl relative overflow-hidden ${
                m.type === 'in' 
                ? 'bg-emerald-600 text-white rounded-tr-none border border-emerald-400/30' 
                : 'bg-white/5 backdrop-blur-md text-white rounded-tl-none border border-white/10'
              }`}>
                {/* אפקט זכוכית פנימי לבועה של ה-AI */}
                {m.type === 'out' && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>}
                
                <p className="text-[14px] leading-relaxed relative z-10 font-medium whitespace-pre-wrap">{m.text}</p>
                <div className="text-[9px] mt-2 opacity-50 font-bold uppercase tracking-widest">
                  {m.timestamp?.toDate ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>

              {/* כרטיסי מוצר בתוך הצאט */}
              {m.attachedProducts?.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-3 w-[260px]">
                  {m.attachedProducts.map((product: any, idx: number) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={idx} 
                      onClick={() => setSelectedProduct(product)}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                    >
                      <div className="aspect-square w-full relative">
                        <img src={product.image_url || '/placeholder-logo.png'} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                          ₪{product.price}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-black truncate">{product.product_name}</h3>
                        <p className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">SKU: {product.sku}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full w-max border border-white/10">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
      </main>

      {/* Product Popup Overlay */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl p-6 flex flex-col items-center justify-center text-right"
          >
            <button onClick={() => setSelectedProduct(null)} className="absolute top-10 right-6 p-3 bg-white/10 rounded-full">
              <X size={24} />
            </button>
            <motion.div initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-sm space-y-6">
              <div className="aspect-square rounded-[3rem] overflow-hidden border-4 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">{selectedProduct.product_name}</h2>
                <p className="text-emerald-400 font-mono text-lg font-black mt-2">₪{selectedProduct.price}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Link href={`/product/${selectedProduct.sku}`} className="bg-emerald-500 text-black py-4 rounded-3xl font-black text-center flex items-center justify-center gap-2">
                  <Calculator size={20} /> הזמנה חכמה
                </Link>
                {selectedProduct.youtube_url && (
                  <a href={selectedProduct.youtube_url} target="_blank" className="bg-white/10 border border-white/20 py-4 rounded-3xl font-black text-center flex items-center justify-center gap-2">
                    <Youtube size={20} className="text-red-500" /> וידאו
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Dock (App-Style) */}
      <footer className="relative z-30 p-6 pt-2 bg-slate-900/80 backdrop-blur-2xl border-t border-white/10 shrink-0 pb-10">
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-white/10">
            <Paperclip size={20} />
          </button>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-4 py-3 flex items-center shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="כתוב הודעה למוח..."
              className="w-full bg-transparent border-none outline-none text-sm font-bold resize-none max-h-20"
              rows={1}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={24} className="transform rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
