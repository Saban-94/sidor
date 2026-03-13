// /pages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { db } from '../lib/firebase'; 
import { ref, onChildAdded, query, limitToLast } from 'firebase/database';
import { Message } from '../types';
import { MessageBubble } from '../components/chat/MessageBubble';
import { Send, Search, MoreVertical, Paperclip, Phone, Video } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeCustomer, setActiveCustomer] = useState('972500000000'); // כאן יבוא המספר של הלקוח
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. האזנה להודעות נכנסות מ-JONI
  useEffect(() => {
    const messagesRef = query(ref(db, 'chat-sidor'), limitToLast(100));

    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const newMessage: Message = {
        id: snapshot.key || Math.random().toString(),
        body: data.body || data.text || "", 
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

  // 2. גלילה אוטומטית למטה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // 3. שליחת הודעה דרך ה-API
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText(''); // ניקוי מהיר של התיבה

    try {
      await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activeCustomer,
          text: textToSend
        }),
      });
    } catch (error) {
      console.error("שגיאה בשליחה:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden dir-rtl" dir="rtl">
      <Head><title>SabanOS | Live Chat</title></Head>

      {/* Sidebar - רשימת שיחות */}
      <div className="hidden md:flex flex-col w-[400px] border-l border-gray-300 bg-white">
        <div className="p-4 bg-[#f0f2f5] flex justify-between items-center border-l border-gray-300">
          <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white font-bold">ס</div>
          <MoreVertical className="text-gray-600 cursor-pointer w-5" />
        </div>
        <div className="p-4 border-b bg-gray-100 flex gap-3 items-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-right">לקוח ח. סבן</h3>
            <p className="text-xs text-green-600 text-right font-bold">צינור פעיל</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="p-3 bg-[#f0f2f5] border-b border-gray-300 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
            <div className="text-right">
              <h2 className="font-semibold text-sm">צ'אט שירות לקוחות</h2>
              <span className="text-[10px] text-green-600">JONI Listener Active</span>
            </div>
          </div>
          <div className="flex gap-4 text-gray-600">
             <Video className="w-5 cursor-pointer" />
             <Phone className="w-5 cursor-pointer" />
          </div>
        </div>

        {/* Message Container עם הרקע של וואטסאפ */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-3 chat-container"
          style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundColor: '#e5ddd5' }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#f0f2f5] flex items-center gap-3 border-t">
          <Paperclip className="text-gray-600 cursor-pointer w-6" />
          <div className="flex-1 bg-white rounded-lg px-4 py-2 shadow-sm">
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב הודעה..." 
              className="w-full outline-none text-sm text-right"
            />
          </div>
          <button onClick={handleSend} className="p-2.5 bg-[#00a884] text-white rounded-full transition-transform active:scale-95">
            <Send className="w-5 transform rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
