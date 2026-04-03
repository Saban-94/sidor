import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Save, Trash2, Edit2, Play, Globe, X, Menu, LayoutGrid, Zap, CheckCircle, ChevronLeft, Info } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  // 1. הגנה מפני לינקים ריקים, לא תקינים או לינקים של פלייסהולדרים שבורים
  const isInvalid = !url || 
                    !url.startsWith('http') || 
                    url.includes('placeholder') || 
                    url.includes('e5e7eb');

  if (isInvalid) {
    // החזרת ה-SVG הפנימי (לא דורש אינטרנט, לא מייצר שגיאות בקונסול)
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8" font-weight="bold">Saban OS - No Image</text></svg>`;
  }

  return url;
};

  const runHunt = async () => {
    if (!huntQuery) return;
    setLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch('/api/admin/inventory-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: huntQuery, multi: true }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
      setIsMobileMenuOpen(false);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const injectResult = (res: any) => {
    setEditingProduct({
      ...editingProduct,
      product_name: res.title || editingProduct?.product_name,
      description: res.snippet || editingProduct?.description,
      image_url: res.image || editingProduct?.image_url,
      youtube_url: res.youtube || editingProduct?.youtube_url,
      sku: editingProduct?.sku || `SBN-${Math.floor(10000 + Math.random() * 89999)}`,
      dry_time: editingProduct?.dry_time || "",
      coverage_rate: editingProduct?.coverage_rate || "",
      application_method: editingProduct?.application_method || "",
      price: editingProduct?.price || 0
    });
    setIsModalOpen(true);
  };

  const saveToDB = async () => {
    const payload = {
      product_name: editingProduct.product_name,
      description: editingProduct.description,
      image_url: editingProduct.image_url,
      youtube_url: editingProduct.youtube_url,
      price: parseFloat(editingProduct.price) || 0,
      sku: editingProduct.sku,
      dry_time: editingProduct.dry_time,
      coverage_rate: editingProduct.coverage_rate,
      application_method: editingProduct.application_method,
      is_ai_learned: true,
      search_text: editingProduct.product_name?.toLowerCase()
    };

    const { error } = await supabase.from('inventory').upsert(payload, { onConflict: 'sku' });
    if (!error) {
      setIsModalOpen(false);
      setEditingProduct(null);
      setSearchResults([]);
      fetchInventory();
    } else { alert("שגיאה: " + error.message); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('למחוק מוצר זה מהמוח?')) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) fetchInventory();
    else alert("שגיאה במחיקה: " + error.message);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans overflow-x-hidden" dir="rtl">
      
      {/* Mobile Nav */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="text-blue-600" />
          <span className="font-black text-xl">Saban<span className="text-blue-600">AI</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-50 rounded-xl"><Menu /></button>
      </div>

      <div className="flex max-w-[1600px] mx-auto">
        <aside className="hidden lg:flex flex-col w-80 h-screen sticky top-0 border-l bg-white p-6 overflow-y-auto">
          <h1 className="text-2xl font-black mb-8 italic">Saban OS <span className="text-blue-600 text-sm not-italic font-bold">V3.0</span></h1>
          
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">צייד מוצרים חכם</label>
            <div className="relative">
              <input 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold" 
                placeholder="מה לחפש בגוגל?" 
                value={huntQuery} 
                onChange={(e) => setHuntQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runHunt()}
              />
              <Search className="absolute left-4 top-4 text-slate-300" size={20}/>
            </div>
            <button onClick={runHunt} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-blue-600 transition-all">
              {loading ? "סורק את הרשת..." : "הפעל ציד רב-תוצאות"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-10 space-y-4">
              <h3 className="text-xs font-black text-blue-600 uppercase">תוצאות שנמצאו ({searchResults.length})</h3>
              {searchResults.map((res, i) => (
                <div key={i} onClick={() => injectResult(res)} className="p-3 border rounded-2xl hover:border-blue-500 cursor-pointer transition-all bg-slate-50/50 group">
                  <img src={getSafeImage(res.image)} className="w-full h-24 object-cover rounded-xl mb-2" />
                  <div className="text-[11px] font-black line-clamp-2 group-hover:text-blue-600">{res.title}</div>
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="flex-1 p-4 lg:p-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden">
                <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center">
                  <h2 className="text-xl font-black">מלאי קיים <span className="text-blue-600 text-sm">({products.length})</span></h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                      <tr><th className="p-6">מוצר</th><th className="p-6 text-center">מדד בריאות</th><th className="p-6">פעולות</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="p-6 flex items-center gap-4">
                            <img src={getSafeImage(p.image_url)} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                            <div>
                              <div className="font-black text-slate-800 text-sm">{p.product_name}</div>
                              <div className="text-[10px] text-slate-400">#{p.sku}</div>
                            </div>
                          </td>
                          <td className="p-6 text-center font-bold text-xs">
                             <div className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full">Optimized</div>
                          </td>
                          <td className="p-6 flex justify-end gap-2">
                            <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile Simulator Preview */}
            <div className="xl:col-span-4 flex justify-center">
              <div className="sticky top-24 w-[300px] h-[620px] bg-slate-900 rounded-[3.5rem] p-3 shadow-2xl border-[8px] border-slate-800 hidden xl:block">
                <div className="bg-white h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col relative">
                  <img src={getSafeImage(editingProduct?.image_url)} className="w-full h-48 object-cover" />
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-black leading-tight text-slate-800">{editingProduct?.product_name || "ממתין לבחירה..."}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold">
                       <div className="bg-slate-50 p-2 rounded-lg">ייבוש: {editingProduct?.dry_time || "---"}</div>
                       <div className="bg-slate-50 p-2 rounded-lg">כיסוי: {editingProduct?.coverage_rate || "---"}</div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 line-clamp-3 leading-relaxed">{editingProduct?.description || "מפרט טכני יופיע כאן..."}</p>
                    <div className="mt-auto pt-4 flex justify-between items-center border-t">
                      <div className="text-xl font-black text-slate-900">₪{editingProduct?.price || '0'}</div>
                      <button className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px]">הוספה לסל</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-t-[2.5rem] lg:rounded-[3rem] shadow-2xl p-6 lg:p-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">הזרקת מוצר <span className="text-blue-600 font-normal italic">V3</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={24}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-2">
              <div className="space-y-4">
                <Field label="שם המוצר" value={editingProduct?.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                <Field label="מק״ט (SKU)" value={editingProduct?.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                <Field label="מחיר (₪)" type="number" value={editingProduct?.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              </div>
              <div className="space-y-4 bg-blue-50/50 p-4 rounded-3xl">
                <Field label="זמן ייבוש" value={editingProduct?.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
                <Field label="כמות כיסוי" value={editingProduct?.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                <Field label="שיטת יישום" value={editingProduct?.application_method} onChange={v => setEditingProduct({...editingProduct, application_method: v})} />
              </div>
              <div className="space-y-4">
                <Field label="לינק תמונה" value={editingProduct?.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                <textarea className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-xs h-24 outline-none font-medium" placeholder="תיאור מלא" value={editingProduct?.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:scale-[1.01] transition-all">שמור והזרק למוח המלאי</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-5 rounded-[2rem] font-black border-2">ביטול</button>
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
      <input type={type} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.2rem] text-sm outline-none focus:border-blue-500 font-bold" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
