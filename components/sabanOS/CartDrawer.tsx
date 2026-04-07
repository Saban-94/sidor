import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, Plus, Minus } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  verified: boolean;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onUpdateQuantity,
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 glass-effect-strong border-l border-white/10 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#94a3b8]" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <p className="text-[#64748b] mb-2">Your cart is empty</p>
                  <p className="text-xs text-[#475569]">Add items to get started</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-effect-light p-4 rounded-xl flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-white truncate">
                          {item.name}
                        </h3>
                        {item.verified && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0 flex items-center gap-1 bg-[#10b981]/20 px-2 py-0.5 rounded-full"
                          >
                            <Check className="w-3 h-3 text-[#10b981]" />
                            <span className="text-xs text-[#10b981] font-medium">
                              Verified by AI
                            </span>
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {/* Quantity Controls */}
                        {onUpdateQuantity && (
                          <div className="flex items-center gap-1 bg-[#0f172a]/50 rounded-lg px-2 py-1">
                            <button
                              onClick={() => item.quantity > 1 && onUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-0.5 hover:text-[#10b981] transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-semibold w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-0.5 hover:text-[#10b981] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm font-bold text-[#10b981]">
                          {(item.price * item.quantity).toLocaleString('en-US')} SAR
                        </p>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRemoveItem(item.id)}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-[#ff4757]/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[#ff4757]" />
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="glass-effect border-t border-white/10 p-4 sm:p-6 space-y-3">
                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-[#94a3b8]">Subtotal</span>
                  <span className="font-bold text-white">
                    {total.toLocaleString('en-US')} SAR
                  </span>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-full
                    bg-gradient-to-r from-[#10b981] to-[#059669]
                    text-white font-semibold shadow-lg
                    hover:shadow-xl transition-all duration-300
                    glow-emerald"
                >
                  Proceed to Checkout
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
