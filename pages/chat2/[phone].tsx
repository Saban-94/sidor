'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { 
  Menu, 
  Send, 
  X, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  Sun, 
  Moon, 
  Package 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { SabanAPI } from '@/lib/SabanAPI';

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const MAGIC_SOUND = "/magic-chime.mp3"; 

const QUICK_ACTIONS = [
  { label: 'הזמנת חומרים', icon: '🏗️' },
  { label: 'בדיקת מלאי', icon: '📦' },
  { label: 'מצב חשבון', icon: '💰' }
];

export default function SabanOSChatV2() {
  const router = useRouter();
  const { phone } = router.query;

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: '1', role: 'ai', content: 'שלום בוס! רויטל כאן. איך עוזרים היום?', timestamp: new Date() }]);
    }
    audioRef.current = new Audio(MAGIC_SOUND);
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
const askAI = async (query: string, imageBase64: string | null = null) => {
    if ((!query.trim() && !imageBase64) || loading || isTyping) return;
    
    const userMsg = query || "📸 ניתוח תמונה...";
    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');

    // הצגת הודעת המשתמש בממשק
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setLoading(true);
    setInput('');

    try {
      // --- הפנייה הכפולה במקביל: מוח + תיעוד ---
      const [brainResponse] = await Promise.all([
        // 1. המוח הראשי (Vercel API) לחישובים ותשובה
        fetch('/api/tools-brain', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            message: query || "", 
            imageBase64: imageBase64 || null 
          })
        }).then(async res => {
          if (!res.ok) {
            const errorTxt = await res.text();
            throw new Error(`Brain Error: ${res.status} - ${errorTxt}`);
          }
          return res.json();
        }),

        // 2. התיעוד ב-Apps Script (Google Sheets) - "שגר ושכח"
        SabanAPI.sendMessage(targetPhone, userMsg, imageBase64).catch(e => 
          console.error("Logging to Sheets failed:", e)
        )
      ]);

      setLoading(false);

      // טיפול בתגובה מהמוח (חישובים, מלאי ותשובה)
      if (brainResponse && brainResponse.reply) {
        
        // א. עדכון סל הקניות אם המוח זיהה פריטים להזמנה
        if (brainResponse.cart && brainResponse.cart.length > 0) {
          playMagicSound();
          const newItems = brainResponse.cart.map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: `${item.name} (${item.qty} ${item.unit || 'יח'})`,
            qty: item.qty
          }));
          setCartItems(prev => [...prev, ...newItems]);
          
          // פתיחת הסל אוטומטית אחרי שנייה וחצי
          setTimeout(() => setShowCart(true), 1500);
        }

        // ב. אפקט הקלדה לתשובה המקצועית של רויטל
        setIsTyping(true);
        let i = 0;
        const words = brainResponse.reply.split(" ");
        setStreamingText("");
        
        const interval = setInterval(() => {
          if (i < words.length) {
            setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
            i++;
          } else {
            clearInterval(interval);
            setMessages(prev => [...prev, { 
              role: 'ai', 
              content: brainResponse.reply, 
              timestamp: new Date() 
            }]);
            setStreamingText("");
            setIsTyping(false);
          }
        }, 30);
      }
    } catch (e: any) {
      setLoading(false);
      setIsTyping(false);
      console.error("Critical Chat Error:", e.message);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "בוס, יש תקלה בחיבור למוח. וודא שהשרת תקין והמפתח מוגדר." 
      }]);
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${themeClass}`} dir="rtl">
      <Head>
        <title>SabanOS | צ'אט ניהול</title>
      </Head>

      {/* Header */}
      <header className={`h-16 flex items-center justify-between px-5 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-[#202c33]/90 border-white/5' : 'bg-white/90 border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <Menu size={24} className="text-slate-400 cursor-pointer" />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-black/5">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Saban OS</span>
          <img src={SABAN_LOGO} className="w-8 h-8 rounded-full border border-emerald-500/30 object-cover" />
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

      {/* הודעות צ'אט */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] border border-white/5' : 'bg-[#005c4b] text-white'}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert leading-relaxed">
                {m.content}
              </ReactMarkdown>
            </motion.div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] text-white flex items-center gap-2">
              <span className="text-sm">{streamingText || "רויטל חושבת..."}</span>
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

{/* סל קניות מונפש ודינמי */}
      <AnimatePresence>
        {showCart && (
          <>
            {/* רקע עמום */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCart(false)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" 
            />
            
            {/* תפריט הסל הצדי */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm z-[60] p-6 flex flex-col bg-[#111b21] shadow-2xl border-r border-white/10"
            >
              {/* כותרת הסל */}
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-black text-emerald-500 italic flex items-center gap-2">
                  <Package /> הסל של סבן
                </h2>
                <X onClick={() => setShowCart(false)} className="cursor-pointer text-slate-400 hover:text-white transition-colors" />
              </div>

              {/* רשימת המוצרים */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                    <ShoppingCart size={40} />
                    <span className="text-sm font-bold">הסל ריק, בוס</span>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.id} 
                      className="p-4 bg-[#202c33] rounded-xl flex justify-between items-center border-r-4 border-emerald-500 shadow-inner group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{item.name}</span>
                        <span className="text-[10px] text-emerald-500/70 font-bold uppercase">מאושר במלאי</span>
                      </div>
                      <button 
                        onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-400/50 group-hover:text-red-400" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* כפתורי פעולה */}
              <div className="mt-auto pt-6 space-y-3">
                
                {/* כפתור שליחה למאגרים (לבן ומרשים) */}
                <button 
                  disabled={cartItems.length === 0 || loading}
                  onClick={async () => {
                    const targetPhone = Array.isArray(phone) ? phone[0] : (phone || 'אורח');
                    const itemsList = cartItems.map(i => i.name).join(', ');
                    
                    try {
                      playMagicSound();
                      
                      // שליחה במקביל ל-Supabase ולגוגל שיטס
                      await Promise.all([
                        // שליחה ל-Supabase (טבלת orders)
                        fetch('/api/save-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            phone: targetPhone,
                            items: cartItems,
                            status: 'pending'
                          })
                        }),
                        // תיעוד ב-Apps Script (גוגל שיטס)
                        SabanAPI.sendMessage(targetPhone, `ביצוע הזמנה סופית מהסל: ${itemsList}`)
                      ]);

                      // הודעת סיכום לוואטסאפ
                      const waText = `הזמנה חדשה מ-SabanOS 🏗️\nלקוח: ${targetPhone}\n\nפריטים:\n${cartItems.map(i => `• ${i.name}`).join('\n')}\n\nנא לאשר ולצאת לביצוע!`;
                      window.open(`https://wa.me/972508860896?text=${encodeURIComponent(waText)}`, '_blank');
                      
                      setCartItems([]);
                      setShowCart(false);
                    } catch (e) {
                      console.error("Order process failed", e);
                    }
                  }}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-30"
                >
                  <CheckCircle2 size={20} />
                  שלח הזמנה לביצוע
                </button>

                {/* כפתור שיתוף וואטסאפ רגיל */}
                <button 
                  onClick={() => {
                    const txt = `רשימת מוצרים מסבן:\n${cartItems.map(i => `• ${i.name}`).join('\n')}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
                  }}
                  className="w-full bg-emerald-600/10 text-emerald-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all"
                >
                  <Share2 size={18} /> שיתוף רשימה
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* פוטר עם כפתורי קיצור */}
      <footer className="p-4 bg-transparent z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-2 max-w-5xl mx-auto">
          {QUICK_ACTIONS.map((action, i) => (
            <button 
              key={i} 
              onClick={() => askAI(action.label)}
              className="whitespace-nowrap px-4 py-2 bg-[#2a3942] hover:bg-[#32444f] rounded-full text-xs font-bold text-white border border-white/5 transition-all flex items-center gap-2"
            >
              <span>{action.icon}</span> {action.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex gap-3 max-w-5xl mx-auto items-center">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="איך עוזרים היום בוס?" 
            className="flex-1 p-3.5 px-6 rounded-full bg-[#2a3942] text-white outline-none border border-transparent focus:border-emerald-500/50 shadow-inner"
          />
          <button type="submit" disabled={loading} className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50">
            <Send size={20} className="rotate-180" />
          </button>
        </form>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
