'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Bot, User, Zap, Database, 
  Sparkles, ShieldCheck, Edit3, Image as ImageIcon, 
  Video, Save, X, Smartphone, Monitor, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanStudioV3() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('לוחות גבס');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const scrollRef = useRef<any>(null);

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
      category: activeTab
    }, { onConflict: 'sku' });

    if (!error) {
      setIsModalOpen(false);
      fetchItems();
    }
  };

  return (
    <div className="h-screen bg-[#FDFDFD] flex flex-col overflow-hidden text-slate-900 font-sans" dir="rtl">
      <Head><title>SABAN | Elite Studio 2026</title></Head>

      {/* Header יוקרתי */}
      <header className="h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center px-8 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200"><Zap size={28} className="text-white fill-white"/></div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Saban <span className="text-blue-600 font-black">Studio</span></h1>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          {['לוחות גבס', 'חומרי מחצבה'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === t ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400'}`}>
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
        
        {/* צד ימין: ניהול מלאי - טקסט ענק וגלילה חלקה */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-4xl font-black text-slate-800 italic">ניהול <span className="text-blue-600">הזרקה</span></h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time DB Control</p>
              </div>
              <button onClick={() => openEditor()} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black text-lg shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3 active:scale-95">
                <PlusIcon/> מוצר חדש
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 pb-20">
              {items.map(item => (
                <motion.div 
                  layout key={item.id} 
                  className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-8">
                    <div className="relative">
                       <img src={item.image_url || '/no-image.png'} className="w-24 h-24 rounded-[2rem] object-cover shadow-md border-4 border-slate-50" />
                       <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">{item.sku}</div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 mb-2">{item.product_name}</h3>
                      <div className="flex gap-6">
                        <Badge icon={<Database size={14}/>} label="מחיר" value={`₪${item.price}`} />
                        <Badge icon={<Sparkles size={14}/>} label="ייבוש" value={item.dry_time} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => openEditor(item)} className="p-5 bg-slate-50 rounded-[1.5rem] text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                    <Edit3 size={24} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </main>

        {/* צד שמאל: סימולטור לקוח (Live Simulator) */}
        <aside className={`bg-white border-r border-slate-100 flex flex-col items-center justify-center transition-all duration-500 shadow-2xl z-40 ${viewMode === 'desktop' ? 'w-[500px]' : 'w-0 opacity-0 pointer-events-none'}`}>
          <div className="w-[320px] h-[650px] bg-slate-900 rounded-[3.5rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-slate-800 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-3xl z-50"></div>
            
            <div className="bg-[#E5DDD5] h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] p-4 pt-8 text-white flex items-center gap-3">
                <ChevronLeft size={20}/>
                <img src={SABAN_LOGO} className="w-10 h-10 rounded-full border border-white/20" />
                <div>
                  <p className="text-sm font-black leading-none">סבן חומרי בניין</p>
                  <p className="text-[10px] opacity-70">מחובר כעת</p>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                <div className="bg-white p-3 rounded-xl rounded-tr-none shadow-sm max-w-[80%] mr-auto text-xs font-bold">היי ראמי, תוכל לשלוח לי מפרט של {editingProduct?.product_name || 'המוצר'}?</div>
                
                <AnimatePresence>
                {editingProduct?.product_name && (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#DCF8C6] p-2 rounded-xl rounded-tl-none shadow-md ml-auto max-w-[90%]">
                    {editingProduct.image_url && <img src={editingProduct.image_url} className="w-full h-40 object-cover rounded-lg mb-2" />}
                    <p className="text-[13px] font-black mb-1">{editingProduct.product_name}</p>
                    <p className="text-[11px] text-slate-600 mb-2 leading-tight">{editingProduct.description}</p>
                    <div className="grid grid-cols-2 gap-1 border-t border-black/5 pt-2">
                       <div className="text-[9px] font-black text-green-800 italic">ייבוש: {editingProduct.dry_time}</div>
                       <div className="text-[9px] font-black text-green-800 italic">מחיר: ₪{editingProduct.price}</div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Live Simulator v3.2</p>
        </aside>
      </div>

      {/* Modal עריכה - טקסט גדול והזרקה דינמית */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/60 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-[4rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-slate-100 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-black italic tracking-tighter">עריכת <span className="text-blue-600">סטודיו</span></h2>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-full hover:rotate-90 transition-all"><X size={32}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <BigField label="שם המוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <BigField label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                    <BigField label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                  </div>
                  <BigField label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
                </div>
                <div className="space-y-8">
                  <BigField label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                  <BigField label="לינק לתמונה" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-3 block">מפרט טכני ללקוח</label>
                    <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] h-32 outline-none font-bold text-lg focus:ring-4 focus:ring-blue-500/10 transition-all" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                  </div>
                </div>
              </div>

              <button onClick={saveProduct} className="w-full mt-12 bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 active:scale-95 transition-all">
                <Save size={28}/> שמור והזרק ל-DB
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { background: #FDFDFD; }
      `}</style>
    </div>
  );
}

function BigField({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">{label}</label>
      <input type={type} className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none font-black text-xl text-slate-800 focus:border-blue-500/20 focus:bg-white transition-all shadow-inner" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function Badge({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
      <span className="text-slate-400">{icon}</span>
      <span className="text-[10px] font-black text-slate-400 uppercase mr-1">{label}:</span>
      <span className="text-sm font-black text-blue-600 italic">{value || '-'}</span>
    </div>
  );
}

function PlusIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
