'use client';

import React, { useState } from 'react';
import { CustomerIdentity } from '@/types';
import { CustomerList } from './CustomerList';
import { ChatWindow } from '../chat/ChatWindow';
import { AIStudio } from './AIStudio';
import { PipelineMonitor } from './PipelineMonitor';
import { Infrastructure } from './Infrastructure';

export const Dashboard: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'pipeline' | 'infrastructure'>('chat');

  return (
    <div className="h-screen w-full bg-saban-dark flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-saban-slate flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-saban-emerald flex items-center justify-center">
            <span className="text-saban-dark font-bold text-lg">S</span>
          </div>
          <h1 className="text-white font-bold text-lg">SABAN HUB</h1>
          <span className="text-saban-muted text-xs ml-2">AI Customer Management</span>
        </div>
        <div className="flex items-center gap-3 text-saban-muted text-xs">
          <span>●</span>
          <span>Connected</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Customer List */}
        <div className="w-80 flex-shrink-0">
          <CustomerList
            selectedCustomerId={selectedCustomer?.id}
            onSelectCustomer={setSelectedCustomer}
          />
        </div>

        {/* Center Panel: Chat or Monitoring */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 bg-saban-slate">
            {(['chat', 'pipeline', 'infrastructure'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 font-medium text-sm transition border-b-2 ${
                  activeTab === tab
                    ? 'text-saban-emerald border-saban-emerald bg-saban-dark/50'
                    : 'text-saban-muted border-transparent hover:text-white'
                }`}
              >
                {tab === 'chat' && '💬 Chat'}
                {tab === 'pipeline' && '🔌 Pipeline (Malshinan)'}
                {tab === 'infrastructure' && '⚙️ Infrastructure'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-4">
            {activeTab === 'chat' && (
              <ChatWindow customerId={selectedCustomer?.id} />
            )}

            {activeTab === 'pipeline' && (
              <PipelineMonitor tabHeight="h-full" />
            )}

            {activeTab === 'infrastructure' && (
              <Infrastructure />
            )}
          </div>
        </div>

        {/* Right Panel: AI Studio */}
        <div className="w-96 flex-shrink-0">
          <AIStudio customerId={selectedCustomer?.id} />
        </div>
      </div>
    </div>
  );
};
