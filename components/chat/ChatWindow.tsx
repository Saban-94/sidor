'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, push, query, limitToLast } from 'firebase/database';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send } from 'lucide-react';

interface ChatWindowProps {
  customerId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ customerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !database || !customerId) return;

    const messagesRef = ref(database, `messages/${customerId}`);
    await push(messagesRef, {
      text: newMessage,
      senderId: 'admin', // מעודכן ל-senderId לפי ה-Type
      timestamp: Date.now(),
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden" dir="rtl">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('https://i.postimg.cc/7Z9y6vYV/wa-bg.png')] bg-repeat opacity-95">
        {messages.map((msg: any) => ( // השתמשתי ב-any זמני כדי לעקוף חסימת Build קשיחה
          <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative ${
              msg.senderId === 'admin' 
              ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100' 
              : 'bg-[#dcf8c6] text-slate-800 rounded-tl-none'
            }`}>
              <div className="prose prose-sm max-w-none font-bold leading-relaxed text-inherit">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, alt, ...props }) => {
                      if (alt === 'Saban') {
                        return (
                          <img 
                            {...props} 
                            alt={alt}
                            className="w-8 h-8 rounded-full inline-block mt-2 border-2 border-white shadow-md bg-white object-cover" 
                          />
                        );
                      }
                      return <img {...props} className="rounded-xl max-w-full h-auto my-2 shadow-sm" />;
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
              <div className="text-[9px] opacity-40 mt-1 text-left font-mono">
                {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      
      {/* Input Form */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3 items-center shadow-2xl">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="הקלד הודעה..."
          className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 ring-brand/20 font-bold text-sm"
        />
        <button type="submit" className="bg-brand text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
          <Send size={20} className="rotate-180" />
        </button>
      </form>
    </div>
  );
};
