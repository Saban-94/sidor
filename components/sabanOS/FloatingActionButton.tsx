'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Image as ImageIcon, Search } from 'lucide-react';

interface FABProps {
  onImageCapture?: (text: string, base64: string) => void;
}

export default function FloatingActionButton({ onImageCapture }: FABProps) {
  const [isActive, setIsActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // פונקציה שמטפלת בבחירת קובץ או צילום
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      // שליחה לרויטל לניתוח
      if (onImageCapture) {
        onImageCapture("ניתוח תמונה מהשטח...", base64);
      }
      setIsActive(false); // סגירת התפריט לאחר בחירה
    };
    reader.readAsDataURL(file);
    
    // איפוס האינפוט
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCamera = (useGallery: boolean = false) => {
    if (fileInputRef.current) {
      // אם בחרנו גלריה נבטל את ה-capture, אם מצלמה נפעיל אותו
      if (useGallery) {
        fileInputRef.current.removeAttribute('capture');
      } else {
        fileInputRef.current.setAttribute('capture', 'environment');
      }
      fileInputRef.current.click();
    }
  };

  return (
    <>
      {/* Camera Icon FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsActive(!isActive)}
        className="fixed bottom-8 left-8 z-30
          w-14 h-14 rounded-full
          bg-gradient-to-r from-[#10b981] to-[#059669]
          text-white shadow-2xl
          flex items-center justify-center
          hover:shadow-3xl transition-all duration-300
          glow-emerald"
      >
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="camera" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
              <Camera className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Action Menu */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 left-8 z-20 flex flex-col gap-3"
          >
            {/* סרוק חומרים (מצלמה) */}
            <motion.button
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openCamera(false)}
              className="px-4 py-3 rounded-2xl glass-effect-strong
                text-white font-black text-xs shadow-lg
                flex items-center gap-3 border border-white/10"
            >
              <div className="bg-emerald-500 p-1.5 rounded-lg"><Camera className="w-4 h-4" /></div>
              סרוק חומרים
            </motion.button>

            {/* גלריה */}
            <motion.button
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openCamera(true)}
              className="px-4 py-3 rounded-2xl glass-effect-strong
                text-white font-black text-xs shadow-lg
                flex items-center gap-3 border border-white/10"
            >
              <div className="bg-blue-500 p-1.5 rounded-lg"><ImageIcon className="w-4 h-4" /></div>
              גלריית תמונות
            </motion.button>

            {/* ניתוח חכם */}
            <motion.button
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openCamera(false)}
              className="px-4 py-3 rounded-2xl glass-effect-strong
                text-white font-black text-xs shadow-lg
                flex items-center gap-3 border border-white/10"
            >
              <div className="bg-purple-500 p-1.5 rounded-lg"><Search className="w-4 h-4" /></div>
              ניתוח חכם
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </>
  );
}
