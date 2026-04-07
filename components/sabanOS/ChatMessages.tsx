import React from 'react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MarkdownComponents = {
  p: ({ node, ...props }: any) => <p className="mb-2" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-bold text-[#34d399]" {...props} />,
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
            }`}
          >
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {message.content}
            </Markdown>
            
            <p className="text-xs mt-1 opacity-60">
              {message.timestamp.toLocaleTimeString('ar-SA', {
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
          <div className="message-bubble-ai flex gap-2 items-center">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#34d399]"
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-[#34d399]"
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-[#34d399]"
            />
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
