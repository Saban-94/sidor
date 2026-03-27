'use client';

import React, { useState } from 'react';
// ייבוא טיפוסים
import { CustomerIdentity } from '@/types';
// ייבוא רכיבי הלוח
import { CustomerList } from './CustomerList';
import { AIStudio } from './AIStudio';
import { PipelineMonitor } from './PipelineMonitor';
import { Infrastructure } from './Infrastructure';
// ייבוא רכיב הצ'אט (לוודא שהנתיב תואם לתיקיית chat)
import { ChatWindow } from '../chat/ChatWindow';

/**
 * SABAN HUB - Main Dashboard Console
 * מרכז הבקרה המאוחד לניהול לקוחות, ניטור הצינור ותשתית ה-AI.
 */
export const Dashboard: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'pipeline' | 'infrastructure'>('chat');

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden font-sans antialiased" dir="rtl">
      
      {/* Top Header - SABAN HUB BRAND */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-[#020617] font-black text-xl italic">S</span>
          </div>
          <div>
            <h1 className="text-white font-black text-lg tracking-tighter">SABAN <span className="text-emerald-500">HUB</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">AI Customer Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Core Connected
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-[#020617]">
        
        {/* Right Panel: Customer List (החלפתי צד בגלל ה-RTL) */}
        <aside className="w-80 border-l border-white/5 bg-[#0f172a]/30">
          <CustomerList
            selectedCustomerId={selectedCustomer?.id}
            onSelectCustomer={setSelectedCustomer}
          />
        </aside>

        {/* Center Panel: Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#020617]">
          
          {/* Custom Tab Navigation */}
          <nav className="flex border-b border-white/5 bg-[#0f172a]/50">
            {(['chat', 'pipeline', 'infrastructure'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 font-black text-xs uppercase tracking-[0.15em] transition-all relative ${
                  activeTab === tab
                    ? 'text-emerald-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'chat' && '💬 Chat Monitor'}
                {tab === 'pipeline' && '🔌 AI Pipeline'}
                {tab === 'infrastructure' && '⚙️ Infrastructure'}
                
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Dynamic Content Rendering */}
          <section className="flex-1 overflow-hidden">
            <div className="h-full w-full">
              {activeTab === 'chat' && (
                <ChatWindow customerId={selectedCustomer?.id} />
              )}

              {activeTab === 'pipeline' && (
                <div className="h-full p-6">
                  <PipelineMonitor tabHeight="h-full" />
                </div>
              )}

              {activeTab === 'infrastructure' && (
                <Infrastructure />
              )}
            </div>
          </section>
        </main>

        {/* Left Panel: AI Agent Studio */}
        <aside className="w-[400px] border-r border-white/5 bg-[#0f172a]/30">
          <AIStudio customerId={selectedCustomer?.id} />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
