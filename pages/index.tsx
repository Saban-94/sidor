// /pages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase'; // וודא שיש לך ייצוא של db מ-firebase.ts
import { ref, onChildAdded, query, limitToLast } from 'firebase/database';
import { Message } from '../types';
import { MessageBubble } from '../components/chat/MessageBubble';

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. הגדרת הנתיב ב-Firebase (לפי המבנה של JONI)
    // בד"כ הנתיב הוא messages/ או chats/chatId/messages
    const messagesRef = query(ref(db, 'messages'), limitToLast(50));

    // 2. האזנה להודעות חדשות שנכנסות
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // מיפוי הנתונים מה-Firebase לטיפוס Message שלנו
      const newMessage: Message = {
        id: snapshot.key || Math.random().toString(),
        body: data.body || data.text || "",
        content: data.body || data.text || "",
        fromMe: data.fromMe || false,
        timestamp: data.timestamp || Date.now(),
        senderId: data.from || "unknown",
        chatId: data.chatId || "default",
        kind: 'text',
        status: 'delivered',
        createdAt: new Date(data.timestamp || Date.now()).toISOString()
      };

      // עדכון ה-State (מניעת כפילויות ע"י בדיקת ID)
      setMessages((prev) => {
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    // ניקוי המאזין כשסוגרים את הדף
    return () => unsubscribe();
  }, []);

  // גלילה אוטומטית למטה כשיש הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5]">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 chat-container"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
      
      {/* Input Area כאן תבוא תיבת הטקסט שלך */}
    </div>
  );
}
