'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  PackageSearch, Save, Youtube, Image as ImageIcon, Calculator, 
  BrainCircuit, Search, Send, Activity, HardHat, FileText
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function InventoryBrain() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    ai_protocol: '',
    image_url: '',
    youtube_url: '',
    consumption_per_mm: 1.6,
    packaging_size: 25,
    price: 0
  });

  const [isSaving, setIsSaving] = useState(false);
  
  // סימולטור
  const [simMessages, setSimMessages] = useState<{role: 'ai'|'user', text: string}[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isSimTyping, setIsSimTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('sku', { ascending: true });
    
    if (!error && data) setProducts(data);
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name || '',
      description: product.description || '',
      ai_protocol: product.ai_protocol || '',
      image_url: product.image_url || '',
      youtube_url: product.youtube_url || '',
      consumption_per_mm: product.consumption_per_mm || 1.6,
      packaging_size: product.packaging_size || 25,
      price: product.price || 0
    });
    setSimMessages([{ role: 'ai', text: `אהלן! אני המוח הטכני של ${product.product_name}. תשאל אותי שאלות טכניות ואענה לפי הפרוטוקול שכתבת.` }]);
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    
    // יצירת מחרוזת החיפוש עבור המוח (search_text)
    const searchText = `${formData.product_name} ${selectedProduct.sku} ${formData.description}`.toLowerCase().trim();
    
    const updatePayload = {
      ...formData,
      search_text: searchText // עדכון עמודת החיפוש שלינק קסם והמוח משתמשים בה
    };

    const { error } = await supabase
      .from('inventory')
      .update(updatePayload)
      .eq('sku', selectedProduct.sku);
      
    setIsSaving(false);
    if (!error) {
      alert('✅ המוח הטכני ועמודת החיפוש עודכנו בהצלחה!');
      fetchInventory();
    } else {
      alert('❌ שגיאה בשמירה: ' + error.message);
    }
  };

  const handleSimulate = async () => {
    if (!simInput.trim() || isSimTyping || !selectedProduct) return;
    
    const userText = simInput.trim();
    setSimInput('');
    setSimMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsSimTyping(true);

    const dynamicContext = `
      אתה יועץ טכני מומחה של "ח. סבן".
      המוצר: ${formData.product_name}.
      נתונים: ${formData.description}. אריזה: ${formData.packaging_size} ק"ג. צריכה: ${formData.consumption_per_mm}.
      -- פרוטוקול AI --
      ${formData.ai_protocol}
    `;

    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, senderPhone: "simulator", context: dynamicContext })
      });
      const data = await res.json();
      setSimMessages(prev => [...prev, { role: 'ai', text: data.reply || 'שגיאה מהמוח' }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', text: 'שגיאת תקשורת' }]);
    } finally {
      setIsSimTyping(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.sku?.toString().includes(search) || p.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden" dir="rtl">
      <Head><title>Saban | מעבדת יועץ טכני</title></Head>

      {/* 1. רשימת מלאי */}
      <aside className="w-80 bg-white border-l shadow-xl flex flex-col shrink-0 z-20">
        <header className="p-6 bg-slate-900 text-white border-b-4 border-emerald-500">
          <h1 className="text-xl font-black flex items-center gap-2"><HardHat /> SABAN <span className="text-emerald-400">TECH</span></h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ניהול מלאי ואימון המוח</p>
        </header>

        <div className="p-4 border-b bg-slate-50">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="חיפוש מקט או שם..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border pr-10 pl-4 py-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredProducts.map(p => (
            <div 
              key={p.sku} 
              onClick={() => handleSelectProduct(p)}
              className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all border ${selectedProduct?.sku === p.sku ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-slate-50 border-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black overflow-hidden shrink-0 ${selectedProduct?.sku === p.sku ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover"/> : <PackageSearch size={18} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 truncate">{p.product_name}</h3>
                <p className="text-[10px] font-mono text-slate-500">SKU: {p.sku}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 2. אזור העריכה והאימון */}
      <main className="flex-1 p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {!selectedProduct ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
            <BrainCircuit size={80} className="mb-4 animate-pulse" />
            <h2 className="text-2xl font-black">בחר מוצר מהרשימה לקידוד המוח</h2>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
            <div className="flex-1 space-y-6">
              {/* כותרת מוצר */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border overflow-hidden">
                    {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover"/> : <PackageSearch size={32} className="m-auto mt-4 text-slate-300" />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900">{formData.product_name}</h1>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">ACTIVE PRODUCT</span>
                  </div>
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400">SKU</p>
                   <p className="font-mono font-bold">{selectedProduct.sku}</p>
                </div>
              </div>

              {/* נתונים טכניים למחשבון */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">
                <h2 className="font-black flex items-center gap-2 text-slate-800 text-lg border-b pb-4"><Calculator className="text-emerald-500"/> נתונים למחשבון ומדיה</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">משקל אריזה (ק"ג)</label>
                    <input type="number" value={formData.packaging_size} onChange={e => setFormData({...formData, packaging_size: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">צריכה למ"מ (מקדם)</label>
                    <input type="number" step="0.1" value={formData.consumption_per_mm} onChange={e => setFormData({...formData, consumption_per_mm: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">לינק תמונה</label>
                    <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none text-sm font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">לינק יוטיוב (הדרכה)</label>
                    <input type="text" value={formData.youtube_url} onChange={e => setFormData({...formData, youtube_url: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none text-sm font-mono" />
                  </div>
                </div>
              </div>

              {/* פרוטוקול AI */}
              <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl space-y-6">
                <h2 className="font-black flex items-center gap-2 text-emerald-400 text-lg"><BrainCircuit /> קידוד ה-DNA של המוח</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-widest">מפרט טכני לחיפוש (Description)</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-emerald-500 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-emerald-500 block mb-2 uppercase tracking-widest">פרוטוקול שירות ומכירה (AI Protocol)</label>
                    <textarea value={formData.ai_protocol} onChange={e => setFormData({...formData, ai_protocol: e.target.value})} rows={5} className="w-full bg-white/10 border-2 border-emerald-500/20 p-4 rounded-2xl outline-none focus:border-emerald-500 text-white text-sm font-bold" />
                  </div>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-500 text-slate-900 font-black py-5 rounded-2xl shadow-lg hover:bg-emerald-400 active:scale-95 transition-all flex justify-center items-center gap-3">
                  <Save size={20} /> {isSaving ? 'מעדכן DB...' : 'שמור נתונים ואימון המוח'}
                </button>
              </div>
            </div>

            {/* סימולטור */}
            <div className="w-[380px] shrink-0 sticky top-8">
              <div className="bg-white border-[14px] border-slate-900 rounded-[3.5rem] h-[700px] shadow-2xl relative flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-4 text-white flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-black">AI</div>
                  <div>
                    <div className="font-black text-sm">סימולטור המוח</div>
                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Live Testing Mode</div>
                  </div>
                </div>
                
                <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                   <div className="text-[10px] text-center bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold border border-emerald-200">בדיקת המוח על המוצר הנוכחי</div>
                   {simMessages.map((msg, i) => (
                    <div key={i} className={`p-3 max-w-[90%] text-sm rounded-2xl shadow-sm ${msg.role === 'ai' ? 'bg-white self-start border border-slate-200 rounded-tr-none' : 'bg-emerald-500 text-white self-end rounded-tl-none'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ))}
                  {isSimTyping && <div className="bg-white p-3 rounded-2xl self-start animate-pulse text-xs font-bold text-slate-400">המוח חושב...</div>}
                </div>

                <div className="p-4 bg-white border-t flex items-center gap-2 shrink-0">
                  <input type="text" value={simInput} onChange={e => setSimInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSimulate()} placeholder="שאל שאלה טכנית..." className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none font-bold" />
                  <button onClick={handleSimulate} className="w-12 h-12 bg-slate-900 rounded-xl flex justify-center items-center text-white"><Send size={18} className="rotate-180 ml-1" /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
