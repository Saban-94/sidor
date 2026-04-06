'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, FileText, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

export default function SabanAIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, type?: 'image' | 'text' }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'camera' | 'image' | 'pdf'>('image');

  // גלילה אוטומטית
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScanning]);

  // פונקציית עיבוד קבצים (תמונות ו-PDF)
  const handleFileAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowMenu(false);
    setIsScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64Full = event.target?.result as string;
      
      if (file.type.includes('image')) {
        setScanPreview(base64Full); // הצגת התמונה לסריקה
        await processImage(base64Full, file);
      } else if (file.type === 'application/pdf') {
        await processPDF(file.name, base64Full);
      }
    };
  };

  const processImage = async (base64: string, file: File) => {
    try {
      // 1. העלאה לדרייב
      const base64Clean = base64.split(',')[1];
      const driveRes = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `scan_${Date.now()}.jpg`, fileData: base64Clean, mimeType: file.type, phone: 'admin' })
      });
      const driveData = await driveRes.json();

      // 2. ניתוח AI
      const aiRes = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "נתח את התמונה", imageBase64: base64Clean, imageUrl: driveData.link })
      });
      const aiData = await aiRes.json();

      setMessages(prev => [...prev, { role: 'ai', content: aiData.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "שגיאה בניתוח הוויזואלי." }]);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanPreview(null);
      }, 1500);
    }
  };

  const processPDF = async (name: string, base64: string) => {
    setMessages(prev => [...prev, { role: 'user', content: `שלחתי קובץ PDF: ${name}` }]);
    // כאן תוסיף לוגיקה לשלוח לדרייב/מנתח PDF
    setTimeout(() => {
      setIsScanning(false);
      setMessages(prev => [...prev, { role: 'ai', content: "קיבלתי את ה-PDF. אני קורא את המפרט ומעדכן אותך." }]);
    }, 2000);
  };

  const askAI = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setInput('');
    const res = await fetch('/api/customer-brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, senderPhone: 'admin' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    setLoading(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0b141a] text-[#e9edef] overflow-hidden font-sans" dir="rtl">
      <Head><title>Saban OS | AI Visual Scan</title></Head>

      {/* Header */}
      <header className="h-16 bg-[#202c33] flex items-center justify-between px-5 shadow-lg shrink-0 z-50">
        <div className="flex items-center gap-3">
          <img src={SABAN_LOGO} className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-emerald-500/20 shadow-lg"/>
          <div className="flex flex-col">
            <span className="font-black text-emerald-500 text-sm tracking-tight">SABAN OS</span>
            <span className="text-[10px] text-slate-400">מומחה טכני מבוסס AI</span>
          </div>
        </div>
        <Calculator className="text-emerald-500 cursor-pointer" size={24} />
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-xl ${m.role === 'user' ? 'bg-[#202c33] rounded-tl-none border border-white/5' : 'bg-[#005c4b] rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm leading-relaxed prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {/* Visual Scanner Overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end">
              <div className="relative w-64 h-80 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl bg-black">
                {scanPreview && <img src={scanPreview} className="w-full h-full object-cover opacity-60" />}
                <motion.div 
                  initial={{ top: 0 }} 
                  animate={{ top: '100%' }} 
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_#4ade80] z-20"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-xs font-bold text-emerald-400 animate-pulse tracking-widest">סורק תשתית...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={scrollRef} />
      </main>

      {/* Input & Menu Area */}
      <footer className="p-4 bg-[#111b21] border-t border-white/5 relative z-[60]">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          
          {/* המבורגר מצלמה / תפריט קבצים */}
          <div className="relative">
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 20 }} className="absolute bottom-16 right-0 flex flex-col gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><FileText size={20}/></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg"><ImageIcon size={20}/></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg"><Camera size={20}/></button>
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${showMenu ? 'bg-red-500 rotate-45' : 'bg-[#2a3942] text-emerald-500'}`}
            >
              <Plus size={24} />
            </button>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAction} accept="image/*,application/pdf" />

          {/* שדה טקסט */}
          <div className="flex-1 bg-[#2a3942] rounded-2xl flex items-center px-4 py-1 border border-white/5 focus-within:border-emerald-500/50 transition-all">
            <textarea 
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="איך אפשר לעזור אחי?"
              className="flex-1 bg-transparent py-3 outline-none text-sm resize-none"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAI(input))}
            />
            <button onClick={() => askAI(input)} className="mr-2 text-emerald-500 hover:scale-110 transition-transform">
              <Send size={22} className="rotate-180" />
            </button>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #34d399; border-radius: 10px; }
        .prose strong { color: #34d399; }
      `}</style>
    </div>
  );
}
