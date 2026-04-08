'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Send, Loader2, CheckCircle, 
  AlertCircle, Zap, Database, MessageSquare 
} from 'lucide-react';

export default function SmartOrderSync() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  // רשימת כפתורים מוגדרת מראש כדי למנוע שגיאת undefined
  const quickActions = [
    { label: 'סטטוס מכולות', icon: Database },
    { label: 'סיכום יומי', icon: Zap },
    { label: 'דוח נהגים', icon: MessageSquare }
  ];

  const handleSendCommand = async (text) => {
    if (!text?.trim() || loading) return;
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
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#111b21]/95 backdrop-blur-md border-t border-white/5 p-4 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mb-2 text-emerald-500 text-[10px] font-bold uppercase italic">
              <Loader2 size={12} className="animate-spin" /> Saban AI Processing...
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 shrink-0 rounded-2xl bg-[#2a3942] text-emerald-500 flex items-center justify-center border border-white/5 shadow-lg">
            <Camera size={22} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

          <div className="flex-1 bg-[#2a3942] rounded-2xl flex items-center px-4 py-1 border border-white/5">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה למוח..."
              className="flex-1 bg-transparent py-3 outline-none text-sm text-[#e9edef] resize-none min-h-[44px]"
            />
            <button onClick={() => handleSendCommand(input)} disabled={loading || !input?.trim()} className="ml-2 text-emerald-500 disabled:opacity-20">
              <Send size={22} className="rotate-180" />
            </button>
          </div>
        </div>

        {/* הגנה על הלולאה עם Optional Chaining */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
          {quickActions?.map((cmd, i) => (
            <button 
              key={i}
              onClick={() => handleSendCommand(cmd.label)}
              className="whitespace-nowrap px-4 py-1.5 bg-[#202c33] rounded-full text-[10px] font-black border border-white/5 text-slate-400 hover:text-emerald-500 transition-all uppercase"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
