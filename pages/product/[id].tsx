import React, { useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Calculator, ArrowRight, X } from 'lucide-react';

export async function getServerSideProps(context: any) {
  const { id } = context.params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

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

  // בדיקה אם הדף מוצג בתוך הצאט (Iframe)
  const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=true');

  const consumption = product.consumption_per_mm || 1.6;
  const bagWeight = product.packaging_size || 25;
  const totalKg = area * thick * consumption * 1.1; 
  const bagsNeeded = Math.ceil(totalKg / bagWeight);

  // פונקציית שליחת ההזמנה לצ'אט
  const handleAddToOrder = () => {
    const orderData = {
      type: 'ADD_TO_ORDER',
      productName: product.product_name,
      sku: product.sku,
      quantity: bagsNeeded,
      totalWeight: bagsNeeded * bagWeight
    };

    // שליחת הנתונים לחלון האב (הצ'אט)
    if (window.parent) {
      window.parent.postMessage(orderData, '*');
    }
  };

  return (
    <div className={`min-h-screen ${isEmbed ? 'bg-transparent' : 'bg-[#020617]'} text-gray-200 font-sans p-2`} dir="rtl">
      <Head>
        <title>ח. סבן | {product.product_name}</title>
      </Head>

      {/* Header - מוסתר אם זה בתוך הצאט */}
      {!isEmbed && (
        <header className="p-6 flex justify-between items-center bg-[#020617] border-b border-white/5">
          <button className="text-white hover:text-emerald-400" onClick={() => window.history.back()}>
            <ArrowRight size={24} />
          </button>
          <div className="font-black text-xl text-white">SABAN <span className="text-emerald-500">1994</span></div>
        </header>
      )}

      <main className={`max-w-4xl mx-auto ${isEmbed ? 'p-2' : 'p-6'} grid grid-cols-1 gap-6`}>
        
        {/* כרטיס מוצר מאוחד */}
        <div className="bg-slate-900/90 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          
          {/* תמונה בראש הכרטיס בתצוגת צאט */}
          <div className="relative h-48 bg-slate-800">
            <img 
              src={product.image_url || 'https://via.placeholder.com/400'} 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            <div className="absolute bottom-4 right-6">
               <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">מק"ט: {product.sku}</p>
               <h1 className="text-2xl font-black text-white">{product.product_name}</h1>
            </div>
          </div>

          <div className="p-6">
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {product.description || 'מוצר איכותי מבית ח. סבן.'}
            </p>

            {/* מחשבון כמויות */}
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 mb-6">
              <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm">
                <Calculator size={16} /> מחשבון כמויות לביצוע
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900 p-3 rounded-xl border border-white/5">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">שטח (מ"ר)</label>
                  <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold outline-none"/>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-white/5">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">עובי (מ"מ)</label>
                  <input type="number" value={thick} onChange={(e) => setThick(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold outline-none"/>
                </div>
              </div>

              <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-xs text-slate-400 block">נדרש לביצוע:</span>
                <span className="text-xl font-black text-emerald-400">{bagsNeeded} שקים</span>
              </div>
            </div>

            {/* כפתור הוספה להזמנה */}
            <button 
              onClick={handleAddToOrder}
              className="w-full bg-emerald-600 py-4 rounded-2xl font-black text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-lg flex justify-center items-center gap-2"
            >
              <ShoppingCart size={18} />
              הוסף {bagsNeeded} שקים להזמנה
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
