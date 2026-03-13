// /pages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { db } from '../lib/firebase'; 
import { ref, onChildAdded, query, limitToLast } from 'firebase/database';
import { Message } from '../types';
import { MessageBubble } from '../components/chat/MessageBubble';
import { Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // מספר הטלפון של הלקוח - JONI בדרך כלל שולח אותו בשדה 'from'
  const [targetPhone, setTargetPhone] = useState('972...'); 

  // קבלת הודעות בזמן אמת
  useEffect(() => {
    const messagesRef = query(ref(db, 'chat-sidor'), limitToLast(100));
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const newMessage: Message = {
        id: snapshot.key || Math.random().toString(),
        body: data.body || data.text || "",
        content: data.body || data.text || "",
        fromMe: data.fromMe || false,
        timestamp: data.timestamp || Date.now(),
        senderId: data.from || "client",
        chatId: "chat-sidor",
        kind: 'text',
        status: 'delivered',
        createdAt: new Date(data.timestamp || Date.now()).toISOString()
      };

      if (data.from && !data.fromMe) setTargetPhone(data.from);

      setMessages((prev) => {
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });
    return () => unsubscribe();
  }, []);

  // גלילה אוטומטית
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // פונקציית שליחה
  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');

    try {
      await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, text: text }),
      });
      // הערה: JONI יכתוב את ההודעה ל-Firebase והיא תופיע כאן אוטומטית דרך המאזין
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] font-sans" dir="rtl">
      <Head><title>SabanOS | Live Chat</title></Head>
      
      {/* Header */}
      <div className="p-3 bg-[#f0f2f5] border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
          <div>
            <h2 className="font-semibold text-sm">לקוח: {targetPhone}</h2>
            <span className="text-[10px] text-green-600 font-bold">JONI Listener Active</span>
          </div>
        </div>
        <div className="flex gap-4 text-gray-600">
          <Video className="w-5" /> <Phone className="w-5" /> <MoreVertical className="w-5" />
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 chat-container"
        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundColor: '#e5ddd5' }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-[#f0f2f5] flex items-center gap-3">
        <Paperclip className="text-gray-600 cursor-pointer w-6" />
        <input 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתוב הודעה..." 
          className="flex-1 bg-white rounded-lg px-4 py-2 outline-none text-sm shadow-sm"
        />
        <button onClick={handleSend} className="p-2.5 bg-[#00a884] text-white rounded-full">
          <Send className="w-5 transform rotate-180" />
        </button>
      </div>
    </div>
  );
}
