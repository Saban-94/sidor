'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, ShoppingCart, Share2, Sparkles, Sun, Moon, Trash2, CheckCircle2, Package, LayoutDashboard, History, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

// --- רכיבים פנימיים (במקום ייבוא חיצוני שגורם לשגיאה) ---

const OrderSummary = ({ userInput, isVisible }: { userInput: string, isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && userInput && (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-4 right-4 z-30 pointer-events-none"
      >
        <div className="bg-emerald-500/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl max-w-max mx-auto border border-white/20 flex items-center gap-2">
          <Sparkles size={16} className="animate-pulse" />
          <span className="text-xs font-bold">המוח מנתח: "{userInput}"</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ProductCard = ({ product, onAdd }: { product: any, onAdd: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }} 
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#202c33] border border-white/5 rounded-2xl overflow-hidden shadow-lg mt-2"
  >
    {product.imageUrl && (
      <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover" />
    )}
    <div className="p-3">
      <h4 className="text-white font-bold text-sm">{product.name}</h4>
      <div className="flex justify-between items-center mt-2">
        <span className="text-emerald-400 font-black text-xs">₪{product.price}</span>
        <button 
          onClick={onAdd}
          className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-full font-bold active:scale-95"
        >
          הוסף לסל
        </button>
      </div>
    </div>
  </motion.div>
);

// --- אתחול והגדרות ---
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

export default function SabanOSUnifiedChat() {
  const router = useRouter();
  const { phone } = router.query;

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

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: '1', role: 'ai', content: 'שלום בוס! המוח של ח.סבן כאן. מה נבנה היום?', timestamp: new Date() }]);
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText, loading]);

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
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: textQuery || "📸 ניתוח תמונה...", timestamp: new Date() }]);
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

      if (data.orderPlaced) {
        playMagicSound(); 
        const newItem = { id: Date.now().toString(), name: data.items || textQuery, qty: "1", verified: true };
        setCartItems(prev => [...prev, newItem]);
        setTimeout(() => setShowCart(true), 600);
      }

      setIsTyping(true);
      let i = 0;
      const words = data.reply.split(" ");
      const interval = setInterval(() => {
        if (i < words.length) {
          setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
          i++;
        } else {
          clearInterval(interval);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.reply, timestamp: new Date(), product: data.productData }]);
          setStreamingText("");
          setIsTyping(false);
        }
      }, 35);
    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "שגיאת תקשורת." }]);
    }
  };

  const themeClass = isDarkMode ? "bg-[#0b141a] text-white" : "bg-[#f0f2f5] text-[#111b21]";

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>SabanOS | Unified Brain</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      
      <audio ref={audioRef} src={MAGIC_SOUND} />

      {/* Header */}
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

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        {messages.map((m, i) => (
          <div key={i}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-3.5 px-4 rounded-2xl shadow-md border ${m.role === 'user' ? (isDarkMode ? 'bg-[#202c33] border-white/5' : 'bg-white border-black/10 text-black') : 'bg-[#005c4b] text-white'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
              </div>
            </motion.div>
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

      {/* Cart Drawer & Footer (Simplifying for Build) */}
      <footer className="p-4 pb-10 bg-transparent">
        <div className="flex items-center gap-3 max-w-5xl mx-auto bg-[#2a3942] p-2 rounded-2xl shadow-2xl border border-white/5">
          <button onClick={() => document.getElementById('cam')?.click()} className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
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
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI(input)} placeholder="איך עוזרים היום?" className="flex-1 bg-transparent outline-none text-white text-sm px-2" />
          <button onClick={() => askAI(input)} className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center"><Send size={20} className="rotate-180" /></button>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed inset-y-0 right-0 w-[80%] max-w-sm z-[60] p-6 flex flex-col shadow-2xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6 text-emerald-500 font-black italic">הסל של סבן <X onClick={() => setShowCart(false)} /></div>
              {cartItems.map(item => (
                <div key={item.id} className="p-4 bg-[#202c33] rounded-xl mb-2 flex justify-between items-center text-white text-xs border-r-4 border-emerald-500">
                  <span>{item.name}</span>
                  <Trash2 size={14} className="text-red-400/50" onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} />
                </div>
              ))}
              <button onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent("הזמנה מ-SabanOS AI:\n" + cartItems.map(i => `• ${i.name}`).join('\n'))}`)} className="w-full bg-emerald-600 py-4 rounded-2xl mt-auto font-bold text-white flex items-center justify-center gap-2"><Share2 size={18}/> שלח וואטסאפ</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
