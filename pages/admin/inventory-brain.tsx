import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Edit2, Zap, X, Trash2, Database } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function InventoryBrain() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntQuery, setHuntQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
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
    } catch (e: any) { alert("⚠️ " + e.message); }
    finally { setLoading(false); }
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
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden" dir="rtl">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-600" />
          <h1 className="text-xl font-black italic">Saban OS Intelligence</h1>
        </div>
        <div className="flex gap-2">
          <input 
            className="p-2 border rounded-xl font-bold text-sm w-64" 
            placeholder="חפש מוצר להזרקה..." 
            value={huntQuery} 
            onChange={e => setHuntQuery(e.target.value)}
          />
          <button onClick={runHunt} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm">
            {loading ? "סורק..." : "צוד"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr className="text-[10px] font-black text-slate-400 uppercase">
                <th className="p-4">מוצר</th>
                <th className="p-4">מחיר</th>
                <th className="p-4">ייבוש</th>
                <th className="p-4">כיסוי</th>
                <th className="p-4">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-blue-50/20">
                  <td className="p-4 flex items-center gap-3">
                    <img src={p.image_url} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-bold text-xs">{p.product_name}</span>
                  </td>
                  <td className="p-4 font-black">₪{p.price}</td>
                  <td className="p-4 text-blue-600 text-xs">{p.dry_time}</td>
                  <td className="p-4 text-emerald-600 text-xs">{p.coverage_rate}</td>
                  <td className="p-4">
                    <button onClick={() => {setEditingProduct(p); setIsModalOpen(true);}} className="text-slate-400 hover:text-blue-600">
                      <Edit2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] p-8">
            <h2 className="text-xl font-black mb-6 italic">עריכת מוצר</h2>
            <div className="grid grid-cols-2 gap-4">
               <input className="p-3 border rounded-xl" value={editingProduct.product_name} onChange={e => setEditingProduct({...editingProduct, product_name: e.target.value})} placeholder="שם מוצר" />
               <input className="p-3 border rounded-xl" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} placeholder="מחיר" />
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={saveToDB} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">שמור</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
