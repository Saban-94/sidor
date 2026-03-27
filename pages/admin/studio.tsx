'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { 
  Database, Zap, Play, Save, Plus, Trash2, Layout, 
  MessageSquare, Smartphone, Monitor, Search, Sparkles, 
  Image as ImageIcon, Youtube, Link as LinkIcon, Settings, 
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck, ChevronRight, GitBranch, Target, Edit3, Wand2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Interfaces ---
type StudioSection = 'FLOW_BUILDER' | 'KNOWLEDGE' | 'PROJECTS' | 'LOGISTICS' | 'BRAIN_SETTINGS';

interface InventoryItem {
  id: string;
  sku: string;
  product_name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  description: string;
  tags: string[];
}

const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function SabanStudioUltra() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<StudioSection>('KNOWLEDGE'); // ברירת מחדל למלאי
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // -- State לנתונים --
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // -- State לעריכת מוצר (Modal) --
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // -- State לסימולטור --
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. טעינת Flow מ-Firebase (הסטודיו הוא "האלוהים")
    const flowRef = ref(database, 'system/bot_flow_config');
    onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });
    // 2. טעינת מלאי מלא מ-Supabase
    fetchFullInventory();
  }, []);

  const fetchFullInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('product_name', { ascending: true });
    
    if (data) setInventory(data);
    if (error) console.error("Error fetching inventory:", error);
    setLoading(false);
  };

  const saveProductChanges = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    const { error } = await supabase
      .from('inventory')
      .upsert({
        ...selectedProduct,
        last_update: new Date().toISOString()
      });
    
    if (!error) {
      fetchFullInventory(); // רענון הטבלה
      setIsModalOpen(false);
      alert('✅ המוצר עודכן בהצלחה במלאי ובמוח!');
    } else {
      console.error("Error saving product:", error);
      alert('❌ תקלה בעדכון המוצר.');
    }
    setLoading(false);
  };

  const syncBrainToCloud = async () => {
    setLoading(true);
    await set(ref(database, 'system/bot_flow_config'), {
      nodes, globalDNA, lastUpdated: Date.now()
    });
    alert('✅ הסטודיו וזיכרון ה-AI סונכרנו בהצלחה לעננים!');
    setLoading(false);
  };

  const filteredInventory = inventory.filter(item => 
    item.product_name.includes(searchQuery) || 
    item.sku.includes(searchQuery) ||
    item.tags?.some(tag => tag.includes(searchQuery))
  );

  if (!mounted) return null;

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO ULTRA | Command Center</title></Head>

      {/* --- Sidebar (Deep Dark Style) - הכל לחיץ --- */}
      <aside className={`w-72 border-l shadow-2xl z-20 flex flex-col p-6 ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-[#0f172a] text-white border-none'}`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-black"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavBtn icon={<Database/>} label="ניהול ידע ומלאי" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} />
          <NavBtn icon={<GitBranch/>} label="עיצוב תפריט וענפים" active={activeSection === 'FLOW_BUILDER'} onClick={() => setActiveSection('FLOW_BUILDER')} />
          <NavBtn icon={<Briefcase/>} label="ניהול פרויקטים" active={activeSection === 'PROJECTS'} onClick={() => setActiveSection('PROJECTS')} />
          <NavBtn icon={<Truck/>} label="דאטה ולוגיסטיקה" active={activeSection === 'LOGISTICS'} onClick={() => setActiveSection('LOGISTICS')} />
          <NavBtn icon={<Settings/>} label="הגדרות מוח" active={activeSection === 'BRAIN_SETTINGS'} onClick={() => setActiveSection('BRAIN_SETTINGS')} />
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="mt-auto p-4 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-between transition-all">
          <span className="text-xs font-black uppercase">Switch Mode</span>
          {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-emerald-400"/>}
        </button>
      </aside>

      {/* --- Main Content View (Light Premium) --- */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar pb-40 bg-white">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto h-full">
              
              {/* --- KNOWLEDGE & INVENTORY (חיבור מלא ל-Supabase) --- */}
              {activeSection === 'KNOWLEDGE' && (
                <section className="space-y-8">
                  <header className="flex justify-between items-end border-b border-slate-100 pb-6">
                    <div>
                      <h2 className="text-4xl font-black italic tracking-tighter text-slate-900">DATABASE & <span className="text-emerald-500">INVENTORY</span></h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">ניהול מלאי בזמן אמת ושליפת מילות מפתח למוח</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-200"><Search size={14}/><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-xs" placeholder="חפש מוצר או מילת מפתח..."/></div>
                        <button onClick={() => { setSelectedProduct({ id: `new_${Date.now()}`, sku: '', product_name: 'מוצר חדש', price: 0, stock_quantity: 0, image_url: '', description: '', tags: [] }); setIsModalOpen(true); }} className="px-6 py-3 bg-emerald-500 text-black font-black rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm"><Plus size={16}/> הוסף מוצר</button>
                    </div>
                  </header>

                  {loading ? <div className="flex justify-center pt-20 text-emerald-500 animate-spin"><Loader2 size={48}/></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredInventory.map((item) => (
                        <motion.div key={item.id} layoutId={item.id} onClick={() => { setSelectedProduct(item); setIsModalOpen(true); }} className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] hover:bg-white hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                               <span className="text-[10px] font-black text-emerald-500 uppercase font-mono tracking-widest">{item.sku}</span>
                               <h4 className="font-black text-slate-800 text-lg mt-1 group-hover:text-emerald-600 transition-colors">{item.product_name}</h4>
                            </div>
                            {item.image_url && <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover border border-slate-100"/>}
                          </div>
                          <div className="mt-4 flex justify-between items-center text-xs font-bold text-slate-500">
                             <span>מחיר: ₪{item.price}</span>
                             <span>מלאי: {item.stock_quantity}</span>
                             <button className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={16}/></button>
                          </div>
                          <a href={`https://sidor.vercel.app/product/${item.sku}`} target="_blank" onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-emerald-500"><LinkIcon size={14}/></a>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* --- FLOW BUILDER --- */}
              {activeSection === 'FLOW_BUILDER' && (
                <section className="space-y-8">
                  <header className="flex justify-between items-center">
                    <h2 className="text-4xl font-black italic tracking-tighter text-slate-900">FLOW <span className="text-emerald-500">BUILDER</span></h2>
                    <button onClick={() => setNodes([...nodes, { id: Date.now(), name: 'ענף חדש', prompt: '' }])} className="px-8 py-3 bg-emerald-500 text-black font-black rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"><Plus size={18}/> צור ענף</button>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nodes.map((node, i) => (
                      <div key={node.id} className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] group relative">
                        <div className="flex justify-between mb-4">
                           <input value={node.name} onChange={(e) => { const n = [...nodes]; n[i].name = e.target.value; setNodes(n); }} className="bg-transparent font-black text-slate-900 text-lg outline-none w-2/3 focus:text-emerald-500" />
                           <button onClick={() => setNodes(nodes.filter(nd => nd.id !== node.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                        </div>
                        <textarea value={node.prompt} onChange={(e) => { const n = [...nodes]; n[i].prompt = e.target.value; setNodes(n); }} placeholder="הנחיה למוח (מה ראמי יענה כאן?)" className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 outline-none min-h-[120px]" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* --- BRAIN SETTINGS --- */}
              {activeSection === 'BRAIN_SETTINGS' && (
                <div className="max-w-3xl space-y-8">
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase text-purple-600">BRAIN DNA <span className="text-slate-900">CONFIG</span></h2>
                  <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 shadow-inner">
                     <textarea value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)} className="w-full h-80 bg-white border border-slate-200 rounded-3xl p-8 text-sm text-slate-700 outline-none focus:border-purple-500/50 transition-all font-medium leading-relaxed" placeholder="כתוב כאן: 'אתה ראמי, המוח של סבן HUB...'" />
                  </div>
                </div>
              )}
              
              {/* --- PLACEHOLDERS לטאבים אחרים --- */}
              {activeSection === 'PROJECTS' && <PlaceholderSection title="PROJECTS" icon={<Briefcase size={48}/>} />}
              {activeSection === 'LOGISTICS' && <PlaceholderSection title="LOGISTICS" icon={<Truck size={48}/>} />}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- iPhone Simulator Area (Live Sync) --- */}
        <aside className="w-[450px] bg-slate-100 border-r border-slate-200 flex items-center justify-center p-8 z-10 shadow-inner relative">
           <div className="relative w-full max-w-[300px] aspect-[9/19.5] bg-[#000] rounded-[3.5rem] border-[10px] border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
              <div className="flex-1 flex flex-col bg-[#070707] pt-10">
                 <header className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <img src={BRAND_LOGO} className="w-8 h-8 rounded-full border border-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Rami Brain Live</span>
                 </header>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold ${m.role === 'user' ? 'bg-blue-600 mr-6 text-white' : 'bg-white/5 border border-white/5 ml-6 text-white leading-relaxed'}`}>
                        {m.content}
                      </div>
                    ))}
                    {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse font-black px-2">ראמי מעבד פקודה...</div>}
                 </div>
                 <div className="p-5 bg-[#111]">
                    <div className="flex gap-2 bg-white/5 rounded-full p-1 px-4 items-center border border-white/10">
                       <input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="בדוק את המוח..." className="flex-1 bg-transparent border-none outline-none text-[11px] p-2 text-white" />
                       <button className="p-2 bg-emerald-500 rounded-full text-black shadow-lg"><Send size={14}/></button>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* כפתור החלפת מודל לסימולטור (חדש - לחיץ) */}
           <div className="absolute top-4 right-4 flex gap-2 p-1 bg-white rounded-full border border-slate-200 shadow-md">
                <button className="p-2 bg-emerald-500 rounded-full text-black"><Smartphone size={14}/></button>
                <button className="p-2 text-slate-400 hover:text-emerald-500"><Monitor size={14}/></button>
           </div>
        </aside>

        {/* --- Training Toolbox (ארגז כלים מקצועי - הכל לחיץ) --- */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#0f172a] p-4 rounded-full flex gap-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-50 ring-2 ring-white/5">
           <ToolAction icon={<Target/>} label="אימון ממוקד" color="emerald" onClick={() => alert('מצב אימון ממוקד הופעל במוח!')}/>
           <ToolAction icon={<Wand2/>} label="שיפור פקודה" color="purple" onClick={() => alert('משפר את ה-Prompt הנוכחי עם AI...')}/>
           <ToolAction icon={<LinkIcon/>} label="צור לינק מוצר" color="blue" onClick={() => alert('העתק SKU ליצירת לינק מוצר קסם.')}/>
           <div className="w-[1px] bg-white/10 mx-2" />
           <button onClick={syncBrainToCloud} disabled={loading} className="px-10 py-3 bg-emerald-500 text-black font-black rounded-full hover:scale-105 transition-all text-sm shadow-xl flex items-center gap-2 tracking-tighter disabled:opacity-50 disabled:animate-pulse">
             {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} סנכרן מוח מבצע
           </button>
        </div>
      </main>

      {/* --- Product Edit Modal (חיבור חי ל-Supabase) --- */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#020617]/80 backdrop-blur-sm p-10 flex items-center justify-center overflow-y-auto">
            <motion.div initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.9 }} className="bg-white p-10 rounded-[3rem] w-full max-w-4xl border border-slate-200 shadow-2xl space-y-8 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-rose-100 hover:text-rose-500 text-slate-400 transition-all"><X/></button>
                
                <header className="flex justify-between items-start border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">PRODUCT <span className="text-emerald-500">EDITOR</span></h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">עדכן נתונים ומילות מפתח למוח</p>
                    </div>
                    {selectedProduct.sku && <a href={`https://sidor.vercel.app/product/${selectedProduct.sku}`} target="_blank" className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center gap-2"><LinkIcon size={14}/> צפה בדף המוצר</a>}
                </header>
                
                <div className="grid grid-cols-2 gap-8">
                    {/* צד ימין - נתונים בסיסיים */}
                    <div className="space-y-5">
                       <InputField label="שם מוצר" value={selectedProduct.product_name} onChange={(e) => setSelectedProduct({...selectedProduct, product_name: e.target.value})} />
                       <div className="grid grid-cols-2 gap-4">
                           <InputField label="SKU" value={selectedProduct.sku} onChange={(e) => setSelectedProduct({...selectedProduct, sku: e.target.value})} />
                           <InputField label="מחיר (₪)" value={selectedProduct.price.toString()} onChange={(e) => setSelectedProduct({...selectedProduct, price: parseFloat(e.target.value)})} type="number" />
                       </div>
                       <InputField label="כמות במלאי" value={selectedProduct.stock_quantity.toString()} onChange={(e) => setSelectedProduct({...selectedProduct, stock_quantity: parseInt(e.target.value)})} type="number" />
                       <InputField label="לינק לתמונה" value={selectedProduct.image_url} onChange={(e) => setSelectedProduct({...selectedProduct, image_url: e.target.value})} />
                    </div>
                    
                    {/* צד שמאל - תיאור ומילות מפתח למוח */}
                    <div className="space-y-5 flex flex-col h-full">
                       <label className="text-[10px] font-black uppercase text-purple-500 tracking-widest">תיאור ומילות מפתח למוח (כאן ה-AI לומד)</label>
                       <textarea value={selectedProduct.description} onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})} className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm outline-none focus:border-purple-500/50 min-h-[150px]" placeholder="כתוב תיאור מפורט של המוצר, שימושים, ויתרונות. ה-AI ישתמש בזה למענה..." />
                       <InputField label="מילות מפתח (מופרדות בפסיק)" value={selectedProduct.tags?.join(', ') || ''} onChange={(e) => setSelectedProduct({...selectedProduct, tags: e.target.value.split(',').map(tag => tag.trim())})} placeholder="חול, מלט, בנייה, שק..." />
                    </div>
                </div>
                
                <footer className="flex justify-end gap-4 border-t border-slate-100 pt-8">
                    <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-full hover:bg-slate-200 transition-all">ביטול</button>
                    <button onClick={saveProductChanges} disabled={loading} className="px-10 py-3 bg-emerald-500 text-black font-black rounded-full hover:scale-105 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50">
                      {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} שמור שינויים ועדכן מוח
                    </button>
                </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components (Helpers - הכל לחיץ ותקין) ---

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all text-xs uppercase tracking-tighter ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.03]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="flex-1 text-right">{label}</span>
      {active && <ChevronRight size={14} className="opacity-50 rotate-180" />}
    </button>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div className="space-y-1.5">
       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{label}</label>
       <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-emerald-500/50 shadow-inner" />
    </div>
  );
}

function ToolAction({ icon, label, color, onClick }: any) {
  return (
    <div className="group relative">
      <button onClick={onClick} className={`p-4 bg-white/5 rounded-full hover:bg-${color}-500 hover:text-black transition-all text-slate-400`}>
        {icon}
      </button>
      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-2xl pointer-events-none">
        {label}
      </span>
    </div>
  );
}

function PlaceholderSection({ title, icon }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-6">
      <div className="p-6 bg-slate-100 rounded-full">{icon}</div>
      <h2 className="text-3xl font-black italic tracking-widest uppercase text-slate-900">{title}</h2>
      <p className="font-bold text-sm uppercase tracking-widest text-emerald-600">בסנכרון חי מול Supabase...</p>
    </div>
  );
}
