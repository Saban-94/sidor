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

  useEffect(() => {
    fetchInventory();
  }, []);

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
      
      // הזרקה דינאמית ישירה לטופס
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
    } catch (e) {
      console.error("Hunt failed", e);
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async () => {
    const { error } = await supabase.from('inventory').upsert({
      ...editingProduct,
      search_text: editingProduct.product_name?.toLowerCase(),
      price: parseFloat(editingProduct.price) || 0
    }, { onConflict: 'sku' });

    if (!error) {
      setIsModalOpen(false);
      setEditingProduct(null);
      setHuntQuery('');
      fetchInventory();
    } else {
      alert("שגיאת שמירה: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans" dir="rtl">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Zap size={20}/></div>
          <span className="font-black text-lg tracking-tighter">Saban<span className="text-blue-600">OS</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-50 rounded-xl border">
          {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Mobile Hamburger Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 p-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-black mb-6">צייד המלאי</h2>
          <div className="flex flex-col gap-4">
            <input 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold"
              placeholder="חפש מוצר להזרקה..."
              value={huntQuery}
              onChange={(e) => setHuntQuery(e.target.value)}
            />
            <button onClick={runHunt} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">
              {loading ? "צד ברשת..." : "הפעל ציד חכם"}
            </button>
          </div>
        </div>
      )}

      <div className="flex max-w-[1600px] mx-auto">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-l bg-white p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><LayoutGrid size={24}/></div>
            <h1 className="text-2xl font-black">Saban<span className="text-blue-600">OS</span></h1>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">חיפוש והזרקה</label>
              <div className="relative">
                <input 
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm pr-10 outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="שם מוצר..."
                  value={huntQuery}
                  onChange={(e) => setHuntQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runHunt()}
                />
                <Search className="absolute right-3 top-3 text-slate-400" size={18}/>
              </div>
              <button onClick={runHunt} disabled={loading} className="w-full mt-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all">
                {loading ? "סורק..." : "צוד מוצר בגוגל"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Table Area */}
            <div className="xl:col-span-8 order-2 xl:order-1">
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
                <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center">
                  <h2 className="text-xl font-black flex items-center gap-3">
                    ניהול מוח המלאי 
                    <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{products.length} מוצרים</span>
                  </h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase">
                      <tr>
                        <th className="p-6">פרטי מוצר</th>
                        <th className="p-6 text-center">ציון AI</th>
                        <th className="p-6">מחיר סבן</th>
                        <th className="p-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <img src={getSafeImage(p.image_url)} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white" />
                              <div>
                                <div className="font-black text-slate-800 text-base">{p.product_name}</div>
                                <div className="text-xs text-slate-400 font-mono">#{p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col items-center">
                              <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                              <span className="text-[10px] font-black mt-1 text-slate-400 italic">Optimized</span>
                            </div>
                          </td>
                          <td className="p-6 font-black text-lg text-slate-900">₪{p.price}</td>
                          <td className="p-6">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition"><Edit2 size={18}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Simulation Area - iPhone Style */}
            <div className="xl:col-span-4 order-1 xl:order-2">
              <div className="sticky top-10 flex flex-col items-center">
                <div className="relative w-[300px] h-[620px] bg-slate-900 rounded-[3.5rem] p-4 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border-[8px] border-slate-800">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10"></div>
                  <div className="bg-white h-full w-full rounded-[2.8rem] overflow-hidden flex flex-col">
                    <img src={getSafeImage(editingProduct?.image_url)} className="w-full h-52 object-cover" />
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{editingProduct?.sku || 'SBN-TEMP'}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight h-14 overflow-hidden">{editingProduct?.product_name || "ממתין להזרקה..."}</h3>
                      <p className="text-[12px] text-slate-500 mt-4 leading-relaxed line-clamp-4 italic">
                        {editingProduct?.description || "כאן יוצג המפרט הטכני המלא מהרשת לאחר הציד..."}
                      </p>
                      
                      <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="text-2xl font-black">₪{editingProduct?.price || '0'}</div>
                          <div className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> במלאי סבן</div>
                        </div>
                        <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl">הוספה לסל מהירה</button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Sidor App Preview</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modern Ingestion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800">עריכה והזרקה למלאי</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full shadow-sm hover:scale-110 transition"><X size={24}/></button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
              <div className="space-y-6">
                <Field label="שם המוצר" value={editingProduct?.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block">תיאור טכני (מפרט)</label>
                  <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm h-40 outline-none focus:border-blue-500 font-medium" value={editingProduct?.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>
              </div>
              <div className="space-y-6">
                <Field label="לינק לתמונה" value={editingProduct?.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                <Field label="לינק יוטיוב" value={editingProduct?.youtube_url} onChange={v => setEditingProduct({...editingProduct, youtube_url: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="מחיר (₪)" type="number" value={editingProduct?.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                  <Field label="מק״ט" value={editingProduct?.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/80 flex gap-4">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">שמור והזרק ל-DB</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-5 rounded-2xl font-black border-2 border-slate-100 hover:bg-slate-50 transition">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block tracking-wider">{label}</label>
      <input 
        type={type}
        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm outline-none focus:border-blue-500 font-bold transition-all"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
