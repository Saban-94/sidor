'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Zap, Edit3, Image as ImageIcon, 
  Video, Save, X, Plus, Package, Droplets, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanStudioFinal() {
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('לוחות גבס');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900" dir="rtl">
      <Head><title>SABAN STUDIO | ניהול מלאי חכם</title></Head>

      {/* Header יוקרתי ובהיר */}
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

          <button onClick={() => openEditor()} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black text-lg shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3">
            <Plus size={24} strokeWidth={3}/> הוסף מוצר
          </button>
        </div>
      </header>

      {/* רשימת מוצרים בכרטיסים ענקיים */}
      <main className="p-8 md:p-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 gap-8 pb-20">
          {items.map(item => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              key={item.id} 
              className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all flex flex-col md:flex-row items-center gap-10 group"
            >
              {/* תמונה גדולה */}
              <div className="relative shrink-0">
                 <img src={item.image_url || '/no-image.png'} className="w-48 h-48 rounded-[3rem] object-cover shadow-xl border-4 border-slate-50 transition-transform group-hover:scale-105" />
                 <div className="absolute -top-4 -right-4 bg-blue-600 text-white text-sm font-black px-4 py-2 rounded-2xl shadow-lg italic">#{item.sku}</div>
              </div>

              {/* נתוני מוצר בכתב גדול */}
              <div className="flex-1 w-full text-center md:text-right">
                <h3 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">{item.product_name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex flex-col">
                    <span className="text-xs font-black text-blue-400 uppercase mb-1">מחיר שוק</span>
                    <span className="text-2xl font-black text-blue-700 italic">₪{item.price}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col text-center">
                    <span className="text-xs font-black text-slate-400 uppercase mb-1">ייבוש</span>
                    <span className="text-xl font-black text-slate-700">{item.dry_time || '-'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col text-center">
                    <span className="text-xs font-black text-slate-400 uppercase mb-1">כיסוי</span>
                    <span className="text-xl font-black text-slate-700">{item.coverage_rate || '-'}</span>
                  </div>
                </div>
              </div>

              {/* כפתור עריכה ענק */}
              <button onClick={() => openEditor(item)} className="p-8 bg-slate-50 rounded-[2.5rem] text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all active:scale-90">
                <Edit3 size={40} />
              </button>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Modal עריכה מלא - Light & Professional */}
      <AnimatePresence>
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-5xl rounded-[4rem] p-10 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-slate-200 overflow-y-auto max-h-[95vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-12 border-b pb-8">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-slate-800">ניהול <span className="text-blue-600">מוצר</span></h2>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={36}/></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                      className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] h-48 outline-none font-bold text-xl text-slate-800 focus:border-blue-500/20 focus:bg-white transition-all" 
                      value={editingProduct.description} 
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      placeholder="הכנס פרטים נוספים על המוצר..."
                    />
                  </div>
                </div>
              </div>

              <button onClick={saveProduct} className="w-full mt-16 bg-blue-600 text-white py-8 rounded-[3rem] font-black text-3xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:bg-blue-700 transition-all">
                <Save size={32}/> שמור ועדכן מלאי
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        body { background: #F8FAFC; }
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
