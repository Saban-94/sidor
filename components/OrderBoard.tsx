'use client';
import React, { useState, useRef } from 'react';
import { 
  Clock, CheckCircle, Eye, 
  Edit3, Printer, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderBoard({ orders = [], onUpdate }: { orders: any[], onUpdate: (id: string, updates: any) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // פונקציית עזר למניעת "בעבוע" של הלחיצה
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // אם אין הזמנות, נציג הודעה ידידותית במקום לקרוס
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 italic">
        <Clock size={48} className="mb-4 text-slate-300" />
        <p className="text-xl font-black text-slate-400">ממתין להזמנות חדשות מח. סבן...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-24 px-2 md:px-0">
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />
      
      <AnimatePresence mode="popLayout">
        {orders.map((order) => {
          if (!order || !order.id) return null; // הגנה נוספת לכל אובייקט
          const isExpanded = expandedId === order.id;

          return (
            <motion.div
              layout
              key={order.id}
              className={`relative rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden shadow-sm bg-white
                ${order.has_new_note ? 'border-emerald-400 shadow-emerald-100' : 'border-slate-100'}`}
            >
              {/* Header */}
              <div className="p-5 md:p-8 flex items-center gap-4 relative z-10">
                
                {/* ID מזהה */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-slate-900 text-blue-400 flex flex-col items-center justify-center font-black italic shrink-0">
                  <span className="text-[10px] opacity-40 font-sans tracking-widest">ID</span>
                  <span className="text-xl md:text-2xl">#{order.order_number || '000'}</span>
                </div>

                {/* תוכן מרכזי */}
                <div className="flex-1 min-w-0 text-right">
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter truncate italic uppercase leading-none">
                    {order.product_name || "הזמנה ללא שם"}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button 
                      onClick={(e) => handleAction(e, () => setEditingId(editingId === order.id ? null : order.id))}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-bold text-[10px] hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 size={12} /> ערוך לקוח
                    </button>
                    <span className="text-slate-400 font-bold text-[11px] italic truncate max-w-[150px]">
                      {order.client_info || "אין פרטי לקוח"}
                    </span>
                  </div>
                </div>

                {/* כפתורי הפעולה */}
                <div className="flex gap-2 shrink-0 relative z-20">
                  <button 
                    onClick={(e) => handleAction(e, () => setExpandedId(isExpanded ? null : order.id))}
                    className={`p-4 md:p-5 rounded-3xl transition-all duration-300 shadow-sm
                      ${isExpanded ? 'bg-slate-900 text-white scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Eye size={24} strokeWidth={2.5} />
                  </button>

                  <button 
                    onClick={(e) => handleAction(e, () => onUpdate(order.id, { status: 'completed' }))}
                    className="p-4 md:p-5 rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-200 active:scale-90 transition-all hover:bg-orange-600"
                  >
                    <CheckCircle size={24} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* פאנל עריכה מהירה */}
              <AnimatePresence>
                {editingId === order.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-slate-50 border-t border-slate-100 overflow-hidden">
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        className="p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        placeholder="שם לקוח" 
                        defaultValue={order.client_info}
                        onBlur={(e) => onUpdate(order.id, { client_info: e.target.value })}
                      />
                      <input 
                        className="p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        placeholder="מספר קומקס" 
                        defaultValue={order.comax_number}
                        onBlur={(e) => onUpdate(order.id, { comax_number: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* תוכן מורחב */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="p-6 md:p-8 border-t-2 border-slate-50 bg-white overflow-hidden"
                  >
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6">
                      <div className="text-3xl font-black text-slate-800 italic uppercase leading-tight whitespace-pre-line">
                        {order.warehouse || "אין פירוט מחסן"}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => window.print()} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                        <Printer size={20}/> הדפסה
                      </button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(order.warehouse || '')}`)} className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                        <Share2 size={20}/> WhatsApp
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
