import React, { useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Calculator, ArrowRight, Package, Droplets } from 'lucide-react';

export async function getServerSideProps(context: any) {
  const { id } = context.params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const { data: product, error } = await supabase
    .from('brain_inventory')
    .select('*')
    .eq('sku', id)
    .single();

  if (error || !product) {
    return { notFound: true };
  }

  return { props: { product } };
}

export default function ProductPage({ product }: { product: any }) {
  const [area, setArea] = useState<number>(10);
  const [thick, setThick] = useState<number>(5);

  const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=true');

  // חישוב כמויות חכם
  const coverage = parseFloat(product.coverage_rate) || 1.6;
  const totalKg = area * thick * coverage * 1.1; 
  const unitsNeeded = Math.ceil(totalKg / 25);

  const handleAddToOrder = () => {
    const orderData = {
      type: 'ADD_TO_ORDER',
      productName: product.product_name,
      sku: product.sku,
      quantity: unitsNeeded,
      price: product.price
    };

    if (window.parent) {
      window.parent.postMessage(orderData, '*');
    }
  };

  return (
    <div className={`min-h-screen ${isEmbed ? 'bg-transparent' : 'bg-slate-50'} text-slate-900 font-sans`} dir="rtl">
      <Head>
        <title>SABAN STUDIO | {product.product_name}</title>
      </Head>

      <main className={`max-w-2xl mx-auto ${isEmbed ? 'p-2' : 'p-6'} pb-32`}>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl">
          
          {/* תמונה גדולה */}
          <div className="relative h-64 bg-slate-100">
            <img 
              src={product.image_url || 'https://via.placeholder.com/400'} 
              className="w-full h-full object-cover"
              alt={product.product_name}
            />
            <div className="absolute bottom-4 right-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg">
              SKU: {product.sku}
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
              {product.product_name}
            </h1>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 italic tracking-widest">זמן ייבוש</span>
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                    <Droplets size={16}/> {product.dry_time || 'לפי יצרן'}
                </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 italic tracking-widest">כושר כיסוי</span>
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <Package size={16}/> {product.coverage_rate || 'משתנה'}
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-lg font-medium leading-relaxed italic border-r-4 border-blue-500 pr-5">
              {product.description}
            </p>

            {/* מחשבון כמויות לביצוע - קריטי להזמנה */}
            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
              <div className="flex items-center gap-2 mb-6 text-blue-800 font-black text-sm uppercase tracking-wider">
                <Calculator size={18} /> סימולטור כמויות בשטח
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
                  <label className="text-[10px] text-slate-400 font-black block mb-1">שטח (מ"ר)</label>
                  <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full bg-transparent text-slate-800 font-black text-xl outline-none"/>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
                  <label className="text-[10px] text-slate-400 font-black block mb-1">עובי (מ"מ)</label>
                  <input type="number" value={thick} onChange={(e) => setThick(Number(e.target.value))}
                    className="w-full bg-transparent text-slate-800 font-black text-xl outline-none"/>
                </div>
              </div>

              <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200 flex justify-between items-center">
                <span className="text-white font-black text-sm uppercase">כמות נדרשת:</span>
                <span className="text-2xl font-black text-white italic">{unitsNeeded} יחידות</span>
              </div>
            </div>

            {/* כפתור הוספה לסל - המטרה הסופית */}
            <div className="pt-4">
                <button 
                  onClick={handleAddToOrder}
                  className="w-full bg-slate-900 py-6 rounded-[2rem] font-black text-white text-2xl hover:bg-blue-600 active:scale-95 transition-all shadow-2xl flex justify-center items-center gap-4"
                >
                  <ShoppingCart size={28} />
                  הוסף {unitsNeeded} יח' לסל (₪{product.price})
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
