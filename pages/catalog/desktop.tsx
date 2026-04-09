import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Search, Cpu, Droplets, Zap, 
  Home, Box, ChevronRight, Layers,
  ExternalLink, Sparkles, X
} from 'lucide-react';

// נתוני הקטלוג לפי מחלקות ומותגים
const categories = [
  {
    id: 'sealing',
    name: 'איטום',
    icon: <Droplets className="w-5 h-5" />,
    brands: ['סיקה', 'תרמוקיר'],
    products: [
      { id: 'p1', name: 'סיקה 107', brand: 'Sika', info: 'חומר איטום צמנטי דו-רכיבי', aiInsight: 'מומלץ למאגרי מי שתייה ומרפסות.' },
      { id: 'p2', name: 'אלסטופלקס', brand: 'Thermokir', info: 'מערכת איטום גמישה', aiInsight: 'מתאים במיוחד לתשתית עם תזוזות מבניות.' }
    ]
  },
  {
    id: 'building',
    name: 'חומרי בניין',
    icon: <Box className="w-5 h-5" />,
    brands: ['כרמית', 'מיסטר פיקס'],
    products: [
      { id: 'p3', name: 'דבק 116', brand: 'Mr. Fix', info: 'דבק קרמיקה איכותי', aiInsight: 'הכי נמכר לפרויקטים של ריצוף חוץ.' }
    ]
  },
  {
    id: 'plumbing',
    name: 'אינסטלציה',
    icon: <Zap className="w-5 h-5" />,
    brands: ['חוליית', 'גבריט'],
    products: []
  }
];

const brandLogos = [
  "סיקה", "תרמוקיר", "כרמית", "מיסטר פיקס", "נירלט", "טמבור"
];

export default function SabanCatalogWindows11() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [activeProduct, setActiveProduct] = useState(null);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 font-sans selection:bg-blue-200">
      
      {/* Windows 11 Acrylic Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/40 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-black/5 rounded-md transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-blue-900">ח. סבן</h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Building Solutions</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="שאל את ה-AI על מוצר או פרויקט..." 
              className="w-full bg-white/50 border border-slate-200 rounded-full py-2 pr-10 pl-4 focus:bg-white focus:ring-2 focus:ring-blue-400/50 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-200">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="flex">
        
        {/* Sidebar Navigation - NotebookLM Style */}
        <aside className={`fixed inset-y-0 right-0 w-72 bg-white/80 backdrop-blur-2xl border-l border-white/40 transform transition-transform duration-300 ease-in-out z-40 shadow-2xl ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 pt-24">
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">מחלקות</h2>
            <nav className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {setSelectedCategory(cat); setIsMenuOpen(false);}}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory.id === cat.id ? 'bg-blue-50 text-blue-700 shadow-inner' : 'hover:bg-black/5 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    {cat.icon}
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 p-8 lg:pr-12 transition-all">
          
          {/* Brand Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
            {brandLogos.map(brand => (
              <div key={brand} className="flex-shrink-0 px-6 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-500 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
                {brand}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-light text-slate-800">קטלוג <span className="font-bold">{selectedCategory.name}</span></h2>
              <div className="flex gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 italic">
                <Sparkles className="w-3 h-3" /> NotebookLM Insight Active
              </div>
            </div>

            {/* Product Layers (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedCategory.products.map(product => (
                <motion.div
                  layoutId={product.id}
                  onClick={() => setActiveProduct(product)}
                  key={product.id}
                  className="group relative bg-white border border-white p-1 rounded-[24px] shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                >
                  <div className="aspect-video bg-slate-100 rounded-[20px] mb-4 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      {product.brand}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{product.info}</p>
                    
                    {/* AI Preview Layer */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-3">
                      <div className="bg-blue-100 p-1.5 rounded-lg">
                        <Cpu className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2">
                        "{product.aiInsight}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* NotebookLM Style AI Detail Overlay */}
      <AnimatePresence>
        {activeProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-md flex items-center justify-center p-4 lg:p-12"
          >
            <motion.div 
              layoutId={activeProduct.id}
              className="bg-white w-full max-w-5xl h-full max-h-[800px] rounded-[32px] shadow-2xl border border-white overflow-hidden flex flex-col lg:flex-row"
            >
              {/* Product Visual Layer */}
              <div className="lg:w-1/2 bg-slate-50 p-8 flex flex-col justify-between">
                <button onClick={() => setActiveProduct(null)} className="self-start p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
                <div className="flex-1 flex items-center justify-center font-black text-slate-200 text-6xl uppercase tracking-tighter">
                  {activeProduct.brand}
                </div>
              </div>

              {/* AI Content Layer */}
              <div className="lg:w-1/2 p-12 overflow-y-auto bg-white border-r border-slate-100">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">AI Generated Summary</span>
                </div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">{activeProduct.name}</h2>
                
                <div className="prose prose-slate">
                  <h4 className="text-slate-800 font-bold mb-2">תובנות מהסטודיו:</h4>
                  <p className="text-slate-600 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 italic leading-relaxed">
                    {activeProduct.aiInsight} חומר זה נסרק ב-NotebookLM של ח. סבן ונמצא כמתאים ביותר לתקן הישראלי המחמיר. 
                  </p>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold">מפרט טכני מלא</div>
                        <div className="text-xs text-slate-400 font-medium">PDF • 2.4 MB</div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
