'use client';

import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, ShieldCheck, Zap, Sparkles, 
  Paperclip, Image as ImageIcon, MapPin, Calendar, X, Camera 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ProfessionalChat() {
  const router = useRouter();
  const { phone } = router.query;
  const cleanPhone = typeof phone === 'string' ? phone.replace(/[\[\]]/g, '') : '';

  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cleanPhone) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('customers').select('*').eq('phone', cleanPhone).single();
      if (data) {
        setUserProfile(data);
        setMessages([{ role: 'assistant', content: `שלום ${data.name}, המוח של סבן OS מסונכרן. איך אני יכול לשרת אותך?` }]);
      }
    };
    fetchProfile();
  }, [cleanPhone]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // --- פונקציות הסיכה ---

  // 1. שליחת מיקום ולינק ל-Waze
  const shareLocation = () => {
    if (!navigator.geolocation) return alert("הדפדפן לא תומך במיקום");
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const wazeUrl = `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      const msg = `📍 המיקום המדויק שלי:\n${wazeUrl}`;
      setMessages(prev => [...prev, { role: 'user', content: msg }]);
      setShowMenu(false);
    });
  };

  // 2. צילום/העלאה לדרייב עם תצוגה בתמונה
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setIsTyping(true);
      
      // שליחה ל-Route שיצרנו קודם שמעלה לגוגל דרייב
      const res = await fetch('/api/upload-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          phone: cleanPhone
        })
      });

      const data = await res.json();
      if (data.link) {
        setMessages(prev => [...prev, { role: 'user', content: data.link }]);
      }
      setIsTyping(false);
      setShowMenu(false);
    };
    reader.readAsDataURL(file);
  };

  // 3. פונקציית עזר להצגת תמונות בצאט (במקום לינק)
  const renderMessageContent = (content: string) => {
    const drivePattern = /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)\/view/;
    const match = content.match(drivePattern);

    if (match) {
      const fileId = match[1];
      const directUrl = `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
      return (
        <div className="space-y-2">
          <img src={directUrl} alt="מדיה" className="rounded-lg max-w-full border border-white/20 shadow-md" onError={(e) => (e.currentTarget.style.display='none')} />
          <a href={content} target="_blank" className="text-[10px] text-blue-400 underline block text-left">📎 פתח מסמך מקורי</a>
        </div>
      );
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B141A] text-slate-100 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-[#202C33] p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            {userProfile?.family_relation === 'הבעלים' ? <ShieldCheck className="text-black" /> : <User className="text-black" />}
          </div>
          <div>
            <h2 className="font-bold text-sm">{userProfile?.name || 'טוען...'}</h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Saban OS Sync</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-[#005C4B] rounded-tr-none' : 'bg-[#202C33] rounded-tl-none border border-white/5'}`}>
              {renderMessageContent(m.content)}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>

      {/* Footer & Menu */}
      <footer className="p-3 bg-[#202C33] relative">
        <AnimatePresence>
          {showMenu && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-20 right-4 bg-[#233138] rounded-2xl p-2 shadow-2xl border border-white/10 flex flex-col gap-1 z-50">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-xs transition-all text-emerald-400 font-bold">
                <ImageIcon size={18}/> תמונה מהגלריה
              </button>
              <button onClick={() => fileInputRef.current?.setAttribute('capture', 'environment')} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-xs transition-all text-blue-400 font-bold">
                <Camera size={18}/> צילום מהמצלמה
              </button>
              <button onClick={shareLocation} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-xs transition-all text-orange-400 font-bold">
                <MapPin size={18}/> שיתוף מיקום (Waze)
              </button>
              <button onClick={() => setMessages(prev => [...prev, {role: 'user', content: "📅 תזמן לי פגישה חדשה ביומן"}])} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-xs transition-all text-purple-400 font-bold">
                <Calendar size={18}/> קביעת פגישה
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 items-center max-w-5xl mx-auto">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-full transition-all ${showMenu ? 'bg-emerald-500 text-black rotate-45' : 'text-slate-400 hover:bg-white/5'}`}>
            <Paperclip size={24} />
          </button>
          
          <input 
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setMessages(prev => [...prev, {role: 'user', content: input}])}
            placeholder="הודעה..."
            className="flex-1 bg-[#2A3942] border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
          
          <button className="bg-emerald-500 text-black p-3 rounded-xl shadow-lg active:scale-95 transition-all">
            <Send size={20} />
          </button>
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
      </footer>
    </div>
  );
}
