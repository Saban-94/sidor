import React, { useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Calculator, ArrowRight, Zap, Droplets, Package } from 'lucide-react';

export async function getServerSideProps(context: any) {
  const { id } = context.params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // חיבור לטבלה החדשה brain_inventory
  const { data: product } = await supabase
    .from('brain_inventory')
    .select('*')
    .eq('sku', id)
    .single();

  if (!product) return { notFound: true };
  return { props: { product } };
}

export default function ProductPage({ product }: { product: any }) {
  const [area, setArea] = useState<number>(10);
  const [thick, setThick] = useState<number>(5);

  const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=true');

  // התאמת לוגיקת המחשבון לעמודות החדשות
  // אם coverage_rate בטבלה הוא טקסט (כמו "1.6 ק"ג למ"ר"), נשתמש בברירת מחדל 1.6 או נשלוף מספר
  const coverage = parseFloat(product.coverage_rate) || 1.6;
  const totalKg = area * thick * coverage * 1.1; // +10% פחת/ביטחון
  const unitsNeeded = Math.ceil(totalKg / 25); // הנחת יסוד: שק/בלה של 25 יחידות או לפי צורך

  const handleAddToOrder = () => {
    const orderData = {
      type: 'ADD_TO_ORDER',
      productName: product.product_name,
      sku: product.sku,
      quantity: unitsNeeded,
      category: product.category
    };

    if (window.parent) {
      window.parent.postMessage(orderData, '*');
    }
  };

  return (
    <div className={`min-h-screen ${isEmbed ? 'bg-transparent' : 'bg-slate-50'} text-slate-900 font-sans p-2`} dir="rtl">
      <Head>
        <title>SABAN STUDIO | {product.product_name}</title>
      </Head>

      {!isEmbed && (
        <header className="p-6 flex justify-between items-center bg-white border-b border-slate-200 shadow-sm">
          <button className="text-slate-600 hover:text-blue-600" onClick={() => window.history.back()}>
            <ArrowRight size={24} />
          </button>
          <div className="font-black text-xl italic">SABAN <span className="text-blue-600">STUDIO</span></div>
        </header>
      )}

      <main className={`max-w-2xl mx-auto ${isEmbed ? 'p-2' : 'p-6'} space-y-6`}>
        
        {/* כרטיס מוצר מעוצב */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl">
          
          {/* תצוגת מדיה */}
          <div className="relative h-56 bg-slate-100">
            {product.image_url ? (
                <img src={product.image_url} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={48}/></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <div className="absolute bottom-4 right-6">
               <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg uppercase tracking-widest">
                 {product.category} | {product.sku}
               </span>
               <h1 className="text-3xl font-black text-slate-800 mt-2 tracking-tighter">{product.product_name}</h1>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* נתונים טכניים מהטבלה החדשה */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase mb-1">
                        <Droplets size={14}/> זמן ייבוש
                    </div>
                    <div className="text-lg font-bold">{product.dry_time || 'לפי יצרן'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase mb-1">
                        <Package size={14}/> כושר כיסוי
                    </div>
                    <div className="text-lg font-bold">{product.coverage_rate || 'משתנה'}</div>
                </div>
            </div>

            <p className="text-slate-500 text-base font-medium leading-relaxed italic">
              "{product.description || 'מוצר איכותי שנבחר עוקב ניתוח המוח של סבן.'}"
            </p>

            {/* מחשבון כמויות */}
            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
              <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-sm uppercase tracking-wider">
                <Calculator size={18} /> סימולטור כמויות לביצוע
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
                  <label className="text-[10px] text-slate-400 font-black block mb-2 uppercase italic">שטח (מ"ר)</label>
                  <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full bg-transparent text-slate-800 font-black text-xl outline-none"/>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
                  <label className="text-[10px] text-slate-400 font-black block mb-2 uppercase italic">עובי (מ"מ)</label>
                  <input type="number" value={thick} onChange={(e) => setThick(Number(e.target.value))}
                    className="w-full bg-transparent text-slate-800 font-black text-xl outline-none"/>
                </div>
              </div>

              <div className="flex justify-between items-center p-5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                <span className="text-white font-black text-sm uppercase">כמות נדרשת:</span>
                <span className="text-2xl font-black text-white italic">{unitsNeeded} יחידות</span>
              </div>
            </div>

            <button 
              onClick={handleAddToOrder}
              className="w-full bg-slate-900 py-5 rounded-[2rem] font-black text-white text-xl hover:bg-blue-600 active:scale-95 transition-all shadow-xl flex justify-center items-center gap-3"
            >
              <ShoppingCart size={24} />
              הוסף {unitsNeeded} יח' לסל
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
