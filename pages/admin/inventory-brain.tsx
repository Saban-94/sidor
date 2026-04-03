import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Save, Trash2, Edit2, Play, Globe, CheckCircle, Plus, X } from 'lucide-react';

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

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  // פונקציית הציד הדינאמית - שואבת נתונים מגוגל לתוך הטופס
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
      
      // הזרקה דינאמית לטופס העריכה
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
    } catch (e) {
      console.error("Hunt failed", e);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (p: any) => {
    let score = 0;
    if (p.product_name) score += 20;
    if (p.description && p.description.length > 30) score += 20;
    if (p.image_url) score += 20;
    if (p.youtube_url) score += 20;
    if (p.price > 0) score += 20;
    return score;
  };

  const saveToDB = async () => {
    const { error } = await supabase.from('inventory').upsert(editingProduct, { onConflict: 'sku' });
    if (!error) {
      setIsModalOpen(false);
      setEditingProduct(null);
      setHuntQuery('');
      fetchInventory();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dir-rtl pb-20" dir="rtl">
      {/* Header קבוע ומרשים */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <Globe size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">Saban OS <span className="text-blue-600">Brain</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inventory AI Control</p>
            </div>
          </div>
          
          {/* שדה ציד משודרג */}
          <div className="flex items-center bg-slate-100 rounded-2xl p-1 w-full md:w-[450px] border focus-within:border-blue-500 transition-all">
            <input 
              className="bg-transparent flex-1 px-4 py-2 text-sm outline-none font-medium" 
              placeholder="כתוב שם מוצר לציד והזרקה (למשל: סיקה גארד 703)..."
              value={huntQuery}
              onChange={(e) => setHuntQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runHunt()}
            />
            <button 
              onClick={runHunt}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition"
            >
              {loading ? "צד..." : "צוד מוצר"}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* טבלת ניהול מוצרים */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                מלאי המוח הקיים ({products.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-black">
                  <tr>
                    <th className="p-4">מוצר</th>
                    <th className="p-4 text-center">בריאות (Health)</th>
                    <th className="p-4">מחיר</th>
                    <th className="p-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image_url || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-white" />
                          <div>
                            <div className="font-bold text-slate-700 text-sm">{p.product_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter">#{p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${calculateScore(p) > 70 ? 'bg-green-500' : 'bg-amber-400'}`} 
                              style={{ width: `${calculateScore(p)}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-black mt-1 text-slate-400">{calculateScore(p)}%</span>
                        </div>
                      </td>
                      <td className="p-4 font-black text-blue-600 text-sm">₪{p.price}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* סימולטור מובייל - תמיד גלוי וחי */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <div className="sticky top-28 flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-400 mb-4 tracking-widest uppercase">Live Link Simulation</h3>
            <div className="relative w-[280px] h-[580px] bg-slate-900 rounded-[3rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-[6px] border-slate-800">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-2xl"></div>
              
              <div className="bg-white h-full w-full rounded-[2.2rem] overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50">
                {/* תוכן ה-Preview החי */}
                <div className="bg-white">
                  <img src={editingProduct?.image_url || 'https://via.placeholder.com/400x300?text=Scan+Product'} className="w-full h-44 object-cover" />
                  <div className="p-4">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{editingProduct?.sku || 'SKU-NONE'}</span>
                    <h4 className="text-lg font-black text-slate-800 mt-1">{editingProduct?.product_name || "ממתין לציד..."}</h4>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed h-16 overflow-hidden">
                      {editingProduct?.description || "כאן יופיע המפרט הטכני שהמוח יצליח לדוג מרחבי האינטרנט..."}
                    </p>
                    
                    {editingProduct?.youtube_url && (
                      <div className="flex items-center gap-2 mt-4 text-red-600 font-bold text-[10px]">
                        <div className="bg-red-600 p-1 rounded-md text-white"><Play size={10} fill="white"/></div>
                        סרטון הדרכה זמין
                      </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-end">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">מחיר סבן</div>
                        <div className="text-xl font-black text-slate-900">₪{editingProduct?.price || '0'}</div>
                      </div>
                      <button className="bg-green-500 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg shadow-green-100">
                        הוספה לסל
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* מודל עריכה והזרקה - משופר למובייל */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">עריכת נתוני המוח</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-white p-2 rounded-full shadow-sm text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input label="שם מוצר" value={editingProduct?.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">תיאור מוצר (מפרט)</label>
                  <textarea 
                    className="w-full p-3 bg-slate-50 border rounded-xl text-sm h-32 outline-none focus:border-blue-500 transition-all"
                    value={editingProduct?.description}
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Input label="לינק לתמונה" value={editingProduct?.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                <Input label="לינק ליוטיוב" value={editingProduct?.youtube_url} onChange={v => setEditingProduct({...editingProduct, youtube_url: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="מחיר (₪)" type="number" value={editingProduct?.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                  <Input label="מק״ט" value={editingProduct?.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button onClick={saveToDB} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition">שמור והזרק למלאי</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-4 rounded-2xl font-black border border-slate-200">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dir-rtl { direction: rtl; }
      `}</style>
    </div>
  );
}

// רכיב עזר לשדות קלט
function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</label>
      <input 
        type={type}
        className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
