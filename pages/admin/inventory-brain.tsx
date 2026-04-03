import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Zap, Search, Edit2 } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function InventoryBrain() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntQuery, setHuntQuery] = useState('');

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden" dir="rtl">
      <header className="bg-white border-b p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="text-blue-600" />
          <h1 className="font-black italic">Saban OS Intelligence</h1>
        </div>
        <div className="flex gap-2">
          <input 
            className="p-2 border rounded-xl text-sm w-64" 
            placeholder="צוד מוצר..." 
            value={huntQuery}
            onChange={(e) => setHuntQuery(e.target.value)}
          />
          <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold">צוד</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="bg-white rounded-2xl border shadow-sm">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b sticky top-0">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">מוצר</th>
                <th className="p-4">מחיר</th>
                <th className="p-4">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-blue-50/20 transition-all">
                  <td className="p-4 flex items-center gap-3 font-bold text-sm">
                    <img src={p.image_url} className="w-10 h-10 rounded-lg object-cover" />
                    {p.product_name}
                  </td>
                  <td className="p-4 font-black">₪{p.price}</td>
                  <td className="p-4"><Edit2 size={14} className="text-slate-300"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
