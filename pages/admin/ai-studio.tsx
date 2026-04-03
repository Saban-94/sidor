'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, Zap, Database, 
  Sparkles, ShieldCheck, Edit3, Image as ImageIcon, 
  Video, Save, X, Smartphone, Monitor, ChevronLeft, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

export default function SabanStudioV3() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('לוחות גבס');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => { fetchItems(); }, [activeTab]);

  const fetchItems = async () => {
    const { data } = await supabase.from('brain_inventory').select('*').eq('category', activeTab).order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const openEditor = (item?: any) => {
    setEditingProduct(item || {
      product_name: '', price: 0, dry_time: '', coverage_rate: '', 
      image_url: '', video_url: '', description: '', sku: `SBN-${Date.now().toString().slice(-5)}`
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
      alert(error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#FDFDFD] overflow-hidden text-slate-900 font-sans" dir="rtl">
      <Head><title>SABAN | Elite Studio 2026</title></Head>

      {/* Header בהיר ויוקרתי */}
      <header className="h-20 bg-white border-b border-slate-100 flex justify-between items-center px-8 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
            <Zap size={28} className="text-white fill-white"/>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Saban <span className="text-blue-600">Studio</span></h1>
        </div>

        <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          {['לוחות גבס', 'חומרי מחצבה'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === t ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setViewMode('desktop')} className={`p-3 rounded-xl transition-all ${viewMode === 'desktop' ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}><Monitor size={22}/></button>
          <button onClick={() => setViewMode('mobile')} className={`p-3 rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}><Smartphone size={22}/></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* אזור ניהול המלאי */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-5xl font-black text-slate-800 italic tracking-tighter">ניהול <span className="text-blue-600">המלאי</span></h2>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> סנכרון זמן אמת פעיל
                </p>
              </div>
              <button onClick={() => openEditor()} className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3 active:scale-95">
                <Plus size={24} strokeWidth={4}/> הזרקת מוצר
              </button>
            </div>

            {/* רשימת כרטיסים */}
            <div className="grid grid-cols-1 gap-6 pb-24">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div 
                    layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    key={item.id} 
                    className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all flex flex-col md:flex-row items-center justify-between group gap-6"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right w-full">
                      <div className="relative shrink-0">
                         <img src={item.image_url || '/no-image.png'} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-xl border-4 border-slate-50" />
                         <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-lg italic">#{item.sku}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">{item.product_name}</h3>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                          <Badge label="מחיר שוק" value={`₪${item.price}`} color="blue" />
                          <Badge label="ייבוש" value={item.dry_time || 'לפי יצרן'} color="slate" />
                          <Badge label="כיסוי" value={item.coverage_rate || 'משתנה'} color="slate" />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => openEditor(item)} className="p-6 bg-slate-50 rounded-[2rem] text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all active:scale-90 shrink-0">
                      <Edit3 size={32} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* סימולטור לקוח - WhatsApp Style */}
        <aside className={`bg-white border-r border-slate-100 flex flex-col items-center justify-center transition-all duration-700 shadow-2xl z-40 ${viewMode === 'desktop' ? 'w-[550px]' : 'w-0 opacity-0 pointer-events-none'}`}>
          <div className="w-[340px] h-[680px] bg-slate-900 rounded-[4rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[10px] border-slate-800 relative scale-95">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-800 rounded-b-3xl z-50"></div>
            
            <div className="bg-[#E5DDD5] h-full w-full rounded-[3.2rem] overflow-hidden flex flex-col shadow-inner">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] p-5 pt-10 text-white flex items-center gap-3">
                <ChevronLeft size={24}/>
                <img src={SABAN_LOGO} className="w-11 h-11 rounded-full border-2 border-white/20 shadow-md" />
                <div>
                  <p className="text-base font-black leading-none">סבן חומרי בניין</p>
                  <p className="text-[11px] opacity-70 font-bold">מחובר כעת</p>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[85%] mr-auto text-[13px] font-black leading-relaxed">
                  היי סבן, יש לכם מפרט ל{editingProduct?.product_name || 'מוצר הזה'}? שלח לי איך זה נראה.
                </div>
                
                <AnimatePresence mode="wait">
                  {editingProduct?.product_name && (
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-[#DCF8C6] p-2 rounded-2xl rounded-tl-none shadow-lg ml-auto max-w-[90%] border border-black/5 overflow-hidden">
                      {editingProduct.image_url ? (
                        <img src={editingProduct.image_url} className="w-full h-44 object-cover rounded-xl mb-3 shadow-sm" />
                      ) : (
                        <div className="w-full h-44 bg-green-100 rounded-xl mb-3 flex items-center justify-center text-green-300"><ImageIcon size={40}/></div>
                      )}
                      <div className="px-2 pb-2">
                        <p className="text-[15px] font-black text-slate-800 mb-1 leading-tight">{editingProduct.product_name}</p>
                        <p className="text-[11px] text-slate-600 font-bold mb-3 leading-snug line-clamp-3 italic">"{editingProduct.description}"</p>
                        <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-3">
                           <div className="bg-white/40 p-2 rounded-lg text-center">
                              <p className="text-[9px] font-black text-green-900/40 uppercase">זמן ייבוש</p>
                              <p className="text-[10px] font-black text-green-800">{editingProduct.dry_time || '-'}</p>
                           </div>
                           <div className="bg-white/40 p-2 rounded-lg text-center">
                              <p className="text-[9px] font-black text-green-900/40 uppercase">הצעה שלנו</p>
                              <p className="text-[12px] font-black text-green-800 italic">₪{editingProduct.price}</p>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <p className="mt-6 text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Live Simulator Node</p>
        </aside>
      </div>

      {/* Modal עריכה - Full Control */}
      <AnimatePresence>
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-xl">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white w-full max-w-5xl rounded-[4rem] p-8 md:p-14 shadow-[0_50px_100px_rgba(0,0,0,0.2)] border border-white overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-14 border-b border-slate-50 pb-8">
                <div>
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase">ניהול <span className="text-blue-600">מוצר</span></h2>
                  <p className="text-sm font-black text-slate-400 mt-2">הזנה דינמית של מפרט טכני ומדיה</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-5 bg-slate-50 rounded-full hover:rotate-90 transition-all text-slate-400 hover:text-red-500"><X size={36}/></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <BigField label="שם המוצר המלא" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                  <div className="grid grid-cols-2 gap-6">
                    <BigField label="מחיר ללקוח (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                    <BigField label="מק״ט ייחודי" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <BigField label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
                    <BigField label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                  </div>
                </div>
                
                <div className="space-y-10">
                  <BigField label="לינק לתמונת מוצר (HQ)" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                  <BigField label="לינק לסרטון הדגמה (MP4/YT)" value={editingProduct.video_url} onChange={v => setEditingProduct({...editingProduct, video_url: v})} />
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-4 block tracking-widest italic">תיאור ומפרט טכני לסימולטור</label>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] h-44 outline-none font-black text-xl text-slate-800 focus:border-blue-500/20 focus:bg-white transition-all shadow-inner" 
                      value={editingProduct.description} 
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      placeholder="כתוב כאן איך להציג את המוצר ללקוח..."
                    />
                  </div>
                </div>
              </div>

              <button onClick={saveProduct} className="w-full mt-16 bg-blue-600 text-white py-8 rounded-[3rem] font-black text-3xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-5 active:scale-95 transition-all hover:bg-blue-700">
                <Save size={36} strokeWidth={3}/> שמור והזרק ל-DB
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;400;700;800&display=swap');
        body { font-family: 'Assistant', sans-serif; background: #FDFDFD; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}

function BigField({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="w-full">
      <label className="text-xs font-black text-slate-400 uppercase mb-4 block tracking-widest italic">{label}</label>
      <input 
        type={type} 
        className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none font-black text-2xl text-slate-800 focus:border-blue-500/20 focus:bg-white transition-all shadow-inner" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}

function Badge({ label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100'
  };
  return (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${colors[color]} shadow-sm`}>
      <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">{label}:</span>
      <span className="text-base font-black italic">{value || '-'}</span>
    </div>
  );
}
