import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push } from 'firebase/database';
import { 
  Database, Zap, Play, Save, Plus, Trash2, Layout, 
  MessageSquare, Smartphone, Monitor, Search, Sparkles, 
  Image as ImageIcon, Youtube, Link as LinkIcon, Settings, 
  BarChart3, HelpCircle, Moon, Sun, ChevronRight, X, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type Tab = 'knowledge' | 'simulator' | 'metrics' | 'guide';

export default function SabanStudioV2() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('knowledge');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [globalDNA, setGlobalDNA] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---
  useEffect(() => {
    setMounted(true);
    fetchData();
    const flowRef = ref(database, 'system/bot_flow_config');
    return onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setInventory(data);
  };

  // --- Logic ---
  const handleSimulate = async () => {
    if (!testMessage.trim()) return;
    const userMsg = { role: 'user', content: testMessage, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setTestMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, state: 'STUDIO_SIM' })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, media: data.mediaUrl, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO | Intelligence Center</title></Head>

      {/* 1. Sidebar - Navigation (צד שמאל במקור, מותאם RTL לימין) */}
      <aside className={`w-72 border-l ${isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'} p-6 flex flex-col`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-[#020617]"><Cpu size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">STUDIO</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<Database size={18}/>} label="ניהול ידע (Knowledge)" active={activeTab === 'knowledge'} onClick={() => setActiveTab('knowledge')} />
          <NavItem icon={<MessageSquare size={18}/>} label="סימולטור צ'אט" active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
          <NavItem icon={<BarChart3 size={18}/>} label="מדדי ביצוע (Metrics)" active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} />
          <NavItem icon={<HelpCircle size={18}/>} label="מדריך RAMI MODE" active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} />
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="mt-auto p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all">
          <span className="text-xs font-bold">{isDarkMode ? 'מצב לילה' : 'מצב יום'}</span>
          {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-blue-500"/>}
        </button>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header Panel */}
        <header className="p-6 border-b border-white/5 backdrop-blur-md flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-black uppercase tracking-widest text-sm opacity-50">{activeTab}</h2>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Brain Connected</div>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-2.5 bg-emerald-500 text-[#020617] font-black rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm"><Save size={16}/> סנכרן הכל</button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'knowledge' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <MetricCard label="רשומות מלאי" value={inventory.length} icon={<Package size={20}/>} color="blue" />
                  <MetricCard label="חוקי AI" value={nodes.length} icon={<Zap size={20}/>} color="emerald" />
                  <MetricCard label="דיוק תשובות" value="94%" icon={<Sparkles size={20}/>} color="purple" />
                </div>
                
                <div className={`flex-1 rounded-[2.5rem] border border-white/5 overflow-hidden ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold">טבלת מלאי ומוצרים</h3>
                    <div className="flex gap-2">
                       <div className="bg-black/20 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5"><Search size={14}/><input className="bg-transparent border-none outline-none text-xs" placeholder="חפש מוצר..."/></div>
                       <button className="p-2 bg-emerald-500 rounded-lg text-black"><Plus size={18}/></button>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-right text-sm">
                      <thead className="sticky top-0 bg-[#0f172a] z-10 border-b border-white/5">
                        <tr className="opacity-40 text-[10px] uppercase font-black">
                          <th className="p-4">SKU</th>
                          <th className="p-4">שם מוצר</th>
                          <th className="p-4">מחיר</th>
                          <th className="p-4">סטטוס</th>
                          <th className="p-4">פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item) => (
                          <tr key={item.sku} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-mono text-emerald-500">{item.sku}</td>
                            <td className="p-4 font-bold">{item.product_name}</td>
                            <td className="p-4">₪{item.price}</td>
                            <td className="p-4"><span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">LIVE</span></td>
                            <td className="p-4 flex gap-2"><Settings size={14} className="opacity-20 cursor-pointer hover:opacity-100"/><Trash2 size={14} className="text-rose-500/50 cursor-pointer hover:text-rose-500"/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'simulator' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex gap-6">
                {/* Simulator Chat */}
                <div className="flex-1 bg-[#0f172a]/50 rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden relative">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${msg.role === 'user' ? 'bg-blue-500' : 'bg-emerald-500 text-black'}`}>
                          {msg.role === 'user' ? <User size={20}/> : <Bot size={20}/>}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-[#1e293b] rounded-tr-none' : 'bg-emerald-500/10 border border-emerald-500/20 rounded-tl-none'}`}>
                           <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                           {msg.media && (
                             <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
                               <img src={msg.media} className="w-full object-cover" />
                             </div>
                           )}
                        </div>
                      </div>
                    ))}
                    {isTyping && <div className="text-[10px] text-emerald-500 animate-pulse px-14">ראמי כותב...</div>}
                  </div>
                  
                  {/* Advanced Toolbar */}
                  <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2 justify-center">
                    <ToolbarIcon icon={<ImageIcon/>} label="הזרק תמונה" />
                    <ToolbarIcon icon={<Youtube/>} label="נגן וידאו" />
                    <ToolbarIcon icon={<LinkIcon/>} label="Magic Link" />
                    <ToolbarIcon icon={<Sparkles/>} label="Typing Effect" />
                  </div>

                  <div className="p-6 bg-[#0f172a]">
                    <div className="flex gap-3 p-2 bg-black/40 rounded-[2rem] border border-white/10 items-center px-4 focus-within:border-emerald-500/50 transition-all">
                      <input 
                        value={testMessage} onChange={(e) => setTestMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                        placeholder="בדוק את המוח בזמן אמת..."
                        className="flex-1 bg-transparent border-none outline-none p-3 text-sm"
                      />
                      <button onClick={handleSimulate} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-[#020617] shadow-lg active:scale-95 transition-all"><Send size={20}/></button>
                    </div>
                  </div>
                </div>
                
                {/* Editor Panel (Right Side) */}
                <div className="w-96 space-y-6">
                  <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5">
                    <h4 className="text-xs font-black uppercase text-purple-400 mb-4 flex items-center gap-2"><Zap size={14}/> Quick Injection</h4>
                    <div className="space-y-3">
                      <button className="w-full p-3 bg-white/5 rounded-xl text-right text-xs hover:bg-white/10 transition-all border border-white/5">הזרק מוצר מלט 'נשר'</button>
                      <button className="w-full p-3 bg-white/5 rounded-xl text-right text-xs hover:bg-white/10 transition-all border border-white/5">הזרק קישור קסם לקטלוג</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* RAMI MODE - GUIDE MODAL */}
      <AnimatePresence>
        {activeTab === 'guide' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-xl p-12 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500 rounded-2xl text-black"><HelpCircle size={32}/></div>
                  <h1 className="text-4xl font-black italic">RAMI MODE: <span className="text-emerald-500">מדריך למשתמש</span></h1>
                </div>
                <button onClick={() => setActiveTab('knowledge')} className="p-4 bg-white/5 rounded-full hover:bg-rose-500 transition-all"><X/></button>
              </div>
              <div className="grid grid-cols-2 gap-12">
                <GuideSection title="איך מאמנים את המוח?" content="בקטגוריית ה-DNA, כתוב הנחיות קצרות וברורות. ה-AI לומד מהן איך לפנות ללקוח. השתמש בסימולטור כדי לבדוק את התוצאה." />
                <GuideSection title="ניהול מלאי (Supabase)" content="כל שינוי בטבלאות בסטודיו מעדכן ישירות את מסד הנתונים. המוח סורק את הטבלה הזו בכל פעם שלקוח שואל על מוצר." />
                <GuideSection title="מה זה Magic Link?" content="אלו לינקים דינמיים שנוצרים בצאט ומפנים לקוחות ישר לדפי נחיתה או תשלום. המוח יודע להצמיד להם תמונה והסבר מותאם אישית." />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Subcomponents ---

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all font-bold text-sm ${active ? 'bg-emerald-500 text-[#020617] shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
      {icon} <span className="flex-1">{label}</span>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-xl">
      <div><p className="text-[10px] font-black uppercase opacity-40 mb-1">{label}</p><h4 className="text-2xl font-black">{value}</h4></div>
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>{icon}</div>
    </div>
  );
}

function ToolbarIcon({ icon, label }: any) {
  return (
    <div className="group relative">
      <button className="p-3 bg-white/5 rounded-xl hover:bg-emerald-500 hover:text-black transition-all text-slate-400">{icon}</button>
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-500 text-black text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
    </div>
  );
}

function GuideSection({ title, content }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-emerald-500 flex items-center gap-2 underline underline-offset-8"># {title}</h3>
      <p className="text-slate-400 leading-relaxed font-medium">{content}</p>
    </div>
  );
}
