// /pages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { db } from '../lib/firebase'; 
import { ref, onChildAdded, query, limitToLast } from 'firebase/database';
import { Message } from '../types';
import { MessageBubble } from '../components/chat/MessageBubble';
import { Send, Paperclip, MoreVertical, Phone, Video, UserPlus } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  // שדה חדש למספר הטלפון - ברירת מחדל למספר שביקשת
  const [targetPhone, setTargetPhone] = useState('972508860896');
  const scrollRef = useRef<HTMLDivElement>(null);

  // האזנה להודעות נכנסות מ-Firebase
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

      setMessages((prev) => {
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !targetPhone.trim()) return;
    
    const text = inputText;
    setInputText('');

    try {
      await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: targetPhone.replace('+', ''), // ניקוי ה-plus אם קיים
          text: text 
        }),
      });
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] font-sans" dir="rtl">
      <Head><title>SabanOS | Chat</title></Head>
      
      {/* Header עם אפשרות לעריכת מספר הטלפון */}
      <div className="p-3 bg-[#f0f2f5] border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
             <UserPlus className="w-5 text-gray-600" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold">שלח למספר:</label>
            <input 
              type="text"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-sm focus:ring-1 ring-green-500 rounded px-1"
              placeholder="972..."
            />
          </div>
        </div>
        <div className="flex gap-4 text-gray-400">
           <span className="text-[10px] text-green-600 font-medium">JONI CONNECTED</span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ 
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
          backgroundColor: '#e5ddd5' 
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#f0f2f5] flex items-center gap-3">
        <input 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתוב הודעה..." 
          className="flex-1 bg-white rounded-lg px-4 py-2 outline-none text-sm shadow-sm"
        />
        <button 
          onClick={handleSend}
          className="p-2.5 bg-[#00a884] text-white rounded-full hover:bg-[#008f72] transition-colors"
        >
          <Send className="w-5 transform rotate-180" />
        </button>
      </div>
    </div>
  );
}
