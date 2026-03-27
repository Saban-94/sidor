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
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot, Briefcase, Truck, ChevronRight, GitBranch, Target, Edit3, Wand2, Loader2, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type StudioSection = 'FLOW_BUILDER' | 'KNOWLEDGE' | 'PROJECTS' | 'LOGISTICS' | 'BRAIN_SETTINGS';

interface InventoryItem {
  id: string; sku: string; product_name: string; price: number; 
  stock_quantity: number; image_url: string; video_url?: string;
  description: string; tags: string[];
}

const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function SabanStudioFinal() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<StudioSection>('FLOW_BUILDER');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Data State (Firebase & Supabase)
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor & Simulator State
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. טעינת ענפים ותפריטים (Firebase)
    const flowRef = ref(database, 'system/bot_flow_config');
    onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });
    // 2. טעינת מלאי (Supabase)
    fetchInventory();
  }, []);

const fetchInventory = async () => {
    setLoading(true);
    try {
      // שליפה פשוטה ללא מיון מורכב כדי לוודא שהחיבור עובד
      const { data, error } = await supabase
        .from('inventory')
        .select('*'); 

      if (error) {
        console.error("Supabase Error Detail:", error.message);
        // אם יש שגיאה, ננסה לשלוף לפחות שמות ו-SKU
        const { data: fallbackData } = await supabase.from('inventory').select('product_name, sku');
        if (fallbackData) setInventory(fallbackData as any);
      } else if (data) {
        setInventory(data);
      }
    } catch (e) {
      console.error("Critical Fetch Error:", e);
    }
    setLoading(false);
  };

  const saveAllToCloud = async () => {
    setLoading(true);
    await set(ref(database, 'system/bot_flow_config'), {
      nodes, globalDNA, lastUpdated: Date.now()
    });
    alert('✅ הסטודיו, הענפים וה-DNA סונכרנו בהצלחה!');
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
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO ULTRA | מרכז השליטה</title></Head>

      {/* --- Sidebar Navigation (Dark) --- */}
      <aside className="w-72 bg-[#0f172a] text-white p-6 flex flex-col shadow-2xl z-30">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <NavBtn icon={<GitBranch/>} label="עיצוב תפריט וענפים" active={activeSection === 'FLOW_BUILDER'} onClick={() => setActiveSection('FLOW_BUILDER')} />
          <NavBtn icon={<Database/>} label="ניהול ידע ומלאי" active={activeSection === 'KNOWLEDGE'} onClick={() => setActiveSection('KNOWLEDGE')} />
          <NavBtn icon={<Briefcase/>} label="ניהול פרויקטים" active={activeSection === 'PROJECTS'} onClick={() => setActiveSection('PROJECTS')} />
          <NavBtn icon={<Truck/>} label="דאטה ולוגיסטיקה" active={activeSection === 'LOGISTICS'} onClick={() => setActiveSection('LOGISTICS')} />
          <NavBtn icon={<Settings/>} label="הגדרות מוח" active={activeSection === 'BRAIN_SETTINGS'} onClick={() => setActiveSection('BRAIN_SETTINGS')} />
        </nav>
      </aside>

      {/* --- Main Dashboard Area --- */}
      <main className="flex-1 flex overflow-hidden relative bg-white">
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar pb-32">
          <AnimatePresence mode="wait">
            
            {/* 1. FLOW BUILDER - עיצוב תפריט וענפים */}
            {activeSection === 'FLOW_BUILDER' && (
              <motion.div key="flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b pb-6 border-slate-100">
                  <h2 className="text-3xl font-black italic text-slate-900 uppercase">Flow <span className="text-emerald-500">Builder</span></h2>
                  <button onClick={() => setNodes([...nodes, { id: Date.now(), name: 'כפתור חדש', prompt: '' }])} className="px-6 py-3 bg-emerald-500 text-black font-black rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"><Plus size={18}/> הוסף ענף</button>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nodes.map((node, i) => (
                    <div key={node.id} className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] group relative hover:shadow-xl transition-all">
                       <input value={node.name} onChange={(e) => { const n = [...nodes]; n[i].name = e.target.value; setNodes(n); }} className="bg-transparent font-black text-slate-900 text-lg outline-none w-full focus:text-emerald-500" />
                       <textarea value={node.prompt} onChange={(e) => { const n = [...nodes]; n[i].prompt = e.target.value; setNodes(n); }} className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 mt-4 text-xs text-slate-600 outline-none" placeholder="הנחיה למוח..." />
                       <button onClick={() => setNodes(nodes.filter(nd => nd.id !== node.id))} className="absolute top-4 left-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. KNOWLEDGE - ניהול מלאי מלא מ-Supabase */}
            {activeSection === 'KNOWLEDGE' && (
              <motion.div key="knowledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b pb-6 border-slate-100">
                  <h2 className="text-3xl font-black italic text-slate-900 uppercase">Database & <span className="text-emerald-500">Inventory</span></h2>
                  <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Search size={14}/><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-xs w-48" placeholder="חפש מוצר..."/>
                  </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.filter(i => i.product_name.includes(searchQuery) || i.sku.includes(searchQuery)).map((item) => (
                    <div key={item.id} onClick={() => { setSelectedProduct(item); setIsModalOpen(true); }} className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] hover:bg-white hover:shadow-2xl transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center">
                          {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="opacity-10"/>}
                        </div>
                        <div className="text-left font-mono text-[10px] text-emerald-500 font-bold">{item.sku}</div>
                      </div>
                      <h4 className="font-black text-slate-800 text-lg group-hover:text-emerald-500 transition-colors">{item.product_name}</h4>
                      <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center text-xs font-black">
                        <span className="text-slate-900">₪{item.price}</span>
                        <span className="text-emerald-500">מלאי: {item.stock_quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3. BRAIN SETTINGS - הגדרות DNA */}
            {activeSection === 'BRAIN_SETTINGS' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
                 <h2 className="text-3xl font-black italic tracking-tighter uppercase text-purple-600">Brain <span className="text-slate-900">DNA</span></h2>
                 <textarea value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)} className="w-full h-80 bg-slate-50 border border-slate-200 rounded-[3rem] p-8 text-sm text-slate-700 outline-none focus:border-purple-500/50 transition-all font-medium leading-relaxed" placeholder="הגדר את אישיות הליבה של ראמי..." />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* --- Simulator iPhone (תמיד מוצג) --- */}
        <aside className="w-[450px] bg-slate-100 border-r border-slate-200 flex items-center justify-center p-8 z-20 shadow-inner">
           <div className="relative w-full max-w-[300px] aspect-[9/19.5] bg-[#000] rounded-[3.5rem] border-[10px] border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
              <div className="flex-1 flex flex-col bg-[#070707] pt-10">
                 <header className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <img src={BRAND_LOGO} className="w-8 h-8 rounded-full border border-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Rami Brain Live</span>
                 </header>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold ${m.role === 'user' ? 'bg-blue-600 mr-6 text-white' : 'bg-[#1e1e1e] border border-white/5 ml-6 text-white'}`}>
                        {m.content}
                      </div>
                    ))}
                    {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse font-black px-2">ראמי מעבד...</div>}
                 </div>
                 <div className="p-5 bg-[#111]">
                    <div className="flex gap-2 bg-white/5 rounded-full p-1 px-4 items-center border border-white/10">
                       <input value={testInput} onChange={(e) => setTestInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSimulate()} placeholder="בדיקה..." className="flex-1 bg-transparent border-none outline-none text-[11px] p-2 text-white" />
                       <button onClick={handleSimulate} className="p-2 bg-emerald-500 rounded-full text-black"><Send size={14}/></button>
                    </div>
                 </div>
              </div>
           </div>
        </aside>

        {/* --- Training Toolbox --- */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#0f172a] p-4 rounded-full flex gap-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-50 ring-2 ring-white/5">
           <ToolAction icon={<Target/>} label="אימון" color="emerald" />
           <ToolAction icon={<LinkIcon/>} label="לינק מוצר" color="blue" />
           <div className="w-[1px] bg-white/10 mx-2" />
           <button onClick={saveAllToCloud} className="px-10 py-3 bg-emerald-500 text-black font-black rounded-full hover:scale-105 transition-all text-sm flex items-center gap-2">
             <Save size={18}/> סנכרן הכל
           </button>
        </div>
      </main>

      {/* --- Product Modal (עריכה והוספה) --- */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-10 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[3rem] w-full max-w-4xl shadow-2xl space-y-8 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X/></button>
                <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <div className="aspect-square bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                         {selectedProduct.image_url ? <img src={selectedProduct.image_url} className="w-full h-full object-cover"/> : <ImageIcon size={48} className="text-slate-200"/>}
                      </div>
                      <input value={selectedProduct.image_url} onChange={(e) => setSelectedProduct({...selectedProduct, image_url: e.target.value})} placeholder="לינק לתמונה" className="w-full p-4 bg-slate-100 rounded-2xl text-xs font-bold" />
                   </div>
                   <div className="space-y-6">
                      <h3 className="text-3xl font-black italic uppercase text-slate-900">Edit <span className="text-emerald-500">Product</span></h3>
                      <input value={selectedProduct.product_name} onChange={(e) => setSelectedProduct({...selectedProduct, product_name: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl text-sm font-bold border-none" placeholder="שם מוצר" />
                      <div className="grid grid-cols-2 gap-4">
                         <input value={selectedProduct.sku} onChange={(e) => setSelectedProduct({...selectedProduct, sku: e.target.value})} className="p-4 bg-slate-100 rounded-2xl text-sm font-bold" placeholder="SKU" />
                         <input value={selectedProduct.price} onChange={(e) => setSelectedProduct({...selectedProduct, price: parseFloat(e.target.value)})} className="p-4 bg-slate-100 rounded-2xl text-sm font-bold" placeholder="מחיר" type="number" />
                      </div>
                      <textarea value={selectedProduct.description} onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium" placeholder="תיאור למוח..." />
                      <button onClick={async () => { await supabase.from('inventory').upsert(selectedProduct); fetchInventory(); setIsModalOpen(false); alert('המוצר עודכן!'); }} className="w-full py-4 bg-emerald-500 text-black font-black rounded-full shadow-lg">שמור שינויים במלאי</button>
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
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-tighter ${active ? 'bg-emerald-500 text-black shadow-lg scale-[1.03]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="flex-1 text-right">{label}</span>
    </button>
  );
}

function ToolAction({ icon, label, color, onClick }: any) {
  return (
    <div className="group relative">
      <button onClick={onClick} className={`p-4 bg-white/5 rounded-full hover:bg-${color}-500 hover:text-black transition-all text-slate-400`}>{icon}</button>
      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">{label}</span>
    </div>
}
