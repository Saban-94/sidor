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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!customerId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const messagesRef = ref(database, `messages/${customerId}`);
      const messagesQuery = query(messagesRef, limitToLast(50));

      const unsubscribe = onValue(
        messagesQuery,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const messageList = Object.entries(data).map(([id, value]: [string, any]) => ({
              id,
              ...value,
              chatId: customerId,
            })) as Message[];

            messageList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            setMessages(messageList);
          }
          setLoading(false);
        },
        (error) => {
          console.error('[v0] Error loading messages:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('[v0] Failed to setup message listener:', error);
      setLoading(false);
    }
  }, [customerId]);

  const handleSendMessage = async () => {
    if (!customerId || !newMessage.trim()) return;

    setSending(true);
    try {
      const messagesRef = ref(database, `messages/${customerId}`);
      const messageData: Omit<Message, 'id'> = {
        chatId: customerId,
        senderId: 'agent-saban',
        kind: 'text',
        content: newMessage,
        body: newMessage,
        fromMe: true,
        timestamp: Date.now(),
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      await push(messagesRef, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('[v0] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!customerId) {
    return (
      <div className="h-full flex items-center justify-center bg-saban-dark rounded-lg border border-white/10">
        <div className="text-center text-saban-muted">
          <p className="text-lg font-medium mb-2">Select a customer to start chatting</p>
          <p className="text-sm">Choose a customer from the list on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-saban-dark rounded-lg border border-white/10 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 chat-container space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-saban-muted">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-saban-muted text-center">
            <div>
              <p className="mb-2">No messages yet</p>
              <p className="text-sm">Start a conversation with this customer</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-saban-slate flex-shrink-0">
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-saban-dark border border-white/20 rounded-lg text-white text-sm placeholder-saban-muted focus:border-saban-emerald transition resize-none"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-6 py-2 bg-saban-emerald text-saban-dark font-medium rounded-lg hover:bg-saban-emerald/90 transition disabled:opacity-50"
          >
            {sending ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
};
