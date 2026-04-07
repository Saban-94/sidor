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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your Saban AI assistant. How can I help you manage your building materials today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [input, setInput] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Portland Cement - Grade A',
      price: 450,
      quantity: 5,
      verified: true,
    },
    {
      id: '2',
      name: 'Steel Reinforcement Bars',
      price: 650,
      quantity: 2,
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

    // Simulate AI response with varied responses
    setTimeout(() => {
      const responses = [
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

  const handleAddToCart = () => {
    const products = [
      { name: 'Concrete Blocks - Standard', price: 320 },
      { name: 'Drywall Sheets - Premium', price: 280 },
      { name: 'Paint - Exterior Grade', price: 150 },
      { name: 'Pipes - PVC 100mm', price: 95 },
      { name: 'Bricks - Red Clay', price: 200 },
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
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-[#0b141a] via-[#111f2e] to-[#0b141a] overflow-hidden safe-area">
      {/* Header */}
      <SabanOSHeader 
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Messages Area */}
        <ChatMessages 
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
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
