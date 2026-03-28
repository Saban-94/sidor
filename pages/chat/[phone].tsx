'use client';

import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { Send, Bot, User, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול קליינטים
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function ProfessionalChat() {
  const router = useRouter();
  const { phone } = router.query;
  const cleanPhone = typeof phone === 'string' ? phone.replace(/[\[\]]/g, '') : '';

  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. שליפת פרופיל משתמש מסופבייס (זיהוי הבוס)
  useEffect(() => {
    if (!cleanPhone) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .single();

      if (data) {
        setUserProfile(data);
        setMessages([{
          role: 'assistant',
          content: `שלום ${data.name}, המוח של סבן OS מסונכרן. הנחיות ה-DNA הוטמעו. איך אוכל לשרת אותך?`
        }]);
      } else {
        setUserProfile({ name: 'אורח', status: 'unknown' });
      }
    };

    fetchProfile();
  }, [cleanPhone]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    // כאן תבוא הקריאה ל-API של Gemini עם ה-Context של המשתמש
    setTimeout(() => {
      const response = userProfile?.family_relation === 'הבעלים' 
        ? `שותף יקר, הבנתי את הבקשה שלך לגבי "${userMsg}". אני מעבד את הנתונים לפי הפרוטוקול המקצועי שלנו.`
        : `שלום ${userProfile?.name}, קיבלתי את הודעתך. איך עוד אוכל לעזור?`;
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5] font-sans" dir="rtl">
      {/* Header מקצועי ומסונכרן */}
      <header className="bg-[#075E54] text-white p-4 shadow-lg flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
              {userProfile?.family_relation === 'הבעלים' ? <ShieldCheck className="text-emerald-400" /> : <User />}
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#075E54] rounded-full"></div>
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight">{userProfile?.name || 'טוען...'}</h2>
            <p className="text-[10px] opacity-80 flex items-center gap-1">
              <Sparkles size={10} /> 
              {userProfile?.family_relation === 'הבעלים' ? 'מצב ניהול מערכת (Partner Mode)' : 'מחובר למוח סבן OS'}
            </p>
          </div>
        </div>
        <div className="bg-black/20 px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-tighter">
          {userProfile?.status === 'active' ? 'System Online' : 'Syncing...'}
        </div>
      </header>

      {/* אזור ההודעות */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${
              m.role === 'user' 
                ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              <span className="text-[9px] text-slate-400 mt-1 block text-left">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-sm animate-pulse text-xs font-bold text-emerald-600">
              המוח חושב...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input ברמה גבוהה */}
      <footer className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto flex gap-2">
          <div className="flex-1 relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={userProfile?.family_relation === 'הבעלים' ? "מה הפקודה שלך, בוס?" : "כתוב הודעה למוח..."}
              className="w-full p-4 pr-12 bg-slate-100 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Zap size={18} />
            </div>
          </div>
          <button 
            onClick={handleSend}
            className="bg-[#075E54] text-white p-4 rounded-2xl hover:bg-[#064e46] transition-all shadow-md active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
