import React, { useState } from 'react';

export default function TestDrivePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleTest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    addLog(`מתחיל בדיקה עבור: ${file.name}`);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        addLog("המרת קובץ ל-Base64 הושלמה.");

        const res = await fetch('/api/test-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64,
            mimeType: file.type,
            phone: "050-TEST"
          })
        });

        const data = await res.json();
        
        if (res.ok) {
          addLog(`✅ הצלחה! לינק: ${data.link}`);
        } else {
          addLog(`❌ כשל בשרת: ${data.error || data.message}`);
        }
      } catch (err: any) {
        addLog(`💥 שגיאת דפדפן: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-10 font-sans max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">מעבדת בדיקת דרייב 🧪</h1>
      <div className="border-2 border-dashed border-slate-300 p-10 text-center rounded-xl mb-6">
        <input type="file" onChange={handleTest} disabled={loading} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      </div>

      <div className="bg-slate-900 text-emerald-400 p-6 rounded-xl font-mono text-xs h-64 overflow-y-auto shadow-2xl">
        <p className="mb-2 text-slate-500">// לוגים בזמן אמת:</p>
        {logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
        {loading && <p className="animate-pulse">מעבד נתונים...</p>}
      </div>
    </div>
  );
}
