'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, push, query, limitToLast } from 'firebase/database';
import { Send, Loader2 } from 'lucide-react';
// ייבוא הבועה החכמה שסיפקת
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  customerId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ customerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // הגנה ל-Build ובדיקת קיום לקוח
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

  // גלילה אוטומטית להודעה האחרונה בכל עדכון
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = newMessage.trim();
    
    if (!cleanMsg || !database || !customerId) return;

    setLoading(true);
    try {
      const messagesRef = ref(database, `messages/${customerId}`);
      
      // הזרקת נתונים בפורמט שה-MessageBubble מצפה לו
      await push(messagesRef, {
        body: cleanMsg,      // התוכן שהבועה מציגה
        fromMe: true,        // אדמין שולח (צבע ירוק סבן)
        timestamp: Date.now(),
        status: 'sent',      // סטטוס התחלתי ל-V
        senderId: 'admin'    // מזהה אופציונלי
      });

      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] overflow-hidden shadow-2xl rounded-xl border border-white/5" dir="rtl">
      
      {/* אזור ההודעות - עם רקע וואטסאפ לוגו של סבן */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://i.postimg.cc/7Z9y6vYV/wa-bg.png')] bg-repeat opacity-95">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-20 flex-col gap-2">
            <MessageSquare size={48} className="text-white" />
            <p className="text-white font-bold italic uppercase tracking-widest text-xs">Saban OS | No Messages</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={scrollRef} />
      </div>
      
      {/* שדה הכתיבה המעוצב */}
      <form 
        onSubmit={sendMessage} 
        className="p-4 bg-[#202c33] border-t border-white/5 flex gap-3 items-center sticky bottom-0 z-10"
      >
        <div className="flex-1 relative">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
            placeholder="הקלד הודעה למוח..."
            className="w-full p-4 bg-[#2a3942] text-[#e9edef] rounded-2xl border-none outline-none focus:ring-1 ring-[#00a884] font-bold text-sm transition-all placeholder:opacity-30 disabled:opacity-50"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !newMessage.trim()}
          className="w-12 h-12 bg-[#00a884] hover:bg-[#00c99e] text-[#111b21] rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 disabled:opacity-50 disabled:grayscale"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} className="rotate-180" />
          )}
        </button>
      </form>

      {/* סטייל לסקרולר המותאם */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 168, 132, 0.5);
        }
      `}</style>
    </div>
  );
};
