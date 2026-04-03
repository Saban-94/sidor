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

  const openManualOrInject = (res?: any) => {
    setEditingProduct(res ? {
      product_name: res.title || res.product_name,
      description: res.description,
      image_url: res.image || res.image_url,
      dry_time: res.dry_time,
      coverage_rate: res.coverage_rate,
      application_method: res.application_method,
      sku: res.sku || `SBN-${Math.floor(Math.random() * 90000 + 10000)}`,
      price: res.price || 0,
      category: activeTab
    } : {
      product_name: '', description: '', image_url: '', dry_time: '', coverage_rate: '', application_method: '', sku: `SBN-${Math.floor(Math.random() * 90000 + 10000)}`, price: 0, category: activeTab
    });
    setIsModalOpen(true);
  };

  const autoInject = async (productName: string) => {
    if (!productName) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: productName, category: activeTab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // הזרקה אוטומטית ל-DB
      const { error } = await supabase
        .from('brain_inventory')
        .upsert({
          ...data,
          category: activeTab,
          stock_status: 'available'
        }, { onConflict: 'sku' });

      if (error) throw error;
      setHuntQuery('');
      fetchStudioData();
    } catch (e: any) {
      alert("⚠️ שגיאת הזרקה: " + e.message);
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
      <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Zap className="text-blue-500" size={28} />
            <h1 className="text-xl font-black italic tracking-tighter uppercase">Saban <span className="text-blue-500">Studio</span></h1>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 w-full md:w-auto">
            {['לוחות גבס', 'חומרי מחצבה'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[11px] font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* אזור פעולה מהירה */}
      <section className="p-4 bg-slate-900/50 border-b border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <input 
              className="w-full p-3 pr-10 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:border-blue-500 font-bold text-sm"
              placeholder={`צוד והזרק ${activeTab}...`}
              value={huntQuery}
              onChange={(e) => setHuntQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && autoInject(huntQuery)}
            />
            <Search className="absolute right-3 top-3 text-slate-500" size={18} />
          </div>
          <button onClick={() => autoInject(huntQuery)} className="bg-blue-600 p-3 rounded-xl shadow-lg active:scale-90">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
          </button>
        </div>
      </section>

      {/* רשימת מלאי - גלילה חלקה */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
              <div className="h-40 relative">
                <img src={item.image_url} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-blue-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">
                  {item.sku}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-4">
                <h3 className="font-black text-white leading-tight">{item.product_name}</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700/50">
                    <span className="text-[8px] text-slate-500 block font-black uppercase italic tracking-widest mb-1">
                      <Droplets size={10} className="inline ml-1" /> ייבוש
                    </span>
                    <span className="text-[10px] font-bold text-blue-400">{item.dry_time || '-'}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700/50">
                    <span className="text-[8px] text-slate-500 block font-black uppercase italic tracking-widest mb-1">
                      <Package size={10} className="inline ml-1" /> כיסוי
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">{item.coverage_rate || '-'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xl font-black italic">₪{item.price}</span>
                  <button onClick={() => {setEditingProduct(item); setIsModalOpen(true);}} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                    <Edit2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* מודל עריכה - מסך מלא במובייל */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 animate-in slide-in-from-bottom duration-300">
          <header className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black italic">ניהול מוצר במוח</h2>
            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 rounded-full"><X size={20}/></button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <Field label="שם מוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              <Field label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              <Field label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
            </div>
            <Field label="לינק לתמונה" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest italic">תיאור טכני</label>
              <textarea 
                className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-sm text-white focus:border-blue-500 min-h-[120px]"
                value={editingProduct.description}
                onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
            <button onClick={saveToDB} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
              <Save size={24}/> שמור הזרקה
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        body { margin: 0; padding: 0; height: 100vh; overflow: hidden; background: #0f172a; }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest italic">{label}</label>
      <input 
        type={type} 
        className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-sm text-white focus:border-blue-500 transition-all" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
