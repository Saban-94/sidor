'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, MapPin, Clock, Truck, Plus, Minus, Trash2, Box } from 'lucide-react';
import { useRouter } from 'next/router';
import confetti from 'canvas-confetti'; // וודא שהתקנת: pnpm add canvas-confetti

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
  onUpdateQuantity: (id: string, quantity: number) => void;
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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [unloadingType, setUnloadingType] = useState('לא נקבע');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const triggerMagicEffects = () => {
    // 1. צליל הקסם
    const audio = new Audio(`/magic-chime.mp3?v=${Date.now()}`);
    audio.play().catch(e => console.log("צליל נחסם", e));

    // 2. זיקוקים
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#ffffff', '#3b82f6']
    });
  };

  const handleFinalOrder = async () => {
    if (!items.length || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { phone } = router.query;
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');

      const response = await fetch('/api/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          items: items,
          address: deliveryAddress,
          unloading_method: unloadingType
        })
      });

      const result = await response.json();

      if (result.success) {
        triggerMagicEffects();
        setCartItems([]);
        
        const trackUrl = `/track/${result.orderNumber}?phone=${targetPhone}`;
        onSendMessage(`הזמנה #${result.orderNumber} נשלחה! 🚀 עוברים לדף מעקב...`);
        
        setTimeout(() => {
          onClose();
          router.push(trackUrl);
        }, 2500);
      }
    } catch (error) {
      console.error("שגיאה:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b141a]/60 backdrop-blur-md z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#0f172a] z-[70] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-white/10"
            dir="rtl"
          >
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <ShoppingBag size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">סל הזמנות</h2>
                    <p className="text-xs text-emerald-100 opacity-80 font-medium">ח. סבן לוגיסטיקה בע"מ</p>
                  </div>
                </div>
                <button onClick={onClose} className="hover:rotate-90 transition-transform duration-300 p-1 text-white">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar bg-[#0f172a]">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-3 bg-[#1e293b] p-3 rounded-2xl border border-white/5">
                  <MapPin size={18} className="text-emerald-500" />
                  <input 
                    placeholder="לאן לשלוח?" value={deliveryAddress} 
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="bg-transparent text-white outline-none w-full text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-[#1e293b] p-3 rounded-2xl border border-white/5">
                    <Clock size={16} className="text-emerald-500" />
                    <input placeholder="מתי?" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="bg-transparent text-white outline-none w-full text-xs font-medium"/>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1e293b] p-3 rounded-2xl border border-white/5">
                    <Truck size={16} className="text-emerald-500" />
                    <select value={unloadingType} onChange={e => setUnloadingType(e.target.value)} className="bg-transparent text-white outline-none w-full text-xs appearance-none">
                      <option value="מנוף">מנוף</option>
                      <option value="ידני">ידני</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Box size={60} className="text-white mb-4" />
                    <p className="text-white font-bold">הסל ריק, בוס</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <motion.div key={item.id} layout className="bg-white/[0.03] p-4 rounded-3xl border border-white/5 flex justify-between items-center transition-all">
                      <div className="flex flex-col gap-2">
                        <span className="text-white font-bold text-sm leading-tight max-w-[180px]">{item.name}</span>
                        <div className="flex items-center bg-[#0f172a] rounded-full p-1 border border-white/10 w-fit">
                          <button onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"><Minus size={14} /></button>
                          <span className="px-3 text-white font-black text-sm">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-500"><Plus size={14} /></button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <button onClick={() => onRemoveItem(item.id)} className="p-2 text-slate-500 hover:text-rose-500"><Trash2 size={18} /></button>
                        <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-black opacity-60">בתיאום מחיר</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-[#1e293b]/50 border-t border-white/10 backdrop-blur-xl">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleFinalOrder} disabled={isSubmitting}
                  className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2rem] font-black text-lg shadow-[0_10px_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'מעבד הזמנה...' : 'אשר ושלח לרויטל'}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
