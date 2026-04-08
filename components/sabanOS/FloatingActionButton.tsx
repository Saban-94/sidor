'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Camera, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, imageBase64?: string | null) => void;
  isLoading: boolean;
}

export default function ChatInput({
  value = "", // הגנה 1: ערך ברירת מחדל למקרה ש-value מגיע כ-undefined
  onChange,
  onSend,
  isLoading,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playMagicChime = () => {
    const audio = new Audio('/magic-chime.mp3');
    audio.play().catch(() => {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // הגנה 2: בדיקה בטוחה של trim למניעת שגיאת undefined
    const safeValue = value?.trim() || "";
    if (safeValue && !isLoading) {
      onSend(safeValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      playMagicChime();
      // הגנה 3: אם אין טקסט, שולחים הודעת ברירת מחדל לצד התמונה
      onSend(value?.trim() || "ניתוח תמונה...", base64);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect-strong border-t border-white/10 px-4 py-4 sm:px-6 z-10"
    >
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-6xl mx-auto items-center relative">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div className="flex-1 relative flex items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="absolute right-3 p-2 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={value || ""} // וידוא שהערך לעולם לא undefined
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="איך רויטל יכולה לעזור?"
            disabled={isLoading}
            className="w-full pr-12 pl-5 py-3 rounded-full
              bg-[#1a2f3f] border border-white/20
              text-white placeholder-[#64748b]
              focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/30
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              text-base sm:text-sm"
          />
        </div>

        <motion.button
          type="submit"
          disabled={!value?.trim() || isLoading} // שימוש ב-optional chaining
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-3 rounded-full
            bg-gradient-to-r from-[#10b981] to-[#059669]
            text-white shadow-lg hover:shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300 flex items-center justify-center min-w-[44px]"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 rotate-180" />
          )}
        </motion.button>
      </form>
      <p className="text-[10px] text-[#64748b] mt-2 text-center sm:text-right uppercase tracking-widest font-black">
        Saban AI Vision Technology
      </p>
    </motion.div>
  );
}
