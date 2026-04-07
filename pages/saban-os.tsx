'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, ShoppingCart, Share2, Sparkles, Sun, Moon, Trash2, CheckCircle2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

// רכיבי UI מ-v0
import SabanOSHeader from '@/components/sabanOS/Header';
import ChatMessages from '@/components/sabanOS/ChatMessages';
import QuickActions from '@/components/sabanOS/QuickActions';
import ChatInput from '@/components/sabanOS/ChatInput';
import CartDrawer from '@/components/sabanOS/CartDrawer';
import FloatingActionButton from '@/components/sabanOS/FloatingActionButton';
import SideNavigation from '@/components/sabanOS/SideNavigation';
import ProductCard from '@/components/sabanOS/ProductCard';
import OrderSummary from '@/components/sabanOS/OrderSummary';

// אתחול Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

export default function SabanOSUnifiedChat() {
  const router = useRouter();
  const { phone } = router.query;

  // מצבים לממשק
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastUserInput, setLastUserInput] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // אתחול ראשוני
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    if (messages.length === 0) {
      setMessages([{ 
        id: '1',
        role: 'ai', 
        content: 'אהלן אחי! המוח של ח.סבן מחובר. איך אני יכול לעזור לנהל את האתר היום?',
        timestamp: new Date()
      }]);
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, streamingText, loading]);

  const playMagicSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const askAI = async (query: string | null, base64: string | null = null) => {
    if ((!query?.trim() && !base64) || loading || isTyping) return;
    
    const textQuery = query || "";
    setLastUserInput(textQuery);
    
    // הצגת הודעת משתמש
    const userMsg = { 
      id: Date.now().toString(),
      role: 'user', 
      isUser: true,
      content: textQuery || "📸 ניתוח תמונה...",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    setLoading(true);
    setInput('');

    try {
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
      const data = await SabanAPI.sendMessage(targetPhone, textQuery, base64);
      
      setLoading(false);

      if (!data || !data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data?.reply || "בוס, תקלה במוח." }]);
        return;
      }

      // --- לוגיקת הזמנה וצלצול ---
      if (data.orderPlaced) {
        playMagicSound();
        const newItem = {
          id: Date.now().toString(),
          name: data.items || "מוצר מהזמנה",
          price: 0, 
          quantity: 1,
          verified: true
        };
        setCartItems(prev => [...prev, newItem]);
        setTimeout(() => setShowCart(true), 600);
      }

      // אפקט הקלדה
      setIsTyping(true);
      let i = 0;
      const words = data.reply.split(" ");
      const interval = setInterval(() => {
        if (i < words.length) {
          setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
          i++;
        } else {
          clearInterval(interval);
          setMessages(prev => [...prev, { 
            id: Date.now().toString(),
            role: 'ai', 
            isUser: false,
            content: data.reply,
            timestamp: new Date(),
            product: data.productData // הנחה שה-API מחזיר נתוני מוצר אם נמצאו ב-Supabase
          }]);
          setStreamingText("");
          setIsTyping(false);
        }
      }, 35);

    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "שגיאת תקשורת מול השרת." }]);
    }
  };

  const themeBg = isDarkMode ? "bg-[#0b141a]" : "bg-[#f0f2f5]";
  const themeText = isDarkMode ? "text-white" : "text-[#111b21]";

  return (
    <div className={`h-screen w-full flex flex-col transition-colors duration-500 overflow-hidden ${themeBg} ${themeText}`} dir="rtl">
      <Head>
        <title>SabanOS | השרת המאוחד</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Header מ-v0 עם תמיכה במצבי תאורה */}
      <SabanOSHeader 
        cartCount={cartItems.length}
        onCartClick={() => setShowCart(true)}
        onMenuClick={() => setIsMenuOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* אזור ההודעות */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
          <div className="fixed inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center opacity-[0.02] pointer-events-none" />
          
          {messages.map((m, i) => (
            <div key={m.id || i}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.isUser || m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3.5 px-4 rounded-2xl shadow-md border ${m.isUser || m.role === 'user' ? (isDarkMode ? 'bg-[#202c33] border-white/5' : 'bg-white border-black/10 text-black') : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
                </div>
              </motion.div>
              
              {/* כרטיס מוצר חכם אם קיים בנתוני ההודעה */}
              {m.product && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-3">
                  <ProductCard product={m.product} onAdd={() => askAI(`הזמן ${m.product.name}`)} />
                </motion.div>
              )}
            </div>
          ))}

          {/* סיכום הזמנה צף מעל הקלט */}
          <OrderSummary 
            userInput={lastUserInput} 
            isVisible={lastUserInput.length > 0 && isTyping} 
          />

          {(isTyping || streamingText) && (
            <div className="flex justify-end">
              <div className="max-w-[85%] p-3.5 px-4 rounded-2xl bg-[#005c4b] text-white rounded-tr-none shadow-md">
                <span className="text-sm">{streamingText || "המוח מעבד..."}</span>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block w-1.5 h-1.5 bg-emerald-300 rounded-full mr-2" />
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </main>

        {/* פעולות מהירות */}
        <QuickActions onActionClick={(action) => askAI(action)} />

        {/* שורת קלט מעוצבת */}
        <ChatInput 
          value={input} 
          onChange={setInput} 
          onSend={(val) => askAI(val)} 
          isLoading={loading}
        />
      </div>

      {/* תפריט המבורגר צדי */}
      <SideNavigation 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />

      {/* כפתור מצלמה צף */}
      <FloatingActionButton onCapture={(base64) => askAI(null, base64)} />

      {/* מגירת סל קניות */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cartItems}
        onRemoveItem={(id) => setCartItems(prev => prev.filter(item => item.id !== id))}
        onUpdateQuantity={(id, qty) => setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item))}
      />
    </div>
  );
}
