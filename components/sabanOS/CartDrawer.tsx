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
  items = [], // הגנה 1
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

  const handleFinalOrder = async () => {
    if (!items || items.length === 0) return;
    const { phone } = router.query;
    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
    
    const orderData = {
      phone: String(targetPhone),
      items: items.map(i => ({ name: i.name, qty: i.quantity })),
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
        SabanAPI.sendMessage(targetPhone, `הזמנה חדשה: ${items.length} פריטים ליעד ${deliveryAddress}`)
      ]);
      setCartItems([]);
      onClose();
      onSendMessage(`ההזמנה נרשמה בסיסטם בוס! 🏗️ הכתובת: ${deliveryAddress}, פריקה: ${unloadingType}. יוצאים לדרך! 🚛`);
    } catch (error) {
      alert("תקלה ברישום.");
    }
  };

  // הגנה קריטית 2: מונע מ-Next.js להריץ את ה-reduce בזמן ה-Build
  if (!mounted) return null;

  // חישוב רק אחרי שהקומפוננטה נטענה בדפדפן
  const totalAmount = items?.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0) || 0;

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
            className="fixed right-0 top-0 h-full w-full sm:w-96 glass-effect-strong border-l border-white/10 z-50 flex flex-col overflow-hidden bg-[#0b141a]/95 text-right shadow-2xl"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">פרטי אספקה</h2>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logistics Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="כתובת מלאה..." 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white text-right placeholder:text-slate-600"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="יום ושעה מבוקשים..." 
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white text-right placeholder:text-slate-600"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <select 
                    value={unloadingType}
                    onChange={(e) => setUnloadingType(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-white text-right appearance-none"
                  >
                    <option value="לא נקבע">איזו פריקה דרושה?</option>
                    <option value="משאית מנוף">משאית מנוף (עד 10 מ')</option>
                    <option value="פריקה ידנית">פריקה ידנית (מהמשאית)</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">הסל ריק בוס</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                      <div className="text-right">
                        <p className="text-white text-sm font-bold">{item.name}</p>
                        <p className="text-emerald-500 text-xs font-black">{item.quantity} יח'</p>
                      </div>
                      <p className="text-emerald-500 text-sm font-black">{item.price > 0 ? `${(item.price * item.quantity).toLocaleString()} ₪` : 'בירור'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#0b141a]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-sm">סה"כ מוערך</span>
                  <span className="text-white font-black text-2xl">{totalAmount.toLocaleString()} ₪</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinalOrder}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-lg transition-colors"
                >
                  אשר ושלח לביצוע
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
