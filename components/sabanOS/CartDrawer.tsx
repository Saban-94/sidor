'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, MapPin, Clock, Truck } from 'lucide-react';
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
  onSendMessage,
  setCartItems
}: CartDrawerProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [unloadingType, setUnloadingType] = useState('לא נקבע');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const handleFinalOrder = async () => {
    if (!items.length || isSubmitting) return;
    setIsSubmitting(true);
    const { phone } = router.query;
    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');

    try {
      const response = await fetch('/api/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: String(targetPhone),
          items: items.map(i => ({ name: i.name, qty: i.quantity })),
          address: deliveryAddress,
          delivery_time: deliveryTime,
          unloading_method: unloadingType,
          status: 'pending'
        })
      });

      if (!response.ok) throw new Error("שגיאה בשמירה");
      setCartItems([]);
      onClose();
      onSendMessage(`אישור הזמנה: המערכת קלטה את הרשימה! יעד: ${deliveryAddress || 'יתואם'}, פריקה: ${unloadingType}. 🚛`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#0b141a] z-50 flex flex-col border-l border-white/10 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white">פרטי אספקה</h2>
              </div>
              <X onClick={onClose} className="cursor-pointer text-slate-400" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3"><MapPin size={16} className="text-emerald-500"/><input placeholder="כתובת..." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="bg-transparent text-white outline-none w-full text-sm"/></div>
                <div className="flex items-center gap-3"><Clock size={16} className="text-emerald-500"/><input placeholder="זמן..." value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="bg-transparent text-white outline-none w-full text-sm"/></div>
                <div className="flex items-center gap-3"><Truck size={16} className="text-emerald-500"/>
                  <select value={unloadingType} onChange={e => setUnloadingType(e.target.value)} className="bg-transparent text-white outline-none w-full text-sm appearance-none">
                    <option value="לא נקבע">סוג פריקה?</option>
                    <option value="משאית מנוף">משאית מנוף</option>
                    <option value="ידנית">ידנית</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5">
                    <div className="text-right">
                      <p className="text-white text-sm font-bold">{item.name || (item as any).product_name}</p>
                      <p className="text-emerald-500 text-xs">{item.quantity || (item as any).qty} יח'</p>
                    </div>
                    <p className="text-emerald-500 font-bold">{item.price > 0 ? `${(item.price * item.quantity).toLocaleString()} ₪` : 'בירור'}</p>
                  </div>
                ))}
              </div>
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-white/10">
                <div className="flex justify-between mb-4">
                  <span className="text-slate-400">סה"כ מוערך</span>
                  <span className="text-white font-bold text-xl">{totalAmount.toLocaleString()} ₪</span>
                </div>
                <button onClick={handleFinalOrder} disabled={isSubmitting} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold disabled:bg-slate-700">
                  {isSubmitting ? 'שולח...' : 'אשר ושלח לביצוע'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
