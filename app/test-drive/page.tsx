'use client'; // חובה ב-App Router עבור רכיבים אינטראקטיביים

import React, { useState } from 'react';

export default function TestDrivePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [googleUrl, setGoogleUrl] = useState('https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec');
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    addLog(`מתחיל בדיקה עבור: ${file.name}`);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        addLog("📡 שולח לשרת Vercel...");

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

        const data = await res.json();
        if (res.ok) {
          addLog(`✅ הצלחה! לינק בדרייב: ${data.link}`);
        } else {
          addLog(`❌ שגיאה: ${data.message || data.error}`);
        }
      } catch (err: any) {
        addLog(`💥 קריסה: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-10 font-sans max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">מלשינון העלאה חריף 🌶️</h1>
      <div className="bg-white border p-6 rounded-xl mb-6 shadow-sm">
        <input 
          type="text" 
          value={googleUrl} 
          onChange={(e) => setGoogleUrl(e.target.value)}
          className="w-full p-2 border rounded mb-4 text-xs font-mono"
          placeholder="Google Script URL"
        />
        <input type="file" onChange={handleUpload} disabled={loading} className="block w-full text-sm" />
      </div>
      <div className="bg-black text-emerald-400 p-6 rounded-xl font-mono text-xs h-64 overflow-y-auto">
        {logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
      </div>
    </div>
  );
}
