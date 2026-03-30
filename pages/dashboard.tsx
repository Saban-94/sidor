'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LayoutDashboard, MessageSquare, Container, Send, Truck, ChevronRight, Box, RefreshCcw, Bot, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<'sidor' | 'containers'>('sidor');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSites();
    if (typeof window !== 'undefined') audioRef.current = new Audio('/order-notification.mp3');
  }, []);

  const fetchSites = async () => {
    const { data } = await supabase.from('container_management').select('*').eq('is_active', true);
    if (data) setContainerSites(data);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    const res = await fetch('/api/unified-brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    setLoading(false);
    if (data.reply.includes('בוצע')) {
      audioRef.current?.play().catch(() => {});
      fetchSites();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7FE] overflow-hidden transition-all" dir="rtl">
      {/* Sidebar */}
      <motion.aside animate={{ width: isSidebarOpen ? 260 : 80 }} className="bg-slate-900 text-white flex flex-col relative z-50 shrink-0">
        <div className="p-6 border-b border-white/5 font-black italic tracking-tighter">SABAN OS</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('sidor')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === 'sidor' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400'}`}>
            <MessageSquare size={20} /> {isSidebarOpen && <span>סידור הובלות</span>}
          </button>
          <button onClick={() => setActiveTab('containers')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === 'containers' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400'}`}>
            <Container size={20} /> {isSidebarOpen && <span>ניהול מכולות</span>}
          </button>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'sidor' ? (
            <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full w-full">
              {/* Sidor Grid */}
              <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-white/50">
                {DRIVERS.map(d => (
                  <div key={d.name} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={d.img} className="w-14 h-14 rounded-full border-2 border-emerald-500 object-cover" />
                      <h3 className="font-black text-xl">{d.name}</h3>
                    </div>
                    <div className="h-20 border-t border-slate-50 flex items-center italic text-slate-300 text-xs tracking-widest">זמין לשיבוץ...</div>
                  </div>
                ))}
              </div>
              {/* Integrated AI Chat */}
              <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col shadow-2xl">
                <div className="p-6 border-b font-black flex items-center gap-2"><Bot className="text-emerald-500"/> AI SUPERVISOR</div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`p-4 rounded-2xl text-xs font-bold ${m.role === 'user' ? 'bg-slate-900 text-white mr-auto' : 'bg-slate-100 text-slate-800 ml-auto'}`}>{m.content}</div>
                  ))}
                </div>
                <form onSubmit={handleSend} className="p-6 border-t">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="הזמנה או מכולה חדשה..." className="w-full bg-slate-100 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/20 font-bold text-sm" />
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 overflow-y-auto grid grid-cols-3 gap-6">
              {containerSites.map(site => (
                <div key={site.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                  <div className="p-3 bg-emerald-500 w-fit rounded-xl text-slate-900 mb-4">
                    {site.action_type === 'PLACEMENT' ? <Box size={20}/> : <RefreshCcw size={20}/>}
                  </div>
                  <h4 className="font-black text-lg">{site.client_name}</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1"><MapPin size={12}/> {site.delivery_address}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
