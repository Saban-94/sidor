import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Network, MessageSquare, Edit3, Save, Search, FileText, ShoppingCart, User, GitMerge, AlertCircle } from 'lucide-react';

// 🔥 אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

// הגדרת צמתי העץ (Nodes) כברירת מחדל
const defaultNodes = [
  { id: 'MENU', title: 'תפריט ראשי (Root)', icon: GitMerge, color: 'bg-indigo-500', 
    prompt: 'הודעת הפתיחה. הצג תפריט: 1. בירור, 2. הצעת מחיר, 3. הזמנה, 4. נציג.' },
  { id: 'INQUIRY', title: '1️⃣ בירור מוצר', icon: Search, color: 'bg-blue-500', 
    prompt: 'חפש במלאי. אם יש תמונה, צרף לינק קסם.' },
  { id: 'QUOTE', title: '2️⃣ הצעת מחיר', icon: FileText, color: 'bg-emerald-500', 
    prompt: 'שאל כמויות מדויקות וכתובת לאספקה. אל תמציא מחירים.' },
  { id: 'ORDER', title: '3️⃣ הזמנה', icon: ShoppingCart, color: 'bg-amber-500', 
    prompt: 'שלח לינק קסם אישי לסיום הרכישה במערכת.' },
  { id: 'HUMAN_RAMI', title: '4️⃣ נציג אנושי', icon: User, color: 'bg-red-500', 
    prompt: 'הודע ללקוח שראמי יחזור אליו והשתתק.' },
];

export default function BotFlowBuilder() {
  const [nodes, setNodes] = useState(defaultNodes);
  const [activeNode, setActiveNode] = useState<any>(nodes[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [globalDNA, setGlobalDNA] = useState("אתה ראמי, המוח הלוגיסטי של ח. סבן. דבר קצר, בשפת קבלנים (עלא ראסי).");

  // משיכת הגדרות קיימות
  useEffect(() => {
    const fetchConfig = async () => {
      const snap = await getDoc(doc(dbFS, 'system', 'bot_flow_config'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.nodes) setNodes(data.nodes);
        if (data.globalDNA) setGlobalDNA(data.globalDNA);
        setActiveNode(data.nodes.find((n:any) => n.id === 'MENU') || data.nodes[0]);
      }
    };
    fetchConfig();
  }, []);

  // שמירת העץ ל-Firestore
  const saveFlow = async () => {
    setIsSaving(true);
    await setDoc(doc(dbFS, 'system', 'bot_flow_config'), { nodes, globalDNA }, { merge: true });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const updateActiveNode = (val: string) => {
    const updated = nodes.map(n => n.id === activeNode.id ? { ...n, prompt: val } : n);
    setNodes(updated);
    setActiveNode({ ...activeNode, prompt: val });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans" dir="rtl">
      <Head><title>Master Rami | קנבס עץ AI</title></Head>

      {/* אזור הקנבס הוויזואלי (שמאל) */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* רקע נקודות של סטודיו */}
        <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <header className="relative z-10 p-5 bg-white/80 backdrop-blur-md border-b flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Network size={24} /></div>
            <div>
              <h1 className="font-black text-xl text-slate-800">עורך עץ AI (Canvas Studio)</h1>
              <p className="text-xs font-bold text-slate-500">עיצוב פרוטוקול ומצבי שיחה בלייב</p>
            </div>
          </div>
          <button onClick={saveFlow} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">
            {isSaving ? <span className="animate-pulse">שומר...</span> : <><Save size={18} /> שמור עץ לשרת</>}
          </button>
        </header>

        {/* עץ הצמתים */}
        <div className="relative z-10 flex-1 overflow-auto flex flex-col items-center pt-16 pb-20">
          
          {/* צומת אב - תפריט */}
          <div 
            onClick={() => setActiveNode(nodes[0])}
            className={`w-72 bg-white rounded-2xl p-4 shadow-xl border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeNode.id === nodes[0].id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-200'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex justify-center items-center text-white ${nodes[0].color}`}><GitMerge size={20} /></div>
              <div className="font-black text-slate-800">{nodes[0].title}</div>
            </div>
            <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{nodes[0].prompt}</div>
          </div>

          {/* קווים מחברים */}
          <div className="w-px h-12 bg-slate-300"></div>
          <div className="w-[800px] border-t-2 border-slate-300 relative flex justify-between pt-12">
            {/* צמתים בנים */}
            {nodes.slice(1).map((node, i) => {
              const Icon = node.icon;
              return (
                <div key={node.id} className="flex flex-col items-center relative w-64">
                  {/* קו אנכי יורד לכל ילד */}
                  <div className="w-px h-12 bg-slate-300 absolute -top-12"></div>
                  
                  <div 
                    onClick={() => setActiveNode(node)}
                    className={`w-full bg-white rounded-2xl p-4 shadow-lg border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeNode.id === node.id ? `border-${node.color.split('-')[1]}-500 ring-4 ring-${node.color.split('-')[1]}-500/20` : 'border-slate-200'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex justify-center items-center text-white ${node.color}`}><Icon size={18} /></div>
                      <div className="font-black text-slate-800 text-sm">{node.title}</div>
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{node.prompt}</div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      {/* חלונית עריכה (ימין) */}
      <aside className="w-[400px] bg-white border-l shadow-2xl flex flex-col shrink-0 z-20">
        <header className="p-5 bg-slate-50 border-b flex items-center gap-2">
          <Edit3 size={18} className="text-blue-600" />
          <h2 className="font-black text-slate-800">עריכת פרוטוקול (DNA)</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          
          {/* הגדרות כלליות */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-black text-slate-500 mb-2 flex items-center gap-1 uppercase tracking-wider">
              <AlertCircle size={14}/> DNA גלובלי (אישיות ה-AI)
            </label>
            <textarea 
              value={globalDNA} onChange={(e) => setGlobalDNA(e.target.value)}
              className="w-full h-24 bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed"
            />
          </div>

          <hr className="border-slate-100" />

          {/* עריכת צומת ספציפי */}
          {activeNode && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                 <div className={`w-12 h-12 rounded-2xl flex justify-center items-center text-white shadow-inner ${activeNode.color}`}>
                    <MessageSquare size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-lg text-slate-800">{activeNode.title}</h3>
                    <p className="text-xs font-bold text-slate-400 font-mono">ID: {activeNode.id}</p>
                 </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <label className="text-xs font-black text-blue-600 mb-2 block uppercase tracking-wider">הוראות ביצוע למצב זה</label>
                <textarea 
                  value={activeNode.prompt} onChange={(e) => updateActiveNode(e.target.value)}
                  placeholder="כתוב מה ה-AI צריך לעשות כשלקוח מגיע לשלב הזה..."
                  className="w-full h-48 bg-white border border-blue-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none leading-relaxed"
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mt-4">
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  💡 טיפ: הוסף תגית <code className="bg-amber-200 px-1 rounded mx-1">[IMAGE]</code> או לינקים, וה-API ידע לתרגם אותם לכרטיסי מוצר עשירים בווצאפ.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
