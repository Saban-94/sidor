// /pages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Message, Chat } from '../types';
import { MessageBubble } from '../components/chat/MessageBubble';
import { Send, Menu, Search, MoreVertical, Paperclip } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>('default');
  const scrollRef = useRef<HTMLDivElement>(null);

  // פונקציית עזר ליצירת אובייקט הודעה תקין לפי הטיפוסים החדשים
  const createMessage = (content: string, fromMe: boolean): Message => {
    const now = Date.now();
    return {
      id: Math.random().toString(36).substr(2, 9),
      chatId: activeChat || 'default',
      senderId: fromMe ? 'me' : 'client',
      kind: 'text',
      content: content,
      body: content, // שדה חובה עבור ה-UI
      fromMe: fromMe, // שדה חובה לזיהוי צד בועה
      timestamp: now, // שדה חובה לתצוגת זמן
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage = createMessage(inputText, true);
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // כאן תבוא הקריאה ל-API של הצינור (whatsapp/send)
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: '972...', // מספר היעד
          text: inputText
        }),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-screen bg-[#f0f2f5] text-gray-900 font-sans">
      <Head>
        <title>Saban-OS | מערכת ניהול צינור</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* Sidebar - רשימת שיחות */}
      <div className="hidden md:flex flex-col w-[400px] border-r border-gray-300 bg-white">
        <div className="p-4 bg-[#f0f2f5] flex justify-between items-center">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">ס</div>
          <div className="flex gap-4 text-gray-600">
            <Menu className="cursor-pointer w-5" />
            <MoreVertical className="cursor-pointer w-5" />
          </div>
        </div>
        <div className="p-2">
          <div className="bg-[#f0f2f5] flex items-center px-3 py-1.5 rounded-lg">
            <Search className="w-4 text-gray-500 mr-2" />
            <input placeholder="חפש שיחה או לקוח" className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex gap-3 items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-sm">לקוח ח. סבן</h3>
                <span className="text-[10px] text-gray-500">10:45</span>
              </div>
              <p className="text-xs text-gray-500 truncate">מחכה להצעת מחיר עבור הבלוקים...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chat Header */}
        <div className="p-3 bg-[#f0f2f5] border-b border-gray-300 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div>
              <h2 className="font-semibold text-sm">צ'אט שירות לקוחות</h2>
              <span className="text-[10px] text-green-600 font-medium">מחובר לצינור JONI</span>
            </div>
          </div>
          <MoreVertical className="text-gray-600 cursor-pointer w-5" />
        </div>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#e5ddd5] bg-opacity-50"
          style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}
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
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב הודעה..." 
              className="w-full outline-none text-sm"
            />
          </div>
          <button 
            onClick={handleSend}
            className="p-2.5 bg-[#00a884] text-white rounded-full hover:bg-[#008f72] transition-colors"
          >
            <Send className="w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
