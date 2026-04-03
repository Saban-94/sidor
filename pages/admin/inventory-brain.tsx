import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Save, Trash2, Edit2, Play, Globe, X, Menu, LayoutGrid, Zap, CheckCircle, Info } from 'lucide-react';

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

  // פונקציית הגנה על תמונות - חוסמת לינקים שבורים וידועים לשמצה
  const getSafeImage = (url: string) => {
    const isInvalid = !url || !url.startsWith('http') || url.includes('placeholder') || url.includes('e5e7eb');
    if (isInvalid) {
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
      
      {/* Mobile Top Nav */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="text-blue-600" />
          <span className="font-black text-xl tracking-tighter">Saban<span className="text-blue-600">AI</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-50 rounded-xl">
          {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Drawer מובייל */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 p-6 animate-in slide-in-from-top duration-300 overflow-y-auto">
          <h2 className="text-2xl font-black mb-6">צייד המלאי</h2>
          <div className="flex flex-col gap-4">
            <input 
              className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" 
              placeholder="מה לחפש בגוגל?" 
              value={huntQuery} 
              onChange={(e) => setHuntQuery(e.target.value)} 
            />
            <button onClick={runHunt} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">
              {loading ? "סורק..." : "הפעל ציד"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-8 space-y-4">
              {searchResults.map((res, i) => (
                <div key={i} onClick={() => injectResult(res)} className="p-3 border rounded-2xl bg-slate-50 flex items-center gap-3">
                  <img src={getSafeImage(res.image)} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="text-xs font-black line-clamp-2">{res.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex max-w-[1600px] mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-80 h-screen sticky top-0 border-l bg-white p-6 overflow-y-auto custom-scrollbar">
          <h1 className="text-2xl font-black mb-8 italic tracking-tighter">Saban OS <span className="text-blue-600 text-sm not-italic font-bold">V3.1</span></h1>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ציד מוצרים</label>
            <div className="relative">
              <input 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold" 
                placeholder="חפש מוצר..." 
                value={huntQuery} 
                onChange={(e) => setHuntQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runHunt()}
              />
              <Search className="absolute left-4 top-4 text-slate-300" size={20}/>
            </div>
            <button onClick={runHunt} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-blue-600 transition-all">
              {loading ? "סורק רשת..." : "הפעל ציד רב-תוצאות"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-10 space-y-4">
              <h3 className="text-xs font-black text-blue-600 uppercase">תוצאות ({searchResults.length})</h3>
              {searchResults.map((res, i) => (
                <div key={i} onClick={() => injectResult(res)} className="p-3 border rounded-2xl hover:border-blue-500 cursor-pointer transition-all bg-slate-50/50 group overflow-hidden">
                  <img src={getSafeImage(res.image)} className="w-full h-24 object-cover rounded-xl mb-2" />
                  <div className="text-[11px] font-black line-clamp-2 group-hover:text-blue-600">{res.title}</div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main List */}
        <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden">
                <div className="p-8 border-b bg-slate-50/30">
                  <h2 className="text-xl font-black">מלאי קיים <span className="text-blue-600 text-sm">({products.length})</span></h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                      <tr><th className="p-6">מוצר</th><th className="p-6 text-center">סטטוס</th><th className="p-6 text-center">פעולות</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="p-6 flex items-center gap-4">
                            <img 
                              src={getSafeImage(p.image_url)} 
                              className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white"
                              onError={(e: any) => { e.target.src = getSafeImage(''); }}
                            />
                            <div>
                              <div className="font-black text-slate-800 text-sm">{p.product_name}</div>
                              <div className="text-[10px] text-slate-400">#{p.sku}</div>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black">AI LEARNED</span>
                          </td>
                          <td className="p-6">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Desktop iPhone Preview */}
            <div className="xl:col-span-4 hidden xl:flex justify-center">
              <div className="sticky top-24 w-[300px] h-[620px] bg-slate-900 rounded-[3.5rem] p-3 shadow-2xl border-[8px] border-slate-800">
                <div className="bg-white h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col relative">
                  <img 
                    src={getSafeImage(editingProduct?.image_url)} 
                    className="w-full h-48 object-cover" 
                    onError={(e: any) => { e.target.src = getSafeImage(''); }}
                  />
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-black leading-tight text-slate-800">{editingProduct?.product_name || "ממתין לבחירה..."}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold">
                       <div className="bg-slate-50 p-2 rounded-lg">ייבוש: {editingProduct?.dry_time || "--"}</div>
                       <div className="bg-slate-50 p-2 rounded-lg">כיסוי: {editingProduct?.coverage_rate || "--"}</div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 line-clamp-4 leading-relaxed italic">{editingProduct?.description || "מפרט טכני יופיע כאן..."}</p>
                    <div className="mt-auto pt-4 flex justify-between items-center border-t">
                      <div className="text-xl font-black">₪{editingProduct?.price || '0'}</div>
                      <button className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] shadow-lg">הוספה</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal עריכה והזרקה */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-t-[2.5rem] lg:rounded-[3rem] shadow-2xl p-6 lg:p-10 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter">הזרקה למוח <span className="text-blue-600 font-normal italic text-base">Saban OS</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-2">
              <div className="space-y-4">
                <Field label="שם מוצר" value={editingProduct?.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                <Field label="מק״ט" value={editingProduct?.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                <Field label="מחיר (₪)" type="number" value={editingProduct?.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              </div>
              <div className="space-y-4 bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                <h4 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><Info size={12}/> נתוני מחשבון</h4>
                <Field label="זמן ייבוש" value={editingProduct?.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
                <Field label="כמות כיסוי" value={editingProduct?.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                <Field label="שיטת יישום" value={editingProduct?.application_method} onChange={v => setEditingProduct({...editingProduct, application_method: v})} />
              </div>
              <div className="space-y-4">
                <Field label="לינק תמונה" value={editingProduct?.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                <textarea className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-xs h-28 outline-none font-medium" placeholder="תיאור מפרטי" value={editingProduct?.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-blue-700 transition-all">שמור והזרק ל-DB</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-5 rounded-[2rem] font-black border-2 border-slate-100">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        body { -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{label}</label>
      <input 
        type={type} 
        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.2rem] text-sm outline-none focus:border-blue-500 font-bold transition-all" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
