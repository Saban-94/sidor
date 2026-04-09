'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const WA_TEXT = "text-[#e9edef]";

const QUICK_QUERIES = [
  { label: 'אני רוצה להזמין', icon: '🎯', color: 'text-red-500' },
  { label: 'הזמנת מכולה/מנוף', icon: '🏗️', color: 'text-blue-400' },
  { label: 'ייעוץ טכני/מפרט', icon: '🎓', color: 'text-orange-500' },
  { label: 'מוצרי איטום וגבס', icon: '⛈️', color: 'text-emerald-400' },
  { label: 'שעות פעילות וסניפים', icon: '🏢', color: 'text-slate-400' },
  { label: 'צריך עזרה מנציג', icon: '👤', color: 'text-purple-500' }
];

export default function SabanAIAssistant() {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedProductSku, setSelectedProductSku] = useState<string | null>(null);
  const [userCid, setUserCid] = useState<string>('guest');
  const [showMenu, setShowMenu] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. אתחול ראשוני
  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);
    const storedCid = localStorage.getItem('saban_cid') || `guest_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('saban_cid', storedCid);
    setUserCid(storedCid);
  }, []);

  // 2. Realtime Listener
  useEffect(() => {
    if (userCid === 'guest') return;
    const channel = supabase
      .channel('chat-sync')
      .on('postgres_changes' as any, {
        event: 'UPDATE', schema: 'public', table: 'customer_memory', filter: `clientId=eq.${userCid}`
      }, (payload) => {
        const history = payload.new.accumulated_knowledge || "";
        const lines = history.split('\n').filter(Boolean);
        const lastLine = lines[lines.length - 1];
        if (lastLine?.includes('[ADMIN]:')) {
          const adminContent = lastLine.replace('[ADMIN]:', '').trim();
          setMessages(prev => {
            if (prev.some(m => m.content === adminContent)) return prev;
            return [...prev, { role: 'ai', content: adminContent }];
          });
          new Audio('/message-pop.mp3').play().catch(() => {});
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userCid]);

  // 3. גלילה אוטומטית
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingText, isScanning]);

  // 4. קליטת הודעות מהמחשבון
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data.type === 'ADD_TO_ORDER') {
        setSelectedProductSku(null);
        askAI(`אני רוצה להזמין ${e.data.quantity} יחידות של ${e.data.productName} (מק"ט ${e.data.sku})`);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [userCid]);

  // 5. לוגיקת סריקה וניתוח ויזואלי (כולל כיווץ)
  const processVisualScan = async (base64: string, file: File) => {
    try {
      const img = new Image();
      img.src = base64;
      await new Promise((res) => (img.onload = res));
      
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      // העלאה לדרייב
      const driveRes = await fetch('/api/upload-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `scan_${Date.now()}.jpg`, fileData: compressedBase64, mimeType: 'image/jpeg', phone: userCid })
      });
      const driveData = await driveRes.json();

      // ניתוח AI
      const aiRes = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "נתח את התמונה", imageBase64: compressedBase64, imageUrl: driveData.link })
      });
      const aiData = await aiRes.json();

      setMessages(prev => [...prev, { role: 'ai', content: aiData.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, הסריקה נכשלה. נסה שוב." }]);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanPreview(null);
      }, 1000);
    }
  };

  const handleFileAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowMenu(false);
    setIsScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (file.type.includes('image')) {
        setScanPreview(base64);
        await processVisualScan(base64, file);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "קיבלתי את המסמך, אני מעבד את הנתונים..." }]);
        setIsScanning(false);
      }
    };
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: userCid })
      });
      const data = await res.json();
      setLoading(false);
      
      setIsTyping(true);
      setStreamingText("");
      const words = data.reply.split(" ");
      let i = 0;
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
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור למוח אחי." }]);
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] ${WA_TEXT}`} dir="rtl">
      <Head>
        <title>ח.סבן AI | עוזר אישי</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-10 z-0" />

      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <img src={SABAN_LOGO} className="w-32 h-32 rounded-3xl shadow-2xl animate-pulse"/>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-16 flex items-center justify-between px-5 bg-[#202c33] border-b border-white/5 z-10 shrink-0 shadow-lg">
        <Menu size={22} className="text-slate-400" />
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-left items-end">
            <span className="font-bold text-sm text-emerald-500 leading-none tracking-tighter uppercase italic">Saban AI Assistant</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Active</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
            </div>
          </div>
          <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border border-emerald-500/30"/>
        </div>
        <Calculator size={22} className="text-emerald-500" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[14px] leading-relaxed prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-md border border-white/5">
              <span className="text-[14px] leading-relaxed">{streamingText || "..."}</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isScanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end">
              <div className="relative w-64 h-80 rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-2xl bg-black">
                {scanPreview && <img src={scanPreview} className="w-full h-full object-cover opacity-50" />}
                <motion.div initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_#4ade80] z-20" />
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-black text-emerald-400 animate-pulse tracking-widest">סורק תשתית...</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} />
      </main>

      <footer className="p-3 bg-[#0b141a] border-t border-white/5 z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] rounded-full text-[12px] font-semibold border border-white/5 flex items-center gap-2 active:scale-95 shadow-md">
              <span className={q.color}>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex items-center gap-3 max-w-5xl mx-auto">
          <div className="relative flex-none">
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 20 }} className="absolute bottom-16 right-0 flex flex-col gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><FileText size={20}/></button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg"><Camera size={20}/></button>
                </motion.div>
              )}
            </AnimatePresence>
            <button type="button" onClick={() => setShowMenu(!showMenu)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl ${showMenu ? 'bg-red-500 rotate-45' : 'bg-[#2a3942] text-emerald-500 border border-white/10'}`}><Plus size={24} /></button>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAction} accept="image/*,application/pdf" />

          <div className="flex-1 bg-[#2a3942] rounded-full flex items-center px-4 py-1 border border-white/5 shadow-inner">
            <textarea 
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="איך אפשר לעזור אחי?"
              className="flex-1 bg-transparent py-3 outline-none text-sm resize-none font-bold"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAI(input))}
            />
            <button type="submit" disabled={loading} className="mr-2 text-emerald-500 active:scale-90 transition-transform"><Send size={22} className="rotate-180"/></button>
          </div>
        </form>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #10b981; }
      `}</style>
    </div>
  );
}
