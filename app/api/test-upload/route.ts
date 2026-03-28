import React, { useState } from 'react';

export default function SuperLoggerPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [googleUrl, setGoogleUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const startTest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !googleUrl) {
      alert("חובה להזין URL של גוגל ולבחור קובץ!");
      return;
    }

    setStatus('running');
    addLog(`🚀 שלב 1: התחלת תהליך עבור ${file.name}`);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        addLog("📂 שלב 2: קובץ הומר ל-Base64 בהצלחה");
        const base64 = (reader.result as string).split(',')[1];

        addLog("📡 שלב 3: שולח בקשה ל-Vercel API (api/test-upload)...");
        const res = await fetch('/api/test-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64,
            mimeType: file.type,
            GOOGLE_URL: googleUrl
          })
        });

        addLog(`📡 שלב 4: התקבלה תגובה מ-Vercel (סטטוס: ${res.status})`);
        
        const contentType = res.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
          const rawText = await res.text();
          addLog(`❌ שגיאה קריטית: השרת החזיר HTML במקום JSON!`);
          addLog(`תוכן השגיאה: ${rawText.substring(0, 100)}...`);
          throw new Error("הנתיב api/test-upload לא נמצא (404)");
        }

        const data = await res.json();
        if (data.status === 'success' || res.ok) {
          addLog(`✅ שלב 5: גוגל אישרה קבלה! לינק: ${data.link}`);
          setStatus('success');
        } else {
          addLog(`❌ שלב 5: גוגל/ורסל החזירו שגיאה: ${data.message || data.error}`);
          setStatus('error');
        }
      } catch (err: any) {
        addLog(`💥 קריסת ממשק: ${err.message}`);
        setStatus('error');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto font-sans" dir="rtl">
      <h1 className="text-2xl font-black mb-6 text-slate-800 underline decoration-emerald-500">מלשינון העלאה חריף 🌶️</h1>
      
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
        <label className="block text-sm font-bold mb-2">1. כתובת ה-Deployment מגוגל (ה-URL מסוג exec):</label>
        <input 
          type="text" 
          value={googleUrl}
          onChange={(e) => setGoogleUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/.../exec"
          className="w-full p-3 border rounded-xl mb-4 text-xs font-mono bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        
        <label className="block text-sm font-bold mb-2">2. בחר קובץ לבדיקה:</label>
        <input type="file" onChange={startTest} className="block w-full text-sm" />
      </div>

      <div className="bg-black rounded-2xl p-6 h-96 overflow-y-auto shadow-2xl border-4 border-slate-800">
        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
          <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest">Live System Logs</span>
          <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'bg-yellow-500 animate-ping' : status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-700'}`} />
        </div>
        {logs.map((log, i) => (
          <div key={i} className={`mb-2 font-mono text-[11px] ${log.includes('✅') ? 'text-emerald-400' : log.includes('❌') || log.includes('💥') ? 'text-red-400' : 'text-slate-300'}`}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
