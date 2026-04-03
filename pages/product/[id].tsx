import React, { useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Calculator, ArrowRight, Package, Droplets } from 'lucide-react';

export async function getServerSideProps(context: any) {
  const { id } = context.params; // ה-ID כאן הוא המק"ט (SKU)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // שינוי קריטי: פנייה לטבלה החדשה brain_inventory
  const { data: product, error } = await supabase
    .from('brain_inventory')
    .select('*')
    .eq('sku', id) // חיפוש לפי עמודת SKU
    .single();

  // אם יש שגיאה או שהמוצר לא נמצא, נחזיר 404
  if (error || !product) {
    console.error("Product not found in brain_inventory:", id);
    return { notFound: true };
  }

  return { props: { product } };
}

export default function ProductPage({ product }: { product: any }) {
  const [area, setArea] = useState<number>(10);
  const [thick, setThick] = useState<number>(5);

  const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=true');

  // חישוב לפי השדות החדשים של המוח
  const coverage = parseFloat(product.coverage_rate) || 1.6;
  const totalKg = area * thick * coverage * 1.1; 
  const unitsNeeded = Math.ceil(totalKg / 25);

  return (
    <div className={`min-h-screen ${isEmbed ? 'bg-transparent' : 'bg-white'} text-slate-900 font-sans p-4`} dir="rtl">
      <Head>
        <title>SABAN STUDIO | {product.product_name}</title>
      </Head>

      <main className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* תמונה */}
          <div className="relative h-64 bg-slate-50">
            <img 
              src={product.image_url || 'https://via.placeholder.com/400'} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg">
              SKU: {product.sku}
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">{product.product_name}</h1>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 italic">ייבוש</span>
                <span className="text-lg font-bold text-blue-600">{product.dry_time || 'לפי יצרן'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 italic">כיסוי</span>
                <span className="text-lg font-bold text-emerald-600">{product.coverage_rate || 'משתנה'}</span>
              </div>
            </div>

            <p className="text-slate-500 font-medium leading-relaxed italic border-r-4 border-blue-100 pr-4">
              {product.description}
            </p>

            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                <div className="flex justify-between items-center">
                    <span className="font-black text-slate-700">מחיר שוק:</span>
                    <span className="text-3xl font-black text-blue-600 italic">₪{product.price}</span>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
