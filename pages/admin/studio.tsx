import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
// תיקון ייבוא: הוספת כל האייקונים הנדרשים כולל Package
import { 
  Database, Zap, Play, Save, Plus, Trash2, 
  MessageSquare, Monitor, Smartphone, Search, Sparkles, 
  Image as ImageIcon, Youtube, Link as LinkIcon, Settings, 
  BarChart3, HelpCircle, Moon, Sun, X, Cpu, Send, Package, User, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Interfaces ---
type Tab = 'knowledge' | 'simulator' | 'metrics' | 'guide';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

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

  useEffect(() => {
    setMounted(true);
    fetchInventory();
    
    const flowRef = ref(database, 'system/bot_flow_config');
    const unsub = onValue(flowRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNodes(data.nodes || []);
        setGlobalDNA(data.globalDNA || '');
      }
    });
    return () => unsub();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').limit(50);
    if (data) setInventory(data);
  };

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
        body: JSON.stringify({ message: userMsg.content, state: 'STUDIO_SIM', manualInjection: true })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply, 
        media: data.mediaUrl, 
        timestamp: Date.now() 
      }]);
    } catch (e) {
      console.error("Simulation error", e);
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Head><title>SABAN STUDIO | Intelligence Center</title></Head>

      {/* Sidebar Navigation */}
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

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="p-6 border-b border-white/5 backdrop-blur-md flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-black uppercase tracking-widest text-sm opacity-50">{activeTab}</h2>
            <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Brain Online
            </div>
          </div>
          <button className="px-6 py-2.5 bg-emerald-500 text-[#020617] font-black rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm">
            <Save size={16}/> סנכרן הכל
          </button>
        </header>

        <div className="flex-1 overflow-hidden p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'knowledge' && (
              <motion.div key="knowledge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <MetricCard label="רשומות מלאי" value={inventory.length} icon={<Package size={20}/>} color="blue" />
                  <MetricCard label="חוקי AI" value={nodes.length} icon={<Zap size={20}/>} color="emerald" />
                  <MetricCard label="דיוק תשובות" value="94%" icon={<Sparkles size={20}/>} color="purple" />
                </div>
                
                <div className={`flex-1 rounded-[2.5rem] border border-white/5 overflow-hidden ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold">Database Explorer</h3>
                    <button className="p-2 bg-emerald-500 rounded-lg text-black"><Plus size={18}/></button>
                  </div>
                  <div className="overflow-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-right text-sm">
                      <thead className="sticky top-0 bg-[#0f172a] z-10 border-b border-white/5">
                        <tr className="opacity-40 text-[10px] uppercase font-black">
                          <th className="p-4">SKU</th>
                          <th className="p-4">מוצר</th>
                          <th className="p-4">מחיר</th>
                          <th className="p-4">פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item) => (
                          <tr key={item.sku} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                            <td className="p-4 font-mono text-emerald-500">{item.sku}</td>
                            <td className="p-4 font-bold">{item.product_name}</td>
                            <td className="p-4">₪{item.price}</td>
                            <td className="p-4 flex gap-2"><Settings size={14} className="opacity-20"/><Trash2 size={14} className="text-rose-500/50"/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'simulator' && (
              <motion.div key="simulator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex gap-6">
                <div className="flex-1 bg-[#0f172a]/50 rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden relative">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-500 text-black'}`}>
                          {msg.role === 'user' ? <User size={20}/> : <Bot size={20}/>}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-[#1e293b] rounded-tr-none' : 'bg-emerald-500/10 border border-emerald-500/20 rounded-tl-none'}`}>
                           <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && <div className="text-[10px] text-emerald-500 animate-pulse px-14">ראמי מנתח...</div>}
                  </div>
                  
                  <div className="p-6 bg-[#0f172a]">
                    <div className="flex gap-3 p-2 bg-black/40 rounded-[2rem] border border-white/10 items-center px-4">
                      <input 
                        value={testMessage} onChange={(e) => setTestMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                        placeholder="דבר אל המוח..."
                        className="flex-1 bg-transparent border-none outline-none p-3 text-sm"
                      />
                      <button onClick={handleSimulate} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-[#020617] shadow-lg"><Send size={20}/></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Subcomponents ---
function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all font-bold text-sm ${active ? 'bg-emerald-500 text-[#020617] shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
      {icon} <span className="flex-1">{label}</span>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
      <div><p className="text-[10px] font-black uppercase opacity-40 mb-1">{label}</p><h4 className="text-2xl font-black">{value}</h4></div>
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>{icon}</div>
    </div>
  );
}
