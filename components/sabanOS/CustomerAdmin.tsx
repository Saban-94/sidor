'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Link as LinkIcon, Copy, Check, 
  ExternalLink, History, Package, MapPin, Plus, UserCheck 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Customer {
  clientId: string;
  user_name: string;
  accumulated_knowledge: string;
  updated_at: string;
}

export default function CustomerAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // שליפת לקוחות וזיכרון מהטבלאות
  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase
        .from('customer_memory')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) setCustomers(data);
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  const copyLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const link = `https://sidor.vercel.app/chat2/${cleanPhone}`;
    navigator.clipboard.writeText(link);
    setCopiedId(phone);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCustomers = customers.filter(c => 
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.clientId.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-4 sm:p-8" dir="rtl">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Users className="text-emerald-500 w-8 h-8" />
            ניהול לקוחות - רויטל AI
          </h1>
          <p className="text-slate-400 text-sm mt-1">ניהול זיכרון, פרויקטים ולינקי קסם אישיים</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="חפש לקוח או טלפון..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-10 pl-4 outline-none focus:border-emerald-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid הלקוחות */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 opacity-50">טוען בריכת מידע...</div>
        ) : filteredCustomers.map((customer) => (
          <div 
            key={customer.clientId}
            className="glass-effect-strong rounded-3xl border border-white/10 p-6 flex flex-col hover:border-emerald-500/30 transition-all group"
          >
            {/* פרטי לקוח */}
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-2xl">
                <UserCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <button 
                onClick={() => copyLink(customer.clientId)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all text-xs font-bold"
              >
                {copiedId === customer.clientId ? <Check className="w-3 h-3 text-emerald-500" /> : <LinkIcon className="w-3 h-3" />}
                {copiedId === customer.clientId ? 'הועתק!' : 'לינק קסם'}
              </button>
            </div>

            <h3 className="text-xl font-bold mb-1">{customer.user_name || 'לקוח ללא שם'}</h3>
            <p className="text-slate-400 text-sm mb-4 font-mono">{customer.clientId}</p>

            {/* זיכרון צבור */}
            <div className="flex-1 bg-black/20 rounded-2xl p-4 mb-4 text-xs text-slate-300 leading-relaxed border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold uppercase tracking-wider">
                <History className="w-3 h-3" />
                זיכרון רויטל:
              </div>
              <p className="line-clamp-4 italic">
                {customer.accumulated_knowledge || 'אין זיכרון צבור עדיין...'}
              </p>
            </div>

            {/* כפתורי פעולה */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <a 
                href={`/chat2/${customer.clientId}`}
                target="_blank"
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-xs font-black transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                פתח צ'אט
              </a>
              <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-black transition-all border border-white/5">
                <Package className="w-3 h-3" />
                היסטוריה
              </button>
            </div>
          </div>
        ))}

        {/* כרטיס הוספה חדש */}
        <div className="rounded-3xl border-2 border-dashed border-white/10 p-6 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group">
          <div className="bg-white/5 p-4 rounded-full mb-4 group-hover:bg-emerald-500/20 transition-all">
            <Plus className="w-8 h-8 text-slate-500 group-hover:text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-400 group-hover:text-white transition-all">הקמת לקוח חדש</h3>
          <p className="text-xs text-slate-500 mt-1">יצירת זהות ולינק קסם אישי</p>
        </div>
      </div>
    </div>
  );
}
