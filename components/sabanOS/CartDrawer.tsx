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
  {items.length === 0 ? (
    <p className="text-center text-slate-500 py-10 text-xs uppercase tracking-widest italic">הסל ריק בוס</p>
  ) : (
    items.map((item) => (
      <div key={item.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center shadow-lg backdrop-blur-md">
        
        {/* צד ימין: שם המוצר ובורר כמות */}
        <div className="text-right flex flex-col gap-2">
          <p className="text-white text-sm font-bold tracking-wide">
            {/* הגנה על השם - אם חסר מציג 'מוצר מהשטח' */}
            {item.name || (item as any).product_name || "מוצר מהשטח"}
          </p>
          
          {/* בורר כמות מקצועי */}
          <div className="flex items-center gap-3 bg-[#1a2f3f] rounded-full px-2 py-1 w-fit border border-white/5">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
            >
              <Minus size={14} />
            </motion.button>
            
            <span className="text-white font-black text-sm min-w-[20px] text-center">
              {item.quantity || 1}
            </span>

            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 transition-colors"
            >
              <Plus size={14} />
            </motion.button>
          </div>
        </div>

        {/* צד שמאל: מחיר וכפתור מחיקה */}
        <div className="flex flex-col items-end gap-3">
          <button 
            onClick={() => onRemoveItem(item.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <p className="text-emerald-400 text-sm font-black italic">
            {item.price > 0 ? `${((item.price || 0) * (item.quantity || 1)).toLocaleString()} ₪` : 'בירור'}
          </p>
        </div>
      </div>
    ))
  )}
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
