import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, query, onSnapshot, doc, 
  setDoc, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { 
  Users, Save, BrainCircuit, Search, CheckCircle2, AlertCircle, 
  Smartphone, Plus, Edit2, Trash2, Activity, Send, Battery, Wifi, Signal
} from 'lucide-react';

// ==========================================
// 1. אתחול Firebase בטוח (חסין קריסות Vercel)
// ==========================================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://demo-project.firebaseio.com",
};

let app;
let dbFS: any = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  dbFS = getFirestore(app);
} catch (error) {
  console.error("🔥 Firebase Init Error:", error);
}

// ממשק חוק בטבלה
interface PromptRule {
  id: string;
  title: string;
  content: string;
}

export default function CrmManager() {
  const [isMounted, setIsMounted] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  
  // ==========================================
  // סטייטים של ניהול פקודות (Identity & Rules)
  // ==========================================
  const [identity, setIdentity] = useState('');
  const [rules, setRules] = useState<PromptRule[]>([]);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  // ==========================================
  // סטייטים של סימולטור אייפון
  // ==========================================
  const [simMessages, setSimMessages] = useState<{role: 'ai'|'user', text: string}[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isSimTyping, setIsSimTyping] = useState(false);
  const simScrollRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'idle'|'success'|'error', text: string}>({type: 'idle', text: ''});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // טעינת לקוחות
  useEffect(() => {
    if (!isMounted || !dbFS || firebaseConfig.projectId === "demo-project") return;
    try {
      const q = query(collection(dbFS, "customers"));
      const unsubscribe = onSnapshot(q, (snap) => {
        const custData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomers(custData);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  }, [isMounted]);

  // בחירת לקוח וטעינת הנתונים שלו לסטודיו
  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    
    // ניסיון לחלץ זהות וחוקים אם נשמרו כקובץ JSON, אחרת טוען כטקסט רגיל
    try {
      if (c.relation && c.relation.startsWith('{')) {
        const parsed = JSON.parse(c.relation);
        setIdentity(parsed.identity || '');
        setRules(parsed.rules || []);
      } else {
        setIdentity(c.relation || '');
        setRules([]);
      }
    } catch (e) {
      setIdentity(c.relation || '');
      setRules([]);
    }
    
    setSimMessages([{ role: 'ai', text: `אהלן! אני המוח שמדמה את השיחה עם ${c.name || 'הלקוח'}. שלח הודעה כדי לבדוק את הפקודות שלך בלייב.` }]);
    setStatusMsg({type: 'idle', text: ''});
  };

  // ==========================================
  // ניהול טבלת חוקים (CRUD)
  // ==========================================
  const addOrUpdateRule = () => {
    if (!newRuleTitle.trim() || !newRuleContent.trim()) return;
    
    if (editingRuleId) {
      setRules(rules.map(r => r.id === editingRuleId ? { ...r, title: newRuleTitle, content: newRuleContent } : r));
      setEditingRuleId(null);
    } else {
      setRules([...rules, { id: Date.now().toString(), title: newRuleTitle, content: newRuleContent }]);
    }
    setNewRuleTitle('');
    setNewRuleContent('');
  };

  const editRule = (rule: PromptRule) => {
    setNewRuleTitle(rule.title);
    setNewRuleContent(rule.content);
    setEditingRuleId(rule.id);
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // מנתח פקודה (Score)
  const analyzeRule = (content: string) => {
    const length = content.length;
    let score = 50;
    let feedback = "בסיסי";
    
    if (length > 30) score += 20;
    if (content.includes("אם") || content.includes("כאשר")) score += 15; // לוגיקה
    if (content.includes("שאל") || content.includes("תאשר")) score += 15; // פעולה אקטיבית
    
    if (score > 90) feedback = "חד, מדויק ולוגי (מצוין)";
    else if (score > 70) feedback = "ברור וטוב";
    else feedback = "כללי מדי - חסר 'אם-אז'";

    return { score: Math.min(score, 100), feedback };
  };

  // שמירה ל-Firestore
  const handleSaveProfile = async () => {
    if (!selectedCustomer || !dbFS) return;
    setIsSaving(true);
    
    // אורזים הכל לקובץ אחד שיישמר כשדה relation
    const compiledPromptObj = {
      identity: identity,
      rules: rules
    };

    try {
      const docRef = doc(dbFS, "customers", selectedCustomer.id);
      await setDoc(docRef, {
        name: selectedCustomer.name || selectedCustomer.id,
        relation: JSON.stringify(compiledPromptObj),
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      setStatusMsg({type: 'success', text: 'המוח תוכנת ונשמר בהצלחה!'});
      setTimeout(() => setStatusMsg({type: 'idle', text: ''}), 3000);
    } catch (e) {
      console.error(e);
      setStatusMsg({type: 'error', text: 'שגיאה בשמירת הנתונים'});
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // מנוע הסימולטור (Live Chat)
  // ==========================================
  const handleSimulate = async () => {
    if (!simInput.trim() || isSimTyping) return;
    
    const userText = simInput.trim();
    setSimInput('');
    setSimMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsSimTyping(true);
    
    // גוללים למטה
    setTimeout(() => {
      if (simScrollRef.current) simScrollRef.current.scrollTop = simScrollRef.current.scrollHeight;
    }, 100);

    // מרכיבים את הפרומפט הנוכחי (לפני שמירה!)
    const compiledRulesText = rules.map(r => `[${r.title}]: ${r.content}`).join('\n');
    const dynamicContext = `זהות וסגנון: ${identity}\n\nחוקי ברזל:\n${compiledRulesText}`;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          senderPhone: selectedCustomer?.id || "simulator",
          context: dynamicContext // מעבירים את הקונטקסט החי
        })
      });
      const data = await res.json();
      setSimMessages(prev => [...prev, { role: 'ai', text: data.reply || 'שגיאה מהמוח' }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', text: 'שגיאת תקשורת עם המוח המקומי' }]);
    } finally {
      setIsSimTyping(false);
      setTimeout(() => {
        if (simScrollRef.current) simScrollRef.current.scrollTop = simScrollRef.current.scrollHeight;
      }, 100);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.id.includes(search) || (c.name && c.name.includes(search))
  );

  if (!isMounted) return <div className="h-screen bg-slate-50 flex items-center justify-center font-bold">טוען מעבדת AI...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden" dir="rtl">
      <Head><title>Saban AI Lab | סימולטור ופקודות</title></Head>

      {/* תפריט צד (רשימת לקוחות) */}
      <aside className="w-80 bg-white border-l shadow-2xl flex flex-col shrink-0 z-20">
        <header className="p-6 bg-slate-900 text-white border-b-4 border-blue-500">
          <h1 className="text-xl font-black italic">SABAN <span className="text-blue-400">AI LAB</span></h1>
          <p className="text-xs font-bold text-blue-300 mt-1">מעבדת אימון וסימולטור 🔬</p>
        </header>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="חיפוש לפי טלפון או שם..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 pr-10 pl-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCustomers.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleSelectCustomer(c)}
              className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${selectedCustomer?.id === c.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${selectedCustomer?.id === c.id ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <Users size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 truncate">{c.name || c.id}</h3>
                <p className="text-[10px] font-mono text-slate-500">{c.id}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* אזור העבודה הראשי */}
      <main className="flex-1 p-6 lg:p-10 bg-slate-50 flex flex-col lg:flex-row gap-8 overflow-y-auto relative">
        
        {!selectedCustomer ? (
          <div className="m-auto flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
            <BrainCircuit size={80} />
            <h2 className="text-2xl font-bold">בחר לקוח או מנכ"ל מהרשימה כדי להתחיל אימון</h2>
          </div>
        ) : (
          <>
            {/* עמודה ימנית: ניהול פקודות */}
            <div className="flex-1 max-w-3xl space-y-6">
              <header className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200 shadow-inner">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">קידוד מוח עבור: {selectedCustomer.name}</h1>
                  <p className="text-sm font-bold text-slate-500 font-mono mt-1">{selectedCustomer.id}</p>
                </div>
              </header>

              {/* זהות כללית (Identity) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-black">
                  <Smartphone size={20} className="text-blue-500"/>
                  <h2>1. זהות וסגנון תקשורת (Identity & Tone)</h2>
                </div>
                <textarea 
                  value={identity}
                  onChange={e => setIdentity(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-blue-500 text-sm leading-relaxed"
                  placeholder='לדוגמה: אתה ראמי. הלקוח מולך הוא הראל המנכ"ל. תהיה קצר, מקצועי וענייני. בלי לחפור ובלי סלנג.'
                />
              </div>

              {/* טבלת חוקים (Rules Table) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-slate-800 font-black">
                    <Activity size={20} className="text-emerald-500"/>
                    <h2>2. טבלת חוקי ברזל וניתוח AI</h2>
                  </div>
                </div>

                {/* הוספת חוק חדש */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <input 
                    type="text" placeholder="שם החוק (למשל: אישורי תשלום)" 
                    value={newRuleTitle} onChange={e => setNewRuleTitle(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                  <textarea 
                    placeholder="תיאור החוק (למשל: אם הוא שואל למה X קרה, ענה מיד עם הסיבה הלוגיסטית...)" 
                    value={newRuleContent} onChange={e => setNewRuleContent(e.target.value)}
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  />
                  <button 
                    onClick={addOrUpdateRule}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
                  >
                    <Plus size={16} /> {editingRuleId ? 'עדכן חוק' : 'הוסף חוק לטבלה'}
                  </button>
                </div>

                {/* טבלת חוקים אקטיביים */}
                {rules.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-wider">
                          <th className="p-3 rounded-tr-xl">שם החוק</th>
                          <th className="p-3">תיאור הפקודה</th>
                          <th className="p-3 text-center">מדד עוצמה</th>
                          <th className="p-3 rounded-tl-xl text-left">פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((rule, idx) => {
                          const analysis = analyzeRule(rule.content);
                          return (
                            <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                              <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{idx + 1}. {rule.title}</td>
                              <td className="p-3 text-slate-600 max-w-xs truncate" title={rule.content}>{rule.content}</td>
                              <td className="p-3">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div className={`h-full rounded-full ${analysis.score > 80 ? 'bg-emerald-500' : analysis.score > 60 ? 'bg-orange-400' : 'bg-red-500'}`} style={{width: `${analysis.score}%`}}></div>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500">{analysis.feedback} ({analysis.score}%)</span>
                                </div>
                              </td>
                              <td className="p-3 flex items-center justify-end gap-2">
                                <button onClick={() => editRule(rule)} className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border border-slate-100 transition"><Edit2 size={14}/></button>
                                <button onClick={() => deleteRule(rule.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-slate-100 transition"><Trash2 size={14}/></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* שמירת כל הפרופיל */}
                <button 
                  onClick={handleSaveProfile} disabled={isSaving || firebaseConfig.projectId === "demo-project"}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-6"
                >
                  <Save size={18} /> {isSaving ? 'מקודד למוח...' : 'שמור והחל על הלקוח'}
                </button>

                {statusMsg.type !== 'idle' && (
                  <div className={`p-4 rounded-xl text-center text-sm font-bold ${statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {statusMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* עמודה שמאלית: סימולטור מובייל (Live Preview) */}
            <div className="hidden xl:flex flex-col items-center shrink-0 w-[350px]">
              <div className="bg-slate-200 text-slate-600 text-xs font-black px-4 py-1.5 rounded-full mb-4 flex items-center gap-2">
                <Activity size={14} className="animate-pulse text-blue-500" />
                Live AI Simulator
              </div>

              {/* iPhone Frame */}
              <div className="w-[320px] h-[650px] bg-white border-[12px] border-slate-800 rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-0 inset-x-0 h-6 w-32 bg-slate-800 mx-auto rounded-b-2xl z-20 flex justify-center items-center gap-2">
                  <div className="w-12 h-1.5 bg-slate-900 rounded-full"></div>
                </div>

                {/* Status Bar */}
                <div className="bg-[#00a884] h-12 w-full pt-1 px-5 flex justify-between items-center text-white shrink-0 z-10">
                  <span className="text-[10px] font-bold mt-2">12:46</span>
                  <div className="flex items-center gap-1 mt-2">
                    <Signal size={10} /><Wifi size={10} /><Battery size={12} />
                  </div>
                </div>

                {/* WhatsApp Header */}
                <div className="bg-[#00a884] p-3 text-white flex items-center gap-3 shadow-md shrink-0 z-10">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <BrainCircuit size={18} />
                  </div>
                  <div className="leading-tight">
                    <div className="font-bold text-sm">ראמי (AI)</div>
                    <div className="text-[10px] text-white/80">מקליד לפי הפקודות שלך...</div>
                  </div>
                </div>

                {/* Chat Background & Messages */}
                <div ref={simScrollRef} className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-[#e5ddd5]" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'cover'}}>
                  <div className="bg-amber-100 text-amber-800 text-[10px] text-center p-2 rounded-lg font-bold mx-4 shadow-sm">
                    הסימולטור משתמש בחוקים שהזנת עכשיו (גם אם טרם שמרת).
                  </div>
                  
                  {simMessages.map((msg, i) => (
                    <div key={i} className={`p-2.5 max-w-[85%] text-sm rounded-xl shadow-sm ${msg.role === 'ai' ? 'bg-white rounded-tr-none self-start border border-slate-100' : 'bg-[#dcf8c6] rounded-tl-none self-end'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ))}
                  
                  {isSimTyping && (
                    <div className="bg-white p-2.5 rounded-xl rounded-tr-none self-start shadow-sm border border-slate-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={simInput}
                    onChange={e => setSimInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSimulate()}
                    placeholder="שלח הודעה כהראל..."
                    disabled={isSimTyping}
                    className="flex-1 bg-white rounded-full px-4 py-2 text-sm outline-none border border-slate-200"
                  />
                  <button onClick={handleSimulate} disabled={isSimTyping || !simInput.trim()} className="w-10 h-10 bg-[#00a884] rounded-full flex justify-center items-center text-white disabled:opacity-50">
                    <Send size={16} className="rotate-180 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
