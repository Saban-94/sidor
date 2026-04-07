import React from 'react';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  onActionClick: () => void;
}

const actions = [
  { label: 'Order Now', emoji: '🎯', color: 'from-[#10b981] to-[#059669]' },
  { label: 'Crane Delivery', emoji: '🏗️', color: 'from-[#3b82f6] to-[#1e40af]' },
  { label: 'Technical Advice', emoji: '🎓', color: 'from-[#f59e0b] to-[#d97706]' },
  { label: 'Stock Check', emoji: '📦', color: 'from-[#8b5cf6] to-[#6d28d9]' },
];

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="px-4 py-4 sm:px-6 border-t border-white/5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onActionClick}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap
              bg-gradient-to-r ${action.color}
              text-white shadow-lg hover:shadow-xl
              transition-all duration-300
              border border-white/20`}
          >
            <span className="mr-2">{action.emoji}</span>
            {action.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
