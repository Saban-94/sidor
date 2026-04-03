'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Zap, Edit3, Trash2, Image as ImageIcon, 
  Video, Save, X, Plus, Package, Droplets, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanStudioLight() {
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('לוחות גבס');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchItems(); }, [activeTab]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('brain_inventory')
      .select('*')
      .eq('category', activeTab)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const openEditor = (item?: any) => {
    setEditingProduct(item || {
      product_name: '', price: 0, dry_time: '', coverage_rate: '', 
      image_url: '', video_url: '', description: '', sku: `SBN-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsModalOpen(true);
  };

  const saveProduct = async () => {
    const { error } = await supabase.from('brain_inventory').upsert({
      ...editingProduct,
      category: activeTab,
      search_text: editingProduct.product_name?.toLowerCase()
    }, { onConflict: 'sku' });

    if (!error) {
      setIsModalOpen(false);
      fetchItems();
    } else {
      alert("שגיאה בשמירה: " + error.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('בוס, בטוח שאתה רוצה למחוק את המוצר הזה מהמוח?')) {
      const { error } = await supabase.from('brain_inventory').delete().eq('id', id);
      if (!error) fetchItems();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-slate-900" dir="rtl">
      <Head><title>SABAN STUDIO | ניהול מלאי בהיר</title></Head>

      {/* Header יוקרתי */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <Zap size={32} className="text-white fill-white"/>
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-800">SABAN <span className="text-blue-600">STUDIO</span></h1>
          </div>

          <div className="flex bg-slate-100 p-2 rounded-[2rem] gap-2">
            {['לוחות גבס', 'חומרי מחצבה'].map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`px-10 py-3 rounded-[1.5rem] text-lg font-black transition-all ${activeTab === t ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <button onClick={() => openEditor()} className="bg-slate-900 text-white px-10 py-4 rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3">
            <Plus size={24} strokeWidth={4}/> הוספה
          </button>
        </div>
      </header>

      {/* רשימת מוצרים - טקסט ענק ועיצוב נקי */}
      <main className="p-8 md:p-12 max-w-6xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 gap-10 pb-20">
          {items.length === 0 && (
            <div className="text-center py-20 opacity-20">
              <Package size={80} className="mx-auto mb-4"/>
              <h2 className="text-2xl font-black italic">אין מוצרים בקטגוריה הזו</h2>
            </div>
          )}
          {items.map(item => (
            <motion.div 
              layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              key={item.id} 
              className="bg-white border-2 border-slate-50 p-8 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all flex flex-col md:flex-row items-center gap-10 group"
            >
              {/* תמונה גדולה */}
              <div className="relative shrink-0">
                 <img src={item.image_url || '/no-image.png'} className="w-48 h-48 rounded-[3rem] object-cover shadow-2xl border-4 border-white transition-transform group-hover:scale-105" />
                 <div className="absolute -top-4 -right-4 bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-2xl shadow-lg italic">#{item.sku}</div>
              </div>

              {/* נתוני מוצר */}
              <div className="flex-1 w-full text-center md:text-right">
                <h3 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">{item.product_name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50 flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">מחיר שוק</span>
                    <span className="text-3xl font-black text-blue-700 italic">₪{item.price}</span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Droplets size={12}/> ייבוש</span>
                    <span className="text-xl font-black text-slate-700">{item.dry_time || '-'}</span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Package size={12}/> כיסוי</span>
                    <span className="text-xl font-black text-slate-700">{item.coverage_rate || '-'}</span>
                  </div>
                </div>
              </div>

              {/* כפתורי פעולה */}
              <div className="flex flex-row md:flex-col gap-4">
                <button onClick={() => openEditor(item)} className="p-6 bg-slate-50 rounded-[2rem] text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90">
                  <Edit3 size={32} />
                </button>
                <button onClick={() => deleteProduct(item.id)} className="p-6 bg-slate-50 rounded-[2rem] text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90">
                  <Trash2 size={32} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Modal עריכה מלא */}
      <AnimatePresence>
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-5xl rounded-[4rem] p-10 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-slate-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-12 border-b pb-8">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-slate-800">ניהול <span className="text-blue-600">מוצר</span></h2>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={36}/></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-right">
                <div className="space-y-8">
                  <BigInput label="שם המוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                  <div className="grid grid-cols-2 gap-6">
                    <BigInput label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                    <BigInput label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <BigInput label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
                    <BigInput label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                  </div>
                </div>

                <div className="space-y-8">
                  <BigInput label="לינק לתמונה" icon={<ImageIcon size={20}/>} value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                  <BigInput label="לינק לוידאו" icon={<Video size={20}/>} value={editingProduct.video_url} onChange={v => setEditingProduct({...editingProduct, video_url: v})} />
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest italic">תיאור ומפרט טכני</label>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] h-48 outline-none font-bold text-xl text-slate-800 focus:border-blue-500/20 focus:bg-white transition-all shadow-inner" 
                      value={editingProduct.description} 
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      placeholder="הכנס פרטים טכניים..."
                    />
                  </div>
                </div>
              </div>

              <button onClick={saveProduct} className="w-full mt-16 bg-blue-600 text-white py-8 rounded-[3rem] font-black text-3xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-5 hover:bg-blue-700 transition-all active:scale-95">
                <Save size={36} strokeWidth={3}/> שמור ועדכן מוצר
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        body { background: #FDFDFD; overflow: hidden; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}

function BigInput({ label, value, onChange, type = "text", icon }: any) {
  return (
    <div className="w-full">
      <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest italic flex items-center gap-2">
        {icon} {label}
      </label>
      <input 
        type={type} 
        className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none font-black text-2xl text-slate-800 focus:border-blue-500/20 focus:bg-white transition-all shadow-inner" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
