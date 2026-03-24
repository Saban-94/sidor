import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, query, onSnapshot, doc, 
  setDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Users, Save, BrainCircuit, Search, Smartphone, Plus, Edit2, 
  Trash2, Activity, Send, Battery, Wifi, Signal, ArrowRight, Image as ImageIcon
} from 'lucide-react';

// ==========================================
// 1. אתחול Firebase בטוח
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
  
  // PWA Mobile Navigation State
  const [showMobileList, setShowMobileList] = useState(true);
  
  // Profile & AI States
  const [identity, setIdentity] = useState('');
  const [editPhoto, setEditPhoto] = useState(''); // שדה חדש לתמונת פרופיל
  const [rules, setRules] = useState<PromptRule[]>([]);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  // Simulator States
  const [simMessages, setSimMessages] = useState<{role: 'ai'|'user', text: string}[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isSimTyping, setIsSimTyping] = useState(false);
  const simScrollRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'idle'|'success'|'error', text: string}>({type: 'idle', text: ''});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // שליפת לקוחות
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

  // בחירת לקוח
  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setEditPhoto(c.photo || ''); // טעינת התמונה הקיימת
    
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
    setShowMobileList(false); // מעבר לתצוגת פנים במובייל
  };

  // ניהול חוקים
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

  const analyzeRule = (content: string) => {
    const length = content.length;
    let score = 50;
    let feedback = "בסיסי";
    if (length > 30) score += 20;
    if (content.includes("אם") || content.includes("כאשר")) score += 15;
    if (content.includes("שאל") || content.includes("תאשר") || content.includes("ענה")) score += 15;
    if (score > 90) feedback = "חד ולוגי";
    else if (score > 70) feedback = "ברור וטוב";
    else feedback = "חסר 'אם-אז'";
    return { score: Math.min(score, 100), feedback };
  };

  // שמירה ל-Firestore
  const handleSaveProfile = async () => {
    if (!selectedCustomer || !dbFS) return;
    setIsSaving(true);
    
    const compiledPromptObj = {
      identity: identity,
      rules: rules
    };

    try {
      const docRef = doc(dbFS, "customers", selectedCustomer.id);
      await setDoc(docRef, {
        name: selectedCustomer.name || selectedCustomer.id,
        photo: editPhoto, // שומר את התמונה במסד הנתונים
        relation: JSON.stringify(compiledPromptObj),
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      setStatusMsg({type: 'success', text: 'המוח והפרופיל עודכנו בהצלחה!'});
      setTimeout(() => setStatusMsg({type: 'idle', text: ''}), 3000);
    } catch (e) {
      console.error(e);
      setStatusMsg({type: 'error', text: 'שגיאה בשמירת הנתונים'});
    } finally {
      setIsSaving(false);
    }
  };

  // מנוע סימולטור
  const handleSimulate = async () => {
    if (!simInput.trim() || isSimTyping) return;
    
    const userText = simInput.trim();
    setSimInput('');
    setSimMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsSimTyping(true);
    
    setTimeout(() => {
      if (simScrollRef.current) simScrollRef.current.scrollTop = simScrollRef.current.scrollHeight;
    }, 100);

    const compiledRulesText = rules.map(r => `[${r.title}]: ${r.content}`).join('\n');
    const dynamicContext = `זהות וסגנון: ${identity}\n\nחוקי ברזל:\n${compiledRulesText}`;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          senderPhone: selectedCustomer?.id || "simulator",
          context: dynamicContext
        })
      });
      const data = await res.json();
      setSimMessages(prev => [...prev, { role: 'ai', text: data.reply || 'שגיאה מהמוח' }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', text: 'שגיאת תקשורת עם השרת' }]);
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

  if (!isMounted) return <div className="h-screen bg-slate-50 flex items-center justify-center font-bold">טוען PWA...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden" dir="rtl">
      <Head>
        <title>Saban AI Lab | PWA</title>
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* תפריט צד (מוסתר במובייל כשנבחר לקוח) */}
      <aside className={`${showMobileList ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 bg-white border-l shadow-2xl flex-col shrink-0 z-20 transition-all`}>
        <header className="p-6 bg-slate-900 text-white border-b-4 border-blue-500 shrink-0">
          <h1 className="text-xl font-black italic">SABAN <span className="text-blue-400">AI LAB</span></h1>
          <p className="text-xs font-bold text-blue-300 mt-1">מעבדת אימון וסימולטור 🔬</p>
        </header>

        <div className="p-4 border-b shrink-0">
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white overflow-hidden shadow-sm ${selectedCustomer?.id === c.id ? 'bg-blue-600' : 'bg-slate-300'}`}>
                {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : <Users size={20} />}
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
      <main className={`${!showMobileList ? 'flex' : 'hidden'} lg:flex flex-1 p-0 lg:p-8 bg-slate-50 flex-col lg:flex-row gap-8 overflow-y-auto relative`}>
        
        {!selectedCustomer ? (
          <div className="m-auto flex-col items-center justify-center text-slate-400 opacity-50 space-y-4 hidden lg:flex">
            <BrainCircuit size={80} />
            <h2 className="text-2xl font-bold">בחר לקוח מהרשימה כדי להתחיל אימון</h2>
          </div>
        ) : (
          <>
            {/* עמודה ימנית: ניהול פקודות (PWA Mobile View) */}
            <div className="flex-1 w-full max-w-3xl space-y-4 lg:space-y-6 p-4 lg:p-0">
              
              {/* PWA Mobile Header Back Button */}
              <div className="lg:hidden flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm mb-4">
                <button onClick={() => setShowMobileList(true)} className="bg-slate-100 p-2 rounded-xl text-slate-600 active:scale-95"><ArrowRight size={20}/></button>
                <span className="font-black text-slate-800">חזור לרשימה</span>
              </div>

              <header className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200 shadow-inner overflow-hidden shrink-0">
                  {editPhoto ? <img src={editPhoto} className="w-full h-full object-cover" alt="Profile" /> : <BrainCircuit size={32} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h1 className="text-xl lg:text-2xl font-black text-slate-900 truncate">קידוד: {selectedCustomer.name}</h1>
                  <p className="text-sm font-bold text-slate-500 font-mono mt-1">{selectedCustomer.id}</p>
                </div>
              </header>

              {/* זהות, סגנון ותמונת פרופיל */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
                <div className="flex items-center gap-2 text-slate-800 font-black border-b border-slate-100 pb-3">
                  <Smartphone size={20} className="text-blue-500"/>
                  <h2>1. פרופיל וזהות תקשורת (Identity)</h2>
                </div>
                
                {/* שדה תמונה חדש */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1"><ImageIcon size={14}/> לינק לתמונת פרופיל (URL)</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="text" 
                      value={editPhoto}
                      onChange={e => setEditPhoto(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 text-sm dir-ltr text-left"
                      placeholder="https://example.com/photo.jpg"
                    />
                    {editPhoto && <img src={editPhoto} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" alt="Preview" />}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">זהות ה-AI מול הלקוח</label>
                  <textarea 
                    value={identity}
                    onChange={e => setIdentity(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-blue-500 text-sm leading-relaxed"
                    placeholder='לדוגמה: אתה ראמי. הלקוח הוא הראל המנכ"ל...'
                  />
                </div>
              </div>

              {/* טבלת חוקים */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-slate-800 font-black">
                    <Activity size={20} className="text-emerald-500"/>
                    <h2>2. טבלת חוקי ברזל וניתוח AI</h2>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <input 
                    type="text" placeholder="שם החוק (למשל: אישורי תשלום)" 
                    value={newRuleTitle} onChange={e => setNewRuleTitle(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                  <textarea 
                    placeholder="תיאור החוק (אם-אז...)" 
                    value={newRuleContent} onChange={e => setNewRuleContent(e.target.value)}
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  />
                  <button 
                    onClick={addOrUpdateRule}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition w-full md:w-auto"
                  >
                    <Plus size={16} /> {editingRuleId ? 'עדכן חוק' : 'הוסף חוק לטבלה'}
                  </button>
                </div>

                {rules.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right min-w-[500px]">
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
                            <tr key={rule.id} className="border-b border-slate-50">
                              <td className="p-3 font-bold text-slate-800">{idx + 1}. {rule.title}</td>
                              <td className="p-3 text-slate-600 max-w-[200px] truncate" title={rule.content}>{rule.content}</td>
                              <td className="p-3">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full ${analysis.score > 80 ? 'bg-emerald-500' : analysis.score > 60 ? 'bg-orange-400' : 'bg-red-500'}`} style={{width: `${analysis.score}%`}}></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-500">{analysis.feedback}</span>
                                </div>
                              </td>
                              <td className="p-3 flex items-center justify-end gap-2">
                                <button onClick={() => editRule(rule)} className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border border-slate-100"><Edit2 size={14}/></button>
                                <button onClick={() => deleteRule(rule.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-slate-100"><Trash2 size={14}/></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <button 
                  onClick={handleSaveProfile} disabled={isSaving || firebaseConfig.projectId === "demo-project"}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} /> {isSaving ? 'מעדכן במסד הנתונים...' : 'שמור פרופיל למאגר'}
                </button>

                {statusMsg.type !== 'idle' && (
                  <div className={`p-4 rounded-xl text-center text-sm font-bold ${statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {statusMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* עמודה שמאלית: סימולטור (נראה גם במובייל בתחתית הדף) */}
            <div className="flex flex-col items-center shrink-0 w-full lg:w-[350px] pb-10 lg:pb-0">
              <div className="bg-slate-200 text-slate-600 text-xs font-black px-4 py-1.5 rounded-full mb-4 flex items-center gap-2">
                <Activity size={14} className="animate-pulse text-blue-500" />
                Live AI Simulator
              </div>

              {/* iPhone Frame */}
              <div className="w-[320px] h-[600px] lg:h-[650px] bg-white border-[12px] border-slate-800 rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-6 w-32 bg-slate-800 mx-auto rounded-b-2xl z-20 flex justify-center items-center">
                  <div className="w-12 h-1.5 bg-slate-900 rounded-full"></div>
                </div>

                <div className="bg-[#00a884] h-12 w-full pt-1 px-5 flex justify-between items-center text-white shrink-0 z-10">
                  <span className="text-[10px] font-bold mt-2">12:46</span>
                  <div className="flex items-center gap-1 mt-2">
                    <Signal size={10} /><Wifi size={10} /><Battery size={12} />
                  </div>
                </div>

                <div className="bg-[#00a884] p-3 text-white flex items-center gap-3 shadow-md shrink-0 z-10">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    {editPhoto ? <img src={editPhoto} className="w-full h-full object-cover" alt="User" /> : <BrainCircuit size={18} className="text-[#00a884]" />}
                  </div>
                  <div className="leading-tight">
                    <div className="font-bold text-sm">ראמי (AI)</div>
                    <div className="text-[10px] text-white/80">מקליד לפי הפקודות שלך...</div>
                  </div>
                </div>

                <div ref={simScrollRef} className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-[#e5ddd5]" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'cover'}}>
                  <div className="bg-amber-100 text-amber-800 text-[10px] text-center p-2 rounded-lg font-bold mx-4 shadow-sm">
                    הסימולטור משתמש בזהות ובחוקים שהזנת עכשיו (גם טרם שמירה).
                  </div>
                  
                  {simMessages.map((msg, i) => (
                    <div key={i} className={`p-2.5 max-w-[85%] text-sm rounded-xl shadow-sm ${msg.role === 'ai' ? 'bg-white rounded-tr-none self-start border border-slate-100' : 'bg-[#dcf8c6] rounded-tl-none self-end'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ))}
                  
                  {isSimTyping && (
                    <div className="bg-white p-2.5 rounded-xl rounded-tr-none self-start shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    </div>
                  )}
                </div>

                <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 shrink-0 pb-6 lg:pb-2">
                  <input 
                    type="text" 
                    value={simInput}
                    onChange={e => setSimInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSimulate()}
                    placeholder="שלח הודעה בסימולטור..."
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
