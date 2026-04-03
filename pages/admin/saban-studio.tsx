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
      fetchStudioData();
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans dir-rtl" dir="rtl">
      {/* Navbar */}
      <header className="p-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Zap size={24} className="fill-white" />
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Saban <span className="text-blue-500">Studio</span></h1>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 w-full md:w-auto">
            {['לוחות גבס', 'חומרי מחצבה'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* הזרקה מהירה */}
        <section className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input 
                className="w-full p-4 pr-12 bg-slate-800 border border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold text-white transition-all"
                placeholder={`צוד והזרק ${activeTab} (למשל: לוח גבס ירוק)...`}
                value={huntQuery}
                onChange={(e) => setHuntQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && autoInject(huntQuery)}
              />
              <Search className="absolute right-4 top-4 text-slate-500" size={20} />
            </div>
            <button 
              onClick={() => autoInject(huntQuery)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-10 py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
              הזרק למוח
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(activeTab === 'לוחות גבס' ? ['לוח גבס רגיל', 'לוח גבס ירוק', 'גבס חסין אש', 'צמנט בורד'] : ['חול בלה', 'סומסום בלה', 'חצץ בלה', 'טיט מוכן']).map(p => (
              <button 
                key={p} 
                onClick={() => autoInject(p)}
                className="bg-slate-800/30 border border-slate-700/50 p-3 rounded-xl text-[11px] font-black text-slate-400 hover:bg-slate-800 hover:text-blue-400 hover:border-blue-500 transition-all active:scale-95"
              >
                + {p}
              </button>
            ))}
          </div>
        </section>

        {/* תצוגת מלאי בזמן אמת */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] overflow-hidden group hover:border-blue-500/40 transition-all flex flex-col shadow-xl">
              <div className="h-48 relative">
                <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white shadow-lg uppercase tracking-widest">
                  {item.sku}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-5">
                <h3 className="text-xl font-black text-white leading-tight">{item.product_name}</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                    <span className="text-[9px] text-slate-500 block font-black mb-1 italic tracking-widest uppercase">
                      <Droplets size={10} className="inline ml-1" /> זמן ייבוש
                    </span>
                    <span className="text-xs font-bold text-blue-400">{item.dry_time || 'בבדיקה'}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                    <span className="text-[9px] text-slate-500 block font-black mb-1 italic tracking-widest uppercase">
                      <Package size={10} className="inline ml-1" /> כושר כיסוי
                    </span>
                    <span className="text-xs font-bold text-emerald-400">{item.coverage_rate || 'לפי יצרן'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-2">"{item.description}"</p>
                
                <div className="mt-auto pt-5 border-t border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-black uppercase">מחיר שוק</span>
                    <span className="text-2xl font-black italic text-white">₪{item.price}</span>
                  </div>
                  <button 
                    onClick={() => {setEditingProduct(item); setIsModalOpen(true);}}
                    className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-90"
                  >
                    <Edit2 size={20}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* עריכה והזרקה ידנית */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] border border-slate-800 p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter">ניהול מוצר במוח</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="שם מוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
              <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              <Field label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
              <div className="md:col-span-2">
                <Field label="לינק לתמונה" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">תיאור טכני</label>
                <textarea 
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-sm text-white focus:border-blue-500 min-h-[100px]"
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                <Save size={24}/> שמור הזרקה
              </button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-slate-400 py-5 rounded-[2rem] font-black hover:text-white transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{label}</label>
      <input 
        type={type} 
        className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-sm text-white focus:border-blue-500 transition-all" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
