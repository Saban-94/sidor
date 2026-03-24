import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, query, onSnapshot, doc, 
  setDoc, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { Users, Save, FileUp, BrainCircuit, Search, CheckCircle2, AlertCircle, Database } from 'lucide-react';

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

export default function CrmManager() {
  const [isMounted, setIsMounted] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editRelation, setEditRelation] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'idle'|'loading'|'success'|'error', text: string}>({type: 'idle', text: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      console.error("שגיאה בשליפת לקוחות:", err);
    }
  }, [isMounted]);

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setEditName(c.name || '');
    setEditRelation(c.relation || '');
    setUploadStatus({type: 'idle', text: ''});
  };

  const handleSaveProfile = async () => {
    if (!selectedCustomer || !dbFS) return;
    setIsSaving(true);
    try {
      const docRef = doc(dbFS, "customers", selectedCustomer.id);
      await setDoc(docRef, {
        name: editName,
        relation: editRelation,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      setUploadStatus({type: 'success', text: 'פרופיל והנחיות מוח עודכנו בהצלחה!'});
      setTimeout(() => setUploadStatus({type: 'idle', text: ''}), 3000);
    } catch (e) {
      console.error(e);
      setUploadStatus({type: 'error', text: 'שגיאה בשמירת הנתונים'});
    } finally {
      setIsSaving(false);
    }
  };

  // ייבוא מרוכז של אנשי קשר מ-CSV של JONI
  const handleBulkImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dbFS) return;

    setUploadStatus({type: 'loading', text: 'מייבא אנשי קשר למאגר...'});
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        
        const batch = writeBatch(dbFS);
        let count = 0;

        // מתחילים מ-1 כדי לדלג על שורת הכותרות
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(',');
          if (cols.length < 4) continue;

          // מבנה הקובץ: מספר נייד (0), שם (1), שם מלא (2), שם קבוצה (3)
          const phone = cols[0].replace(/\D/g, ''); // ניקוי המספר
          const fullName = cols[2].trim() || cols[1].trim() || 'לקוח ללא שם';
          const groupName = cols[3].trim();
          
          if (!phone) continue;

          const docRef = doc(dbFS, "customers", phone);
          batch.set(docRef, {
            name: fullName,
            relation: groupName ? `שייך לקבוצה: ${groupName}` : 'לקוח כללי',
            importedFromJoni: true,
            lastUpdated: serverTimestamp()
          }, { merge: true }); // merge: true שומר על היסטוריה קיימת אם יש
          
          count++;
          if (count >= 400) break; // מגבלת Batch של פיירבייס (עד 500)
        }

        await batch.commit();
        setUploadStatus({type: 'success', text: `ייבוא הושלם! ${count} לקוחות נוצרו/עודכנו בהצלחה.`});
        setTimeout(() => setUploadStatus({type: 'idle', text: ''}), 5000);
        if (bulkInputRef.current) bulkInputRef.current.value = '';
      } catch (error) {
        console.error(error);
        setUploadStatus({type: 'error', text: 'שגיאה בקריאת הקובץ. ודא שזה CSV תקין.'});
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomer || !dbFS) return;

    setUploadStatus({type: 'loading', text: 'קורא ומזריק היסטוריה...'});
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        
        const batch = writeBatch(dbFS);
        let count = 0;

        for (let line of lines) {
          if (!line.trim()) continue;
          
          const isIncoming = !line.includes("ראמי") && !line.includes("ח. סבן");
          const msgRef = doc(collection(dbFS, "customers", selectedCustomer.id, "chat_history"));
          
          batch.set(msgRef, {
            text: line.replace(/^.*?-\s*.*?:/, '').trim(),
            type: isIncoming ? 'in' : 'out',
            source: 'whatsapp_import',
            timestamp: serverTimestamp() 
          });
          
          count++;
          if (count >= 400) break; 
        }

        await batch.commit();
        setUploadStatus({type: 'success', text: `הוזרקו ${count} הודעות למוח בהצלחה!`});
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error(error);
        setUploadStatus({type: 'error', text: 'שגיאה בפיענוח הקובץ'});
      }
    };
    reader.readAsText(file);
  };

  const filteredCustomers = customers.filter(c => 
    c.id.includes(search) || (c.name && c.name.includes(search))
  );

  if (!isMounted) return <div className="h-screen bg-slate-50 flex items-center justify-center font-bold">טוען ממשק...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans" dir="rtl">
      <Head><title>CRM & AI Training | ח. סבן</title></Head>

      <aside className="w-80 bg-white border-l shadow-2xl flex flex-col shrink-0 z-10">
        <header className="p-6 bg-slate-900 text-white border-b-4 border-emerald-500">
          <h1 className="text-xl font-black italic">SABAN STUDIO</h1>
          <p className="text-xs font-bold text-emerald-400 mt-1">ניהול ואימון AI 🧠</p>
        </header>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="חיפוש לקוח / טלפון..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 pr-10 pl-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCustomers.length === 0 && firebaseConfig.projectId !== "demo-project" && (
            <div className="text-center p-4 text-slate-400 text-sm font-bold">לא נמצאו לקוחות במאגר</div>
          )}
          {filteredCustomers.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleSelectCustomer(c)}
              className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${selectedCustomer?.id === c.id ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50 border border-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${selectedCustomer?.id === c.id ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <Users size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 truncate">{c.name || 'לא ידוע'}</h3>
                <p className="text-xs font-mono text-slate-500">{c.id}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
        {firebaseConfig.projectId === "demo-project" && (
          <div className="bg-red-100 text-red-800 p-4 rounded-xl mb-6 font-bold flex items-center gap-3 shadow-sm border border-red-200">
            <AlertCircle size={24} className="animate-pulse" />
            <span>חסרים משתני סביבה. המערכת רצה במצב "Demo" ולא תשמור נתונים. הכנס למערכת Vercel והוסף את מפתחות ה-Firebase.</span>
          </div>
        )}

        {/* התראות סטטוס כלליות (כמו הצלחת ייבוא) */}
        {!selectedCustomer && uploadStatus.type !== 'idle' && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
            uploadStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
            uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
            'bg-red-50 text-red-700'
          }`}>
            {uploadStatus.type === 'loading' && <BrainCircuit className="animate-pulse" size={18} />}
            {uploadStatus.type === 'success' && <CheckCircle2 size={18} />}
            {uploadStatus.type === 'error' && <AlertCircle size={18} />}
            {uploadStatus.text}
          </div>
        )}

        {!selectedCustomer ? (
          <div className="h-full flex flex-col items-center justify-center space-y-12">
            <div className="text-slate-400 opacity-50 flex flex-col items-center space-y-4">
              <BrainCircuit size={64} />
              <h2 className="text-xl font-bold">בחר לקוח מהרשימה כדי לאמן את המוח</h2>
            </div>

            {/* קוביית ייבוא אנשי קשר גלובלית */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center space-y-4">
              <Database size={40} className="mx-auto text-blue-500" />
              <h3 className="font-black text-xl text-slate-800">ייבוא אנשי קשר (CSV)</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                העלה את קובץ ה-CSV של JONI כדי לייצר פרופיל אישי לכל לקוח במערכת בלחיצת כפתור.
              </p>
              <label className="bg-blue-50 text-blue-700 border border-blue-200 px-6 py-4 rounded-xl font-black cursor-pointer hover:bg-blue-100 transition-colors inline-block w-full mt-4">
                בחר קובץ CSV והתחל ייבוא
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={bulkInputRef}
                  onChange={handleBulkImportCSV} 
                  disabled={firebaseConfig.projectId === "demo-project" || uploadStatus.type === 'loading'}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner border border-emerald-200">
                <Users size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">{selectedCustomer.name || selectedCustomer.id}</h1>
                <p className="text-sm font-mono text-slate-500 font-bold bg-slate-200 px-2 py-0.5 rounded-md inline-block mt-1">{selectedCustomer.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* פרופיל AI */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-black mb-4">
                  <BrainCircuit size={20} />
                  <h2>אימון מוח (AI Context)</h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">שם תצוגה</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">הנחיות התנהגות (Prompt Injection)</label>
                  <textarea 
                    value={editRelation}
                    onChange={e => setEditRelation(e.target.value)}
                    rows={5}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm leading-relaxed"
                  />
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || firebaseConfig.projectId === "demo-project"}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? 'שומר נתונים...' : 'שמור פרופיל למאגר'}
                </button>
              </div>

              {/* הזרקת היסטוריה ספציפית ללקוח */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 font-black mb-4">
                    <FileUp size={20} />
                    <h2>הזרקת היסטוריה (WhatsApp)</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    יצא את צ'אט הווצאפ הספציפי עם הלקוח כקובץ TXT, העלה לכאן, והמערכת תזריק את השיחות לזיכרון ה-AI.
                  </p>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <FileUp size={32} className="text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">לחץ לבחירת היסטוריה (.txt)</span>
                    <input 
                      type="file" 
                      accept=".txt"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={firebaseConfig.projectId === "demo-project"}
                      className="hidden" 
                    />
                  </label>
                </div>

                {uploadStatus.type !== 'idle' && (
                  <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                    uploadStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
                    uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {uploadStatus.type === 'loading' && <BrainCircuit className="animate-pulse" size={18} />}
                    {uploadStatus.type === 'success' && <CheckCircle2 size={18} />}
                    {uploadStatus.type === 'error' && <AlertCircle size={18} />}
                    {uploadStatus.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
