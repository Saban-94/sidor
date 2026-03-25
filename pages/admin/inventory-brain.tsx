import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  PackageSearch, Save, Youtube, Image as ImageIcon, Calculator, 
  BrainCircuit, Search, Send, Activity, ArrowRight, HardHat
} from 'lucide-react';

// אתחול Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function InventoryBrain() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // שדות טופס
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
    
    const { error } = await supabase
      .from('inventory')
      .update(formData)
      .eq('sku', selectedProduct.sku);
      
    setIsSaving(false);
    if (!error) {
      alert('✅ עודכן בהצלחה במסד הנתונים!');
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

    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);

    // הזרקת ה-DNA הטכני של המוצר הספציפי לסימולטור
    const dynamicContext = `
      אתה יועץ טכני מומחה של "ח. סבן".
      הלקוח שואל כרגע על המוצר: ${formData.product_name}.
      
      -- נתונים טכניים יבשים --
      ${formData.description}
      אריזה: ${formData.packaging_size} ק"ג.
      צריכה ממוצעת: ${formData.consumption_per_mm} למ"מ.
      וידאו הדרכה: ${formData.youtube_url || 'אין'}
      
      -- 🔴 פרוטוקול חובה (הנחיות התנהגות מול המוצר) 🔴 --
      ${formData.ai_protocol || 'הסבר באופן מקצועי, קצר וברור. הצע עזרה בחישוב כמויות.'}
      
      הוראה: אם הלקוח שואל איך ליישם או מה היתרונות, ענה אך ורק לפי הפרוטוקול מעלה. תהיה קצר וקולע.
    `;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          senderPhone: "simulator",
          context: dynamicContext
        })
      });
      const data = await res.json();
      setSimMessages(prev => [...prev, { role: 'ai', text: data.reply || 'שגיאה מהמוח' }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', text: 'שגיאת תקשורת עם המוח המקומי' }]);
    } finally {
      setIsSimTyping(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  };

  const filteredProducts = products.filter(p => 
    p.sku?.toString().includes(search) || p.product_name?.includes(search)
  );

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden" dir="rtl">
      <Head><title>Saban | מעבדת יועץ טכני</title></Head>

      {/* 1. רשימת מלאי */}
      <aside className="w-80 bg-white border-l shadow-xl flex flex-col shrink-0 z-20">
        <header className="p-6 bg-slate-900 text-white border-b-4 border-amber-500">
          <h1 className="text-xl font-black flex items-center gap-2"><HardHat /> SABAN <span className="text-amber-400">TECH</span></h1>
          <p className="text-xs font-bold text-amber-200 mt-1">ניהול מלאי ויועץ טכני AI</p>
        </header>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="חיפוש מק\"ט או שם..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 pr-10 pl-4 py-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredProducts.map(p => (
            <div 
              key={p.sku} 
              onClick={() => handleSelectProduct(p)}
              className={`p-3 mb-1 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${selectedProduct?.sku === p.sku ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50 border border-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black overflow-hidden shrink-0 ${selectedProduct?.sku === p.sku ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover"/> : <PackageSearch size={18} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 truncate">{p.product_name}</h3>
                <p className="text-xs font-mono text-slate-500">{p.sku}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 2. אזור העריכה */}
      <main className="flex-1 p-8 overflow-y-auto flex flex-col lg:flex-row gap-8 relative">
        {!selectedProduct ? (
          <div className="m-auto flex flex-col items-center justify-center text-slate-400 opacity-50">
            <BrainCircuit size={80} className="mb-4" />
            <h2 className="text-2xl font-bold">בחר מוצר מהרשימה לקידוד המוח הטכני</h2>
          </div>
        ) : (
          <>
            <div className="flex-1 max-w-2xl space-y-6">
              <header className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex justify-center items-center border border-amber-200 overflow-hidden">
                   {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover"/> : <HardHat size={32} />}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{formData.product_name}</h1>
                  <p className="text-sm font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">מק"ט: {selectedProduct.sku}</p>
                </div>
              </header>

              {/* נתונים לוגיסטיים ומחשבון */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="font-black flex items-center gap-2 text-slate-800"><Calculator size={18} className="text-blue-500"/> נתוני מחשבון ומדיה</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">משקל שק/אריזה (ק"ג)</label>
                    <input type="number" value={formData.packaging_size} onChange={e => setFormData({...formData, packaging_size: Number(e.target.value)})} className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:border-blue-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">צריכה למ"מ (מקדם)</label>
                    <input type="number" step="0.1" value={formData.consumption_per_mm} onChange={e => setFormData({...formData, consumption_per_mm: Number(e.target.value)})} className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:border-blue-500 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1"><ImageIcon size={12}/> לינק לתמונה</label>
                    <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl outline-none text-sm dir-ltr text-left" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1"><Youtube size={12}/> סרטון יוטיוב</label>
                    <input type="text" value={formData.youtube_url} onChange={e => setFormData({...formData, youtube_url: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl outline-none text-sm dir-ltr text-left" placeholder="https://youtube.com/..." />
                  </div>
                </div>
              </div>

              {/* המוח (DNA טכני) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="font-black flex items-center gap-2 text-slate-800"><BrainCircuit size={18} className="text-emerald-500"/> קידוד המוח הטכני</h2>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">מפרט טכני יבש (Description)</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:border-emerald-500 text-sm" placeholder="תיאור המוצר, תקנים..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1 bg-amber-100 p-2 rounded-lg">פרוטוקול התנהגות AI מול הלקוח (AI Protocol) 🧠</label>
                  <textarea value={formData.ai_protocol} onChange={e => setFormData({...formData, ai_protocol: e.target.value})} rows={4} className="w-full bg-slate-50 border-2 border-amber-200 p-3 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-700" placeholder='לדוגמה: "הדגש ללקוח שחובה למרוח פריימר לפני. אם הוא שואל על כמויות - השתמש בנתוני המחשבון כדי לתת לו תשובה מדוייקת. דבר אליו כמו מנהל עבודה."' />
                </div>
              </div>

              <button onClick={handleSave} disabled={isSaving} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2">
                <Save size={18} /> {isSaving ? 'שומר ב-Supabase...' : 'שמור נתונים ופרוטוקול'}
              </button>
            </div>

            {/* 3. סימולטור חי */}
            <div className="w-[350px] shrink-0 flex flex-col items-center">
              <div className="bg-slate-200 text-slate-600 text-xs font-black px-4 py-1 rounded-full mb-4 flex items-center gap-2">
                <Activity size={14} className="animate-pulse text-emerald-500" />
                Live Tech Simulator
              </div>

              <div className="w-full h-[600px] bg-white border-[12px] border-slate-800 rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden">
                <div className="bg-slate-800 p-3 text-white flex items-center gap-3 shrink-0">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center"><HardHat size={16} /></div>
                  <div className="leading-tight">
                    <div className="font-bold text-sm">יועץ טכני AI</div>
                    <div className="text-[10px] text-amber-200 truncate w-40">{formData.product_name}</div>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-[#f0f2f5]">
                  <div className="bg-amber-100 text-amber-800 text-[10px] text-center p-2 rounded-lg font-bold mx-2 shadow-sm">הסימולטור מריץ את הפרוטוקול הנוכחי (לפני שמירה)</div>
                  {simMessages.map((msg, i) => (
                    <div key={i} className={`p-2.5 max-w-[85%] text-sm rounded-xl shadow-sm ${msg.role === 'ai' ? 'bg-white rounded-tr-none self-start border border-slate-200' : 'bg-[#dcf8c6] rounded-tl-none self-end'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ))}
                  {isSimTyping && <div className="bg-white p-2.5 rounded-xl rounded-tr-none self-start shadow-sm animate-pulse">חושב...</div>}
                </div>

                <div className="bg-slate-100 p-2 flex items-center gap-2 shrink-0 border-t border-slate-200">
                  <input type="text" value={simInput} onChange={e => setSimInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSimulate()} placeholder="שאל שאלה טכנית..." disabled={isSimTyping} className="flex-1 bg-white rounded-full px-4 py-2 text-sm outline-none border border-slate-300" />
                  <button onClick={handleSimulate} disabled={isSimTyping || !simInput.trim()} className="w-10 h-10 bg-slate-800 rounded-full flex justify-center items-center text-white disabled:opacity-50">
                    <Send size={16} className="rotate-180 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
