'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic'; // ייבוא כלי לטעינה דינמית
import { CustomerIdentity } from '@/types';
import { CustomerList } from './CustomerList';
import { Infrastructure } from './Infrastructure';
import { ChatWindow } from '../chat/ChatWindow';

// טעינה דינמית של ה-AI Studio ישירות מהדף שלו
const SabanAIStudio = dynamic(() => import('../../pages/admin/ai'), { 
  ssr: false,
  loading: () => <div className="p-10 text-white opacity-20">טוען מוח AI...</div>
});

export const Dashboard: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'infrastructure'>('chat');

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden" dir="rtl">
      {/* ... שאר הקוד של ה-Header ... */}
      
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-l border-white/5 bg-[#020617]">
          <CustomerList
            selectedCustomerId={selectedCustomer?.id}
            onSelectCustomer={setSelectedCustomer}
          />
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? <ChatWindow customerId={selectedCustomer?.id} /> : <Infrastructure />}
          </div>
        </main>

        <aside className="w-[450px] border-r border-white/5 bg-[#0f172a]/20 backdrop-blur-sm overflow-y-auto">
          {/* שימוש בקומפוננטה שנטענה דינמית */}
          <SabanAIStudio /> 
        </aside>
      </div>
    </div>
  );
};
