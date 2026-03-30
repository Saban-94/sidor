// pages/chat/[phone].tsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Send, Bot, User, CheckCircle2, Truck, HardHat } from 'lucide-react';

export default function CustomerProChat() {
  const router = useRouter();
  const { phone } = router.query;
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'שלום בוס, כאן המוח של ח. סבן. איזה פרויקט מקדמים היום?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/unified-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: input, history: messages })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error("Error calling brain:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans antialiased">
      {/* Header הייטקי */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-emerald-200 shadow-lg">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">המוח של ח. סבן</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-slate-500 font-medium">מנהל תיק לקוח אישי</p>
            </div>
          </div>
        </div>
        <div className="text-slate-400 bg-slate-100 p-2 rounded-full">
          <HardHat size={20} />
        </div>
      </header>

      {/* אזור השיחה */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && msg.content.includes("הוזרקה") && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold">
                  <CheckCircle2 size={14} /> ההזמנה הגיעה לראמי
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      {/* Input Bar */}
      <footer className="p-4 bg-white border-t border-slate-200 pb-8">
        <div className="max-w-4xl mx-auto flex gap-2 items-center bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:border-emerald-500 transition-all shadow-inner">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="מה לשלוח היום?"
            className="flex-1 bg-transparent border-none outline-none p-2 text-slate-800 placeholder:text-slate-400"
          />
          <button 
            onClick={sendMessage}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}             <button onClick={() => supabase.from('orders').delete().eq('id', order.id)} className="p-1 hover:bg-white/10 rounded-md text-red-400"><Trash2 size={12}/></button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!mounted || !profile) return null;

  return (
    <div className={`flex flex-col lg:flex-row h-screen w-full transition-colors duration-500 ${isDarkMode ? 'bg-[#0B0F1A]' : 'bg-[#F1F5F9]'}`} dir="rtl">
      <Head><title>SABAN OS | {profile.name}</title></Head>

      {/* --- Sidebar: לוח נהגים --- */}
      <aside className={`w-full lg:w-[450px] flex flex-col border-l shadow-2xl z-20 ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <Truck className="text-emerald-400 animate-bounce" />
            <h2 className="font-black italic text-lg uppercase tracking-tighter">סידור עבודה חי</h2>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/10 rounded-full">
            {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
          {[
            { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
            { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
          ].map(driver => (
            <div key={driver.name} className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-500/10 p-3 rounded-3xl border border-emerald-500/20">
                <img src={driver.img} className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover shadow-lg" />
                <h3 className={`font-black text-xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{driver.name}</h3>
              </div>
              <div className="space-y-2 relative">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="flex items-center gap-4 min-h-[50px] group px-2">
                    <span className={`text-[10px] font-black font-mono w-10 opacity-30 ${isDarkMode ? 'text-white' : 'text-slate-400'}`}>{slot}</span>
                    <div className="flex-1 border-b border-slate-100/10 min-h-[40px]">
                      {renderOrder(driver.name, slot)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* --- Main: צאט פקודות --- */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden shadow-inner">
        <header className={`h-20 px-8 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#111827]/80 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30"><Bot className="text-white" size={24}/></div>
            <div>
              <h1 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>העוזר המבצעי</h1>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/> <span className="text-[10px] font-bold opacity-50 uppercase">{profile.name}</span></div>
            </div>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.type === 'in' ? 'justify-start' : 'justify-end'} group`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-xl text-sm font-bold leading-relaxed transition-all ${
                m.type === 'in' 
                ? (isDarkMode ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tr-none border border-slate-100') 
                : 'bg-emerald-500 text-slate-950 rounded-tl-none shadow-emerald-500/20'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </main>

        <footer className={`p-6 border-t ${isDarkMode ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-100'}`}>
          <div className={`max-w-4xl mx-auto flex items-center gap-3 p-2 rounded-[2.5rem] border shadow-2xl transition-all ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <input 
              type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב פקודה להזרקה..."
              className="flex-1 bg-transparent px-6 py-3 font-bold outline-none"
            />
            <button onClick={handleSend} className="bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-emerald-600">
              <Send size={22} className="transform rotate-180" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
