'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, Send } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminControlPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState('');

  const fetchData = async () => {
    const { data } = await supabase.from('customer_memory').select('*').order('updated_at', { ascending: false });
    if (data) {
      setCustomers(data);
      // עדכון הלקוח הנבחר כדי שיראו את ההודעות החדשות בזמן אמת
      if (selectedCustomer) {
        const updated = data.find(c => c.clientId === selectedCustomer.clientId);
        if (updated) setSelectedCustomer(updated);
      }
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'customer_memory',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCustomer?.clientId]); // האזנה לשינויים בלקוח הנבחר

  const handleSend = async () => {
    if (!adminMessage || !selectedCustomer) return;
    
    const newHistory = `${selectedCustomer.accumulated_knowledge}\n[ADMIN]: ${adminMessage}`;
    
    // עדכון ב-DB
    await supabase.from('customer_memory')
      .update({ accumulated_knowledge: newHistory })
      .eq('clientId', selectedCustomer.clientId);

    // שליחת Push (אופציונלי)
    try {
      await fetch('/api/admin/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedCustomer.clientId, message: adminMessage })
      });
    } catch (e) {
      console.log("Push failed, but message saved.");
    }

    setAdminMessage('');
    fetchData();
  };

  return (
    <div className="h-screen w-full bg-[#0b141a] text-white flex font-sans overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-80 border-l border-white/5 bg-[#111b21] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 bg-[#202c33]">
          <h1 className="text-xl font-black text-emerald-500 flex items-center gap-2">
            <ShieldAlert /> Saban OS
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {customers.map(c => (
            <div 
              key={c.clientId} 
              onClick={() => setSelectedCustomer(c)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-all ${selectedCustomer?.clientId === c.clientId ? 'bg-emerald-500/10 border-r-4 border-emerald-500' : 'hover:bg-white/5'}`}
            >
              <div className="font-bold text-sm">{c.user_name || "אורח"}</div>
              <div className="text-[10px] text-slate-500">{c.clientId}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-[#0b141a]">
        <header className="h-16 bg-[#202c33] flex items-center px-6 border-b border-white/5 shadow-md">
          <span className="font-bold text-emerald-400">
            {selectedCustomer ? `מעקב פעיל: ${selectedCustomer.user_name || "אורח"}` : "בחר לקוח למעקב"}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-opacity-5 custom-scrollbar">
          {selectedCustomer?.accumulated_knowledge.split('\n').filter(Boolean).map((line: string, i: number) => {
            const isAdmin = line.includes('[ADMIN]');
            return (
              <div key={i} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-md p-3 px-4 rounded-2xl text-sm shadow-lg ${isAdmin ? 'bg-blue-600 rounded-tl-none' : 'bg-[#202c33] rounded-tr-none border border-white/5'}`}>
                  {line.replace('[ADMIN]:', '').replace('U:', '👤').replace('AI:', '🤖')}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-[#111b21] border-t border-white/5">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 max-w-4xl mx-auto"
          >
            <input 
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="כתוב מענה ידני (הלקוח יראה את זה מהבוט)..." 
              className="flex-1 bg-[#2a3942] rounded-xl p-3 px-5 outline-none border border-white/5 focus:border-emerald-500 transition-all text-sm"
            />
            <button 
              type="submit"
              className="bg-emerald-600 p-3 px-6 rounded-xl hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
