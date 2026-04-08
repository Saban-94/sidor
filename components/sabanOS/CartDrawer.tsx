'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, Plus, Minus, ShoppingBag, MapPin, Clock, Truck } from 'lucide-react';
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
  onSendMessage: (text: string) => void;
  setCartItems: (items: CartItem[]) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items = [], // שכבת הגנה 1: ערך ברירת מחדל
  onRemoveItem,
  onUpdateQuantity,
  onSendMessage,
  setCartItems
}: CartDrawerProps) {
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [unloadingType, setUnloadingType] = useState('לא נקבע');

  useEffect(() => {
    setMounted(true);
  }, []);

  // שכבת הגנה 2: בדיקה כפולה לפני ה-reduce
  const currentItems = Array.isArray(items) ? items : [];
  const total = currentItems.reduce((sum, item) => {
    return sum + ((item?.price || 0) * (item?.quantity || 0));
  }, 0);

  const handleFinalOrder = async () => {
    if (currentItems.length === 0) return;

    const { phone } = router.query;
    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
    
    const orderData = {
      phone: String(targetPhone),
      items: currentItems.map(i => ({ name: i.name, qty: i.quantity })),
      address: deliveryAddress, 
      delivery_time: deliveryTime, 
      unloading_method: unloadingType, 
      status: 'pending'
    };

    try {
      await Promise.all([
        fetch('/api/save-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        }),
        SabanAPI.sendMessage(targetPhone, `צ'ק-אאוט: ${currentItems.length} פריטים למשלוח`)
      ]);

      if (typeof setCartItems === 'function') setCartItems([]);
      onClose();

      if (typeof onSendMessage === 'function') {
        onSendMessage(`קיבלתי את הרשימה פיקס! בוא נסגור פרטים: כתובת: ${deliveryAddress || 'תעודכן'}, מועד: ${deliveryTime || 'יתואם'}, פריקה: ${unloadingType}. אנחנו בדרך! 🚛`);
      }
    } catch (error) {
      console.error("Order failed:", error);
      alert("תקלה ברישום ההזמנה.");
    }
  };

  // שכבת הגנה 3: מניעת רינדור שרת
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 glass-effect-strong border-l border-white/10 z-50 flex flex-col overflow-hidden bg-[#0b141a]/95 shadow-2xl"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">סיכום אספקה</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-4">
              {/* לוגיסטיקה */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 shadow-inner">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="כתובת לאספקה..." 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 text-right text-xs"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="יום ושעת הגעה..." 
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 text-right text-xs"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <select 
                    value={unloadingType}
                    onChange={(e) => setUnloadingType(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white cursor-pointer text-right text-xs appearance-none"
                  >
                    <option value="לא נקבע">סוג פריקה נדרש?</option>
                    <option value="משאית מנוף">משאית מנוף (עד 10 מ')</option>
                    <option value="פריקה ידנית">פריקה ידנית מהמשאית</option>
                  </select>
                </div>
              </div>

              {/* פריטים */}
              <div className="space-y-2">
                {currentItems.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-4">הסל ריק</p>
                ) : (
                  currentItems.map((item, idx) => (
                    <div key={item.id || idx} className="bg-white/5 p-3 rounded-xl border border-white/5 text-right">
                      <p className="text-white text-sm font-bold">{item.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-emerald-500 text-xs font-black">{item.quantity} יח'</span>
                        <span className="text-slate-400 text-xs">{item.price > 0 ? `${(item.price * item.quantity).toLocaleString()} ₪` : 'בירור מחיר'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            {currentItems.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#0b141a]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-sm">סה"כ מוערך</span>
                  <span className="text-white font-black text-2xl tracking-tighter">{total.toLocaleString()} ₪</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinalOrder}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-lg shadow-lg"
                >
                  אישור ושלח לביצוע
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
