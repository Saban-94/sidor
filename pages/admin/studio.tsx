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
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck, ChevronRight, GitBranch, Target, Edit3, Wand2, Loader2, Video, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface InventoryItem {
  id: string; sku: string; product_name: string; price: number; 
  stock_quantity: number; image_url: string; video_url?: string;
  description: string; tags: string[];
}

const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function SabanStudioUltra() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('KNOWLEDGE');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Data State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor State
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Chat Simulator State
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchInventory();
    const flowRef = ref(database, 'system/bot_flow_config');
    onValue(flowRef, (snap) => {
      if (snap.exists()) setNodes(snap.val().nodes || []);
    });
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setInventory(data);
    setLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    const { error } = await supabase.from('inventory').upsert(selectedProduct);
    if (!error) {
      await fetchInventory();
      setIsModalOpen(false);
      alert('✅ המלאי והמוח עודכנו!');
    } else {
      alert('❌ שגיאת כתיבה ל-Supabase. בדוק RLS.');
    }
    setLoading(false);
  };

  const handleSimulate = async () => {
    if (!testInput.trim()) return;
    const userMsg = { role: 'user', content: testInput };
    setChatHistory(prev => [...prev, userMsg]);
    setTestInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, state: 'STUDIO_TEST', manualInjection: true })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, media: data.mediaUrl }]);
    } catch (e) { console.error(e); }
    setIsTyping(false);
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex overflow-hidden ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO ULTRA</title></Head>

      {/* --- Sidebar (Navigation) --- */}
      <aside className="w-72 bg-[#0f172a] text-white p-6 flex flex-col shadow-2xl z-30">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <NavBtn icon={<Database/>} label="ניהול ידע ומלאי" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} />
          <NavBtn icon={<GitBranch/>} label="עיצוב תפריט" active={activeSection === 'FLOW'} onClick={() => setActiveSection('FLOW')} />
          <NavBtn icon={<BarChart3/>} label="מדדים ודוחות" active={activeSection === 'METRICS'} onClick={() => setActiveSection('METRICS')} />
        </nav>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="mt-auto p-4 rounded-2xl bg-white/5 flex items-center justify-between">
          <span className="text-xs font-black uppercase">Mode</span>
          {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-emerald-400"/>}
        </button>
      </aside>

      {/* --- Main Workspace --- */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white pb-32">
          <AnimatePresence mode="wait">
            {activeSection === 'KNOWLEDGE' && (
              <motion.section key="knowledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-end border-b pb-6 border-slate-100">
                  <div>
                    <h2 className="text-4xl font-black italic text-slate-900 tracking-tighter underline decoration-emerald-500 decoration-4 underline-offset-8">DATABASE & INVENTORY</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">ניהול מוצרים, תמונות וסרטונים עבור המוח</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-slate-100 px-4 py-3 rounded-2xl flex items-center gap-2 border border-slate-200">
                      <Search size={16} className="text-slate-400"/>
                      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold w-48" placeholder="חפש במלאי..."/>
                    </div>
                    <button onClick={() => { setSelectedProduct({ id: `new-${Date.now()}`, sku: '', product_name: 'מוצר חדש', price: 0, stock_quantity: 0, image_url: '', description: '', tags: [] }); setIsModalOpen(true); }} className="px-8 py-3 bg-emerald-500 text-black font-black rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"><Plus size={18}/> הוסף מוצר</button>
                  </div>
                </header>

                {loading ? <div className="flex justify-center py-20 animate-spin text-emerald-500"><Loader2 size={48}/></div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.filter(i => i.product_name.includes(searchQuery) || i.sku.includes(searchQuery)).map((item) => (
                      <div key={item.id} onClick={() => { setSelectedProduct(item); setIsModalOpen(true); }} className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-inner">
                            {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="w-full h-full p-4 opacity-10"/>}
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-black text-emerald-500 font-mono tracking-widest">{item.sku}</span>
                            <h4 className="font-black text-slate-800 text-lg mt-1 group-hover:text-emerald-500 transition-colors">{item.product_name}</h4>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black text-slate-400 border-t border-slate-200/50 pt-4">
                          <span className="text-slate-900">₪{item.price}</span>
                          <span className={item.stock_quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}>מלאי: {item.stock_quantity}</span>
                          {item.video_url && <Video size={14} className="text-purple-500"/>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* --- Simulator iPhone Live --- */}
        <aside className="w-[450px] bg-slate-100 border-r border-slate-200 flex items-center justify-center p-8 z-20 shadow-inner">
          <div className="relative w-full max-w-[300px] aspect-[9/19.5] bg-[#000] rounded-[3.5rem] border-[10px] border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
            <div className="flex-1 flex flex-col bg-[#070707] pt-10">
               <header className="p-4 border-b border-white/5 flex items-center gap-3">
                  <img src={BRAND_LOGO} className="w-8 h-8 rounded-full border border-emerald-500" />
                  <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest animate-pulse">Live Brain Sim</span>
               </header>
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold ${m.role === 'user' ? 'bg-blue-600 mr-6 text-white' : 'bg-white/5 border border-white/5 ml-6 text-white'}`}>
                      {m.content}
                    </div>
                  ))}
                  {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse font-black px-2">ראמי מעבד...</div>}
               </div>
               <div className="p-5 bg-[#111]">
                  <div className="flex gap-2 bg-white/5 rounded-full p-1 px-4 items-center border border-white/10">
                     <input value={testInput} onChange={(e) => setTestInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSimulate()} placeholder="בדוק את המוח..." className="flex-1 bg-transparent border-none outline-none text-[11px] p-2 text-white" />
                     <button onClick={handleSimulate} className="p-2 bg-emerald-500 rounded-full text-black"><Send size={14}/></button>
                  </div>
               </div>
            </div>
          </div>
        </aside>
      </main>

      {/* --- Product Editor Modal (CRUD) --- */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-10 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[3rem] w-full max-w-4xl shadow-2xl space-y-8 relative overflow-hidden">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X/></button>
               <div className="flex gap-10">
                  <div className="w-1/3 space-y-4">
                     <div className="aspect-square bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group relative">
                        {selectedProduct.image_url ? <img src={selectedProduct.image_url} className="w-full h-full object-cover"/> : <ImageIcon size={48} className="text-slate-200"/>}
                     </div>
                     <input value={selectedProduct.image_url} onChange={(e) => setSelectedProduct({...selectedProduct, image_url: e.target.value})} placeholder="לינק לתמונה" className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-emerald-500" />
                     <input value={selectedProduct.video_url || ''} onChange={(e) => setSelectedProduct({...selectedProduct, video_url: e.target.value})} placeholder="לינק לסרטון (YouTube/Direct)" className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-purple-500" />
                  </div>
                  <div className="flex-1 space-y-6">
                     <h3 className="text-3xl font-black italic text-slate-900 uppercase">Product <span className="text-emerald-500">Editor</span></h3>
                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="שם מוצר" value={selectedProduct.product_name} onChange={(val) => setSelectedProduct({...selectedProduct, product_name: val})} />
                        <InputGroup label="SKU" value={selectedProduct.sku} onChange={(val) => setSelectedProduct({...selectedProduct, sku: val})} />
                        <InputGroup label="מחיר (₪)" value={selectedProduct.price.toString()} type="number" onChange={(val) => setSelectedProduct({...selectedProduct, price: parseFloat(val)})} />
                        <InputGroup label="מלאי נוכחי" value={selectedProduct.stock_quantity.toString()} type="number" onChange={(val) => setSelectedProduct({...selectedProduct, stock_quantity: parseInt(val)})} />
                     </div>
                     <textarea value={selectedProduct.description} onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:border-emerald-500" placeholder="תיאור מפורט למוח..." />
                     <button onClick={handleSaveProduct} disabled={loading} className="w-full py-4 bg-emerald-500 text-black font-black rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>} שמור שינויים ועדכן מוח
                     </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all text-xs uppercase tracking-tighter ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.03]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="flex-1 text-right">{label}</span>
      {active && <ChevronRight size={14} className="opacity-50 rotate-180" />}
    </button>
  );
}

function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-inner" />
    </div>
  );
}
