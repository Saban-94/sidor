"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "../../../lib/supabase";
import { 
  Truck, MapPin, Warehouse, Bot, X, Send, Calendar 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// נתוני נהגים
const drivers = [
  { 
    name: 'חכמת', 
    img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
    type: 'משאית מנוף'
  },
  { 
    name: 'עלי', 
    img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg',
    type: 'פריקה ידנית'
  }
];

export default function DispatchDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetDateStr, setTargetDateStr] = useState('');
  
  // AI State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'ai'|'user', text: string}[]>([
    { role: 'ai', text: 'שלום ראמי! אני מחובר לטבלת הסידור. מה תרצה לדעת על ההובלות למחר?' }
  ]);
  
  const supabase = getSupabase();

  const fetchOrders = useCallback(async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1); // למחר
    const dateStr = targetDate.toISOString().split('T')[0];
    setTargetDateStr(dateStr);

    const { data, error } = await supabase
      .from('saban_dispatch')
      .select('*')
      .eq('scheduled_date', dateStr)
      .order('scheduled_time', { ascending: true });

    if (!error) setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('dispatch_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_dispatch' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, supabase]);

  // שליחת שאלה למוח
  const askAI = async () => {
    if (!aiInput.trim() || isAiTyping) return;
    const question = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: question }]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/dispatch-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, dateStr: targetDateStr })
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'ai', text: data.reply || 'שגיאה בתשובת השרת' }]);
    } catch (e) {
      setAiMessages(prev => [...prev, { role: 'ai', text: 'שגיאת רשת בחיבור למוח.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-900">טוען סידור עבודה...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#0B2C63] italic">SABAN<span className="text-blue-500 underline">LIVE</span></h1>
          <p className="text-slate-500 font-bold flex items-center gap-2">
            <Calendar size={16} /> סידור עבודה: {new Date(targetDateStr).toLocaleDateString('he-IL')}
          </p>
        </div>
        <span className="bg-green-500 text-white px-4 py-1 rounded-full animate-pulse text-xs font-bold shadow-sm">
          מחובר LIVE
        </span>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <div className="relative">
                <img src={driver.img} alt={driver.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-blue-50 shadow-lg" />
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-lg shadow-md">
                  <Truck size={16} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
                <p className="text-blue-600 font-bold text-sm">{driver.type}</p>
              </div>
            </div>

            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).length > 0 ? (
                orders.filter(o => o.driver_name === driver.name).map((order) => (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={order.id}>
                    <div className="bg-white border-none shadow-md hover:shadow-xl transition-all rounded-2xl overflow-hidden group">
                      <div className={`h-1.5 w-full ${driver.name === 'חכמת' ? 'bg-blue-600' : 'bg-orange-500'}`} />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-black text-slate-800 leading-none">{order.customer_name}</h3>
                          <div className="bg-slate-100 px-3 py-1 rounded-lg font-mono font-bold text-blue-700">
                            {order.scheduled_time?.slice(0, 5) || 'לא שובץ'}
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                            <MapPin size={14} className="text-red-500" /> {order.address}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                            <Warehouse size={14} className="text-blue-500" /> {order.warehouse_source}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {order.is_crane_delivery && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">מנוף</span>}
                          {order.is_truck_delivery && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">משאית</span>}
                          {order.is_waste_collection && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700">פסולת</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-300 font-bold border-2 border-dashed border-slate-200 rounded-3xl">אין הזמנות משובצות</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#0B2C63] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <Bot size={32} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-bounce">AI</div>
      </button>

      <AnimatePresence>
        {isAiOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col"
          >
            <div className="bg-[#0B2C63] p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="text-blue-400" />
                <span className="font-black">Gemini - מוח הסידור</span>
              </div>
              <button onClick={() => setIsAiOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="h-80 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 text-sm font-bold">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-2xl max-w-[85%] ${msg.role === 'ai' ? 'bg-blue-100 text-blue-900 rounded-tr-none self-start ml-8' : 'bg-[#00a884] text-white rounded-tl-none self-end mr-8'}`}>
                  {msg.text}
                </div>
              ))}
              {isAiTyping && <div className="bg-blue-100 p-3 rounded-2xl max-w-[50%] rounded-tr-none text-blue-900 animate-pulse self-start ml-8">חושב...</div>}
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0 bg-white">
              <input 
                type="text" 
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askAI()}
                placeholder="שאל אותי על החרש/עלי..." 
                className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none"
              />
              <button onClick={askAI} disabled={isAiTyping} className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-50 transition-opacity">
                <Send size={18} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
