'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, Plus, Minus, ShoppingBag } from 'lucide-react';
import { SabanAPI } from '@/lib/SabanAPI';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const { phone } = router.query;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // פונקציית שליחה לטבלה ולוואטסאפ
  const handleFinalOrder = async () => {
    if (items.length === 0) return;

    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
    
    const orderData = {
      phone: targetPhone,
      items: items,
      total_items: items.length,
      status: 'pending'
    };

    try {
      // שליחה במקביל ל-Supabase ולגוגל שיטס
      await Promise.all([
        fetch('/api/save-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        }),
        SabanAPI.sendMessage(targetPhone, `ביצוע הזמנה סופית מהסל: ${items.map(i => i.name).join(', ')}`)
      ]);

      // הכנת הודעת וואטסאפ
      const waText = `הזמנה חדשה מ-SabanOS 🏗️\nלקוח: ${targetPhone}\n\nרשימת פריטים:\n${items.map(i => `• ${i.name} (כמות: ${i.quantity})`).join('\n')}\n\nנא לאשר הזמנה!`;
      window.open(`https://wa.me/972508860896?text=${encodeURIComponent(waText)}`, '_blank');
      
      onClose();
    } catch (error) {
      alert("תקלה ברישום ההזמנה, נסה שוב.");
    }
  };

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
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white">סל הקניות</h2>
              </div>
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
                  <p className="text-[#64748b] mb-2">הסל שלך ריק</p>
                  <p className="text-xs text-[#475569]">הוסף פריטים כדי להתחיל</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-effect-light p-4 rounded-xl flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0 text-right">
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
                            <span className="text-[10px] text-[#10b981] font-bold uppercase">
                              אומת ע"י AI
                            </span>
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {onUpdateQuantity && (
                          <div className="flex items-center gap-1 bg-[#0f172a]/50 rounded-lg px-2 py-1" dir="ltr">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-0.5 hover:text-[#10b981] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-semibold w-6 text-center text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => item.quantity > 1 && onUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-0.5 hover:text-[#10b981] transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm font-bold text-[#10b981]">
                          {item.price > 0 ? `${(item.price * item.quantity).toLocaleString()} ₪` : 'מחיר בבירור'}
                        </p>
                      </div>
                    </div>

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
              <div className="glass-effect border-t border-white/10 p-4 sm:p-6 space-y-3 bg-[#0b141a]/80">
                <div className="flex justify-between items-center">
                  <span className="text-[#94a3b8]">סה"כ לתשלום</span>
                  <span className="font-bold text-white text-xl">
                    {total.toLocaleString()} ₪
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFinalOrder}
                  className="w-full py-4 rounded-2xl
                    bg-gradient-to-r from-[#10b981] to-[#059669]
                    text-white font-black shadow-lg
                    hover:shadow-xl transition-all duration-300
                    flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  שלח הזמנה לביצוע
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
