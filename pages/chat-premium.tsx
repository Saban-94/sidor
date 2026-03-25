import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Calculator, 
  Youtube, 
  Check,
  CheckCheck
} from 'lucide-react';

// Types
interface Message {
  id: string;
  text: string;
  type: 'in' | 'out';
  timestamp: Date;
  product?: Product;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  image?: string;
  youtubeUrl?: string;
}

// Product Card Component
const ProductCard = ({ product }: { product: Product }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="mt-3 bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden"
  >
    {/* Product Image */}
    <div className="aspect-square w-full bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {product.image ? (
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-slate-200/50 flex items-center justify-center">
            <Bot size={40} className="text-slate-300" />
          </div>
        </div>
      )}
      {/* Floating Price Badge */}
      <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
        {'\u20AA'}{product.price.toLocaleString()}
      </div>
    </div>

    {/* Product Info */}
    <div className="p-4">
      <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
        {product.name}
      </h3>
      <p className="text-xs font-mono text-slate-400 tracking-wide">
        SKU: {product.sku}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Calculator size={16} />
          <span>Calculate Quantities</span>
        </motion.button>
        {product.youtubeUrl && (
          <motion.a
            href={product.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-xl transition-colors"
          >
            <Youtube size={18} />
          </motion.a>
        )}
      </div>
    </div>
  </motion.div>
);

// Message Bubble Component
const MessageBubble = ({ message, isLast }: { message: Message; isLast: boolean }) => {
  const isUser = message.type === 'in';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Message Content */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-emerald-500 text-white rounded-2xl rounded-br-md'
              : 'bg-white text-slate-800 rounded-2xl rounded-bl-md border border-slate-100'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Timestamp & Read Status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-slate-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isUser && (
            <CheckCheck size={12} className={isLast ? 'text-emerald-500' : 'text-slate-400'} />
          )}
        </div>

        {/* Product Card (AI messages only) */}
        {!isUser && message.product && (
          <ProductCard product={message.product} />
        )}
      </div>
    </motion.div>
  );
};

// Typing Indicator Component
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex justify-start mb-3"
  >
    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -6, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
            className="w-2 h-2 bg-emerald-500 rounded-full"
          />
        ))}
      </div>
    </div>
  </motion.div>
);

// Main Chat Interface
export default function PremiumChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to Saban AI! How can I help you with your construction needs today?',
      type: 'out',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      text: 'I need waterproofing membrane for a 50sqm bathroom',
      type: 'in',
      timestamp: new Date(Date.now() - 45000),
    },
    {
      id: '3',
      text: 'Perfect choice! For a 50sqm bathroom, I recommend our premium SikaPlan membrane. Here is the product with all the details:',
      type: 'out',
      timestamp: new Date(Date.now() - 30000),
      product: {
        id: 'prod-1',
        name: 'SikaPlan Waterproofing Membrane 2.0mm',
        sku: 'SP-WM-2024-PRO',
        price: 189,
        youtubeUrl: 'https://youtube.com/watch?v=example',
      },
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle send message
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      type: 'in',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I found the perfect product for your needs. Take a look at this high-quality option from our inventory:',
        type: 'out',
        timestamp: new Date(),
        product: {
          id: 'prod-2',
          name: 'Premium Ceramic Floor Tiles 60x60',
          sku: 'CT-60-2024-A',
          price: 45,
          youtubeUrl: 'https://youtube.com/watch?v=example2',
        },
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 font-sans" dir="ltr">
      <Head>
        <title>Saban AI | Premium Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
      </Head>

      {/* Sticky Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 safe-area-top"
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          {/* Avatar */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <Bot size={24} className="text-white" />
            </motion.div>
            {/* Online Pulse */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2.5 h-2.5 bg-emerald-400 rounded-full"
              />
            </div>
          </div>

          {/* Title */}
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg tracking-tight">Saban AI</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-emerald-400 text-xs font-medium">Online</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Chat Area */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-4"
      >
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isLast={index === messages.length - 1 && message.type === 'in'}
              />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
        </div>
      </main>

      {/* Sticky Input Area */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 safe-area-bottom"
      >
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          {/* Attachment Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Paperclip size={20} />
          </motion.button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 px-4 py-3 rounded-2xl transition-all duration-200 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Send Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
              inputText.trim()
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Send size={18} className={inputText.trim() ? '' : 'opacity-50'} />
          </motion.button>
        </div>
      </motion.footer>

      <style jsx global>{`
        .safe-area-top {
          padding-top: max(0.75rem, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
        
        /* Custom Scrollbar */
        main::-webkit-scrollbar {
          width: 4px;
        }
        main::-webkit-scrollbar-track {
          background: transparent;
        }
        main::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        main::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Remove tap highlight on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}
