// /pages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { db } from '../lib/firebase'; 
import { ref, onChildAdded, query, limitToLast } from 'firebase/database';
import { Message } from '../types';
import { MessageBubble } from '../components/chat/MessageBubble';
import { Send, Paperclip, MoreVertical, Phone, Video, UserPlus, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [targetPhone, setTargetPhone] = useState('972508860896');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. מאזין בזמן אמת להודעות מ-Firebase
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
        // מניעת כפילויות
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => unsubscribe();
  }, []);

  // 2. גלילה אוטומטית למטה כשיש הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. פונקציית שליחה חסינה
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    
    setError(null);
    setIsSending(true);
    const textToSend = inputText;

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: targetPhone, 
          text: textToSend 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setInputText(''); // ניקוי התיבה רק אם נשלח בהצלחה
      } else {
        setError(result.error || "שגיאה בשליחה");
      }
    } catch (err) {
      setError("לא ניתן להתחבר לשרת. וודא ש-ngrok פועל.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] font-sans overflow-hidden" dir="rtl">
      <Head>
        <title>SabanOS | ניהול צ'אט</title>
      </Head>
      
      {/* Header - ניהול יעד השליחה */}
      <div className="p-3 bg-[#f0f2f5] border-b flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
             <UserPlus className="w-5" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">שולח למספר:</label>
            <input 
              type="text"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-sm text-slate-700 focus:text-emerald-700 transition-colors"
              placeholder="972..."
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-1 text-red-500 text-xs font-medium animate-pulse">
              <AlertCircle className="w-4" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-4 text-gray-500">
            <Video className="w-5 cursor-pointer hover:text-emerald-600 transition-colors" />
            <Phone className="w-5 cursor-pointer hover:text-emerald-600 transition-colors" />
            <MoreVertical className="w-5 cursor-pointer hover:text-emerald-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Chat Area - רקע וואטסאפ קלאסי */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
        style={{ 
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
          backgroundColor: '#e5ddd5',
          backgroundBlendMode: 'overlay'
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#f0f2f5] flex items-center gap-3 border-t border-gray-300">
        <Paperclip className="text-gray-500 cursor-pointer w-6 hover:text-emerald-600 transition-colors" />
        <div className="flex-1 bg-white rounded-lg px-4 py-2.5 shadow-sm flex items-center border border-transparent focus-within:border-emerald-500 transition-all">
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="כתוב הודעה..." 
            disabled={isSending}
            className="w-full outline-none text-sm text-slate-700 bg-transparent disabled:opacity-50"
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={isSending || !inputText.trim()}
          className={`p-3 rounded-full transition-all flex items-center justify-center shadow-md
            ${isSending || !inputText.trim() 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#00a884] hover:bg-[#008f72] active:scale-90 text-white'}`}
        >
          <Send className={`w-5 transform rotate-180 ${isSending ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
}
