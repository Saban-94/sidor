'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface OrderSummaryProps {
  userInput: string;
  isVisible: boolean;
}

export default function OrderSummary({ userInput, isVisible }: OrderSummaryProps) {
  const { language } = useTheme();

  if (!userInput.trim()) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="mx-4 mb-3"
        >
          <div className="glass-effect rounded-2xl px-4 py-3 inline-block max-w-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-primary)] uppercase">
                {language === 'he' ? 'הזמנה' : 'Order'}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-primary)] mt-1 leading-relaxed">
              {userInput}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
