import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Edit2, Zap, X, Database } from 'lucide-react';

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
    if (!editingProduct) return;
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
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden dir-rtl" dir="rtl">
      {/* Search Header */}
      <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-600" />
          <h1 className="text-xl font-black italic">Saban OS Intelligence</h1>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input 
            className="flex-1 md:w-96 p-3 bg-slate-50 border-2 rounded-xl outline-none font-bold text-sm" 
            placeholder="צוד מוצר להזרקה..." 
            value={huntQuery} 
            onChange={e => setHuntQuery(e.target.value)}
          />
          <button onClick={runHunt} className="bg-slate-900 text-white px-6 rounded-xl font-black text-sm shadow-md">
            {loading ? "סורק..." : "צוד"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-white">
        <div className="bg-white rounded-2xl border overflow-x-auto shadow-sm">
          <table className="w-full text-right border-collapse min-w-[800px]">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">מוצר</th>
                <th className="p-4">מחיר (₪)</th>
                <th className="p-4">ייבוש</th>
                <th className="p-4">כיסוי</th>
                <th className="p-4">שיטה</th>
                <th className="p-4 text-center">עריכה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-blue-50/20 transition-all">
                  <td className="p-4 flex items-center gap-3">
                    <img src={p.image_url} className="w-10 h-10 rounded-lg object-cover border" />
                    <div className="max-w-[200px]">
                      <div className="font-black text-xs truncate">{p.product_name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">#{p.sku}</div>
                    </div>
                  </td>
                  <td className="p-4 font-black text-slate-700">₪{p.price || 0}</td>
                  <td className="p-4 text-[11px] font-bold text-blue-600">{p.dry_time || "-"}</td>
                  <td className="p-4 text-[11px] font-bold text-emerald-600">{p.coverage_rate || "-"}</td>
                  <td className="p-4 text-[11px] text-slate-500">{p.application_method || "-"}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => {setEditingProduct(p); setIsModalOpen(true);}} className="text-slate-400 hover:text-blue-600">
                      <Edit2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Section */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black mb-6 italic">עריכת מוצר <span className="text-blue-600">AI</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="p-3 bg-slate-50 border rounded-xl font-bold" value={editingProduct.product_name} onChange={e => setEditingProduct({...editingProduct, product_name: e.target.value})} placeholder="שם מוצר" />
              <input className="p-3 bg-slate-50 border rounded-xl font-bold" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} placeholder="מחיר" />
              <input className="p-3 bg-slate-50 border rounded-xl font-bold" value={editingProduct.dry_time} onChange={e => setEditingProduct({...editingProduct, dry_time: e.target.value})} placeholder="זמן ייבוש" />
              <input className="p-3 bg-slate-50 border rounded-xl font-bold" value={editingProduct.coverage_rate} onChange={e => setEditingProduct({...editingProduct, coverage_rate: e.target.value})} placeholder="כיסוי" />
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl">שמור והזרק ל-DB</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black border">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
