import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Save, Trash2, Edit2, Play, Globe, X, Menu, LayoutGrid, Zap, CheckCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function InventoryBrain() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntQuery, setHuntQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const getSafeImage = (url: string) => {
    if (url && url.startsWith('http')) return url;
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">אין תמונה זמינה</text></svg>`;
  };

  const runHunt = async () => {
    if (!huntQuery) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: huntQuery }),
      });
      const data = await res.json();
      setEditingProduct({
        product_name: data.product_name || huntQuery,
        description: data.description || '',
        image_url: data.image_url || '',
        youtube_url: data.youtube_url || '',
        price: 0,
        sku: data.sku || `SBN-${Math.floor(10000 + Math.random() * 89999)}`,
        is_ai_learned: true
      });
      setIsModalOpen(true);
      setIsMobileMenuOpen(false);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const saveToDB = async () => {
    // שליחת Payload מזוקק בלבד - בלי search_tsv ובלי עמודות מערכת
    const payload = {
      product_name: editingProduct.product_name,
      description: editingProduct.description,
      image_url: editingProduct.image_url,
      youtube_url: editingProduct.youtube_url,
      price: parseFloat(editingProduct.price) || 0,
      sku: editingProduct.sku,
      is_ai_learned: true,
      search_text: editingProduct.product_name?.toLowerCase()
    };

    // שימוש ב-upsert על ה-payload הנקי
    const { error } = await supabase
      .from('inventory')
      .upsert(payload, { onConflict: 'sku' });

    if (!error) {
      setIsModalOpen(false);
      setEditingProduct(null);
      setHuntQuery('');
      fetchInventory();
    } else {
      console.error("Save error details:", error);
      alert("שגיאת שמירה: " + error.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('למחוק מהמוח?')) {
      await supabase.from('inventory').delete().eq('id', id);
      fetchInventory();
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans" dir="rtl">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Zap size={20}/></div>
          <span className="font-black text-lg">Saban<span className="text-blue-600">OS</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-50 rounded-xl border">
          {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 p-6 animate-in slide-in-from-top duration-300">
          <h2 className="text-2xl font-black mb-6">צייד המלאי</h2>
          <div className="flex flex-col gap-4">
            <input className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none" placeholder="חפש מוצר להזרקה..." value={huntQuery} onChange={(e) => setHuntQuery(e.target.value)} />
            <button onClick={runHunt} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">צוד עכשיו</button>
          </div>
        </div>
      )}

      <div className="flex max-w-[1600px] mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-l bg-white p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><LayoutGrid size={24}/></div>
            <h1 className="text-2xl font-black">Saban<span className="text-blue-600">OS</span></h1>
          </div>
          <div className="space-y-6">
            <div className="relative">
              <input className="w-full p-3 bg-slate-50 border rounded-xl text-sm" placeholder="שם מוצר לציד..." value={huntQuery} onChange={(e) => setHuntQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runHunt()} />
              <Search className="absolute left-3 top-3 text-slate-300" size={16}/>
            </div>
            <button onClick={runHunt} disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all">
              {loading ? "סורק רשת..." : "צוד מוצר בגוגל"}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 order-2 xl:order-1">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden">
                <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center">
                  <h2 className="text-xl font-black italic">Inventory Intelligence <span className="text-blue-600">({products.length})</span></h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase">
                      <tr><th className="p-6">מוצר</th><th className="p-6">מחיר סבן</th><th className="p-6 text-center">פעולות</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-blue-50/20 group transition-all">
                          <td className="p-6 flex items-center gap-4">
                            <img src={getSafeImage(p.image_url)} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                            <div><div className="font-black text-slate-800">{p.product_name}</div><div className="text-[10px] text-slate-400 font-mono tracking-tighter">#{p.sku}</div></div>
                          </td>
                          <td className="p-6 font-black text-lg text-slate-900">₪{p.price}</td>
                          <td className="p-6">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 bg-slate-50 rounded-lg hover:text-blue-600"><Edit2 size={18}/></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-2 bg-slate-50 rounded-lg hover:text-red-600"><Trash2 size={18}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 order-1 xl:order-2 flex justify-center">
              <div className="sticky top-10 w-[280px] h-[580px] bg-slate-900 rounded-[3.5rem] p-3 shadow-2xl border-[8px] border-slate-800">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-2xl z-10"></div>
                <div className="bg-white h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col">
                  <img src={getSafeImage(editingProduct?.image_url)} className="w-full h-44 object-cover" />
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full self-start mb-2">{editingProduct?.sku || 'SBN-READY'}</span>
                    <h3 className="text-lg font-black leading-tight h-12 overflow-hidden">{editingProduct?.product_name || "ממתין להזרקה..."}</h3>
                    <p className="text-[11px] text-slate-500 mt-4 line-clamp-4 leading-relaxed">{editingProduct?.description || "מפרט טכני יופיע כאן..."}</p>
                    <div className="mt-auto pt-4 flex justify-between items-end border-t border-slate-50">
                      <div className="text-xl font-black">₪{editingProduct?.price || '0'}</div>
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
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl p-8 overflow-hidden animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-black mb-6">עריכה והזרקה למלאי</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-4">
                <Field label="שם המוצר" value={editingProduct?.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">תיאור טכני</label>
                  <textarea className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-sm h-32 outline-none font-medium focus:border-blue-500 transition-all" value={editingProduct?.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <Field label="לינק לתמונה" value={editingProduct?.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                <Field label="לינק יוטיוב" value={editingProduct?.youtube_url} onChange={v => setEditingProduct({...editingProduct, youtube_url: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="מחיר (₪)" type="number" value={editingProduct?.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                  <Field label="מק״ט" value={editingProduct?.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">שמור והזרק ל-DB</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-4 rounded-2xl font-black border-2 border-slate-100">ביטול</button>
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
      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{label}</label>
      <input type={type} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none font-bold focus:border-blue-500 transition-all" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
