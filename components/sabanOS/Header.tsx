import React from 'react';
import { ShoppingCart, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
}

export default function SabanOSHeader({ cartCount, onCartClick, onMenuClick }: HeaderProps) {
  const { language } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect-strong relative z-40 border-b border-[var(--color-border)] px-4 py-4 sm:px-6"
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Hamburger Menu */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-primary)]"
        >
          <Menu className="w-6 h-6" />
        </motion.button>

        {/* Logo and Title */}
        <div className="flex items-center gap-3 flex-1 sm:flex-none sm:mx-0 justify-center sm:justify-start">
          {/* Circular Logo */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-lg glow-emerald-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-wider">
              {language === 'he' ? 'סבן' : 'SABAN'} AI
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {language === 'he' ? 'ניהול חומרים' : 'Materials Management'}
            </p>
          </div>
        </div>

        {/* Shopping Cart Icon */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCartClick}
          className="relative p-2 rounded-full hover:bg-[var(--color-surface)] transition-colors"
        >
          <ShoppingCart className="w-6 h-6 text-[var(--color-primary)]" />
          
          {/* Notification Badge */}
          {cartCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center glow-accent"
            >
              {cartCount}
            </motion.div>
          )}
        </motion.button>
      </div>
    </motion.header>
  );
}
