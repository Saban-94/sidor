'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, User, Phone, Briefcase, Trash2, Edit3, Sparkles, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserManagementStudio() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', phone: '', relation: 'לקוח ח.סבן', brain_notes: '', image_url: '' });

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*');
    if (data) setCustomers(data);
  }

  const createMagicLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const link = `https://sidor.vercel.app/chat/${cleanPhone}`;
    navigator.clipboard.writeText(link);
    alert(`לינק הועתק: ${link}\nשתף לווטסאפ של הלקוח!`);
  };

  return (
    <div className="p-10 bg-white min-h-screen text-slate-900 font-sans" dir="rtl">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black uppercase italic italic text-emerald-500">User <span className="text-slate-900">Manager</span></h1>
        <button onClick={() => {/* לוגיקת שמירה */}} className="bg-emerald-500 text-black px-10 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2">
          <Plus size={20}/> הוסף לקוח VIP
        </button>
      </header>

      {/* טבלה דינאמית בעיצוב בהיר ונקי */}
      <div className="grid grid-cols-1 gap-6">
        {customers.map((c) => (
          <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] flex items-center justify-between hover:shadow-xl transition-all group">
            <div className="flex items-center gap-6">
              <img src={c.image_url || 'https://iili.io/qstzfVf.jpg'} className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" />
              <div>
                <h3 className="text-xl font-black text-slate-900">{c.name}</h3>
                <p className="text-emerald-500 font-bold text-sm">{c.phone} | {c.relation}</p>
                <div className="mt-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 max-w-md">
                   <p className="text-[11px] text-slate-600 leading-relaxed italic"><Sparkles size={12} className="inline ml-1"/> {c.brain_notes || "אין הנחיות למוח..."}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => createMagicLink(c.phone)} className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg hover:bg-blue-600 transition-colors"><Share2 size={20}/></button>
              <button className="p-4 bg-slate-200 text-slate-700 rounded-2xl shadow-lg hover:bg-slate-300 transition-colors"><Edit3 size={20}/></button>
              <button className="p-4 bg-rose-100 text-rose-500 rounded-2xl shadow-lg hover:bg-rose-500 hover:text-white transition-colors"><Trash2 size={20}/></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
