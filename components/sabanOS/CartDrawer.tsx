'use client';
import React, { useState, useEffect } from 'react';
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
  onSendMessage: (text: string) => void; 
  setCartItems: (items: CartItem[]) => void; 
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onUpdateQuantity,
  onSendMessage,
  setCartItems
}: CartDrawerProps) {
  const router = useRouter();
  const { phone } = router.query;
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const handleFinalOrder = async () => {
    if (items.length === 0) return;

    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
    
    const orderData = {
      phone: String(targetPhone),
      items: items.map(i => ({ name: i.name, qty: i.quantity })),
      status: 'pending'
    };

    try {
      // 1. שליחה ל-Supabase ולגוגל במקביל
      await Promise.all([
        fetch('/api/save-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        }),
        SabanAPI.sendMessage(targetPhone, `ביצוע הזמנה מהסל: ${items.map(i => i.name).join(', ')}`)
      ]);

      // 2. ריקון הסל המקומי בבת אחת
      setCartItems([]);
      
      // 3. סגירת המגירה
      onClose();

      // 4. הפעלת רויטל לצומת הלוגיסטית (תיקון שם הפונקציה ל-onSendMessage)
      const summary = items.map(i => `${i.quantity} יחידות של ${i.name}`).join(', ');
      
      onSendMessage(`אישור קבלת רשימה: המערכת קלטה את ההזמנה שלך (${summary}). בוא נשלים פרטי אספקה: 
      1. מה הכתובת המדויקת למשלוח?
      2. מתי תרצה את האספקה (יום ושעה)?
      3. איזה פריקה נדרשת: משאית מנוף (עד 10 מטר מרחק הנפה) או פריקה ידנית?`);

    } catch (error) {
      console.error("Order process failed:", error);
      alert("בוס, הייתה תקלה ברישום. הנתונים בטבלה אבל הסל לא התרוקן.");
    }
  };

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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 glass-effect-strong border-l border-white/10 z-50 flex flex-col overflow-hidden shadow-2xl bg-[#0b141a]/95"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">סל הקניות</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-50">
                  <ShoppingBag className="w-12 h-12 mb-4 text-slate-600" />
                  <p className="text-slate-400 mb-1">הסל שלך ריק</p>
                  <p className="text-xs text-slate-500">הוסף פריטים כדי להתחיל</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-effect-light p-4 rounded-2xl flex items-start justify-between gap-3 border border-white/5 shadow-inner"
                  >
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                        {item.verified && (
                          <div className="flex-shrink-0 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 font-black tracking-tighter">אומת AI</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {onUpdateQuantity && (
                          <div className="flex items-center gap-2 bg-black/30 rounded-xl px-2 py-1" dir="ltr">
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-emerald-500 text-slate-400"><Plus className="w-3 h-3" /></button>
                            <span className="text-xs font-black w-4 text-center text-white">{item.quantity}</span>
                            <button onClick={() => item.quantity > 1 && onUpdateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-emerald-500 text-slate-400"><Minus className="w-3 h-3" /></button>
                          </div>
                        )}
                        <p className="text-sm font-black text-emerald-500">
                          {item.price > 0 ? `${(item.price * item.quantity).toLocaleString()} ₪` : 'בירור מחיר'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} className="p-2 rounded-xl text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="glass-effect-strong border-t border-white/10 p-4 sm:p-6 space-y-4 bg-[#0b141a]/90">
                <div className="flex justify-between items-center px-1">
                  <span className="text-slate-400 font-medium text-sm">סה"כ לתשלום</span>
                  <span className="font-black text-white text-2xl tracking-tighter">{total.toLocaleString()} ₪</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFinalOrder}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-lg shadow-lg flex items-center justify-center gap-3"
                >
                  <Check className="w-6 h-6" />
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
