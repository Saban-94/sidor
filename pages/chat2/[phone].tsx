'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
export const dynamic = 'force-dynamic';
// ייבוא הרכיבים והכלים
import SabanOSHeader from '@/components/sabanOS/Header';
import ChatMessages from '@/components/sabanOS/ChatMessages';
import QuickActions from '@/components/sabanOS/QuickActions';
import ChatInput from '@/components/sabanOS/ChatInput';
import CartDrawer from '@/components/sabanOS/CartDrawer';
import FloatingActionButton from '@/components/sabanOS/FloatingActionButton';
import { SabanAPI } from '@/lib/SabanAPI';

// ממשקים
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  imageBase64?: string;
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

  // מניעת שגיאות Hydration
  const [mounted, setMounted] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]); // מערך ריק כברירת מחדל
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // מערך ריק כברירת מחדל
  const [input, setInput] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // אתחול ראשוני
  useEffect(() => {
    setMounted(true);
    audioRef.current = new Audio('/magic-chime.mp3');
    
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        content: 'אהלן בוס! רויטל כאן. המחסן מסונכרן אצלי, איך אפשר לעזור היום?',
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const playMagicSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // ---------------------------------------------------------
  // פונקציית שליחה מאוחדת (מוח Vercel + תיעוד Sheets)
  // ---------------------------------------------------------
  const handleSendMessage = async (text: string, imageBase64: string | null = null) => {
    if ((!text.trim() && !imageBase64) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: text || "📸 ניתוח תמונה...",
      isUser: true,
      timestamp: new Date(),
      imageBase64: imageBase64 || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');

      // שליחה במקביל למוח ולתיעוד
      const [brainResponse] = await Promise.all([
        fetch('/api/tools-brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, imageBase64 })
        }).then(res => {
          if (!res.ok) throw new Error("Brain API failure");
          return res.json();
        }),

        SabanAPI.sendMessage(targetPhone, text, imageBase64).catch(e => 
          console.error("Sheets recording failed", e)
        )
      ]);

      if (brainResponse && brainResponse.reply) {
        // הוספה אוטומטית לסל אם המוח זיהה פריטים
        if (brainResponse.cart && brainResponse.cart.length > 0) {
          playMagicSound();
          const newItems: CartItem[] = brainResponse.cart.map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: `${item.name} (${item.qty} ${item.unit || 'יח'})`,
            price: 0,
            quantity: item.qty,
            verified: true,
          }));
          setCartItems(prev => [...prev, ...newItems]);
          setTimeout(() => setIsCartOpen(true), 1500);
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: brainResponse.reply,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: "בוס, המוח קצת עמוס. נסה שוב בעוד רגע.",
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  if (!mounted) return null;

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-[#0b141a] via-[#111f2e] to-[#0b141a] overflow-hidden safe-area" dir="rtl">
      {/* Header */}
      <SabanOSHeader 
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center opacity-[0.03] pointer-events-none" />
        
        <ChatMessages 
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        {/* Quick Actions - מעבירים את הפונקציה המגיירת */}
        <QuickActions onActionClick={(label: string) => handleSendMessage(label)} />

        {/* Input Area */}
        <ChatInput 
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Floating Action Button */}

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
