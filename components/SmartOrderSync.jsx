'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Send, Loader2, CheckCircle, 
  AlertCircle, Zap, Database, MessageSquare 
} from 'lucide-react';

/**
 * SabanOS Smart Order Sync - Visual Engine
 * רכיב הזרקת נתונים חכם המחובר ל-Supervisor Core
 */
export default function SmartOrderSync() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const fileInputRef = useRef(null);

  // פונקציית שליחת פקודה למוח
  const handleSendCommand = async (text) => {
    if (!text.trim() || loading) return;
    
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/ai-supervisor-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, sender_name: "ראמי מסארווה" })
      });

      if (response.ok) {
        setStatus('success');
        setInput('');
        // צליל אישור קטן
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error("Sync error:", err);
      setStatus('error');
    } finally {
      setLoading(false);
      // איפוס סטטוס אחרי 3 שניות
      setTimeout(() => setStatus(null), 3000);
    }
  };

  // פונקציית העלאת תמונה לסריקת OCR
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Clean = event.target.result.split(',')[1];
        const res = await fetch('/api/tools-brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: "סרוק תעודת משלוח ועדכן סידור", 
            imageBase64: base64Clean 
          })
        });

        if (res.ok) setStatus('success');
        else setStatus('error');
      } catch (err) {
        setStatus('error');
      } finally {
        setLoading(false);
        setTimeout(() => setStatus(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#111b21]/95 backdrop-blur-md border-t border-white/5 p-4 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        
        {/* אינדיקטורים מעל שורת הקלט */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 mb-2 text-emerald-500 text-[10px] font-bold tracking-widest uppercase italic"
            >
              <Loader2 size={12} className="animate-spin" />
              Saban AI Processing...
            </motion.div>
          )}

          {status && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 mb-2 p-2 rounded-lg border text-[11px] font-bold ${
                status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}
            >
              {status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {status === 'success' ? "הנתונים עודכנו בסידור ✅" : "תקלה בסנכרון, נסה שוב ❌"}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          {/* כפתור מצלמה לסריקה */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 shrink-0 rounded-2xl bg-[#2a3942] text-emerald-500 flex items-center justify-center border border-white/5 hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
          >
            <Camera size={22} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />

          {/* שדה טקסט חכם */}
          <div className="flex-1 bg-[#2a3942] rounded-2xl flex items-center px-4 py-1 border border-white/5 focus-within:border-emerald-500/40 transition-all shadow-inner">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה למוח: 'הזמנה חדשה להרצל'..."
              className="flex-1 bg-transparent py-3 outline-none text-sm text-[#e9edef] resize-none max-h-32 min-h-[44px]"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendCommand(input))}
            />
            
            <button 
              onClick={() => handleSendCommand(input)}
              disabled={loading || !input.trim()}
              className="ml-2 text-emerald-500 disabled:opacity-20 hover:scale-110 transition-transform"
            >
              <Send size={22} className="rotate-180" />
            </button>
          </div>
        </div>

        {/* פקודות מהירות */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
          {[
            { label: 'סטטוס מכולות', icon: Database },
            { label: 'סיכום יומי', icon: Zap },
            { label: 'דוח נהגים', icon: MessageSquare }
          ].map((cmd, i) => (
            <button 
              key={i}
              onClick={() => handleSendCommand(cmd.label)}
              className="whitespace-nowrap px-4 py-1.5 bg-[#202c33] rounded-full text-[10px] font-black border border-white/5 text-slate-400 hover:text-emerald-500 transition-all uppercase tracking-tighter"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
