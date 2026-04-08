'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // התיקון הקריטי: ייבוא AnimatePresence
import CustomerUnifiedManager from '@/components/sabanOS/CustomerUnifiedManager';

// מונע מ-Next.js לנסות לרנדר את הדף כסטטי ב-Build
export const dynamic = 'force-dynamic';

export default function AdminAiPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CustomerUnifiedManager />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
