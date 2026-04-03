import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Edit2, Zap, X, Plus, Database, Loader2, Save } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function InventoryBrain() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntQuery, setHuntQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Zap, Database, Plus, Search, ExternalLink, Package, Droplets } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SabanStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('לוחות גבס');

  useEffect(() => { fetchStudioData(); }, [activeTab]);

  const fetchStudioData = async () => {
    const { data } = await supabase.from('brain_inventory').select('*').eq('category', activeTab).order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const autoInject = async (product: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: product, category: activeTab }),
      });
      const data = await res.json();
      
      const { error } = await supabase.from('brain_inventory').upsert({
        ...data,
        stock_status: 'available'
      }, { onConflict: 'sku' });

      if (!error) fetchStudioData();
    } catch (e) { alert("שגיאת הזרקה"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans dir-rtl" dir="rtl">
      {/* Header סטודיו */}
      <header className="p-6 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Zap size={24}/></div>
            <h1 className="text-2xl font-black tracking-tighter italic">SABAN <span className="text-blue-500">STUDIO</span></h1>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl">
            {['לוחות גבס', 'חומרי מחצבה'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activeTab === 'לוחות גבס' ? (
            ['לוח גבס רגיל', 'לוח גבס חסין אש', 'לוח גבס ירוק', 'לוח צמנט בורד'].map(p => (
              <button key={p} onClick={() => autoInject(p)} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-xs font-bold hover:border-blue-500 transition-all active:scale-95">
                + הזרק {p}
              </button>
            ))
          ) : (
            ['חול בלה', 'סומסום בלה', 'חצץ בלה', 'טיט מוכן'].map(p => (
              <button key={p} onClick={() => autoInject(p)} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-xs font-bold hover:border-blue-500 transition-all active:scale-95">
                + הזרק {p}
              </button>
            ))
          )}
        </div>

        {/* Real-time Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all">
              <div className="relative h-48 overflow-hidden">
                <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black shadow-xl">
                  {item.sku}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-black line-clamp-1">{item.product_name}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1 flex items-center gap-1"><Droplets size={10}/> ייבוש</p>
                    <p className="text-xs font-bold text-blue-400">{item.dry_time}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1 flex items-center gap-1"><Package size={10}/> כיסוי</p>
                    <p className="text-xs font-bold text-emerald-400">{item.coverage_rate}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 italic">"{item.description}"</p>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xl font-black italic">₪{item.price}</span>
                  <a href={item.technical_doc_url} target="_blank" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors">
                    <ExternalLink size={18}/>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {loading && (
        <div className="fixed bottom-10 left-10 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Zap size={20} className="animate-pulse"/>
          <span className="font-black text-sm">המוח מזריק נתונים...</span>
        </div>
      )}
    </div>
  );
}
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
    setSearchResults([]);
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

  const openManualOrInject = (res?: any) => {
    setEditingProduct(res ? {
      product_name: res.title,
      description: res.description,
      image_url: res.image,
      dry_time: res.dry_time,
      coverage_rate: res.coverage_rate,
      application_method: res.application_method,
      sku: `SBN-${Math.floor(Math.random() * 90000 + 10000)}`,
      price: 0
    } : {
      product_name: '', description: '', image_url: '', dry_time: '', coverage_rate: '', application_method: '', sku: `SBN-${Math.floor(Math.random() * 90000 + 10000)}`, price: 0
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
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden dir-rtl text-right font-sans" dir="rtl">
      
      {/* Top Bar - Search & Manual Plus */}
      <header className="bg-white border-b p-4 shadow-sm z-50 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <input 
              className="w-full p-3 pr-10 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="חפש בגוגל להזרקה..." 
              value={huntQuery} 
              onChange={e => setHuntQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runHunt()}
            />
            <Search className="absolute right-3 top-3 text-slate-400" size={18}/>
          </div>
          <button onClick={runHunt} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-transform">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>}
          </button>
          <button onClick={() => openManualOrInject()} className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-transform">
            <Plus size={20}/>
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Google Results Horizontal Scroll */}
        {searchResults.length > 0 && (
          <div className="p-4 flex gap-3 overflow-x-auto shrink-0 bg-blue-50/50 border-b custom-scrollbar">
            {searchResults.map((res, i) => (
              <div key={i} onClick={() => openManualOrInject(res)} className="min-w-[140px] bg-white p-2 rounded-2xl border shadow-sm active:scale-95 transition-all">
                <img src={res.image || '/no-image.png'} className="w-full h-20 object-cover rounded-xl mb-1" />
                <p className="text-[9px] font-black line-clamp-2 leading-tight">{res.title}</p>
              </div>
            ))}
          </div>
        )}

        {/* Inventory List (Mobile Cards) */}
        <div className="p-4 max-w-4xl mx-auto space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Database size={14}/> מלאי Saban OS</h2>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{products.length} פריטים</span>
          </div>

          {products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-[1.5rem] border shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <img src={p.image_url} className="w-14 h-14 rounded-2xl object-cover border" />
                <div>
                  <h3 className="font-black text-sm text-slate-800 line-clamp-1">{p.product_name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold text-blue-600">₪{p.price}</span>
                    <span className="text-[10px] text-slate-400">|</span>
                    <span className="text-[10px] font-medium text-slate-500">{p.dry_time || 'אין נתון'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => {setEditingProduct(p); setIsModalOpen(true);}} className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-blue-600 transition-colors">
                <Edit2 size={18}/>
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Full Screen Modal for Editing/Manual Entry */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
          <header className="p-4 border-b flex justify-between items-center shrink-0">
            <h2 className="font-black text-lg italic text-slate-800">ניהול <span className="text-blue-600">מוצר</span></h2>
            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            <Field label="שם מוצר מלא" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              <Field label="מק״ט" value={editingProduct.sku} onChange={v => setEditingProduct({...editingProduct, sku: v})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              <Field label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
            </div>
            <Field label="שיטת יישום" value={editingProduct.application_method} onChange={v => setEditingProduct({...editingProduct, application_method: v})} />
            <Field label="לינק לתמונה" value={editingProduct.image_url} onChange={v => setEditingProduct({...editingProduct, image_url: v})} />
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">תיאור טכני</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl h-32 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500" 
                value={editingProduct.description} 
                onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
              />
            </div>
          </div>

          <div className="p-4 border-t bg-white shrink-0">
            <button onClick={saveToDB} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Save size={20}/> שמור והזרק ל-DB
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        body { margin: 0; height: 100vh; overflow: hidden; }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest">{label}</label>
      <input 
        type={type} 
        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
