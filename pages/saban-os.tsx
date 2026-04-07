'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ShoppingCart,
  Camera,
  X,
  Trash2,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

import SabanOSHeader from '@/components/sabanOS/Header';
import ChatMessages from '@/components/sabanOS/ChatMessages';
import QuickActions from '@/components/sabanOS/QuickActions';
import ChatInput from '@/components/sabanOS/ChatInput';
import CartDrawer from '@/components/sabanOS/CartDrawer';
import FloatingActionButton from '@/components/sabanOS/FloatingActionButton';

// ייבוא ה-API האמיתי שלך
import { SabanAPI } from '@/lib/SabanAPI';
import { useRouter } from 'next/router';

// ------ ממשקים ------
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  verified: boolean;
}

export default function SabanOSChat() {
  const router = useRouter();
  const { phone } = router.query;
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'אהלן בוס! אני המוח של ח.סבן. המחסן מסונכרן אצלי, איך אני יכול לעזור היום?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // יצירת אלמנט אודיו לצליל הקסם
  useEffect(() => {
    audioRef.current = new Audio('/magic-chime.mp3');
  }, []);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const playMagicSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // -------------------------------------------
  //   שליחת הודעה למוח האמיתי (Gemini + Sheets)
  // -------------------------------------------
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // שליחה ל-Apps Script שלך
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
      const data = await SabanAPI.sendMessage(targetPhone, text);

      if (data && data.success) {
        // אם זוהתה הזמנה במוח, נוסיף לסל ונשמיע צליל
        if (data.orderPlaced) {
          playMagicSound();
          const newItem: CartItem = {
            id: Date.now().toString(),
            name: data.items || text,
            price: 0,
            quantity: 1,
            verified: true,
          };
          setCartItems(prev => [...prev, newItem]);
          // פתיחת הסל אוטומטית כדי שהלקוח יראה שזה נקלט
          setTimeout(() => setIsCartOpen(true), 600);
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: data.reply,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data?.error || "תקלה בחיבור");
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: "אחי, המוח קצת עמוס כרגע. נסה שוב בעוד רגע.",
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden safe-area transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#0b141a] text-white'
          : 'bg-[#f5f7fa] text-[#1b1b1b]'
      }`}
      dir="rtl"
    >
      {/* כפתור החלפת Theme */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute left-3 top-3 z-50 p-2 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 text-white transition-all active:scale-90"
      >
        {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
      </button>

      {/* Header */}
      <SabanOSHeader
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
        theme={theme}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center opacity-[0.03] pointer-events-none" />
        
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          theme={theme}
        />

        {/* פעולות מהירות - משגרות הודעה ישירות למוח */}
        <QuickActions onActionClick={(label: string) => handleSendMessage(label)} theme={theme} />

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          isLoading={isLoading}
          theme={theme}
        />
      </div>

      {/* כפתור מצלמה - צפוי להוסיף לוגיקה של Base64 בהמשך */}
      <FloatingActionButton theme={theme} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        theme={theme}
      />
    </div>
  );
}
