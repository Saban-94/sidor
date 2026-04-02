'use client';

import React, { useState } from 'react';
import { CustomerIdentity } from '@/types';
import { CustomerList } from './CustomerList';
import SabanAIStudio from '../../pages/admin/ai';
import { SabanAIStudio } from '../../admin/SabanAIStudio'; 
import { Infrastructure } from './Infrastructure';
import { ChatWindow } from '../chat/ChatWindow';

export const Dashboard: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'infrastructure'>('chat');

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden" dir="rtl">
      {/* Header יוקרתי */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/80 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <h1 className="text-white font-black tracking-tighter text-xl">SABAN HUB <span className="text-emerald-500 text-xs font-normal">v2.0</span></h1>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setActiveTab('chat')}
             className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${activeTab === 'chat' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400'}`}
           >
             צ'אט ומבצעים
           </button>
           <button 
             onClick={() => setActiveTab('infrastructure')}
             className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${activeTab === 'infrastructure' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400'}`}
           >
             תשתיות ולוח
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* צד ימין: רשימת לקוחות */}
        <aside className="w-80 border-l border-white/5 bg-[#020617]">
          <CustomerList
            selectedCustomerId={selectedCustomer?.id}
            onSelectCustomer={setSelectedCustomer}
          />
        </aside>

        {/* מרכז: חלון הצ'אט עם הרקע המקובע */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatWindow customerId={selectedCustomer?.id} />
            ) : (
              <Infrastructure />
            )}
          </div>
        </main>

        {/* צד שמאל: ה-AI STUDIO המקצועי (הממשק מ-/admin/ai) */}
        <aside className="w-[450px] border-r border-white/5 bg-[#0f172a]/20 backdrop-blur-sm overflow-y-auto custom-scrollbar">
          {/* כאן אנחנו מזריקים את הממשק של ה-AI שביקשת */}
          <SabanAIStudio /> 
        </aside>
      </div>

      {/* סטייל לסקרולר */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};
