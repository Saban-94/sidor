import { useEffect, useState } from 'react';
import { ref, onChildAdded, query, limitToLast } from "firebase/database";
import { db } from "../lib/firebaseClient"; // ה-SDK הרגיל של פיירבייס

export default function SabanOS() {
  const [messages, setMessages] = useState<any[]>([]);
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');

  // האזנה להודעות נכנסות מ-chat-sidor
  useEffect(() => {
    const chatRef = query(ref(db, 'chat-sidor'), limitToLast(20));
    
    const unsubscribe = onChildAdded(chatRef, (snapshot) => {
      const data = snapshot.val();
      setMessages((prev) => [...prev, { id: snapshot.key, ...data }].slice(-20));
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message: text }),
    });
    
    if (res.ok) {
      setText('');
      alert("נשלח לצינור!");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4 font-sans" dir="rtl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-green-700">Saban-OS Control Center</h1>
        <p className="text-sm text-gray-600">ניהול וואטסאפ וצינור JONI</p>
      </header>

      {/* תצוגת הודעות */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg p-4 shadow-inner mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`mb-2 p-2 rounded-lg ${m.fromMe ? 'bg-green-100 text-left' : 'bg-blue-100 text-right'}`}>
            <span className="block text-xs font-bold">{m.pushName || m.from}</span>
            <p>{m.body || m.text}</p>
          </div>
        ))}
      </div>

      {/* פאנל שליחה */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <input 
          className="w-full border p-2 rounded mb-2" 
          placeholder="מספר טלפון (972...)" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        />
        <textarea 
          className="w-full border p-2 rounded mb-2" 
          placeholder="הודעה..." 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
        />
        <button 
          onClick={sendMessage}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
        >
          שלח הודעה
        </button>
      </div>
    </div>
  );
}
