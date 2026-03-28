'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, User, Phone, Briefcase, Trash2, Edit3, 
  Sparkles, Share2, Search, Languages, 
  UserPlus, ShieldCheck, MessageSquare, ExternalLink,
  MoreVertical, Filter, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManagementStudio() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setCustomers(data);
    } catch (e) {
      console.error("Error fetching customers:", e);
    }
    setLoading(false);
  }

  const createMagicLink = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const link = `https://sidor.vercel.app/chat/${cleanPhone}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      alert(`✅ לינק הקסם הועתק ללוח!\nניתן לשלוח עכשיו בוואטסאפ ללקוח.`);
    } else {
      alert(`הלינק: ${link}`);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name?.toLowerCase().includes(search.toLowerCase())) || 
    (c.phone?.includes(search))
  );

  return (
    <div className="p-4 md:p-10 bg-[#fbfcfd] min-h-screen text-slate-900 font-sans selection:bg-emerald-100" dir="rtl">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <UserPlus className="text-black" size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">
              User <span className="text-emerald-500">Studio</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              ניהול לקוחות VIP וסנכרון מוח AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-96 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="חפש לקוח, טלפון או פרויקט..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-[1.2rem] py-4 pr-12 pl-4 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-bold text-sm shadow-sm"
            />
          </div>
          <button className="bg-white border border-slate-200 p-4 rounded-[1.2rem] shadow-sm hover:bg-slate-50 transition-all text-slate-500">
            <Filter size={22} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={20} />
          </div>
          <p className="mt-6 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Syncing Database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredCustomers.map((c, index) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all group relative overflow-hidden"
              >
                {/* VIP Side Highlight */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* User Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-inner bg-slate-50 border-2 border-white group-hover:scale-105 transition-transform duration-500">
                      <img 
                        src={c.image_url || 'https://iili.io/qstzfVf.jpg'} 
                        className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" 
                        alt={c.name}
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-emerald-400 p-2 rounded-2xl border-2 border-white shadow-lg">
                      <ShieldCheck size={16} />
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{c.name || 'אורח חדש'}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                            {c.relation || 'לקוח ח.סבן'}
                          </span>
                          <div className="flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-50 px-3 py-1 rounded-full">
                            <Phone size={12} />
                            {c.phone}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => createMagicLink(c.phone)}
                          className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                          title="שתף לינק קסם"
                        >
                          <Share2 size={20} />
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                          <Edit3 size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Brain Intelligence Box */}
                    <div className="bg-[#fcfdfe] border border-slate-100 p-5 rounded-[1.8rem] relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Sparkles size={16} className="animate-pulse" />
                          <span className="text-[11px] font-black uppercase tracking-[0.1em]">AI Brain Intelligence</span>
                        </div>
                        <Languages size={14} className="text-slate-300" />
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-relaxed font-medium italic min-h-[40px]">
                        {c.brain_notes || "המוח טרם למד את העדפות הלקוח. לחץ על עריכה כדי להזין תחביבים, שפה וסגנון מענה..."}
                      </p>
                      
                      {/* Stats Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                            <MessageSquare size={14} className="text-emerald-500" /> 
                            {c.total_chats || 0} Chats
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                            <ExternalLink size={14} /> 
                            {new Date(c.created_at).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                        <button className="text-[10px] font-black text-emerald-600 underline decoration-2 underline-offset-4 hover:text-emerald-700">
                          צפה בשיחה
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Magic Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-10 left-10 w-20 h-20 bg-slate-900 text-emerald-500 rounded-[2rem] shadow-2xl flex items-center justify-center border-4 border-white z-50 group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
      </motion.button>
    </div>
  );
}
