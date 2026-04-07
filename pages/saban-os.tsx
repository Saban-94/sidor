'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShoppingCart, Camera, X, Trash2, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '@/contexts/ThemeContext';
import SabanOSHeader from '@/components/sabanOS/Header';
import ChatMessages from '@/components/sabanOS/ChatMessages';
import QuickActions from '@/components/sabanOS/QuickActions';
import ChatInput from '@/components/sabanOS/ChatInput';
import CartDrawer from '@/components/sabanOS/CartDrawer';
import FloatingActionButton from '@/components/sabanOS/FloatingActionButton';
import SideNavigation from '@/components/sabanOS/SideNavigation';
import ProductCard from '@/components/sabanOS/ProductCard';
import OrderSummary from '@/components/sabanOS/OrderSummary';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  product?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string;
  };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  verified: boolean;
}

export default function SabanOSChat() {
  const { language } = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: language === 'he' 
        ? 'שלום! אני סבן AI, עוזרך האישי לניהול חומרי בנייה. איך אוכל לעזור לך היום?' 
        : 'Hello! I am your Saban AI assistant. How can I help you manage your building materials today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [input, setInput] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: language === 'he' ? 'צמנט פורטלנד - כיתה A' : 'Portland Cement - Grade A',
      price: 450,
      quantity: 5,
      verified: true,
    },
    {
      id: '2',
      name: language === 'he' ? 'חישוקי פלדה לתוחן' : 'Steel Reinforcement Bars',
      price: 650,
      quantity: 2,
      verified: true,
    },
  ]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserInput, setLastUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setLastUserInput(text);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response with Hebrew support
    setTimeout(() => {
      const responses = language === 'he' 
        ? [
            `שאלה טובה על "${text}"! אני יכול לעזור לך עם:\n\n- **חיפוש מוצרים**: צמנט, פלדה, חול, קלקר\n- **מעקב הזמנות**: עדכונים בזמן אמת\n- **ייעוץ טכני**: הנחיות מומחים\n- **תמחור**: מחירים הטובים ביותר`,
            `תודה על השאלה על "${text}". הנה ההמלצות שלי:\n\n1. **הערכת איכות**: חומרים מאומתים בAI\n2. **בדיקת מלאי**: רמות המלאי הנוכחיות\n3. **אפשרויות משלוח**: משלוח רגיל או משלוח קרנים\n4. **אופטימיזציה עלויות**: הנחות בכמויות גדולות`,
            `שאלה מעניינת! בנוגע ל"${text}":\n\n- **מפרטי חומרים**: פרטים טכניים מלאים\n- **הסמכות**: כל הפריטים מאומתים\n- **אחריות**: 30 ימים ערבות איכות\n- **תמיכה**: צוות תמיכה טכנית 24/7`,
          ]
        : [
            `Great question about "${text}"! I can help you with:\n\n- **Product Search**: Find cement, steel, sand, aggregates\n- **Order Tracking**: Real-time delivery updates\n- **Technical Advice**: Expert guidance on materials\n- **Pricing**: Best rates for bulk orders`,
            `Thank you for asking about "${text}". Here's what I recommend:\n\n1. **Quality Assessment**: AI-verified materials\n2. **Inventory Check**: Current stock levels\n3. **Delivery Options**: Standard or express crane delivery\n4. **Cost Optimization**: Bulk discounts available`,
            `Excellent inquiry! Regarding "${text}":\n\n- **Material Specifications**: Full technical details\n- **Certifications**: All items verified\n- **Warranty**: 30-day quality guarantee\n- **Support**: 24/7 technical support team`,
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

  const handleAddToCart = (productId?: string, productName?: string, price?: number) => {
    const products = language === 'he'
      ? [
          { name: 'בלוקים בטוניים - סטנדרט', price: 320 },
          { name: 'לוחות ש干וול - פרימיום', price: 280 },
          { name: 'צבע - כיתה חיצונית', price: 150 },
          { name: 'צינורות - PVC 100mm', price: 95 },
          { name: 'לבנים - חימר אדום', price: 200 },
        ]
      : [
          { name: 'Concrete Blocks - Standard', price: 320 },
          { name: 'Drywall Sheets - Premium', price: 280 },
          { name: 'Paint - Exterior Grade', price: 150 },
          { name: 'Pipes - PVC 100mm', price: 95 },
          { name: 'Bricks - Red Clay', price: 200 },
        ];

    const selectedProduct = productId 
      ? { name: productName || '', price: price || 0 }
      : products[Math.floor(Math.random() * products.length)];

    const newItem: CartItem = {
      id: Date.now().toString(),
      name: selectedProduct.name,
      price: selectedProduct.price,
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
    <div className="h-screen w-full flex flex-col bg-[var(--color-background)] overflow-hidden safe-area">
      {/* Header */}
      <SabanOSHeader 
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Messages Area */}
        <ChatMessages 
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        {/* Order Summary Bubble */}
        <OrderSummary 
          userInput={lastUserInput}
          isVisible={lastUserInput.length > 0 && messages.some(m => m.isUser && m.content === lastUserInput)}
        />

        {/* Quick Actions */}
        <QuickActions onActionClick={handleAddToCart} />

        {/* Input Area */}
        <ChatInput 
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Side Navigation */}
      <SideNavigation 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Cart Drawer */}
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
