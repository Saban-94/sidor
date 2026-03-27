'use client';

import React, { useState } from 'react';
import { CustomerIdentity } from '@/types';
import { CustomerList } from './CustomerList';
import { AIStudio } from './AIStudio'; // ייבוא הרכיב המתוקן
import { Infrastructure } from './Infrastructure';
import { ChatWindow } from '../chat/ChatWindow';

export const Dashboard: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'infrastructure'>('chat');

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden" dir="rtl">
      <header className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/80 flex justify-between items-center">
        <h1 className="text-white font-black">SABAN HUB</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-l border-white/5">
          <CustomerList
            selectedCustomerId={selectedCustomer?.id}
            onSelectCustomer={setSelectedCustomer}
          />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? <ChatWindow customerId={selectedCustomer?.id} /> : <Infrastructure />}
          </div>
        </main>

        <aside className="w-[400px] border-r border-white/5 bg-[#0f172a]/30">
          {/* העברה בטוחה של ה-Prop - עכשיו TS יזהה אותו */}
          <AIStudio customerId={selectedCustomer?.id} />
        </aside>
      </div>
    </div>
  );
};
