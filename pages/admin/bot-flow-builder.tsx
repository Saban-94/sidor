import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, limit } from 'firebase/firestore';
import { 
  Bot, Send, Image as ImageIcon, FileText, Link as LinkIcon, 
  Sparkles, Smile, MessageCircle, RefreshCw, Save, Activity,
  Smartphone, ShieldCheck, ChevronLeft, Zap, Play, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

const EMOJIS = ["✨", "🏗️", "💎", "🚚", "📞", "🤝", "🔥", "🚀", "✅", "⚠️", "📊"];
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default function StudioPro() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [simMessages, setSimMessages] = useState<any[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [dnaDraft, setDnaDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת לקוחות לאימון
  useEffect(() => {
    const q = query(collection(dbFS, 'customers'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [simMessages, isThinking]);

  // פונקציית סימולציה (חשיבה מלאכותית)
  const triggerSimulation = async (manualData?: any) => {
    if (isThinking || (!simInput.trim() && !manualData)) return;

    const userText = manualData ? `[זרקה ידנית]` : simInput.trim();
    if (!manualData) {
      setSimMessages(prev => [...prev, { role: 'user', text: userText }]);
      setSimInput('');
    }
    
    setIsThinking(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: manualData ? "" : userText,
          name: selectedCustomer?.name || 'אורח',
          senderPhone: selectedCustomer?.id || 'simulator',
          state: 'MENU',
          manualInjection: manualData || null
        })
      });
      const data = await res.json();
      
      // אם יש הזרקה ידנית, נציג אותה
      const finalReply = manualData ? manualData.reply : data.reply;
      
      setSimMessages(prev => [...prev, { 
        role: 'ai', 
        text: finalReply, 
        mediaUrl: data.mediaUrl,
        pdfUrl: data.pdfUrl,
        actionButton: data.actionButton
      }]);
    } catch (e) {
      setSimMessages(prev => [...prev, { role: 'ai', text: '⚠️ שגיאת חיבור למוח' }]);
    } finally {
      setIsThinking(false);
    }
  };

  // הזרקות ידניות
  const injectManual = (type: 'image' | 'pdf' | 'link' | 'text') => {
    let data: any = {};
    if (type === 'image') data = { reply: "הנה תמונת המוצר שביקשת:", mediaUrl: "https://i.postimg.cc/mD8ZqZp6/shak.jpg" };
    if (type === 'pdf') data = { reply: "מצרף לך את המחירון המעודכן שלנו ב-PDF:", pdfUrl: "https://example.com/price-list.pdf" };
    if (type === 'link') data = { reply: "כנס ללינק הקסם שלך כדי לראות את הצעת המחיר:", actionButton: { text: "צפייה בהצעת מחיר 💎", link: "https://sidor.vercel.app/start" } };
    if (type === 'text') data = { reply: dnaDraft || "פקודת DNA ידנית הוזרקה בהצלחה." };
    
    triggerSimulation(data);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-200 overflow-hidden" dir="rtl">
      <Head><title>SabanOS | Studio Pro</title></Head>

      {/* Sidebar: בחירת לקוח ו-DNA */}
      <aside className="w-80 bg-slate-900 border-l border-white/5 flex flex-col shrink-0 z-20 shadow-2xl">
        <header className="p-6 bg-slate-950 border-b border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cpu size={20} />
            <h1 className="font-black text-lg">STUDIO PRO</h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">מעבדת אימון ודינמיקה</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <label className="text-[10px] font-black text-slate-500 mb-3 block uppercase tracking-tighter">בחר לקוח לסימולציה</label>
            <div className="space-y-2">
              {customers.map(c => (
                <button 
                  key={c.id} onClick={() => setSelectedCustomer(c)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border ${selectedCustomer?.id === c.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">{c.name?.[0]}</div>
                  <div className="text-right flex-1">
                    <div className="text-xs font-bold truncate">{c.name || c.id}</div>
                    <div className="text-[9px] text-slate-500 font-mono">{c.id}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 mb-1 block uppercase">שרטוט DNA ידני (מבנה שאלה/תשובה)</label>
            <textarea 
              value={dnaDraft} onChange={e => setDnaDraft(e.target.value)}
              placeholder="כתוב כאן תשובה שאתה רוצה שה-AI יזריק..."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500 transition-all resize-none leading-relaxed"
            />
            <button 
              onClick={() => injectManual('text')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Zap size={14} /> הזרק DNA לסימולטור
            </button>
          </section>
        </div>
      </aside>

      {/* Main Studio: הקנבס והסימולטור */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-8 bg-[#020617]" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        
        {/* Simulator Frame (iPhone Style) */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          className="w-[360px] h-[720px] bg-slate-900 rounded-[3rem] border-[10px] border-slate-800 shadow-[0_0_80px_rgba(16,185,129,0.1)] relative flex flex-col overflow-hidden"
        >
          {/* Status Bar */}
          <div className="bg-slate-900 h-6 w-full flex justify-center items-center shrink-0">
            <div className="w-20 h-4 bg-slate-800 rounded-b-xl"></div>
          </div>

          {/* Header */}
          <header className="bg-slate-900 p-4 border-b border-white/5 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black">ראמי (JONI AI)</h2>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest underline decoration-emerald-500/50">מחובר בזמן אמת</span>
              </div>
            </div>
          </header>

          {/* Chat Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#020617]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')", backgroundBlendMode: 'overlay' }}>
            <AnimatePresence>
              {simMessages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: m.role === 'ai' ? -20 : 20 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                  key={i} className={`max-w-[85%] p-3 rounded-2xl shadow-xl text-xs relative ${m.role === 'ai' ? 'bg-slate-800 text-slate-200 self-start rounded-tr-none border border-white/5' : 'bg-emerald-600 text-white self-end rounded-tl-none'}`}
                >
                  {/* Media (Image) */}
                  {m.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                      <img src={m.mediaUrl} className="w-full object-cover max-h-40" alt="media" />
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                  {/* PDF Link Attachment */}
                  {m.pdfUrl && (
                    <div className="mt-3 bg-black/30 p-2 rounded-xl flex items-center gap-2 border border-white/5 hover:bg-black/50 transition cursor-pointer">
                      <div className="bg-red-500/20 p-1.5 rounded-lg text-red-500"><FileText size={16}/></div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold text-[10px] truncate text-slate-300">מסמך PDF מצורף</div>
                        <div className="text-[8px] text-slate-500">Price_List_2026.pdf</div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {m.actionButton && (
                    <div className="mt-3">
                      <button className="w-full bg-white text-slate-900 font-black py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-[10px]">
                        {m.actionButton.text} <ChevronLeft size={14} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start bg-slate-800 p-3 rounded-2xl rounded-tr-none flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400 animate-spin" />
                <span className="text-[10px] font-bold text-slate-400">המוח מנתח ומעצב...</span>
              </motion.div>
            )}
          </div>

          {/* סרגל כלים דינמי (Toolbar) */}
          <div className="px-4 py-2 bg-slate-900 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1.5 rounded-lg transition-colors ${showEmojiPicker ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-300'}`}>
                <Smile size={18} />
              </button>
              <div className="w-px h-4 bg-white/10"></div>
              <button onClick={() => injectManual('image')} className="p-1.5 text-slate-500 hover:text-blue-400 transition" title="הזרק תמונה"><ImageIcon size={18} /></button>
              <button onClick={() => injectManual('pdf')} className="p-1.5 text-slate-500 hover:text-red-400 transition" title="הזרק PDF"><FileText size={18} /></button>
              <button onClick={() => injectManual('link')} className="p-1.5 text-slate-500 hover:text-amber-400 transition" title="הזרק לינק קסם"><LinkIcon size={18} /></button>
            </div>
            
            <button 
              onClick={() => triggerSimulation()}
              className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-500/30 transition flex items-center gap-1"
              title="פקודת חשיבה מלאכותית"
            >
              <Cpu size={18} className={isThinking ? 'animate-spin' : ''} />
              <span className="text-[8px] font-black uppercase">Thinking</span>
            </button>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 shrink-0 pb-10">
            {showEmojiPicker && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 p-2 bg-slate-800 rounded-xl mb-3 overflow-x-auto no-scrollbar">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { setSimInput(prev => prev + e); setShowEmojiPicker(false); }} className="text-xl hover:scale-125 transition-transform">{e}</button>
                ))}
              </motion.div>
            )}
            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-2xl border border-white/5 focus-within:border-emerald-500 transition-all">
              <input 
                type="text" value={simInput} onChange={e => setSimInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && triggerSimulation()}
                placeholder="כתוב שאלה מהלקוח..."
                className="flex-1 bg-transparent border-none outline-none text-xs px-2"
              />
              <button 
                onClick={() => triggerSimulation()}
                className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <Send size={18} className="transform rotate-180" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Floating Background Elements */}
        <div className="absolute top-20 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      </main>
    </div>
  );
}
