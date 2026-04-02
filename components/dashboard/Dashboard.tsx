'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CustomerIdentity } from '@/types';
import { CustomerList } from './CustomerList';
import { Infrastructure } from './Infrastructure';
import { ChatWindow } from '../chat/ChatWindow';

// טעינה דינמית של ה-AI STUDIO החדש כדי למנוע כפילויות ושגיאות Build
const SabanAIStudio = dynamic(() => import('../../pages/admin/ai'), { 
  ssr: false,
  loading: () => <div className="p-10 text-emerald-500/20 animate-pulse font-black text-xs uppercase">Loading Saban AI...</div>
});

export const Dashboard: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'infrastructure'>('chat');

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden" dir="rtl">
      {/* Header יוקרתי וממוקד */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/80 flex justify-between items-center shadow-2xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <h1 className="text-white font-black tracking-tighter text-xl italic">SABAN HUB <span className="text-emerald-500 not-italic ml-1">v2.1</span></h1>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
           <button 
             onClick={() => setActiveTab('chat')}
             className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             Chat & Operations
           </button>
           <button 
             onClick={() => setActiveTab('infrastructure')}
             className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'infrastructure' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             Infrastructure
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* צד ימין: רשימת לקוחות (רוחב קבוע) */}
        <aside className="w-80 border-l border-white/5 bg-[#020617] z-20 shadow-xl">
          <CustomerList
            selectedCustomerId={selectedCustomer?.id}
            onSelectCustomer={setSelectedCustomer}
          />
        </aside>

        {/* מרכז: חלון הצ'אט המרכזי */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#020617] border-l border-white/5 relative">
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'chat' ? (
              <ChatWindow customerId={selectedCustomer?.id} />
            ) : (
              <Infrastructure />
            )}
          </div>
        </main>

        {/* צד שמאל: ה-AI STUDIO החדש (הממשק מ-/admin/ai) */}
        <aside className="w-[420px] border-r border-white/5 bg-[#0f172a]/40 backdrop-blur-xl overflow-y-auto custom-scrollbar shadow-inner z-20">
          <div className="p-1 h-full">
             {/* הממשק החדש של המוח נטען כאן */}
             <SabanAIStudio /> 
          </div>
        </aside>
      </div>

      {/* עיצוב סקרולר עדין */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
      `}</style>
    </div>
  );
};
