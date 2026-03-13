import { useState, useEffect } from 'react';
import Head from 'next/head';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, query, limitToLast } from 'firebase/database';

// Client-side config (Public)
const firebaseConfig = {
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function SabanOS() {
  const [messages, setMessages] = useState<any[]>([]);
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    const chatRef = query(ref(db, 'chat-sidor'), limitToLast(15));
    return onChildAdded(chatRef, (snap) => {
      setMessages(prev => [...prev, { id: snap.key, ...snap.val() }].slice(-15));
    });
  }, []);

  const send = async () => {
    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message: text }),
    });
    setText('');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-4 font-sans">
      <Head>
        <title>Saban-OS Control</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#25D366" />
      </Head>

      <h1 className="text-xl font-bold text-green-700 mb-4">ח. סבן - ניהול צינור</h1>
      
      <div className="bg-white rounded-lg shadow p-4 h-80 overflow-y-auto mb-4 border">
        {messages.map(m => (
          <div key={m.id} className="mb-2 border-b pb-1">
            <small className="text-gray-400 text-xs">{m.pushName || m.from}</small>
            <p className="text-sm">{m.body || m.text}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <input className="w-full p-3 border rounded shadow-sm" placeholder="מספר טלפון..." value={phone} onChange={e => setPhone(e.target.value)} />
        <textarea className="w-full p-3 border rounded shadow-sm" placeholder="הודעה..." value={text} onChange={e => setText(e.target.value)} />
        <button onClick={send} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold">שלח לוואטסאפ</button>
      </div>
    </div>
  );
}
