'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShoppingCart, Camera, X, Trash2, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SabanOSHeader from '@/components/sabanOS/Header';
import ChatMessages from '@/components/sabanOS/ChatMessages';
import QuickActions from '@/components/sabanOS/QuickActions';
import ChatInput from '@/components/sabanOS/ChatInput';
import CartDrawer from '@/components/sabanOS/CartDrawer';
import FloatingActionButton from '@/components/sabanOS/FloatingActionButton';

// ממשק הודעה בעברית
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// ממשק פריט בסל
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  verified: boolean;
}

export default function SabanOSChat() {
  // הודעת פתיחה של המוח של סבן
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'אהלן בוס! אני המוח של ח.סבן. איך אני יכול לעזור לך לנהל את האתר או המלאי היום?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [input, setInput] = useState('');
  
  // מוצרים לדוגמה בסל בגרסת עברית
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'מלט פורטלנד - שק 25 ק"ג',
      price: 450,
      quantity: 10,
      verified: true,
    },
    {
      id: '2',
      name: 'ברזל בניין - מוט 12 מ"מ',
      price: 650,
      quantity: 5,
      verified: true,
    },
  ]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // לוגיקת שליחת הודעה עם תשובות חכמות בעברית
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // סימולציית "המוח" של סבן עם תשובות רלוונטיות לענף
    setTimeout(() => {
      const responses = [
        `אחלה שאלה לגבי "${text}"! הנה מה שאני יכול להציע:\n\n- **חיפוש מוצרים**: מלט, ברזל, חול, חצץ\n- **מעקב הזמנות**: עדכוני משלוחים בזמן אמת מהמגרש\n- **ייעוץ טכני**: מפרטים של מוצרי איטום וגבס\n- **מחירון**: מחירים מיוחדים להזמנות סיטונאיות`,
        `קיבלתי, בודק לך לגבי "${text}". המלצה שלי:\n\n1. **איכות חומר**: כל המוצרים שלנו מאושרים ע"י מכון התקנים\n2. **מצב מלאי**: המחסן מסונכרן, יש זמינות מיידית\n3. **לוגיסטיקה**: אפשרות למשלוח מנוף מהיום להיום\n4. **חיסכון**: הנחת כמות משמעותית לסגירת שלד`,
        `שאלה מקצועית! לגבי "${text}":\n\n- **מפרט טכני**: כל המידע על כושר כיסוי ועמידות\n- **אימות AI**: המוצר נבדק ונמצא תקין למפרט שלך\n- **אחריות**: אחריות יצרן מלאה ל-30 יום\n- **תמיכה**: הנציגים שלנו זמינים לך גם בוואטסאפ לכל שאלה`,
      ];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1200);
  };

  // הוספת מוצרים רנדומליים בעברית לסל (לצורך הטסט)
  const handleAddToCart = () => {
    const products = [
      { name: 'בלוק 20 - סטנדרט', price: 320 },
      { name: 'לוח גבס לבן - פרימיום', price: 280 },
      { name: 'צבע חוץ - סופרקריל', price: 150 },
      { name: 'צינור PVC 100 מ"מ', price: 95 },
      { name: 'לבני חרס - אדום', price: 200 },
    ];

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const newItem: CartItem = {
      id: Date.now().toString(),
      name: randomProduct.name,
      price: randomProduct.price,
      quantity: 1,
      verified: true,
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-[#0b141a] via-[#111f2e] to-[#0b141a] overflow-hidden safe-area" dir="rtl">
      {/* Header - כותרת סבן OS */}
      <SabanOSHeader 
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Main Chat Container - אזור הצ'אט המרכזי */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Messages Area - תצוגת ההודעות */}
        <ChatMessages 
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        {/* Quick Actions - פעולות מהירות (הזמנה, ייעוץ וכו') */}
        <QuickActions onActionClick={handleAddToCart} />

        {/* Input Area - שורת הקלט */}
        <ChatInput 
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Floating Action Button - כפתור מצלמה לניתוח חכם */}
      <FloatingActionButton />

      {/* Cart Drawer - מגירת סל הקניות בצד */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
}
