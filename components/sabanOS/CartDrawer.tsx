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
  items?: CartItem[]; // הגנה 1: הפיכת השדה לאופציונלי ב-Type
  onRemoveItem: (id: string) => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onSendMessage: (text: string) => void;
  setCartItems: (items: CartItem[]) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items = [], // הגנה 2: ערך ברירת מחדל ריק ב-Props
  onRemoveItem,
  onUpdateQuantity,
  onSendMessage,
  setCartItems
}: CartDrawerProps) {
  const router = useRouter();
  
  // פתרון Hydration
  const [mounted, setMounted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [unloadingType, setUnloadingType] = useState('לא נקבע');

  useEffect(() => {
    setMounted(true);
  }, []);

  // הגנה 3: וידוא קיום מערך לפני ביצוע reduce - זה מה שיפתור את שגיאת ה-Build
  const safeItems = Array.isArray(items) ? items : [];
  const total = safeItems.reduce((sum, item) => {
    const price = item?.price || 0;
    const qty = item?.quantity || 0;
    return sum + (price * qty);
  }, 0);

  const handleFinalOrder = async () => {
    if (safeItems.length === 0) return;

    const { phone } = router.query;
    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
    
    const orderData = {
      phone: String(targetPhone),
      items: safeItems.map(i => ({ name: i.name, qty: i.quantity })),
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
        SabanAPI.sendMessage(targetPhone, `צ'ק-אאוט סבן-סידור: ${safeItems.length} פריטים`)
      ]);

      if (typeof setCartItems === 'function') {
        setCartItems([]);
      }
      onClose();

      if (typeof onSendMessage === 'function') {
        onSendMessage(`אישור קבלת רשימה: המערכת קלטה את ההזמנה. בוא נסגור פרטים: 📍 כתובת: ${deliveryAddress || 'תעודכן'}, ⏰ מועד: ${deliveryTime || 'יתואם'}, 🏗️ פריקה: ${unloadingType}. אנחנו בדרך! 🚛`);
      }
    } catch (error) {
      console.error("Order process failed:", error);
      alert("תקלה ברישום ההזמנה, נסה שוב.");
    }
  };

  // מניעת Prerendering של Next.js על השרת
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
            className="fixed right-0 top-0 h-full w-full sm:w-96 glass-effect-strong border-l border-white/10 z-50 flex flex-col overflow-hidden shadow-2xl bg-[#0b141a]/95 shadow-emerald-500/10"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">סיכום אספקה</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-4">
              
              {/* לוגיסטיקה */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-2 space-y-3 shadow-inner">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="כתובת מדויקת לאספקה..." 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 text-right text-xs"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="יום ושעת אספקה..." 
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
                    className="bg-transparent border-none outline-none w-full text-white appearance-none cursor-pointer text-right text-xs"
                  >
                    <option value="לא נקבע">איזה סוג פריקה?</option>
                    <option value="משאית מנוף">משאית מנוף (עד 10 מ')</option>
                    <option value="פריקה ידנית">פריקה ידנית (מהמשאית)</option>
                  </select>
                </div>
              </div>

              {safeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                  <ShoppingBag className="w-10 h-10 mb-2" />
                  <p className="text-xs">הסל ריק</p>
                </div>
              ) : (
                safeItems.map((item, index) => (
                  <div key={item.id || index} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-start">
                    <div className="text-right">
                      <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-[10px] text-emerald-500 font-black">{item.quantity} יחידות</p>
                    </div>
                    <p className="text-sm font-black text-emerald-500">
                      {item.price > 0 ? `${(item.price * item.quantity).toLocaleString()} ₪` : 'בירור מחיר'}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {safeItems.length > 0 && (
              <div className="glass-effect-strong border-t border-white/10 p-6 space-y-4 bg-[#0b141a]/95">
                <div className="flex justify-between items-center px-1">
                  <span className="text-slate-400 font-medium text-sm">סה"כ לתשלום</span>
                  <span className="font-black text-white text-2xl tracking-tighter">{total.toLocaleString()} ₪</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
