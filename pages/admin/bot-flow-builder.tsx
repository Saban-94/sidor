import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Network, MessageSquare, Edit3, Save, Search, FileText, ShoppingCart, User, GitMerge, AlertCircle, PlusCircle, Trash2, ChevronDown, CornerDownLeft } from 'lucide-react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);
const EMOJIS = ["✨", "🏗️", "💎", "🚚", "📞", "🤝", "🔥", "🚀", "✅", "⚠️", "📊"];
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";
// מבנה נתונים חדש: תמיכה בהיררכיה (parentId)
const defaultNodes = [
  { id: 'MENU', parentId: null, title: 'תפריט ראשי', color: 'bg-indigo-500', prompt: 'הודעת הפתיחה. הצג תפריט: 1. בירור, 2. הצעת מחיר, 3. הזמנה, 4. נציג.' },
  { id: 'INQUIRY', parentId: 'MENU', title: '1️⃣ בירור מוצר', color: 'bg-blue-500', prompt: 'חפש במלאי. ברגע שמצאת את המוצר, שאל את הלקוח "כמה מ"ר/יחידות אתה צריך?" ושנה את הסטטוס ל-INQUIRY_QTY.' },
  { id: 'INQUIRY_QTY', parentId: 'INQUIRY', title: 'חישוב כמויות (תת-ענף)', color: 'bg-cyan-500', prompt: 'קח את הכמות שהלקוח ביקש. חשב לפי נתוני המחשבון שבמלאי כמה שקים צריך, תן לו סה"כ מחיר, ושאל אם להפוך להצעת מחיר. שנה סטטוס ל-QUOTE.' },
  { id: 'QUOTE', parentId: 'MENU', title: '2️⃣ הצעת מחיר', color: 'bg-emerald-500', prompt: 'שאל כתובת לאספקה וסכם מחיר סופי. שנה סטטוס ל-ORDER לאישור.' },
  { id: 'ORDER', parentId: 'QUOTE', title: '3️⃣ אישור הזמנה (תת-ענף)', color: 'bg-amber-500', prompt: 'שלח לינק קסם אישי לסיום הרכישה במערכת.' },
  { id: 'HUMAN_RAMI', parentId: 'MENU', title: '4️⃣ נציג אנושי', color: 'bg-red-500', prompt: 'הודע ללקוח שראמי יחזור אליו והשתתק.' },
];

