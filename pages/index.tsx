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
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. האזנה בזמן אמת ל-Firebase (Realtime Listener)
  useEffect(() => {
    // התחברות לנתיב שהגדרת בצינור של JONI
    const messagesRef = query(ref(db, 'chat-sidor'), limitToLast(50));

    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // מיפוי הנתונים מ-Firebase למבנה של האפליקציה
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
        // מניעת כפילויות של הודעות
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => unsubscribe(); // ניקוי המאזין בסגירת הדף
  }, []);

  // 2. גלילה אוטומטית למטה כשיש הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    // כאן תבוא הקריאה ל-API של הצינור לשליחת הודעה
    console.log("Sending message:", inputText);
    setInputText('');
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] text-gray-900 font-sans overflow-hidden rtl" dir="rtl">
      <Head>
        <title>SabanOS | צ'אט שירות לקוחות</title>
      </Head>

      {/* Sidebar - רשימת שיחות (מוסתר במובייל) */}
      <div className="hidden md:flex flex-col w-[400px] border-l border-gray-300 bg-white">
        <div className="p-4 bg-[#f0f2f5] flex justify-between items-center border-l border-gray-300">
          <div className="w-10 h-10 bg-whatsapp-green rounded-full flex items-center justify-center text-white font-bold">ס</div>
          <div className="flex gap-4 text-gray-600">
            <MoreVertical className="cursor-pointer w-5" />
          </div>
        </div>
        <div className="p-2">
          <div className="bg-[#f0f2f5] flex items-center px-3 py-1.5 rounded-lg">
            <Search className="w-4 text-gray-500 ml-2" />
            <input placeholder="חפש שיחה" className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-gray-100 border-b border-gray-100 flex gap-3 items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-sm">לקוח ח. סבן</h3>
                <span className="text-[10px] text-gray-500">עכשיו</span>
              </div>
              <p className="text-xs text-gray-500 truncate">מחובר לצינור JONI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chat Header */}
        <div className="p-3 bg-[#f0f2f5] border-b border-gray-300 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
            <div>
              <h2 className="font-semibold text-sm">לקוח ח. סבן</h2>
              <span className="text-[10px] text-green-600 font-medium">מחובר לצינור</span>
            </div>
          </div>
          <div className="flex gap-5 text-gray-600 ml-2">
            <Video className="w-5 cursor-pointer" />
            <Phone className="w-5 cursor-pointer" />
            <MoreVertical className="w-5 cursor-pointer" />
          </div>
        </div>

        {/* Messages List - הרקע שהגדרנו ב-CSS */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 chat-container"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#f0f2f5] flex items-center gap-3">
          <Paperclip className="text-gray-600 cursor-pointer w-6" />
          <div className="flex-1 bg-white rounded-lg px-4 py-2 flex items-center shadow-sm">
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב הודעה..." 
              className="w-full outline-none text-sm"
            />
          </div>
          <button 
            onClick={handleSend}
            className="p-2.5 bg-whatsapp-green text-white rounded-full hover:opacity-90 transition-opacity"
          >
            <Send className="w-5 transform rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
