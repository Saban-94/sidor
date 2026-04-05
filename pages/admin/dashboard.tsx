'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, Send, Truck, Users } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminControlPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState('');

  // שליפת נתונים
  const fetchData = async () => {
    const { data } = await supabase.from('customer_memory').select('*').order('updated_at', { ascending: false });
    if (data) setCustomers(data);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', table: 'customer_memory' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async () => {
    if (!adminMessage || !selectedCustomer) return;
    
    const newHistory = `${selectedCustomer.accumulated_knowledge}\n[ADMIN]: ${adminMessage}`;
    
    await supabase.from('customer_memory')
      .update({ accumulated_knowledge: newHistory })
      .eq('clientId', selectedCustomer.clientId);

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
        <div className="flex-1 overflow-y-auto">
          {customers.map(c => (
            <div 
              key={c.clientId} 
              onClick={() => setSelectedCustomer(c)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-all ${selectedCustomer?.clientId === c.clientId ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}
            >
              <div className="font-bold text-sm">{c.user_name || "אורח"}</div>
              <div className="text-[10px] text-slate-500">{c.clientId}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-[#0b141a]">
        <header className="h-16 bg-[#202c33] flex items-center px-6 border-b border-white/5">
          <span className="font-bold">{selectedCustomer?.user_name || "בחר לקוח למעקב"}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {selectedCustomer?.accumulated_knowledge.split('\n').filter(Boolean).map((line: string, i: number) => (
            <div key={i} className={`flex ${line.includes('[ADMIN]') ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-md p-3 rounded-xl text-sm ${line.includes('[ADMIN]') ? 'bg-blue-600' : 'bg-[#202c33]'}`}>
                {line.replace('[ADMIN]:', '')}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#111b21] border-t border-white/5">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input 
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="הודעה ידנית..." 
              className="flex-1 bg-[#2a3942] rounded-xl p-3 outline-none border border-white/5"
            />
            <button onClick={handleSend} className="bg-emerald-600 p-3 rounded-xl hover:bg-emerald-500 transition-all">
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