export default function BotFlowBuilder() {
  const [nodes, setNodes] = useState<any[]>(defaultNodes);
  const [activeNode, setActiveNode] = useState<any>(nodes[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [globalDNA, setGlobalDNA] = useState("אתה ראמי, המוח הלוגיסטי של ח. סבן. דבר קצר, בשפת קבלנים (עלא ראסי).");

  useEffect(() => {
    const fetchConfig = async () => {
      const snap = await getDoc(doc(dbFS, 'system', 'bot_flow_config'));
      if (snap.exists() && snap.data().nodes) {
        setNodes(snap.data().nodes);
        setGlobalDNA(snap.data().globalDNA || globalDNA);
        setActiveNode(snap.data().nodes[0]);
      }
    };
    fetchConfig();
  }, []);

  const saveFlow = async () => {
    setIsSaving(true);
    await setDoc(doc(dbFS, 'system', 'bot_flow_config'), { nodes, globalDNA }, { merge: true });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const updateNode = (key: string, val: string) => {
    const updated = nodes.map(n => n.id === activeNode.id ? { ...n, [key]: val } : n);
    setNodes(updated);
    setActiveNode({ ...activeNode, [key]: val });
  };

  const addChildNode = (parentId: string) => {
    const newNode = {
      id: `NEW_STATE_${Date.now().toString().slice(-4)}`,
      parentId,
      title: 'שלב חדש בענף',
      color: 'bg-slate-500',
      prompt: 'הגדר מה ה-AI עושה בשלב זה...'
    };
    setNodes([...nodes, newNode]);
    setActiveNode(newNode);
  };

  const deleteNode = (id: string) => {
    // מוחק את הצומת ואת כל הילדים שלו
    const nodesToDelete = new Set([id]);
    let added = true;
    while (added) {
      added = false;
      nodes.forEach(n => {
        if (nodesToDelete.has(n.parentId) && !nodesToDelete.has(n.id)) {
          nodesToDelete.add(n.id);
          added = true;
        }
      });
    }
    const filtered = nodes.filter(n => !nodesToDelete.has(n.id));
    setNodes(filtered);
    setActiveNode(filtered[0]);
  };

  // פונקציה רקורסיבית לציור העץ
  const renderTree = (parentId: string | null, level: number = 0) => {
    const children = nodes.filter(n => n.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className="flex flex-col gap-2 w-full mt-2">
        {children.map(node => (
          <div key={node.id} className="flex flex-col">
            <div 
              onClick={() => setActiveNode(node)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                activeNode?.id === node.id ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
              style={{ marginRight: `${level * 24}px` }}
            >
              {level > 0 && <CornerDownLeft size={16} className="text-slate-300" />}
              <div className={`w-3 h-3 rounded-full ${node.color}`}></div>
              <div className="flex-1 font-black text-slate-800 text-sm truncate">{node.title}</div>
              <button 
                onClick={(e) => { e.stopPropagation(); addChildNode(node.id); }}
                className="text-slate-400 hover:text-indigo-600 transition p-1"
                title="הוסף תת-ענף"
              >
                <PlusCircle size={16} />
              </button>
            </div>
            {renderTree(node.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans" dir="rtl">
      <Head><title>Master Rami | בונה ענפי AI</title></Head>

      {/* טור ימין: עץ הניווט (Sidebar) */}
      <aside className="w-80 bg-white border-l shadow-2xl flex flex-col shrink-0 z-20 overflow-y-auto">
        <header className="p-6 bg-slate-900 text-white border-b-4 border-indigo-500">
          <h1 className="text-xl font-black flex items-center gap-2"><Network size={20} /> AI Flow Builder</h1>
          <p className="text-xs font-bold text-indigo-300 mt-1">מנהל ענפים ותרחישי שיחה</p>
        </header>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">מבנה העץ הלוגי</div>
          {renderTree(null)}
        </div>

        <div className="p-4 border-t bg-slate-50">
          <button onClick={saveFlow} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
            {isSaving ? 'שומר עץ...' : <><Save size={18} /> שמור עץ לשרת</>}
          </button>
        </div>
      </aside>

      {/* טור שמאל: עורך הענף המרכזי */}
      <main className="flex-1 p-8 overflow-y-auto flex flex-col items-center relative" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        
        {activeNode && (
          <div className="w-full max-w-3xl bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 space-y-6 relative z-10">
            <header className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex justify-center items-center text-white shadow-inner ${activeNode.color}`}>
                  <MessageSquare size={32} />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={activeNode.title} 
                    onChange={e => updateNode('title', e.target.value)}
                    className="text-2xl font-black text-slate-800 border-none outline-none bg-transparent placeholder-slate-300 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2 -mx-2"
                    placeholder="שם הענף (למשל: בירור מוצר)"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-500">מזהה סטטוס (State ID):</span>
                    <input 
                      type="text" 
                      value={activeNode.id} 
                      onChange={e => updateNode('id', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded outline-none w-40"
                    />
                  </div>
                </div>
              </div>
              
              {activeNode.id !== 'MENU' && (
                <button onClick={() => deleteNode(activeNode.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition">
                  <Trash2 size={20} />
                </button>
              )}
            </header>

            {/* DNA של הסטטוס הספציפי */}
            <div className="space-y-3">
              <label className="text-sm font-black text-indigo-600 flex items-center gap-2">
                <AlertCircle size={16}/> פקודת מוח לענף זה (Prompt)
              </label>
              <textarea 
                value={activeNode.prompt} 
                onChange={e => updateNode('prompt', e.target.value)}
                placeholder='מה ה-AI צריך לעשות כאן? (למשל: "אחרי שחישבת כמות, תשאל אם לשלוח לינק תשלום, ושנה סטטוס ל-QUOTE")'
                className="w-full h-48 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-amber-800">
              <AlertCircle size={20} className="shrink-0" />
              <div className="text-xs font-bold leading-relaxed">
                <strong>איך מעבירים לענף הבא?</strong><br/>
                פשוט תכתוב בתיבה למעלה במילים שלך: <br/>
                <span className="bg-amber-200 px-1 rounded mx-1">"ברגע שהלקוח עונה X, תשנה את הסטטוס שלו ל-[ID של הענף הבא]".</span><br/>
                ה-API המרכזי קורא את הטקסט הזה ומבצע את המעבר מאחורי הקלעים!
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
