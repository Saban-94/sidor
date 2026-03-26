import React, { useState, useEffect } from 'react';
import { database, app } from '../../lib/firebase'; // ייבוא האפליקציה וה-RTDB
import { ref, onValue } from 'firebase/database';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // שימוש ב-Firestore API
import { 
  Save, 
  Plus, 
  Trash2, 
  Settings, 
  MessageSquare, 
  ChevronRight, 
  Zap,
  Layout,
  Database,
  Cpu,
  Globe
} from 'lucide-react';

// נכסי מותג קבועים
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function BotFlowBuilder() {
    // אתחול Firestore עם האפליקציה הקיימת כדי למנוע בלבול עם RTDB
    const dbFS = getFirestore(app); 
    
    const [nodes, setNodes] = useState<any[]>([]);
    const [globalDNA, setGlobalDNA] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'flow' | 'dna'>('flow');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // שימוש ב-dbFS (Firestore) במקום ב-db (RTDB)
                const docRef = doc(dbFS, 'system', 'bot_flow_config');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    setNodes(data.nodes || []);
                    setGlobalDNA(data.globalDNA || "");
                }
            } catch (err) {
                console.error("Error fetching bot config:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [dbFS]);

    const saveConfig = async () => {
        try {
            await setDoc(doc(dbFS, 'system', 'bot_flow_config'), {
                nodes,
                globalDNA,
                updatedAt: new Date().toISOString()
            });
            alert("✅ הקונפיגורציה נשמרה בהצלחה!");
        } catch (err) {
            console.error("Save error:", err);
            alert("❌ שגיאה בשמירה");
        }
    };

    const addNode = () => {
        const newNode = {
            id: `NODE_${Date.now()}`,
            label: "ענף חדש",
            prompt: "מה הבוט צריך לעשות כאן?",
            keywords: ""
        };
        setNodes([...nodes, newNode]);
    };

    const removeNode = (id: string) => {
        setNodes(nodes.filter(n => n.id !== id));
    };

    const updateNode = (id: string, field: string, value: string) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, [field]: value } : n));
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'} font-sans antialiased transition-colors duration-300`}>
            {/* Header */}
            <nav className={`sticky top-0 z-50 border-b ${theme === 'dark' ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-xl px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Cpu className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight italic">SABAN <span className="text-emerald-500">STUDIO</span></h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-bold">Bot Logic Architect</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`p-2 rounded-lg border ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                        {theme === 'dark' ? '🌞' : '🌙'}
                    </button>
                    <button 
                        onClick={saveConfig}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Save size={18} />
                        <span>שמור שינויים</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar - Settings */}
                <div className="lg:col-span-4 space-y-6">
                    <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-100'} shadow-xl`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="text-emerald-500" />
                            <h3 className="font-black text-lg">DNA גלובלי</h3>
                        </div>
                        <p className="text-xs opacity-60 mb-4 font-medium leading-relaxed">
                            הגדר את "האישיות" של ראמי. ההנחיות כאן ישפיעו על כל תשובה שלו, ללא קשר לענף.
                        </p>
                        <textarea 
                            value={globalDNA}
                            onChange={(e) => setGlobalDNA(e.target.value)}
                            placeholder="אתה ראמי, המוח הלוגיסטי של ח. סבן..."
                            className={`w-full h-48 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none border ${theme === 'dark' ? 'bg-[#020617] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                    </div>

                    <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-100'} shadow-xl`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="text-blue-500" />
                            <h3 className="font-black text-lg">סטטוס פריסה</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-xs font-bold text-emerald-500">Gemini 1.5 Flash</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <span className="text-xs font-bold text-blue-500">Bridge Active</span>
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Node Editor */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Layout className="text-emerald-500" />
                            <h3 className="font-black text-xl italic uppercase tracking-wider">Flow Branches</h3>
                        </div>
                        <button 
                            onClick={addNode}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                        >
                            <Plus size={18} />
                            <span>הוסף ענף</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {nodes.map((node, index) => (
                            <div 
                                key={node.id}
                                className={`group p-6 rounded-3xl border transition-all hover:border-emerald-500/50 ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xs">
                                            {index + 1}
                                        </div>
                                        <input 
                                            value={node.label}
                                            onChange={(e) => updateNode(node.id, 'label', e.target.value)}
                                            className={`font-black bg-transparent outline-none border-b border-transparent focus:border-emerald-500 transition-all ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => removeNode(node.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-black opacity-40 mb-1 block">הנחיית ביצוע (Prompt)</label>
                                        <textarea 
                                            value={node.prompt}
                                            onChange={(e) => updateNode(node.id, 'prompt', e.target.value)}
                                            className={`w-full p-4 rounded-2xl text-sm border focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none ${theme === 'dark' ? 'bg-[#020617] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-black opacity-40 mb-1 block">מזהה מצב (State ID)</label>
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-black/20 border-white/5 text-xs font-mono opacity-60">
                                                {node.id}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Preview Floating Button */}
            <div className="fixed bottom-8 left-8">
                <div className={`group relative w-72 p-1 rounded-[2.5rem] border shadow-2xl overflow-hidden transition-all hover:scale-105 ${theme === 'dark' ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'}`}>
                    <header className={`p-4 border-b flex items-center gap-3 shrink-0 ${theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-100'}`}>
                        <div className="w-12 h-12 rounded-full bg-emerald-500 overflow-hidden shadow-lg border-2 border-white/10">
                            <img src={BRAND_LOGO} alt="AI" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-black">ראמי (JONI AI)</h2>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Online Now</span>
                            </div>
                        </div>
                    </header>
                    <div className="p-4 bg-black/20 text-[11px] font-medium opacity-60 leading-relaxed italic">
                        "ככה אני אראה בערך בווטסאפ של הלקוח..."
                    </div>
                </div>
            </div>
        </div>
    );
}
