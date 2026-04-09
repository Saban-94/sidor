import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Saban OS - Desktop Catalog Interface
 * דף קטלוג מקצועי למחשב שולחני הכולל צ'אט מובנה ותצוגת מדיה
 */

export default function DesktopCatalog() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // שליפת נתונים ראשונית מהדרייב/API
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/drive-catalog', {
          method: 'POST',
          body: JSON.stringify({ productName: 'all' }),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        setCatalogItems(data.products || []);
        setLoading(false);
      } catch (e) {
        console.error("Failed to load catalog");
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="h-screen w-full bg-[#0b141a] text-white flex overflow-hidden font-sans" dir="rtl">
      
      {/* תפריט צד - רשימת מוצרים */}
      <aside className="w-80 border-l border-white/10 bg-[#111f2e] flex flex-col">
        <div className="p-6 border-b border-white/10">
          <img src="/saban-hub-logo.jpg" alt="Saban Logo" className="h-12 mx-auto mb-4 rounded-lg shadow-lg" />
          <h1 className="text-xl font-bold text-emerald-400 text-center">קטלוג טכני חכם</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {catalogItems.map((item: any) => (
            <button
              key={item.id}
              onClick={() => setSelectedProduct(item)}
              className={`w-full text-right p-4 rounded-xl transition-all ${
                selectedProduct?.id === item.id ? 'bg-emerald-500 text-dark font-bold' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </aside>

      {/* מרכז המסך - תצוגת תוכן (וידאו/מצגת) */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        {selectedProduct ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-bold mb-6 border-b border-emerald-500/30 pb-4">
              {selectedProduct.name} - מרכז ידע
            </h2>
            
            <div className="grid grid-cols-2 gap-8">
              {/* נגן וידאו / מצגת */}
              <div className="space-y-6">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                   {/* כאן נכנס ה-iframe של הדרייב */}
                  <iframe 
                    src={selectedProduct.videoUrl || selectedProduct.presentationUrl}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">דגשי יישום (מתוך NotebookLM)</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {selectedProduct.description || "טוען נתונים טכניים מהמקורות..."}
                  </p>
                </div>
              </div>

              {/* צ'אט יועץ טכני מובנה */}
              <div className="bg-[#111f2e] rounded-2xl border border-white/10 flex flex-col h-[600px] shadow-xl">
                <div className="p-4 border-b border-white/10 bg-emerald-500/10">
                  <p className="text-sm font-bold">צ'אט מומחה: {selectedProduct.name}</p>
                </div>
                <div className="flex-1 p-4 overflow-y-auto text-sm">
                   {/* כאן תשתמש ברכיב ה-ChatMessages הקיים שלך */}
                   <p className="text-emerald-400 italic">המערכת מוכנה לענות על שאלות לגבי {selectedProduct.name}...</p>
                </div>
                <div className="p-4 border-t border-white/10">
                  <input 
                    type="text" 
                    placeholder="שאל את המומחה לגבי מוצר זה..."
                    className="w-full bg-white/5 border border-white/20 rounded-lg p-3 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <span className="text-6xl mb-4">🏗️</span>
            <p className="text-xl">בחר מוצר מהתפריט כדי לצפות במפרטים ובסרטונים</p>
          </div>
        )}
      </main>
    </div>
  );
}
