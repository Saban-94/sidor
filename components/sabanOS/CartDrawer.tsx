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
  items = [],
  onRemoveItem,
  onUpdateQuantity,
  onSendMessage,
  setCartItems
}: CartDrawerProps) {
  // הלוגיקה חייבת להיות בתוך גוף הפונקציה!
  const router = useRouter();
  const { phone } = router.query;
  
  const [mounted, setMounted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [unloadingType, setUnloadingType] = useState('לא נקבע');

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentItems = items || [];
  const total = currentItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const handleFinalOrder = async () => {
    if (currentItems.length === 0) return;

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
        SabanAPI.sendMessage(targetPhone, `ביצוע הזמנה מהסל: ${currentItems.length} פריטים`)
      ]);

      if (typeof setCartItems === 'function') {
        setCartItems([]);
      }
      
      onClose();

      if (typeof onSendMessage === 'function') {
        onSendMessage(`תודה בוס! ההזמנה נקלטה במערכת. 🏗️
        📍 יעד: ${deliveryAddress || 'יתואם מול רויטל'}
        ⏰ מועד: ${deliveryTime || 'יתואם טלפונית'}
        🏗️ פריקה: ${unloadingType}`);
      }

    } catch (error) {
      console.error("Order process failed:", error);
      alert("תקלה ברישום ההזמנה.");
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
            className="fixed right-0 top-0 h-full w-full sm:w-96 glass-effect-strong border-l border-white/10 z-50 flex flex-col overflow-hidden shadow-2xl bg-[#0b141a]/95 shadow-emerald-500/10"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">סיכום הזמנה</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 py-4 space-y-3">
              
              {/* קוביית פרטי לוגיסטיקה */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="כתובת אספקה..." 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 text-right"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="מועד הגעה מבוקש..." 
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 text-right"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <select 
                    value={unloadingType}
                    onChange={(e) => setUnloadingType(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white appearance-none cursor-pointer text-right"
                  >
                    <option value="לא נקבע">סוג פריקה?</option>
                    <option value="משאית מנוף">משאית מנוף (עד 10 מ')</option>
                    <option value="פריקה ידנית">פריקה ידנית</option>
                  </select>
                </div>
              </div>

              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-effect-light p-4 rounded-2xl border border-white/5 text-right"
                >
                  <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-emerald-500 font-black">{item.quantity} יחידות</span>
                    <p className="text-sm font-black text-emerald-500">
                      {item.price > 0 ? `${(item.price * item.quantity).toLocaleString()} ₪` : 'בירור מחיר'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            {currentItems.length > 0 && (
              <div className="glass-effect-strong border-t border-white/10 p-6 space-y-4 bg-[#0b141a]/95">
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
