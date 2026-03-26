import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { database, app } from '../../lib/firebase';
import { ref, onValue, push, serverTimestamp, query as rtQuery, limitToLast } from 'firebase/database';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';
import { 
  Search, MoreVertical, MessageSquare, Menu, 
  CheckCheck, Clock, Bot, User, ShieldCheck, 
  Send, Paperclip, Smile, Phone, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const dbFS = getFirestore(app);

export default function SabanWhatsAppWeb() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. טעינת רשימת הלקוחות מה-CRM (Firestore)
  useEffect(() => {
    const q = query(collection(dbFS, 'customers'), orderBy('lastMessageAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomers(docs);
    });
    return () => unsub();
  }, []);

  // 2. טעינת הודעות בזמן אמת עבור הלקוח הנבחר (RTDB)
  useEffect(() => {
    if (!activeCustomer) return;

    const chatRef = rtQuery(ref(database, `chats/${activeCustomer.id}/messages`), limitToLast(100));
    const unsub = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          ...val
        }));
        setMessages(msgList);
      } else {
        setMessages([]);
      }
    });

    return () => unsub();
  }, [activeCustomer]);

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeCustomer) return;

    const newMessage = {
      text: inputText,
      sender: 'admin',
      timestamp: serverTimestamp(),
      type: 'out'
    };

    // הזרקה לתור השליחה ולצ'אט המקומי
    await push(ref(database, `chats/${activeCustomer.id}/messages`), newMessage);
    await push(ref(database, 'outgoing'), {
      to: activeCustomer.id + "@c.us",
      body: inputText,
      timestamp: serverTimestamp()
    });

    setInputText('');
  };

  return (
    <div className="flex h-screen bg-[#111b21] text-[#e9edef] font-sans antialiased overflow-hidden text-right" dir="rtl">
      <Head><title>WhatsApp - Saban Hub</title></Head>

      {/* Sidebar: רשימת צ'אטים */}
      <aside className="w-[400px] flex flex-col border-l border-[#222d34] bg-[#111b21]">
        <header className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center">
            <User size={24} className="text-[#aebac1]" />
          </div>
          <div className="flex gap-6 text-[#aebac1]">
            <MessageSquare size={20} className="cursor-pointer" />
            <MoreVertical size={20} className="cursor-pointer" />
          </div>
        </header>

        <div className="p-2 bg-[#111b21]">
          <div className="relative bg-[#202c33] rounded-lg flex items-center px-4 py-1.5">
            <Search size={18} className="text-[#8696a0] ml-4" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש או התחל צ'אט חדש"
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {customers.filter(c => c.id.includes(search) || c.name?.includes(search)).map((customer) => (
            <div 
              key={customer.id}
              onClick={() => setActiveCustomer(customer)}
              className={`flex items-center px-3 h-[72px] cursor-pointer border-b border-[#222d34] hover:bg-[#202c33] ${activeCustomer?.id === customer.id ? 'bg-[#2a3942]' : ''}`}
            >
              <div className="w-12 h-12 rounded-full bg-[#374045] ml-3 flex items-center justify-center shrink-0">
                <span className="font-bold text-lg">{customer.name?.charAt(0) || 'L'}</span>
              </div>
              <div className="flex-1 min-w-0 border-b border-transparent">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-[17px] truncate">{customer.name || customer.id}</span>
                  <span className="text-xs text-[#8696a0]">12:45</span>
                </div>
                <div className="flex items-center text-sm text-[#8696a0]">
                  <CheckCheck size={16} className="ml-1 text-[#53bdeb]" />
                  <p className="truncate italic">מענה אוטומטי פעיל...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-[#0b141a] relative">
        {activeCustomer ? (
          <>
            <header className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between z-10">
              <div className="flex items-center cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#374045] ml-3 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-[16px] font-medium leading-tight">{activeCustomer.name || activeCustomer.id}</h2>
                  <p className="text-[13px] text-[#8696a0]">מחובר (ניהול AI)</p>
                </div>
              </div>
              <div className="flex gap-5 text-[#aebac1]">
                <Phone size={20} />
                <Video size={22} />
                <Search size={20} />
                <MoreVertical size={20} />
              </div>
            </header>

            {/* רקע ווטסאפ קלאסי */}
            <div 
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 relative bg-[#0b141a]"
              style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', opacity: 0.9 }}
              ref={scrollRef}
            >
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[65%] p-2 rounded-lg text-[14.2px] shadow-sm relative ${m.type === 'in' ? 'bg-[#202c33] self-start rounded-tr-none' : 'bg-[#005c4b] self-end rounded-tl-none'}`}>
                  <div className="pb-1">{m.text}</div>
                  <div className="text-[11px] text-[#8696a0] flex items-center justify-end gap-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {m.type === 'out' && <CheckCheck size={15} className="text-[#53bdeb]" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <footer className="h-[62px] bg-[#202c33] px-4 flex items-center gap-4">
              <Smile className="text-[#8696a0] cursor-pointer" />
              <Paperclip className="text-[#8696a0] cursor-pointer" />
              <form onSubmit={handleSend} className="flex-1">
                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="הקלד הודעה"
                  className="w-full bg-[#2a3942] border-none outline-none py-2.5 px-4 rounded-lg text-sm"
                />
              </form>
              <Send 
                className={`cursor-pointer ${inputText.trim() ? 'text-[#00a884]' : 'text-[#8696a0]'}`} 
                onClick={handleSend} 
              />
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] border-b-4 border-[#00a884]">
            <img src="https://iili.io/qstzfVf.jpg" className="w-64 opacity-20 mb-8 rounded-full" alt="Saban Hub" />
            <h1 className="text-[#e9edef] text-3xl font-light mb-4">SABAN HUB Web</h1>
            <p className="text-[#8696a0] text-sm">שלח והעבר הודעות מבלי להשאיר את הטלפון מחובר.<br/>השתמש ב-Saban Hub ב-4 מכשירים בו-זמנית.</p>
          </div>
        )}
      </main>
    </div>
  );
}
