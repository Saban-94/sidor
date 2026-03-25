import React, { useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Calculator, ArrowRight } from 'lucide-react';

// 1. משיכת נתונים בטוחה בצד השרת (SSR) - הלקוח לא רואה את המפתחות
export async function getServerSideProps(context: any) {
  const { id } = context.params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const { data: product } = await supabase
    .from('inventory')
    .select('*')
    .eq('sku', id)
    .single();

  if (!product) {
    return { notFound: true }; // יציג דף 404 אם המוצר לא קיים
  }

  return { props: { product } };
}

export default function ProductPage({ product }: { product: any }) {
  // סטייטים למחשבון
  const [area, setArea] = useState<number>(10);
  const [thick, setThick] = useState<number>(5);

  // לוגיקת המחשבון שלך (מוגנת מקריסות)
  const consumption = product.consumption_per_mm || 1.6;
  const bagWeight = product.packaging_size || 25;
  const totalKg = area * thick * consumption * 1.1; // כולל 10% פחת
  const bagsNeeded = Math.ceil(totalKg / bagWeight);

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans pb-24" dir="rtl">
      <Head>
        <title>ח. סבן | {product.product_name}</title>
      </Head>

      {/* Header */}
      <header className="p-6 flex justify-between items-center sticky top-0 bg-[#020617]/80 backdrop-blur-md z-50 border-b border-white/5">
        <button className="text-white hover:text-emerald-400 transition" onClick={() => window.history.back()}>
          <ArrowRight size={24} />
        </button>
        <div className="font-black text-xl tracking-wider text-white">
          SABAN <span className="text-emerald-500">1994</span>
        </div>
      </header>

      {/* Product Hero */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
        
        {/* תמונת מוצר */}
        <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700 font-black text-2xl">אין תמונה</div>
          )}
          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg">
            {product.category || 'חומרי בניין'}
          </div>
        </div>

        {/* פרטי מוצר ומחשבון */}
        <div className="flex flex-col justify-center">
          <p className="text-emerald-400 font-bold mb-2 uppercase tracking-widest text-sm">מק"ט: {product.sku}</p>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            {product.product_name}
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            {product.description || 'מוצר איכותי מבית ח. סבן.'}
          </p>
          {product.price && (
            <div className="text-3xl font-black text-white mb-8">₪{product.price}</div>
          )}

          {/* מחשבון כמויות חכם (מבוסס על הקוד שלך) */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-xl">
            <h3 className="font-black text-xl mb-4 text-white flex items-center gap-2">
              <Calculator size={20} className="text-emerald-400" /> 
              מחשבון כמויות (כולל פחת)
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2">שטח (מ"ר)</label>
                <input 
                  type="number" 
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full bg-slate-800 border-none rounded-xl p-4 text-white font-bold text-lg outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2">עובי (מ"מ)</label>
                <input 
                  type="number" 
                  value={thick}
                  onChange={(e) => setThick(Number(e.target.value))}
                  className="w-full bg-slate-800 border-none rounded-xl p-4 text-white font-bold text-lg outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div className="text-emerald-400 font-black text-center py-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-lg">
              סה"כ נדרש: {bagsNeeded} שקים ({bagWeight} ק"ג)
            </div>

            <button className="w-full bg-emerald-600 mt-6 py-5 rounded-xl font-black text-lg text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex justify-center items-center gap-2">
              <ShoppingCart size={20} />
              הוסף כמות זו להזמנה
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
