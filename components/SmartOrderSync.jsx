'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Send, Loader2, CheckCircle, AlertCircle, Zap, Database, MessageSquare } from 'lucide-react';

export default function SmartOrderSync() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  const quickActions = [
    { label: 'סטטוס מכולות', icon: Database },
    { label: 'סיכום יומי', icon: Zap },
    { label: 'דוח נהגים', icon: MessageSquare }
  ];

  // פונקציה לדחיסת תמונה - מונעת שגיאת 413
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // רזולוציה מושלמת ל-AI
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // דחיסה ל-70% איכות - חוסך המון מקום
          resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        };
      };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const compressedBase64 = await compressImage(file);
      
      const res = await fetch('/pi/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: compressedBase64, 
          query: "ניתוח תעודה" 
        })
      });

      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch (err) {
      console.error("Upload error:", err);
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleSendCommand = async (text) => {
    if (!text?.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/shipping-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, imageBase64: null })
      });
      if (res.ok) {
        setStatus('success');
        setInput('');
      } else setStatus('error');
    } catch (err) { setStatus('error'); }
    finally { setLoading(false); setTimeout(() => setStatus(null), 3000); }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mb-3 text-blue-600 text-[10px] font-black uppercase tracking-widest italic">
              <Loader2 size={12} className="animate-spin" /> Saban AI Processing...
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 active:scale-90 transition-all shadow-sm">
            <Camera size={22} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

          <div className="flex-1 bg-white rounded-2xl flex items-center px-4 py-1 border border-slate-200 shadow-sm focus-within:border-blue-400 transition-all">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה למוח..."
              className="flex-1 bg-transparent py-3 outline-none text-sm text-slate-700 resize-none min-h-[44px] font-bold"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendCommand(input))}
            />
            <button onClick={() => handleSendCommand(input)} disabled={loading || !input?.trim()} className="ml-2 text-blue-600 disabled:opacity-20">
              <Send size={22} className="rotate-180" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4">
          {quickActions.map((cmd, i) => (
            <button key={i} onClick={() => handleSendCommand(cmd.label)} className="whitespace-nowrap px-5 py-2 bg-slate-50 rounded-full text-[10px] font-black border border-slate-100 text-slate-500 hover:text-blue-600 transition-all uppercase">
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
