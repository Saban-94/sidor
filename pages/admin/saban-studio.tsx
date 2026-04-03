import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Zap, Database, Plus, Search, Loader2, X, Save, Edit2, Droplets, Package } from 'lucide-react';

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
      alert("⚠️ שגיאה: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async () => {
    const { error } = await supabase
      .from('brain_inventory')
      .upsert({
        ...editingProduct,
        category: activeTab,
        search_text: editingProduct.product_name?.toLowerCase()
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
    <div className="h-screen flex flex-col bg-[#0f172a] text-slate-100 overflow-hidden" dir="rtl">
      {/* Header קבוע */}
      <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="text-blue-500 fill-blue-500" size={24} />
            <h1 className="text-xl font-black italic tracking-tighter uppercase text-white">Saban Studio</h1>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
            {['לוחות גבס', 'חומרי מחצבה'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* חיפוש מהיר */}
      <section className="p-4 bg-slate-900/40 border-b border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <input 
              className="w-full p-4 pr-11 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-sm text-white"
              placeholder={`צוד או הזן ${activeTab}...`}
              value={huntQuery}
              onChange={(e) => setHuntQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && autoInject()}
            />
            <Search className="absolute right-4 top-4.5 text-slate-500" size={18} />
          </div>
          <button onClick={autoInject} className="bg-blue-600 p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>}
          </button>
        </div>
      </section>

      {/* גוף הסטודיו */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-xl group hover:border-blue-500 transition-all">
              <div className="h-40 relative">
                <img src={item.image_url || '/no-image.png'} className="w-full h-full object-cover" alt="" />
                <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{item.sku}</div>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4">
                <h3 className="font-black text-white text-lg leading-tight line-clamp-1">{item.product_name}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 p-2 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 block font-black mb-1 italic tracking-widest uppercase">ייבוש</span>
                    <span className="text-[10px] font-bold text-blue-400">{item.dry_time || '-'}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 block font-black mb-1 italic tracking-widest uppercase">כיסוי</span>
                    <span className="text-[11px] font-bold text-emerald-400">{item.coverage_rate || '-'}</span>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xl font-black italic text-white">₪{item.price}</span>
                  <button onClick={() => {setEditingProduct(item); setIsModalOpen(true);}} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                    <Edit2 size={20}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Editor Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 animate-in slide-in-from-bottom">
          <header className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-black italic tracking-tighter">ניהול מוצר סטודיו</h2>
            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <Field label="שם מוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              <Field label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              <Field label="כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
            </div>
            <textarea 
              className="w-full p-4 bg-slate-800 rounded-[1.5rem] outline-none font-bold text-white min-h-[120px]"
              value={editingProduct.description}
              onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
              placeholder="מפרט טכני..."
            />
          </div>
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <button onClick={saveToDB} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-blue-600/20">
              <Save size={24}/> שמור הזרקה
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        body { margin: 0; background: #0f172a; overflow: hidden; }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="w-full">
      <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-widest italic">{label}</label>
      <input 
        type={type} 
        className="w-full p-4 bg-slate-800 border-none rounded-2xl outline-none font-black text-sm text-white focus:ring-2 focus:ring-blue-500 transition-all" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
