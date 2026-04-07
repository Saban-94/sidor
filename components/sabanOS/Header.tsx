import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function SabanOSHeader({ cartCount, onCartClick }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect-strong relative z-40 border-b border-white/10 px-4 py-4 sm:px-6"
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          {/* Circular Logo */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-lg glow-emerald-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-wider">
              SABAN AI
            </h1>
            <p className="text-xs text-[#94a3b8]">Materials Management</p>
          </div>
        </div>

        {/* Shopping Cart Icon */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCartClick}
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ShoppingCart className="w-6 h-6 text-[#10b981]" />
          
          {/* Notification Badge */}
          {cartCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-[#ff4757] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center glow-accent"
            >
              {cartCount}
            </motion.div>
          )}
        </motion.button>
      </div>
    </motion.header>
  );
}
