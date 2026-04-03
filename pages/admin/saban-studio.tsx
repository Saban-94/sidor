import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Zap, Database, Plus, Search, ExternalLink, Package, Droplets, Loader2, X, Save } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SabanStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntQuery, setHuntQuery] = useState('');
  const [activeTab, setActiveTab] = useState('לוחות גבס');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStudioData();
  }, [activeTab]);

  const fetchStudioData = async () => {
    const { data } = await supabase
      .from('brain_inventory')
      .select('*')
      .eq('category', activeTab)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const autoInject = async (productName: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: productName, category: activeTab }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      const { error } = await supabase
        .from('brain_inventory')
        .upsert({
          ...data,
          stock_status: 'available'
        }, { onConflict: 'sku' });

      if (error) throw error;
      fetchStudioData();
    } catch (e: any) {
      alert("⚠️ שגיאת הזרקה: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveManual = async () => {
    const { error } = await supabase
      .from('brain_inventory')
      .upsert({
        ...editingProduct,
        category: activeTab,
        search_text: editingProduct.product_name?.toLowerCase()
      }, { onConflict: 'sku' });

    if (!error) {
      setIsModalOpen(false);
      fetchStudioData();
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans dir-rtl" dir="rtl">
      {/* Header */}
      <header className="p-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Zap size={24}/></div>
            <h1 className="text-2xl font-black tracking-tighter italic text-white">SABAN <span className="text-blue-500">STUDIO</span></h1>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
            {['לוחות גבס', 'חומרי מחצבה'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Quick Actions & Manual Input */}
        <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              className="flex-1 p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm"
              placeholder={`הזרקה ידנית ל${activeTab}...`}
              value={huntQuery}
              onChange={(e) => setHuntQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && autoInject(huntQuery)}
            />
            <button 
              onClick={() => autoInject(huntQuery)}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
              הזרק עכשיו
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(activeTab === 'לוחות גבס' ? ['לוח גבס רגיל', 'לוח גבס ירוק', 'לוח צמנט בורד', 'גבס חסין אש'] : ['חול בלה', 'סומסום בלה', 'חצץ בלה', 'חומר מחצבה בתפזורת']).map(p => (
              <button 
                key={p} 
                onClick={() => autoInject(p)}
                className="bg-slate-800/30 border border-slate-700/50 p-3 rounded-xl text-[11px] font-bold text-slate-300 hover:bg-slate-800 hover:border-blue-500 transition-all active:scale-95"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col">
              <div className="h-44 relative">
                <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-black">{item.sku}</div>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4">
                <h3 className="text-lg font-black text-white">{item.product_name}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 p-2 rounded-xl">
                    <span className="text-[8px] text-slate-500 block font-black mb-1 italic tracking-widest"><Droplets size={10} className="inline ml-1"/> ייבוש</span>
                    <span className="text-xs font-bold text-blue-400">{item.dry_time}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl">
                    <span className="text-[8px] text-slate-500 block font-black mb-1 italic tracking-widest"><Package size={10} className="inline ml-1"/> כיסוי</span>
                    <span className="text-xs font-bold text-emerald-400">{item.coverage_rate}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">"{item.description}"</p>
                <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xl font-black italic text-blue-500">₪{item.price}</span>
                  <button 
                    onClick={() => {setEditingProduct(item); setIsModalOpen(true);}}
                    className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Editor Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] border border-slate-800 p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">עריכת מוצר בסטודיו</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 rounded-full"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="שם מוצר" value={editingProduct.product_name} onChange={v => setEditingProduct({...editingProduct, product_name: v})} />
              <Field label="מחיר (₪)" type="number" value={editingProduct.price} onChange={v => setEditingProduct({...editingProduct, price: v})} />
              <Field label="זמן ייבוש" value={editingProduct.dry_time} onChange={v => setEditingProduct({...editingProduct, dry_time: v})} />
              <Field label="כושר כיסוי" value={editingProduct.coverage_rate} onChange={v => setEditingProduct({...editingProduct, coverage_rate: v})} />
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={saveManual} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2"><Save size={20}/> שמור הזרקה</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black">ביטול</button>
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
      <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{label}</label>
      <input type={type} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-sm text-white focus:border-blue-500" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// קומפוננטת אייקון עריכה חסרה
function Edit2({ size, className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
  );
}
