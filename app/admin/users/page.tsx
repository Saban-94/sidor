'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, User, Phone, Briefcase, Trash2, Edit3, 
  Sparkles, Share2, Search, languages, 
  UserPlus, ShieldCheck, MessageSquare, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManagementStudio() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  }

  const createMagicLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const link = `https://sidor.vercel.app/chat/${cleanPhone}`;
    navigator.clipboard.writeText(link);
    alert(`✅ לינק הקסם הועתק:\n${link}`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  );

  return (
    <div className="p-6 md:p-10 bg-[#f8fafc] min-h-screen text-slate-900 font-sans" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            User <span className="text-emerald-500">Studio</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">ניהול לקוחות VIP וסנכרון מוח AI</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="חיפוש לקוח או טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-12 pl-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm"
            />
          </div>
          <button className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all">
            <UserPlus size={22} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 font-black uppercase tracking-widest text-xs">טוען מאגר לקוחות...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredCustomers.map((c) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                {/* סטטוס VIP מובנה */}
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>

                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img 
                      src={c.image_url || 'https://iili.io/qstzfVf.jpg'} 
                      className="w-20 h-20 rounded-3xl object-cover shadow-lg border-2 border-slate-50" 
                    />
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-emerald-400 p-1.5 rounded-xl border-2 border-white">
                      <ShieldCheck size={14} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">{c.name || 'לקוח ללא שם'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg">
                            {c.relation || 'לקוח כללי'}
                          </span>
                          <span className="text-slate-400 font-bold text-xs">{c.phone}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => createMagicLink(c.phone)}
                          className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          title="העתק לינק קסם"
                        >
                          <Share2 size={18} />
                        </button>
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                          <Edit3 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Rich Brain Notes Section */}
                    <div className="mt-4 bg-[#fcfdfe] border border-slate-100 p-4 rounded-2xl relative group/note">
                      <div className="flex items-center gap-2 mb-2 text-emerald-600">
                        <Sparkles size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Brain Training Data</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium italic line-clamp-2">
                        {c.brain_notes || "המוח טרם למד את העדפות הלקוח. לחץ לעריכה..."}
                      </p>
                      
                      {/* Quick Stats */}
                      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <MessageSquare size={12} /> {c.total_chats || 0} שיחות
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <ExternalLink size={12} /> הצטרף ב-{new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fixed bottom-10 left-10 w-16 h-16 bg-emerald-500 text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <Plus size={32} />
      </button>
    </div>
  );
}
