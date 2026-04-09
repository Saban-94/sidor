import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Search, Droplets, Box, Zap, 
  ChevronRight, Sparkles, X, Play, 
  FileText, Info, Share2, LayoutGrid
} from 'lucide-react';

// --- סגנונות Windows 11 Mica ---
const glassStyle = "bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm";
const cardStyle = "bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]";

// --- נתוני דוגמה למחלקות (יוזנו מהדרייב/DB) ---
const categories = [
  { id: 'sealing', name: 'איטום', icon: <Droplets className="w-5 h-5 text-blue-500" />, color: 'blue' },
  { id: 'building', name: 'חומרי בניין', icon: <Box className="w-5 h-5 text-emerald-500" />, color: 'emerald' },
  { id: 'plumbing', name: 'אינסטלציה', icon: <Zap className="w-5 h-5 text-orange-500" />, color: 'orange' },
];

const brandLogos = ["Sika", "Thermokir", "Mr. Fix", "Nirlet", "Tambour", "Carmit"];

export default function SabanExpertCatalog() {
  const [activeCategory, setActiveCategory] = useState('sealing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const magicChimeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    magicChimeRef.current = new Audio('/magic-chime.mp3');
  }, []);

const openProduct = async (product: any) => {
  // צלצול הקסם
  if (magicChimeRef.current) magicChimeRef.current.play().catch(() => {});

  // פנייה למוח החדש כדי לקבל נתונים "חיים" מהדרייב
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: `ספק מידע טכני על ${product.name}`,
        senderPhone: 'catalog_user' 
      }),
    });
    
    const data = await response.json();
    
    // מעדכנים את המוצר הנבחר עם המדיה שנשלפה מהדרייב
    setSelectedProduct({ 
      ...product, 
      aiAnalysis: data.reply,
      suggested_media: data.suggested_media 
    });
  } catch (e) {
    console.error("שגיאה בשליפת נתוני מוח:", e);
    setSelectedProduct(product);
  }
};

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-900 font-sans selection:bg-emerald-100 overflow-x-hidden" dir="rtl">
      
      {/* --- Windows 11 Top Bar --- */}
      <header className={`sticky top-0 z-50 w-full ${glassStyle} px-6 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-800 tracking-tighter">ח. סבן <span className="text-emerald-500 text-sm italic">PRO</span></span>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-12 relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="חפש מוצר או שאל את המומחה הדיגיטלי..." 
            className="w-full bg-white/50 border border-slate-200 rounded-full py-2.5 pr-11 pl-4 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-65px)]">
        
        {/* --- Sidebar Navigation (Hamburger Menu) --- */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
              />
              <motion.aside 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                className="fixed inset-y-0 right-0 w-80 bg-white/90 backdrop-blur-2xl border-l border-white/20 z-50 p-6 pt-20 shadow-2xl"
              >
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">מחלקות וקטלוגים</h3>
                <nav className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {setActiveCategory(cat.id); setIsMenuOpen(false);}}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeCategory === cat.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'hover:bg-black/5 text-slate-600'}`}
                    >
                      <div className="flex items-center gap-4">
                        {cat.icon}
                        <span className="font-bold">{cat.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeCategory === cat.id ? 'rotate-90' : ''}`} />
                    </button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* --- Main Content Area --- */}
        <div className="flex-1 p-8">
          
          {/* Brand Slider */}
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar mask-fade-edges">
            {brandLogos.map(brand => (
              <div key={brand} className="flex-shrink-0 px-8 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-500 shadow-sm hover:border-emerald-400 hover:text-emerald-600 transition-all cursor-pointer active:scale-95">
                {brand}
              </div>
            ))}
          </div>

          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-light text-slate-800">קטלוג <span className="font-black text-emerald-600">שכבות ידע</span></h2>
              <p className="text-slate-400 mt-2 text-sm font-medium">בחר מוצר לצפייה במפרטים, סרטונים וניתוח AI</p>
            </div>
            <LayoutGrid className="text-slate-300 w-8 h-8" />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8 }}
                onClick={() => openProduct({ id: i, name: `מוצר לדוגמה ${i}`, brand: 'Sika' })}
                className={`${cardStyle} p-2 cursor-pointer group relative overflow-hidden`}
              >
                <div className="aspect-[4/3] bg-slate-100 rounded-[20px] mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm">
                    Sika Expert
                  </div>
                  <div className="flex items-center justify-center h-full text-slate-300">
                    <Box size={48} strokeWidth={1} />
                  </div>
                </div>
                
                <div className="px-4 pb-4">
                  <h3 className="text-lg font-black text-slate-800">סיקה 107 - איטום</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">חומר איטום צמנטי דו-רכיבי לבריכות ומרפסות</p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><Play size={10} className="text-red-600 fill-current" /></div>
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><FileText size={10} className="text-blue-600" /></div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      AI Verified
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* --- NotebookLM Style Full Overlay (The Layers View) --- */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-6xl h-full max-h-[850px] rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-white flex flex-col md:flex-row overflow-hidden"
            >
              {/* Media Layer (Left) */}
              <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <button onClick={() => setSelectedProduct(null)} className="p-3 hover:bg-white rounded-2xl shadow-sm transition-all">
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                  <div className="flex gap-2">
                    <button className="p-3 hover:bg-white rounded-2xl shadow-sm transition-all"><Share2 size={20} className="text-slate-400" /></button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="aspect-video bg-black rounded-[32px] shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play size={64} className="text-white opacity-50 group-hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                  </div>
                  <p className="mt-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">צפה בסרטון הדרכה ויישום בשטח</p>
                </div>
              </div>

              {/* Expert Layer (Right) */}
              <div className="md:w-1/2 p-10 md:p-16 overflow-y-auto border-r border-slate-100 flex flex-col">
                <div className="flex items-center gap-3 text-emerald-600 mb-4">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Saban AI Studio Analysis</span>
                </div>
                
                <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-none">{selectedProduct.name}</h2>
                <div className="flex gap-2 mb-8">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">איטום</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">מקצועי</span>
                </div>

                <div className="space-y-8">
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">סיכום מומחה דיגיטלי</h4>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[24px] text-slate-700 leading-relaxed italic text-sm">
                      "סיקה 107 הוא הפתרון המומלץ ביותר לאיטום בריכות שחייה ומאגרי מים. הניתוח שלנו מראה יחס עלות-תועלת מצוין ועמידות לאורך 15 שנה לפחות ביישום נכון לפי המפרט המצורף."
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-4">קבצי ידע זמינים</h4>
                    {[
                      { icon: <FileText size={18} />, title: 'מפרט טכני מלא (PDF)', size: '2.4MB', color: 'bg-blue-50 text-blue-600' },
                      { icon: <Play size={18} />, title: 'סרטון הדרכת יישום', size: '12:40', color: 'bg-red-50 text-red-600' }
                    ].map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-300 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${file.color}`}>{file.icon}</div>
                          <div>
                            <div className="text-sm font-black text-slate-800">{file.title}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{file.size}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-[-4px] transition-all" />
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;400;700;800&display=swap');
        body { font-family: 'Assistant', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </div>
  );
}
