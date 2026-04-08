'use client';
import React from 'react';
import { Package, Clock, CheckCircle } from 'lucide-react';

export default function OrdersManager() {
  return (
    <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5">
      <div className="flex items-center gap-2 mb-6 text-emerald-500 font-bold">
        <Package size={20} />
        <h2>ניהול הזמנות SabanOS</h2>
      </div>
      <div className="text-slate-400 text-sm italic text-center py-10">
        המערכת מסנכרנת נתונים מול ה-Database בזמן אמת...
      </div>
    </div>
  );
}
