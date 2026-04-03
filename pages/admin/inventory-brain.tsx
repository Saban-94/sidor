import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Edit2, Zap, X, Trash2, CheckCircle, Info, BarChart3, Database, MoveRight } from 'lucide-react';

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

  const calculateScore = (p: any) => {
    let s = 0;
    if (p.image_url && p.image_url.startsWith('http')) s += 25;
    if (p.dry_time && p.dry_time !== "לא צוין") s += 25;
    if (p.coverage_rate && p.coverage_rate !== "לא צוין") s += 25;
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
      if (!res.ok) throw new Error(data.error);
      setSearchResults(data.results || []);
    } catch (e: any) { alert("⚠️ " + e.message); }
    finally { setLoading(false); }
  };

  const injectResult = (res: any) => {
    setEditingProduct({
      product_name: res.title,
      description: res.description,
      image_url: res.image,
      dry_time: res.dry_time,
      coverage_rate: res.coverage_rate,
      application_method: res.application_method,
      sku: `SBN-${Math.floor(Math.random() * 90000 + 10000)}`,
      price: 0
    });
    setIsModalOpen(true);
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
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden dir-rtl" dir="rtl">
      
      {/* 1. שורת חיפוש עליונה קבועה */}
      <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><Zap size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter">Saban OS <span className="text-blue-600">Intelligence</span></h1>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-96">
            <input 
              className="w-full p-3 pr-10 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold transition-all text-sm" 
              placeholder="חפש מוצר להזרקה (גבס, צבע, טיח)..." 
              value={huntQuery} 
              onChange={e => setHuntQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runHunt()}
            />
            <Search className="absolute right-3 top-3.5 text-slate-400" size={18}/>
          </div>
          <button onClick={runHunt} className="bg-slate-900 text-white px-6 rounded-xl font-black hover:bg-blue-600 transition-all active:scale-95 text-sm shadow-md">
            {loading ? "סורק..." : "צוד"}
          </button>
        </div>
      </header>

      {/* 2. גוף הממשק - מחולק לסיידבר ותוכן עם גלילה עצמאית */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* תוצאות ציד - גלילה אופקית מהירה */}
        {searchResults.length > 0 && (
          <div className="w-full bg-white border-b p-4 flex gap-4 overflow-x-auto custom-scrollbar shrink-0">
            {searchResults.map((res, i) => (
              <div key={i} onClick={() => injectResult(res)} className="min-w-[200px] bg-slate-50 p-3 rounded-2xl border-2 hover:border-blue-500 cursor-pointer transition-all group relative">
                <div className="absolute top-2 left-2 bg-blue-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Zap size={12}/></div>
                <img src={res.image || '/no-image.png'} className="w-full h-24 object-cover rounded-xl mb-2" />
                <p className="text-[10px] font-black line-clamp-2 leading-tight">{res.title}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* טבלת מלאי - אזור גלילה מרכזי */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-white shadow-inner">
            <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-2xl border">
              <h2 className="text-lg font-black flex items-center gap-2"><Database className="text-blue-600"/> מלאי המוח בזמן אמת</h2>
              <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest text-slate-500">{products.length} מוצרים רשומים</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[800px]">
                <thead className="bg-slate-50/80 sticky top-0 z-10 border-b">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    <th className="p-4">מוצר</th>
                    <th className="p-4">מחיר (₪)</th>
                    <th className="p-4">ייבוש</th>
                    <th className="p-4">כיסוי</th>
                    <th className="p-4">שיטה</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4">עריכה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-all">
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
                      <td className="p-4 text-[11px] text-slate-500 font-medium">{p.application_method || "-"}</td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${calculateScore(p) > 70 ? 'bg-green-500' : 'bg-blue-400'}`} style={{width: `${calculateScore(p)}%`}}></div>
                          </div>
                          <span className="text-[9px] font-black text-slate-400">{calculateScore(p)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => {setEditingProduct(p); setIsModalOpen(true);}} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Edit2 size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>

          {/* iPhone Simulator - קבוע בדסקטופ, נעלם במובייל כדי לפנות מקום */}
          <aside className="hidden xl:flex w-96 flex-col p-6 bg-slate-50 border-r overflow-y-auto shrink-0">
             <div className="bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800 w-[280px] h-[580px] mx-auto sticky top-4">
                <div className="bg-white h-full w-full rounded-[2.2rem] overflow-hidden flex flex-col relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-10"></div>
                  <img src={editingProduct?.image_url} className="h-40 w-full object-cover" />
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-black text-base text-slate-800 mb-3 h-10 overflow-hidden line-clamp-2">{editingProduct?.product_name || "ממתין להזרקה..."}</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 p-2 rounded-xl text-center"><p className="text-[8px] text-slate-400">ייבוש</p><p className="text-[9px] font-black text-blue-600">{editingProduct?.dry_time || "--"}</p></div>
                      <div className="bg-green-50 p-2 rounded-xl text-center"><p className="text-[8px] text-slate-400">כיסוי</p><p className="text-[9px] font-black text-green-600">{editingProduct?.coverage_rate || "--"}</p></div>
                    </div>
                    <p className="text-[9px] text-slate-500 italic leading-relaxed line-clamp-3">{editingProduct?.description}</p>
                    <div className="mt-auto pt-4 border-t flex justify-between items-center">
                      <span className="text-xl font-black italic">₪{editingProduct?.price || 0}</span>
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold">הוספה</button>
                    </div>
                  </div>
                </div>
             </div>
          </aside>
        </div>
      </div>

      {/* Editor Modal - מותאם למובייל עם גלילה פנימית */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-t-[2rem] lg:rounded-[2.5rem] shadow-2xl p-6 lg:p-10 flex flex-col max-h-[95vh] animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic tracking-tighter">הזרקה למוח <span className="text-blue-600">Saban AI</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-4">
                  <Field label="שם מוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
                    <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
                  </div>
                  <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
                </div>
                <div className="space-y-4">
                  <Field label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
                  <Field label="שיטת יישום" value={editingProduct.application_method} onChange={v => setEditingProduct({...editingProduct, application_method: v})} />
                  <Field label="לינק תמונה" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">תיאור טכני ושיווקי</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-24 outline-none text-xs font-medium focus:border-blue-500 transition-all" 
                    value={editingProduct.description} 
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3 pt-4 border-t shrink-0">
              <button onClick={saveToDB} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:scale-[1.01] transition-all active:scale-95">שמור והזרק ל-DB</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-500 py-4 rounded-2xl font-black border-2 border-slate-100 hover:bg-slate-50 transition">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">{label}</label>
      <input 
        type={type} 
        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none font-black focus:border-blue-500 transition-all" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
