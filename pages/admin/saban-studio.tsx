import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Zap, Database, Plus, Search, ExternalLink, Package, Droplets, Loader2, X, Save, Edit2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SabanStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntQuery, setHuntQuery] = useState('');
  const [activeTab, setActiveTab] = useState('לוחות גבס');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStudioData();
  }, [activeTab]);

  const fetchStudioData = async () => {
    const { data } = await supabase
      .from('brain_inventory')
      .select('*')
      .eq('category', activeTab)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const openManualEntry = () => {
    setEditingProduct({
      product_name: huntQuery || '',
      description: '',
      image_url: '',
      dry_time: '',
      coverage_rate: '',
      application_method: '',
      sku: `SBN-${Math.floor(Math.random() * 90000 + 10000)}`,
      price: 0,
      category: activeTab
    });
    setIsModalOpen(true);
  };

  const autoInject = async () => {
    if (!huntQuery) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: huntQuery, category: activeTab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditingProduct({ ...data, category: activeTab });
      setIsModalOpen(true);
      setHuntQuery('');
    } catch (e: any) {
      alert("⚠️ שגיאת חיפוש: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async () => {
    const { error } = await supabase
      .from('brain_inventory')
      .upsert({
        ...editingProduct,
        category: activeTab
      }, { onConflict: 'sku' });

    if (!error) {
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchStudioData();
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-slate-100 overflow-hidden dir-rtl" dir="rtl">
      
      {/* Navbar קבועה */}
      <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-50 shadow-2xl">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="text-blue-500 fill-blue-500" size={24} />
            <h1 className="text-xl font-black italic tracking-tighter uppercase">Saban <span className="text-blue-500">Studio</span></h1>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
            {['לוחות גבס', 'חומרי מחצבה'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* שורת חיפוש + הזרקה ידנית */}
      <section className="p-4 bg-slate-900/40 border-b border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <input 
              className="w-full p-4 pr-11 bg-slate-800 border border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all shadow-inner"
              placeholder={`צוד או הקלד ${activeTab}...`}
              value={huntQuery}
              onChange={(e) => setHuntQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && autoInject()}
            />
            <Search className="absolute right-4 top-4.5 text-slate-500" size={18} />
          </div>
          <button onClick={autoInject} className="bg-blue-600 p-4 rounded-2xl shadow-lg active:scale-90 transition-transform">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>}
          </button>
          <button onClick={openManualEntry} className="bg-slate-700 p-4 rounded-2xl shadow-lg active:scale-90 transition-transform">
            <Plus size={20}/>
          </button>
        </div>
      </section>

      {/* רשימת המלאי - גלילה חלקה למובייל ומחשב */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl">
              <div className="h-40 relative">
                <img src={item.image_url || '/no-image.png'} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                  {item.sku}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-4">
                <h3 className="font-black text-white text-lg leading-tight line-clamp-1">{item.product_name}</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/30">
                    <span className="text-[8px] text-slate-500 block font-black uppercase italic mb-1">
                      <Droplets size={10} className="inline ml-1" /> ייבוש
                    </span>
                    <span className="text-[11px] font-bold text-blue-400">{item.dry_time || '-'}</span>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/30">
                    <span className="text-[8px] text-slate-500 block font-black uppercase italic mb-1">
                      <Package size={10} className="inline ml-1" /> כיסוי
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">{item.coverage_rate || '-'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-5 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-2xl font-black italic text-white">₪{item.price}</span>
                  <button onClick={() => {setEditingProduct(item); setIsModalOpen(true);}} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white active:scale-90 transition-all">
                    <Edit2 size={20}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* עריכה / הזרקה ידנית - מסך מלא במובייל */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 animate-in slide-in-from-bottom duration-300">
          <header className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black italic tracking-tighter">ניהול מוצר <span className="text-blue-500">Saban AI</span></h2>
            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <Field label="שם מוצר מלא" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
            
            <div className="grid grid-cols-2 gap-4">
              <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              <Field label="מק״ט ייחודי" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              <Field label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
            </div>

            <Field label="שיטת יישום" value={editingProduct.application_method} onChange={v => setEditingProduct({...editingProduct, application_method: v})} />
            <Field label="לינק לתמונת מוצר" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
            
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest italic">מפרט טכני ותיאור</label>
              <textarea 
                className="w-full p-5 bg-slate-800 border-none rounded-[1.5rem] outline-none font-bold text-sm text-white focus:ring-2 focus:ring-blue-500 min-h-[140px]"
                value={editingProduct.description}
                onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
            <button onClick={saveToDB} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-blue-600/20">
              <Save size={24}/> שמור והזרק למוח
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        body { margin: 0; padding: 0; height: 100vh; overflow: hidden; background: #0f172a; }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest italic">{label}</label>
      <input 
        type={type} 
        className="w-full p-4 bg-slate-800 border-none rounded-2xl outline-none font-black text-sm text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
