import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Save, Trash2, Edit2, Globe, X, Menu, Zap, Info, BarChart3 } from 'lucide-react';

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

  const getSafeImage = (url: string) => {
    if (url && url.startsWith('http') && !url.includes('e5e7eb')) return url;
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%2394a3b8">אין תמונה</text></svg>`;
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
      if (data.error) throw new Error(data.error);
      setSearchResults(data.results || []);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const injectResult = (res: any) => {
    setEditingProduct({
      product_name: res.title,
      description: res.ai_description || res.snippet,
      image_url: res.image,
      dry_time: res.dry_time || "",
      coverage_rate: res.coverage_rate || "",
      application_method: res.application_method || "",
      sku: `SBN-${Math.floor(10000 + Math.random() * 90000)}`,
      price: 0
    });
    setIsModalOpen(true);
    setIsMobileMenuOpen(false);
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
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8" dir="rtl">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-2xl text-white shadow-lg"><Zap size={24}/></div>
          <h1 className="text-2xl font-black italic">Saban OS <span className="text-blue-600">Brain</span></h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-3 bg-white rounded-xl shadow-sm"><Menu/></button>
        
        <div className="hidden lg:flex gap-3">
          <input className="p-3 rounded-2xl border-2 outline-none w-64 focus:border-blue-500 font-bold" placeholder="צוד מוצר..." value={huntQuery} onChange={e => setHuntQuery(e.target.value)} />
          <button onClick={runHunt} className="bg-slate-900 text-white px-6 rounded-2xl font-bold hover:bg-blue-600 transition">{loading ? "צוד..." : "הפעל ציד"}</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* תוצאות ציד (מופיע רק כשיש תוצאות) */}
        {searchResults.length > 0 && (
          <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-in fade-in duration-500">
            {searchResults.map((res, i) => (
              <div key={i} onClick={() => injectResult(res)} className="bg-white p-3 rounded-3xl border-2 hover:border-blue-500 cursor-pointer shadow-sm transition-all group">
                <img src={getSafeImage(res.image)} className="w-full h-24 object-cover rounded-2xl mb-2" />
                <p className="text-[10px] font-black line-clamp-2 group-hover:text-blue-600">{res.title}</p>
              </div>
            ))}
          </div>
        )}

        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
              <tr><th className="p-6">מוצר</th><th className="p-6">עושר נתונים</th><th className="p-6">פעולות</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => (
                <tr key={p.id} className="group hover:bg-blue-50/30">
                  <td className="p-6 flex items-center gap-4">
                    <img src={getSafeImage(p.image_url)} className="w-12 h-12 rounded-xl object-cover" />
                    <div><div className="font-black text-sm">{p.product_name}</div><div className="text-[10px] text-slate-400 italic">#{p.sku}</div></div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{width: `${calculateScore(p)}%`}}></div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{calculateScore(p)}%</span>
                    </div>
                  </td>
                  <td className="p-6"><button onClick={() => {setEditingProduct(p); setIsModalOpen(true);}} className="text-slate-300 hover:text-blue-600"><Edit2 size={18}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Simulator Area */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-8 w-[300px] h-[600px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-slate-800">
            <div className="bg-white h-full w-full rounded-[2.2rem] overflow-hidden flex flex-col">
              <img src={getSafeImage(editingProduct?.image_url)} className="h-44 w-full object-cover" />
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-black text-lg leading-tight mb-4">{editingProduct?.product_name || "ממתין להזרקה..."}</h3>
                <div className="space-y-2 text-[10px] font-bold">
                  <div className="flex justify-between bg-slate-50 p-2 rounded-lg"><span>ייבוש:</span><span className="text-blue-600">{editingProduct?.dry_time || "--"}</span></div>
                  <div className="flex justify-between bg-slate-50 p-2 rounded-lg"><span>כיסוי:</span><span className="text-blue-600">{editingProduct?.coverage_rate || "--"}</span></div>
                </div>
                <p className="mt-4 text-[10px] text-slate-500 leading-relaxed italic line-clamp-4">{editingProduct?.description}</p>
                <div className="mt-auto pt-4 border-t flex justify-between items-center">
                  <span className="text-xl font-black">₪{editingProduct?.price || 0}</span>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold">הוספה לסל</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-t-[2.5rem] lg:rounded-[3rem] shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black mb-8 italic">עריכת נתוני מוח <span className="text-blue-600">AI</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Field label="שם מוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                <Field label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                <Field label="מחיר" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              </div>
              <div className="space-y-4">
                <Field label="כמות כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                <Field label="לינק תמונה" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                <label className="text-[10px] font-black text-slate-400 uppercase block">תיאור לקוח</label>
                <textarea className="w-full p-4 bg-slate-50 border-2 rounded-2xl h-32 outline-none text-xs font-medium" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button onClick={saveToDB} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">הזרק ל-DB</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-4 rounded-2xl font-black border-2">ביטול</button>
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
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{label}</label>
      <input type={type} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm outline-none font-bold" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
