'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  imageBase64?: string; // השדה שמאפשר לרויטל להציג את הצילום מהשטח
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// שמירה על רכיבי ה-Markdown המעוצבים שלך
const MarkdownComponents = {
  p: ({ node, ...props }: any) => <p className="mb-2 leading-relaxed" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-black text-[#10b981]" {...props} />,
  em: ({ node, ...props }: any) => <em className="italic text-[#cbd5e1]" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc list-inside space-y-1 mb-2" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside space-y-1 mb-2" {...props} />,
  li: ({ node, ...props }: any) => <li className="ml-2" {...props} />,
  code: ({ node, inline, ...props }: any) => 
    inline ? (
      <code className="bg-[#0f172a] px-2 py-1 rounded text-[#34d399] font-mono text-sm" {...props} />
    ) : (
      <code className="block bg-[#0f172a] p-3 rounded-lg font-mono text-sm overflow-x-auto" {...props} />
    ),
};

export default function ChatMessages({
  messages,
  isLoading,
  messagesEndRef,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4 chat-container no-scrollbar">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`${
              message.isUser
                ? 'message-bubble-user ml-auto'
                : 'message-bubble-ai mr-auto'
            } max-w-[85%] sm:max-w-[75%] shadow-lg`}
          >
            {/* הצגת תמונה במידה וקיימת - לפני הטקסט */}
            {message.imageBase64 && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-3 rounded-xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer"
                onClick={() => window.open(message.imageBase64, '_blank')}
              >
                <img 
                  src={message.imageBase64} 
                  alt="צילום מהשטח" 
                  className="w-full h-auto object-cover max-h-64 sm:max-h-80 hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            )}

            <Markdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {message.content}
            </Markdown>
            
            <p className="text-[10px] mt-2 opacity-50 font-mono text-left">
              {message.timestamp.toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </motion.div>
      ))}

      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="message-bubble-ai flex gap-2 items-center p-4">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div
                key={delay}
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay }}
                className="w-2 h-2 rounded-full bg-[#10b981]"
              />
            ))}
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
