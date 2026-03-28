'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Send, Bot, Calculator, PackageSearch, Youtube, ArrowRight, 
  Paperclip, MoreVertical, Sparkles, X, Moon, Sun, 
  MapPin, Camera, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types למניעת שגיאות Build
interface ChatMessage {
  id: string;
  text: string;
  type: 'in' | 'out';
  timestamp: any;
  attachedProducts?: any[];
  fileUrl?: string;
  isLocation?: boolean;
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. זיהוי וניקוי מזהה לקוח
  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString().replace(/[\[\]\s]/g, "");

    const unsubProfile = onSnapshot(doc(dbFS, "customers", cleanPhone), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({ id: cleanPhone, name: "אורח VIP", relation: "לקוח כללי" });
      }
    });

    const q = query(collection(dbFS, "customers", cleanPhone, "chat_history"), orderBy("timestamp", "asc"));
    const unsubChat = onSnapshot(q, (snap) => {
      const newMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      if (newMsgs.length > messages.length && newMsgs[newMsgs.length - 1].type === 'out') {
        playNotification();
      }
      setMessages(newMsgs);
      scrollToBottom();
    });

    return () => { unsubProfile(); unsubChat(); };
  }, [phone, messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const playNotification = () => audioRef.current?.play().catch(() => {});

  // 2. לוגיקת העלאת קבצים לדרייב
  const handleFileAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsLoading(true);
    setShowAttachments(false);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/upload-to-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type,
            phone: profile.id
          })
        });
        const data = await res.json();
        
        await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), {
          text: `📎 קובץ הועלה: ${file.name}\n${data.link}`,
          type: 'in',
          fileUrl: data.link,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        alert("שגיאה בהעלאה לדרייב");
      } finally { setIsLoading(false); }
    };
  };

  // 3. שיתוף מיקום (Waze)
  const shareLocation = () => {
    if (!navigator.geolocation) return alert("הדפדפן לא תומך במיקום");
    setShowAttachments(false);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const wazeUrl = `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      
      await addDoc(collection(dbFS, "customers", profile!.id, "chat_history"), {
        text: `📍 המיקום שלי בשטח:\n${wazeUrl}`,
        type: 'in',
        isLocation: true,
        timestamp: serverTimestamp()
      });
    });
  };

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

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, senderPhone: profile.id, context: profile.relation })
      });
      const data = await res.json();
      
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
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
        <Bot size={48} className="text-emerald-500" />
      </motion.div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen w-full transition-all duration-500 overflow-hidden relative ${
      isDarkMode ? 'bg-[#050a14] text-white' : 'bg-[#f4f7f9] text-slate-900'
    }`} dir="rtl">
      <Head><title>Saban AI | {profile.name}</title></Head>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" />

      {/* רקע רמי ממותג */}
      <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none bg-center bg-cover" style={{ backgroundImage: `url(${RAMI_PHOTO})` }} />

      {/* Header Premium */}
      <header className={`relative z-40 pt-12 pb-4 px-6 border-b backdrop-blur-xl flex items-center justify-between shadow-2xl ${
        isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg">
              <img src={RAMI_PHOTO} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#050a14]">
              <Sparkles size={10} className="text-black" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter uppercase leading-none italic">Saban <span className="text-emerald-500">AI</span></h1>
            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">{profile.name} • Online</span>
          </div>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 text-amber-400' : 'bg-white text-slate-500 border border-slate-100'}`}>
          {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
      </header>

      {/* Chat Space */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-20 custom-scrollbar pt-10">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${m.type === 'in' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-xl relative ${
                m.type === 'in' ? 'bg-emerald-600 text-white rounded-tr-none' : isDarkMode ? 'bg-white/10 backdrop-blur-md border border-white/5 text-white rounded-tl-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                <p className="text-[14px] leading-relaxed font-bold whitespace-pre-wrap">{m.text}</p>
                {m.isLocation && (
                   <Link href={m.text.split('\n')[1]} target="_blank" className="mt-2 block bg-white/20 p-2 rounded-xl text-[10px] font-black text-center">פתיחת ניווט ב-WAZE</Link>
                )}
                <div className="text-[8px] mt-2 opacity-50 font-black text-left uppercase">
                   {m.timestamp?.toDate ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'כרגע'}
                </div>
              </div>

              {/* כרטיסי מוצר */}
              {m.attachedProducts?.map((p, idx) => (
                <motion.div key={idx} onClick={() => setSelectedProduct(p)} className={`mt-3 rounded-2xl overflow-hidden border shadow-lg cursor-pointer w-64 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <img src={p.image_url || RAMI_PHOTO} className="w-full h-32 object-cover" />
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-xs font-black truncate">{p.product_name}</span>
                    <span className="text-emerald-500 font-black text-xs">₪{p.price}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex items-center gap-2 bg-emerald-500/10 p-3 rounded-full w-max border border-emerald-500/20">
             <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
             </div>
             <span className="text-[10px] font-black text-emerald-500 uppercase">המוח חושב...</span>
          </div>
        )}
      </main>

      {/* Input Dock & Attachments Menu */}
      <footer className={`relative z-50 p-6 pt-2 border-t backdrop-blur-2xl ${isDarkMode ? 'bg-black/60 border-white/5 pb-10' : 'bg-white/90 border-slate-200 pb-8'}`}>
        <AnimatePresence>
          {showAttachments && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className={`absolute bottom-24 right-6 p-4 rounded-3xl shadow-2xl flex flex-col gap-4 border ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 font-bold text-sm text-emerald-500"><FileText size={18}/> מסמך / תמונה</button>
               <button onClick={() => { fileInputRef.current?.setAttribute('capture', 'environment'); fileInputRef.current?.click(); }} className="flex items-center gap-3 font-bold text-sm text-blue-500"><Camera size={18}/> צילום מהנייד</button>
               <button onClick={shareLocation} className="flex items-center gap-3 font-bold text-sm text-rose-500"><MapPin size={18}/> שיתוף מיקום (Waze)</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <button onClick={() => setShowAttachments(!showAttachments)} className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <Paperclip size={20} className={showAttachments ? 'rotate-45 text-emerald-500' : ''} />
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileAction} className="hidden" accept="image/*,application/pdf" />

          <div className={`flex-1 rounded-[2rem] px-5 py-3 flex items-center border transition-all focus-within:ring-2 focus-within:ring-emerald-500/30 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="כתוב הודעה לראמי..." className="w-full bg-transparent border-none outline-none text-[15px] font-bold resize-none py-1 max-h-32" rows={1} />
          </div>

          <button onClick={handleSend} disabled={!inputText.trim() || isLoading} className="w-14 h-14 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50">
            <Send size={24} className="transform rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
