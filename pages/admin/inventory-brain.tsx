import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Save, Trash2, Edit2, Play, Image as ImageIcon, CheckCircle, AlertCircle, Globe } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function InventoryBrain() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // טיוטה למוצר חדש (הצייד)
  const [huntedDraft, setHuntedDraft] = useState<any>({
    product_name: '',
    description: '',
    image_url: '',
    youtube_url: '',
    price: 0,
    sku: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  // פונקציית הציד (Web Hunter Simulation)
  const startHunt = async () => {
    setLoading(true);
    // כאן תתבצע הקריאה ל-API של ה-Hunter שבנינו
    const response = await fetch('/api/admin/inventory-hunter', {
      method: 'POST',
      body: JSON.stringify({ query: searchQuery }),
    });
    const data = await response.json();
    setHuntedDraft(data);
    setLoading(false);
  };

  const calculateScore = (p: any) => {
    let score = 0;
    if (p.product_name) score += 20;
    if (p.description) score += 20;
    if (p.image_url) score += 20;
    if (p.youtube_url) score += 20;
    if (p.price > 0) score += 20;
    return score;
  };

  const handleSave = async (product: any) => {
    const { error } = await supabase.from('inventory').upsert(product);
    if (!error) {
      setEditingProduct(null);
      setHuntedDraft(null);
      fetchInventory();
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('למחוק מוצר זה מהמוח?')) {
      await supabase.from('inventory').delete().eq('id', id);
      fetchInventory();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 dir-rtl text-right" dir="rtl">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory Brain 🧠</h1>
          <p className="text-gray-500">ניהול מלאי חכם והזרקת מוצרים מהרשת</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="חפש מוצר לציד ברשת..." 
            className="px-4 py-2 border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            onClick={startHunt}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            {loading ? 'צד...' : <><Globe size={18} /> צור מוצר</>}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* צד שמאל: סימולטור מובייל (כרטיס מוצר 100%) */}
        <div className="lg:col-span-4 flex justify-center items-start">
          <div className="sticky top-8">
            <h2 className="text-center font-bold mb-4 text-gray-700">סימולטור כרטיס מוצר (LIVE)</h2>
            <div className="relative w-[320px] h-[600px] bg-black rounded-[3rem] p-3 shadow-2xl border-[8px] border-gray-800">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl"></div>
              <div className="bg-white h-full w-full rounded-[2rem] overflow-y-auto overflow-x-hidden custom-scrollbar">
                
                {/* תוכן הכרטיס הדינאמי */}
                <div className="p-0">
                  <img 
                    src={huntedDraft?.image_url || editingProduct?.image_url || 'https://via.placeholder.com/300?text=No+Image'} 
                    className="w-full h-48 object-cover rounded-t-[1.5rem]" 
                  />
                  <div className="p-4">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                      {huntedDraft?.sku || editingProduct?.sku || 'SKU-0000'}
                    </span>
                    <h3 className="text-xl font-black mt-2 text-gray-800">
                      {huntedDraft?.product_name || editingProduct?.product_name || 'שם המוצר יופיע כאן'}
                    </h3>
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed h-20 overflow-hidden">
                      {huntedDraft?.description || editingProduct?.description || 'תיאור טכני מלא מהרשת יופיע כאן בצורה מקצועית...'}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-4 text-red-600 font-bold text-sm">
                      <Play size={16} fill="currentColor" />
                      <span>סרטון הדרכה זמין</span>
                    </div>

                    <div className="mt-6 p-4 border-t border-dashed">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl font-bold text-green-700">₪{huntedDraft?.price || editingProduct?.price || '0.00'}</span>
                          <span className="text-gray-400 text-xs text-left">לינק קסם: sidor.app/p/...</span>
                       </div>
                       <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-100 hover:scale-95 transition">
                          🛒 הוספה לסל מהירה
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* צד ימין: ניהול מוצרים ועריכה */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-gray-600 font-bold">מוצר</th>
                  <th className="p-4 text-gray-600 font-bold text-center">מדד בריאות</th>
                  <th className="p-4 text-gray-600 font-bold">מחיר</th>
                  <th className="p-4 text-gray-600 font-bold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image_url} className="w-12 h-12 rounded-lg object-cover border" />
                        <div>
                          <div className="font-bold text-gray-800">{product.product_name}</div>
                          <div className="text-xs text-gray-400">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 w-24">
                          <div 
                            className={`h-1.5 rounded-full ${calculateScore(product) > 70 ? 'bg-green-500' : 'bg-orange-400'}`} 
                            style={{ width: `${calculateScore(product)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">{calculateScore(product)}% מושלם</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-blue-600">₪{product.price}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingProduct(product)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={18} /></button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* מודל עריכה / הזרקת מוצר חדש */}
      {(editingProduct || huntedDraft?.product_name) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? 'עריכת מוצר במוח' : 'הזרקת מוצר מהרשת'}
              </h2>
              <button onClick={() => { setEditingProduct(null); setHuntedDraft(null); }} className="text-gray-400 hover:text-black">✖</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">שם המוצר</label>
                <input 
                  value={editingProduct?.product_name || huntedDraft?.product_name} 
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, product_name: e.target.value}) : setHuntedDraft({...huntedDraft, product_name: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
                
                <label className="block text-sm font-bold text-gray-700">תיאור טכני</label>
                <textarea 
                  rows={4}
                  value={editingProduct?.description || huntedDraft?.description} 
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setHuntedDraft({...huntedDraft, description: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">לינק לתמונה</label>
                <input 
                  value={editingProduct?.image_url || huntedDraft?.image_url} 
                  className="w-full p-2 border rounded-lg text-xs" 
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, image_url: e.target.value}) : setHuntedDraft({...huntedDraft, image_url: e.target.value})}
                />
                
                <label className="block text-sm font-bold text-gray-700">לינק יוטיוב</label>
                <input 
                  value={editingProduct?.youtube_url || huntedDraft?.youtube_url} 
                  className="w-full p-2 border rounded-lg text-xs" 
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, youtube_url: e.target.value}) : setHuntedDraft({...huntedDraft, youtube_url: e.target.value})}
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">מחיר סבן</label>
                    <input 
                      type="number"
                      value={editingProduct?.price || huntedDraft?.price} 
                      className="w-full p-2 border rounded-lg" 
                      onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, price: e.target.value}) : setHuntedDraft({...huntedDraft, price: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">מק"ט</label>
                    <input 
                      value={editingProduct?.sku || huntedDraft?.sku} 
                      className="w-full p-2 border rounded-lg" 
                      onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, sku: e.target.value}) : setHuntedDraft({...huntedDraft, sku: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => handleSave(editingProduct || huntedDraft)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                <Save size={20} /> שמור והזרק למוח
              </button>
              <button 
                onClick={() => { setEditingProduct(null); setHuntedDraft(null); }}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dir-rtl { direction: rtl; }
      `}</style>
    </div>
  );
}
