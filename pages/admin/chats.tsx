'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, app } from '../../lib/firebase';
import { ref, onValue, push, query as rtQuery, limitToLast } from 'firebase/database';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { 
  Search, Phone, MessageSquare, MoreVertical, 
  Send, Smile, Paperclip, CheckCheck, User,
  ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// הגנה ל-TypeScript ול-Build של Vercel
const dbFS = app ? getFirestore(app) : null;

export default function SabanWhatsAppWeb() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!dbFS) return;

    const q = query(collection(dbFS, 'customers'), orderBy('last_message_time', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const custs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(custs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!database || !selectedCustomer) return;

    const chatRef = rtQuery(ref(database, `chats/${selectedCustomer.id}`), limitToLast(100));
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.entries(data).map(([id, msg]: [string, any]) => ({ id, ...msg }));
        setMessages(msgList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [selectedCustomer]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !database || !selectedCustomer) return;

    const chatRef = ref(database, `chats/${selectedCustomer.id}`);
    await push(chatRef, {
      text: newMessage,
      sender: 'admin',
      timestamp: Date.now(),
      status: 'sent'
    });
    setNewMessage('');
  };

  if (!mounted) return null;

  return (
    <div className="h-screen bg-[#F0F2F5] flex overflow-hidden font-sans" dir="rtl">
      <Head>
        <title>SABAN CHATS | WhatsApp Web Mode</title>
      </Head>

      <aside className="w-[450px] bg-white border-l border-slate-200 flex flex-col h-full z-20 shadow-xl">
        <header className="p-4 bg-[#F0F2F5] flex items-center justify-between">
          <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
            <User className="text-slate-500" />
          </div>
          <div className="flex gap-5 text-slate-500">
            <Zap size={20} className="hover:text-blue-600 cursor-pointer" />
            <MessageSquare size={20} className="hover:text-blue-600 cursor-pointer" />
            <MoreVertical size={20} className="hover:text-blue-600 cursor-pointer" />
          </div>
        </header>

        <div className="p-2 border-b border-slate-100 bg-white">
          <div className="bg-[#F0F2F5] flex items-center px-4 py-2 rounded-xl">
            <Search size={18} className="text-slate-400 ml-4" />
            <input 
              placeholder="חפש לקוח..." 
              className="bg-transparent border-none outline-none text-sm w-full font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {customers.filter(c => c.name?.includes(search)).map((customer) => (
            <button 
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={`w-full p-4 flex items-center gap-4 border-b border-slate-50 transition-all ${selectedCustomer?.id === customer.id ? 'bg-[#F0F2F5]' : 'hover:bg-slate-50'}`}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black">
                {customer.name?.charAt(0)}
              </div>
              <div className="flex-1 text-right">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-black text-slate-800">{customer.name}</h4>
                </div>
                <p className="text-xs text-slate-500 truncate w-64">{customer.last_message || 'לחץ להתחלת צ'אט...'}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#E5DDD5] relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] pointer-events-none"></div>

        {selectedCustomer ? (
          <>
            <header className="p-4 bg-[#F0F2F5] flex items-center justify-between z-10 shadow-sm font-bold">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">
                  {selectedCustomer.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{selectedCustomer.name}</h3>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-2 z-10 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`max-w-[60%] p-3 rounded-2xl text-sm font-bold shadow-sm ${msg.sender === 'admin' ? 'bg-[#D9FDD3] self-start rounded-tr-none' : 'bg-white self-end rounded-tl-none'}`}>
                  {msg.text}
                  <div className="text-[9px] text-slate-400 mt-1 flex justify-end gap-1">
                    {msg.sender === 'admin' && <CheckCheck size={12} className="text-blue-500" />}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <footer className="p-4 bg-[#F0F2F5] flex items-center gap-4 z-10">
              <Smile className="text-slate-500 cursor-pointer" />
              <form onSubmit={sendMessage} className="flex-1 flex gap-4">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="הקלד הודעה..." 
                  className="w-full p-3 rounded-xl border-none outline-none font-bold text-sm"
                />
                <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl shadow-lg">
                  <Send size={20} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 z-10">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border border-white">
              <ShieldCheck size={80} className="mx-auto text-blue-600 mb-6 opacity-20" />
              <h3 className="text-2xl font-black text-slate-800 italic">SABAN CHATS</h3>
              <p className="mt-2 font-bold text-sm">בחר לקוח מהרשימה כדי להתחיל בניהול השיחה</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
