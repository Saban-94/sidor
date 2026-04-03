import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Edit2, Zap, X, Menu, Trash2, CheckCircle, Info } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function InventoryBrain() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntQuery, setHuntQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const calculateScore = (p: any) => {
    let s = 0;
    if (p.image_url) s += 25;
    if (p.dry_time) s += 25;
    if (p.coverage_rate) s += 25;
    if (p.price > 0) s += 25;
    return s;
  };

  const runHunt = async () => {
    if (!huntQuery) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: huntQuery, multi: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSearchResults(data.results || []);
      setIsMobileMenuOpen(false);
    } catch (e: any) { alert("⚠️ " + e.message); }
    finally { setLoading(false); }
  };

  const injectResult = (res: any) => {
    setEditingProduct({
      product_name: res.title,
      description: res.description,
      image_url: res.image,
      dry_time: res.dry_time,
      coverage_rate: res.coverage_rate,
      application_method: res.application_method,
      sku: `SBN-${Math.floor(Math.random() * 90000 + 10000)}`,
      price: 0
    });
    setIsModalOpen(true);
  };

  const saveToDB = async () => {
    const { error } = await supabase.from('inventory').upsert({
      ...editingProduct,
      price: parseFloat(editingProduct.price) || 0,
      search_text: editingProduct.product_name.toLowerCase()
    }, { onConflict: 'sku' });

    if (!error) {
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchInventory();
    } else { alert(error.message); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-10 dir-rtl" dir="rtl">
      {/* Header & Search */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-600 w-8 h-8" />
          <h1 className="text-3xl font-black italic tracking-tighter">Saban OS <span className="text-blue-600">Intelligence</span></h1>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input 
            className="flex-1 md:w-80 p-4 bg-white rounded-2xl border-2 shadow-sm outline-none focus:border-blue-500 font-bold transition-all" 
            placeholder="חפש מוצר להזרקה..." 
            value={huntQuery} 
            onChange={e => setHuntQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runHunt()}
          />
          <button onClick={runHunt} className="bg-slate-900 text-white px-8 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg active:scale-95">
            {loading ? "סורק..." : "צוד"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* תוצאות ציד - גלריה מהירה */}
        {searchResults.length > 0 && (
          <div className="lg:col-span-12 flex gap-4 overflow-x-auto pb-6 animate-in slide-in-from-top duration-500">
            {searchResults.map((res, i) => (
              <div key={i} onClick={() => injectResult(res)} className="min-w-[200px] bg-white p-4 rounded-[2rem] border-2 hover:border-blue-500 cursor-pointer shadow-md transition-all group">
                <img src={res.image || '/no-image.png'} className="w-full h-32 object-cover rounded-2xl mb-3 shadow-sm" />
                <p className="text-xs font-black line-clamp-2 group-hover:text-blue-600 leading-tight">{res.title}</p>
              </div>
            ))}
          </div>
        )}

        {/* טבלת מלאי */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xl font-black">מלאי המוח הקיים</h2>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{products.length} מוצרים</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr><th className="p-6">מוצר</th><th className="p-6 text-center">עושר נתונים (Score)</th><th className="p-6 text-center">פעולות</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => (
                  <tr key={p.id} className="group hover:bg-blue-50/20 transition-all">
                    <td className="p-6 flex items-center gap-4">
                      <img src={p.image_url} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-white" />
                      <div><div className="font-black text-sm">{p.product_name}</div><div className="text-[10px] text-slate-400 italic font-mono">#{p.sku}</div></div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border">
                          <div className={`h-full ${calculateScore(p) > 70 ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${calculateScore(p)}%`}}></div>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{calculateScore(p)}% עשיר</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <button onClick={() => {setEditingProduct(p); setIsModalOpen(true);}} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* iPhone Simulator */}
        <div className="lg:col-span-4 hidden lg:flex justify-center">
          <div className="sticky top-10 w-[300px] h-[620px] bg-slate-900 rounded-[3.5rem] p-3 shadow-2xl border-[8px] border-slate-800">
            <div className="bg-white h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col relative">
              <img src={editingProduct?.image_url} className="h-48 w-full object-cover shadow-inner" />
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-black text-xl leading-tight mb-4 text-slate-800">{editingProduct?.product_name || "בחר מוצר להזרקה"}</h3>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400">💨 ייבוש:</span>
                    <span className="text-[11px] font-black text-blue-600">{editingProduct?.dry_time || "--"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400">📏 כיסוי:</span>
                    <span className="text-[11px] font-black text-blue-600">{editingProduct?.coverage_rate || "--"}</span>
                  </div>
                </div>
                <p className="mt-6 text-[11px] text-slate-500 leading-relaxed italic line-clamp-4">{editingProduct?.description}</p>
                <div className="mt-auto pt-6 border-t flex justify-between items-center">
                  <span className="text-2xl font-black italic">₪{editingProduct?.price || 0}</span>
                  <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg">הוספה לסל</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-t-[2.5rem] lg:rounded-[3rem] shadow-2xl p-8 lg:p-12 overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <h2 className="text-3xl font-black mb-10 italic tracking-tighter">הזרקה למוח <span className="text-blue-600">Saban AI</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Field label="שם מוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                  <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                </div>
                <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              </div>
              <div className="space-y-6">
                <Field label="כמות כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                <Field label="לינק תמונה" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">תיאור טכני ללקוח</label>
                  <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-32 outline-none text-xs font-medium focus:border-blue-500 transition-all" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-100 hover:scale-[1.02] transition-all active:scale-95">שמור והזרק ל-DB</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-5 rounded-[2rem] font-black border-2 border-slate-100 hover:bg-slate-50 transition">ביטול</button>
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
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">{label}</label>
      <input type={type} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm outline-none font-black focus:border-blue-500 transition-all" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
