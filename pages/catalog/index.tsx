import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Search, Droplets, Box, Zap, 
  ChevronRight, Sparkles, X, Play, 
  FileText, Info, Share2, LayoutGrid, Loader2
} from 'lucide-react';

// --- סגנונות Windows 11 Mica ---
const glassStyle = "bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm";
const cardStyle = "bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]";

// --- נתוני מחלקות ---
const categories = [
  { id: 'sealing', name: 'איטום', icon: <Droplets className="w-5 h-5 text-blue-500" /> },
  { id: 'building', name: 'חומרי בניין', icon: <Box className="w-5 h-5 text-emerald-500" /> },
  { id: 'plumbing', name: 'אינסטלציה', icon: <Zap className="w-5 h-5 text-orange-500" /> },
];

const brandLogos = ["Sika", "Thermokir", "Mr. Fix", "Nirlet", "Tambour", "Carmit"];

// רשימת מוצרים לדוגמה (ניתן למשוך מ-Supabase בהמשך)
const initialProducts = [
  { id: 'p1', name: 'סיקה 107', description: 'חומר איטום צמנטי דו-רכיבי', category: 'sealing', brand: 'Sika' },
  { id: 'p2', name: 'דבק 116', description: 'דבק קרמיקה ופורצלן חזק', category: 'building', brand: 'Mr. Fix' },
  { id: 'p3', name: 'תרמוקיר 700', description: 'טיח תרמי לבידוד מושלם', category: 'building', brand: 'Thermokir' },
];

export default function SabanExpertCatalog() {
  const [activeCategory, setActiveCategory] = useState('sealing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const magicChimeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    magicChimeRef.current = new Audio('/magic-chime.mp3');
    magicChimeRef.current.volume = 0.4;
  }, []);

  const openProduct = async (product: any) => {
    setLoadingProduct(true);
    // צלצול הקסם של סבן
    if (magicChimeRef.current) magicChimeRef.current.play().catch(() => {});

    try {
      // פנייה למוח (API) כדי לקבל נתוני NotebookLM וקישורי דרייב
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `תן לי את כל הידע הטכני, הסרטונים והמפרטים שיש בדרייב על ${product.name}`,
          senderPhone: 'catalog_viewer' 
        }),
      });
      
      const data = await response.json();
      
      // אינטגרציה של נתוני המוח לתוך ממשק השכבות
      setSelectedProduct({ 
        ...product, 
        aiAnalysis: data.reply,
        media: data.suggested_media || { videos: [], specs: [] }
      });
    } catch (e) {
      console.error("Brain Connection Error:", e);
      setSelectedProduct(product);
    } finally {
      setLoadingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-900 font-sans selection:bg-emerald-100 overflow-x-hidden" dir="rtl">
      
      {/* Header Windows 11 Style */}
      <header className={`sticky top-0 z-50 w-full ${glassStyle} px-6 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-800 tracking-tighter italic">ח. סבן <span className="text-emerald-500 text-sm">PRO</span></span>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-12 relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="חפש מוצר או שאל את המומחה..." 
            className="w-full bg-white/50 border border-slate-200 rounded-full py-2.5 pr-11 pl-4 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm shadow-sm"
          />
        </div>

        <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
      </header>

      <main className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-80 bg-white/90 backdrop-blur-2xl border-l border-white/20 z-50 p-6 pt-20 shadow-2xl"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-4">מחלקות</h3>
              <nav className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {setActiveCategory(cat.id); setIsMenuOpen(false);}}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeCategory === cat.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-black/5 text-slate-600'}`}
                  >
                    <div className="flex items-center gap-4">{cat.icon} <span className="font-bold">{cat.name}</span></div>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 p-8">
          {/* Brand Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar">
            {brandLogos.map(brand => (
              <div key={brand} className="flex-shrink-0 px-8 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-500 hover:border-emerald-400 transition-all cursor-pointer shadow-sm">
                {brand}
              </div>
            ))}
          </div>

          <h2 className="text-3xl font-light text-slate-800 mb-8">קטלוג <span className="font-black text-emerald-600">מומחה דיגיטלי</span></h2>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
            {initialProducts.filter(p => p.category === activeCategory).map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -8 }}
                onClick={() => openProduct(product)}
                className={`${cardStyle} p-4 cursor-pointer group`}
              >
                <div className="aspect-square bg-slate-100 rounded-[20px] mb-4 flex items-center justify-center text-slate-300 relative overflow-hidden">
                  <Box size={40} strokeWidth={1} />
                  {loadingProduct && <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-emerald-500" /></div>}
                </div>
                <h3 className="text-lg font-black text-slate-800">{product.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{product.description}</p>
                <div className="mt-4 flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><Play size={10} className="text-red-600" /></div>
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><FileText size={10} className="text-blue-600" /></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* NotebookLM Overlay Layer */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-6xl h-full max-h-[850px] rounded-[40px] shadow-2xl border border-white flex flex-col md:flex-row overflow-hidden"
            >
              {/* Media Player Layer */}
              <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col justify-center items-center relative">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 p-3 hover:bg-white rounded-2xl shadow-sm transition-all"><X /></button>
                
                {selectedProduct.media?.videos?.length > 0 ? (
                  <div className="w-full aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl">
                    <iframe src={selectedProduct.media.videos[0].link} className="w-full h-full" allowFullScreen />
                  </div>
                ) : (
                  <div className="text-center text-slate-300">
                    <Play size={80} strokeWidth={0.5} />
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest">סרטון הדרכה מהשטח</p>
                  </div>
                )}
              </div>

              {/* AI Expert Insights Layer */}
              <div className="md:w-1/2 p-12 overflow-y-auto border-r border-slate-100">
                <div className="flex items-center gap-3 text-emerald-600 mb-4 font-black uppercase text-[10px] tracking-widest">
                  <Sparkles size={16} /> Saban AI Knowledge Base
                </div>
                <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">{selectedProduct.name}</h2>
                
                <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[24px] text-slate-700 leading-relaxed italic text-sm mb-8 shadow-inner">
                  {selectedProduct.aiAnalysis || "טוען ניתוח מומחה מהמוח..."}
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">מפרטים וקבצי דרייב</h4>
                  {selectedProduct.media?.specs?.map((spec: any, idx: number) => (
                    <a key={idx} href={spec.link} target="_blank" className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-400 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><FileText size={20} /></div>
                        <span className="text-sm font-black text-slate-800">{spec.name}</span>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
