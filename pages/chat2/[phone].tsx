'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, MapPin, Truck, Trash2, Edit2, 
  Bell, Moon, Sun, ChevronLeft, MoreHorizontal, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configurations ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanArtisanOS() {
  const router = useRouter();
  const { phone } = router.query;
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { 
    setMounted(true); 
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/order-notification.mp3');
    }
  }, []);

  // 1. Firebase Listeners
  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.toString();
    onSnapshot(doc(dbFS, "customers", cleanPhone), (d) => {
      setProfile(d.exists() ? { id: d.id, ...d.data() } : { id: cleanPhone, name: "אורח" });
    });
    const q = query(collection(dbFS, "customers", cleanPhone, "chat_history"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });
  }, [phone]);

  // 2. Supabase Realtime + Sound Notification
  useEffect(() => {
    const fetchOrders = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('orders').select('*').eq('delivery_date', today);
      if (data) setOrders(data);
    };
    fetchOrders();

    const channel = supabase.channel('orders_artisan')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        if (audioRef.current) audioRef.current.play().catch(e => console.log("Audio block", e));
        fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
const askAI = async (query: string, base64: string | null = null) => {
    if ((!query?.trim() && !base64) || loading || isTyping) return;
    
    if (query) setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      // שליחת ההודעה ל-Apps Script במקום ל-API המקומי
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'admin');
      const data = await SabanAPI.sendMessage(targetPhone, query);
      
      setLoading(false);

      // טיפול בשגיאות מהשרת
      if (!data || !data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data?.error || "משהו השתבש בחיבור לשרת, נסה שוב אחי." }]);
        return;
      }

      // חיווי קולי/ויזואלי אם המודל זיהה הזמנה וכתב אותה לגיליון
      if (data.orderPlaced) {
        playMagicSound();
        // כאן תוכל בהמשך גם לרענן את העגלה (Cart) אם תרצה
      }

      // אפקט הקלדה רציף לתשובה שהגיעה מה-Gemini
      setIsTyping(true);
      let i = 0;
      const words = data.reply.split(" ");
      const interval = setInterval(() => {
        if (i < words.length) {
          setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
          i++;
        } else {
          clearInterval(interval);
          setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
          setStreamingText("");
          setIsTyping(false);
        }
      }, 40);

    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "שגיאת רשת מול הסקריפט, נסה שוב." }]);
    }
  };
  const handleSend = async () => {
    if (!inputText.trim() || !profile) return;
    const text = inputText; setInputText('');
    await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), { text, type: 'in', timestamp: serverTimestamp() });
    
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, senderPhone: profile.id })
    });
    const data = await res.json();
    await addDoc(collection(dbFS, "customers", profile.id, "chat_history"), { text: data.reply, type: 'out', timestamp: serverTimestamp() });
  };

  const renderOrder = (driver: string, slot: string) => {
    const order = orders.find(o => o.driver_name === driver && o.order_time === slot);
    if (!order) return null;
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg border border-emerald-500/30">
        <div className="flex justify-between items-start">
          <div className="flex-1 truncate">
            <div className="font-black text-xs text-emerald-400">{order.client_info}</div>
            <div className="text-[10px] opacity-70 truncate">{order.location}</div>
          </div>
          <div className="flex gap-1">
             <button className="p-1 hover:bg-white/10 rounded-md text-blue-400"><Edit2 size={12}/></button>
             <button onClick={() => supabase.from('orders').delete().eq('id', order.id)} className="p-1 hover:bg-white/10 rounded-md text-red-400"><Trash2 size={12}/></button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!mounted || !profile) return null;

  return (
    <div className={`flex flex-col lg:flex-row h-screen w-full transition-colors duration-500 ${isDarkMode ? 'bg-[#0B0F1A]' : 'bg-[#F1F5F9]'}`} dir="rtl">
      <Head><title>SABAN OS | {profile.name}</title></Head>

      {/* --- Sidebar: לוח נהגים --- */}
      <aside className={`w-full lg:w-[450px] flex flex-col border-l shadow-2xl z-20 ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <Truck className="text-emerald-400 animate-bounce" />
            <h2 className="font-black italic text-lg uppercase tracking-tighter">סידור עבודה חי</h2>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/10 rounded-full">
            {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
          {[
            { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
            { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
          ].map(driver => (
            <div key={driver.name} className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-500/10 p-3 rounded-3xl border border-emerald-500/20">
                <img src={driver.img} className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover shadow-lg" />
                <h3 className={`font-black text-xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{driver.name}</h3>
              </div>
              <div className="space-y-2 relative">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="flex items-center gap-4 min-h-[50px] group px-2">
                    <span className={`text-[10px] font-black font-mono w-10 opacity-30 ${isDarkMode ? 'text-white' : 'text-slate-400'}`}>{slot}</span>
                    <div className="flex-1 border-b border-slate-100/10 min-h-[40px]">
                      {renderOrder(driver.name, slot)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* --- Main: צאט פקודות --- */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden shadow-inner">
        <header className={`h-20 px-8 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#111827]/80 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30"><Bot className="text-white" size={24}/></div>
            <div>
              <h1 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>העוזר המבצעי</h1>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/> <span className="text-[10px] font-bold opacity-50 uppercase">{profile.name}</span></div>
            </div>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.type === 'in' ? 'justify-start' : 'justify-end'} group`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-xl text-sm font-bold leading-relaxed transition-all ${
                m.type === 'in' 
                ? (isDarkMode ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tr-none border border-slate-100') 
                : 'bg-emerald-500 text-slate-950 rounded-tl-none shadow-emerald-500/20'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </main>

        <footer className={`p-6 border-t ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-100'}`}>
          <div className={`max-w-4xl mx-auto flex items-center gap-3 p-2 rounded-[2.5rem] border shadow-2xl transition-all ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <input 
              type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב פקודה להזרקה..."
              className="flex-1 bg-transparent px-6 py-3 font-bold outline-none"
            />
            <button onClick={handleSend} className="bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-emerald-600">
              <Send size={22} className="transform rotate-180" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
