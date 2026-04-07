'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, ShoppingCart, Share2, Sparkles, Sun, Moon, Trash2, CheckCircle2, LayoutDashboard, History, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

// רכיבי UI מותאמים אישית
import ProductCard from '@/components/sabanOS/ProductCard';
import OrderSummary from '@/components/sabanOS/OrderSummary';
import CartDrawer from '@/components/sabanOS/CartDrawer';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

export default function SabanOSProfessionalChat() {
  const router = useRouter();
  const { phone } = router.query;

  // מצבי מערכת
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [lastUserInput, setLastUserInput] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // אתחול וברכת שלום
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
        id: '1', role: 'ai', 
        content: 'שלום בוס! המוח של ח.סבן כאן. נתחיל לבנות?', 
        timestamp: new Date() 
      }]);
    }
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
    
    // הצגת הודעת המשתמש בדיוק כפי שנכתבה
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'user', 
      content: textQuery || "📸 ניתוח תמונה...", 
      timestamp: new Date() 
    }]);
    
    setLoading(true);
    setInput('');

    try {
      const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
      const data = await SabanAPI.sendMessage(targetPhone, textQuery, base64);
      
      setLoading(false);

      if (!data || !data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data?.reply || "בוס, תקלה בחיבור למוח." }]);
        return;
      }

      // הפעלת צלצול ועדכון סל עם שם מוצר אמיתי
      if (data.orderPlaced) {
        playMagicSound(); 
        const newItem = {
          id: Date.now().toString(),
          name: data.items || textQuery, 
          qty: "1",
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
            content: data.reply, 
            timestamp: new Date(),
            product: data.productData // שליפה מהטבלה אם קיימת
          }]);
          setStreamingText("");
          setIsTyping(false);
        }
      }, 35);

    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "שגיאת תקשורת מול המוח." }]);
    }
  };

  const themeClass = isDarkMode ? "bg-[#0b141a] text-white" : "bg-[#f0f2f5] text-[#111b21]";
  const bubbleClass = (role: string) => role === 'user' 
    ? (isDarkMode ? "bg-[#202c33] border-white/5" : "bg-white border-black/10 shadow-sm text-black")
    : "bg-[#005c4b] text-white";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>SabanOS | Unified Brain</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Header עם המבורגר */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-[#202c33]/90 border-white/5' : 'bg-white/90 border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <Menu size={24} className="text-slate-400 cursor-pointer" onClick={() => setIsMenuOpen(true)} />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-black/5">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Saban OS</span>
          <img src={SABAN_LOGO} className="w-8 h-8 rounded-full border border-emerald-500/30" />
        </div>
        <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
          <ShoppingCart size={24} className="text-emerald-500" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#202c33]">
              {cartItems.length}
            </span>
          )}
        </div>
      </header>

      {/* Side Navigation (Hamburger) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed inset-y-0 right-0 w-64 z-[110] p-6 shadow-2xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-emerald-500">תפריט</h3>
                <X size={20} onClick={() => setIsMenuOpen(false)} className="cursor-pointer" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-sm cursor-pointer hover:text-emerald-500 transition-colors"><LayoutDashboard size={18}/> דשבורד</div>
                <div className="flex items-center gap-3 text-sm cursor-pointer hover:text-emerald-500 transition-colors"><History size={18}/> היסטוריית הזמנות</div>
                <div className="flex items-center gap-3 text-sm cursor-pointer hover:text-emerald-500 transition-colors"><Settings size={18}/> הגדרות</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        <div className="fixed inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center opacity-[0.02] pointer-events-none" />
        {messages.map((m, i) => (
          <div key={i}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-3.5 px-4 rounded-2xl shadow-md border ${bubbleClass(m.role)}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
              </div>
            </motion.div>
            {/* כרטיס מוצר ויזואלי אם קיים */}
            {m.product && <ProductCard product={m.product} onAdd={() => askAI(`הזמן ${m.product.name}`)} />}
          </div>
        ))}
        <OrderSummary userInput={lastUserInput} isVisible={isTyping} />
        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3.5 px-4 rounded-2xl bg-[#005c4b] text-white shadow-md">
              <span className="text-sm">{streamingText || "סבן AI חושב..."}</span>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block w-1.5 h-1.5 bg-emerald-300 rounded-full mr-2" />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} items={cartItems} onRemoveItem={(id) => setCartItems(prev => prev.filter(i => i.id !== id))} />

      {/* Footer עם מצלמה ומקלדת */}
      <footer className="p-4 pb-10 bg-transparent">
        <div className="flex items-center gap-3 max-w-5xl mx-auto bg-[#2a3942] p-2 rounded-2xl shadow-2xl border border-white/5">
          <button onClick={() => document.getElementById('cam')?.click()} className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
            <Camera size={24}/>
          </button>
          <input id="cam" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = (ev) => askAI(null, ev.target?.result as string);
            }
          }} />
          <input 
            value={input} onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && askAI(input)}
            placeholder="איך עוזרים היום בוס?" 
            className="flex-1 bg-transparent outline-none text-white text-sm font-bold px-2 placeholder:text-slate-500"
          />
          <button onClick={() => askAI(input)} className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
            <Send size={20} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
