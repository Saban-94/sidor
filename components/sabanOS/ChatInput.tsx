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

export default function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // טעינה מראש של הצלצול כדי שלא ייעלם
  useEffect(() => {
    audioRef.current = new Audio('/magic-chime.mp3');
    audioRef.current.load();
  }, []);

  const playChime = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // חזרה להתחלה
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      
      // הפעלת הצלצול בדיוק ברגע שה-Base64 מוכן
      playChime();
      
      // שליחה לרויטל
      onSend(value || "רויטל, תנתחי לי את התמונה הזו בבקשה", base64);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // פונקציה לטיפול בצילום/העלאת תמונה
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      // שולח מיד את התמונה לניתוח במוח
      onSend(value, base64);
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
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-6xl mx-auto items-center">
        
        {/* כפתור מצלמה (Hidden Input) */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 p-3 rounded-full bg-[#1a2f3f] border border-white/20 text-emerald-400 hover:border-emerald-500/50 transition-all shadow-lg disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
        </motion.button>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="איך עוזרים היום?"
          disabled={isLoading}
          className="flex-1 px-5 py-3 rounded-full
            bg-[#1a2f3f] border border-white/20
            text-white placeholder-[#64748b]
            focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/30
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            text-base sm:text-sm"
          style={{
            fontSize: 'max(16px, 1rem)',
          }}
        />

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={(!value.trim() && !isLoading) || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-3 rounded-full
            bg-gradient-to-r from-[#10b981] to-[#059669]
            text-white shadow-lg hover:shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            glow-emerald-sm flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
        </motion.button>
      </form>

      {/* Footer Info */}
      <p className="text-[10px] text-[#64748b] mt-2 text-center sm:text-right uppercase tracking-widest font-black">
        Powered by Saban AI Technology
      </p>
    </motion.div>
  );
}
