'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, Chat } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, push, query, orderByChild, limitToLast } from 'firebase/database';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  customerId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ customerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // הגנה ל-TypeScript ול-Build
    if (!database || !customerId) {
      setMessages([]);
      return;
    }

    try {
      const messagesRef = ref(database, `messages/${customerId}`);
      const messagesQuery = query(messagesRef, limitToLast(50));

      const unsubscribe = onValue(messagesQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const msgList = Object.entries(data).map(([id, msg]: [string, any]) => ({
            id,
            ...msg,
          }));
          setMessages(msgList);
        } else {
          setMessages([]);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase RTDB Error:", error);
    }
  }, [customerId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !database || !customerId) return;

    const messagesRef = ref(database, `messages/${customerId}`);
    await push(messagesRef, {
      text: newMessage,
      sender: 'admin',
      timestamp: Date.now(),
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-chat-bg chat-container overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={scrollRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 bg-[#f0f2f5] flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="הקלד הודעה..."
          className="flex-1 p-3 rounded-xl border-none focus:ring-2 ring-brand outline-none"
        />
        <button type="submit" className="bg-brand text-white px-6 py-2 rounded-xl font-bold">
          שלח
        </button>
      </form>
    </div>
  );
};
