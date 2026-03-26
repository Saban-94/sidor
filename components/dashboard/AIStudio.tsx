'use client';

import React, { useState, useEffect } from 'react';
import { AIBehaviorRules, SuccessMetrics } from '@/types';
import { database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AIStudioProps {
  customerId?: string;
}

export const AIStudio: React.FC<AIStudioProps> = ({ customerId }) => {
  const [rules, setRules] = useState<AIBehaviorRules | null>(null);
  const [metrics, setMetrics] = useState<SuccessMetrics | null>(null);
  const [dnaRules, setDnaRules] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [responseStyle, setResponseStyle] = useState<'formal' | 'casual' | 'professional' | 'creative'>('professional');
  const [temperature, setTemperature] = useState(0.7);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'dna' | 'metrics'>('identity');

  useEffect(() => {
    if (!customerId) return;

    const loadRules = async () => {
      try {
        const rulesRef = ref(database, `ai-rules/${customerId}`);
        const snapshot = await get(rulesRef);
        if (snapshot.exists()) {
          const data = snapshot.val() as AIBehaviorRules;
          setRules(data);
          setDnaRules(data.dnaRules || '');
          setSystemPrompt(data.systemPrompt || '');
          setResponseStyle(data.responseStyle || 'professional');
          setTemperature(data.temperature || 0.7);
        }

        const metricsRef = ref(database, `success-metrics/${customerId}`);
        const metricsSnapshot = await get(metricsRef);
        if (metricsSnapshot.exists()) {
          setMetrics(metricsSnapshot.val() as SuccessMetrics);
        }
      } catch (error) {
        console.error('[v0] Error loading AI rules:', error);
      }
    };

    loadRules();
  }, [customerId]);

  const handleSaveRules = async () => {
    if (!customerId) return;

    setSaving(true);
    try {
      const timestamp = Date.now();
      const newRules: AIBehaviorRules = {
        id: rules?.id || `rule-${timestamp}`,
        customerId,
        systemPrompt,
        dnaRules,
        temperature,
        maxTokens: 1024,
        responseStyle,
        createdAt: rules?.createdAt || timestamp,
        updatedAt: timestamp,
      };

      const rulesRef = ref(database, `ai-rules/${customerId}`);
      await set(rulesRef, newRules);
      setRules(newRules);
      console.log('[v0] AI rules saved successfully');
    } catch (error) {
      console.error('[v0] Error saving AI rules:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-saban-slate border-l border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">AI Studio</h2>
        <p className="text-saban-muted text-xs mt-1">Configure AI behavior and DNA rules</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['identity', 'dna', 'metrics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === tab
                ? 'text-saban-emerald border-saban-emerald'
                : 'text-saban-muted border-transparent hover:text-white'
            }`}
          >
            {tab === 'identity' && 'Identity'}
            {tab === 'dna' && 'DNA'}
            {tab === 'metrics' && 'Metrics'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'identity' && (
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full h-24 px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm font-mono placeholder-saban-muted focus:border-saban-emerald transition resize-none"
                placeholder="Define the AI system prompt..."
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Response Style</label>
              <select
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value as any)}
                className="w-full px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm focus:border-saban-emerald transition"
              >
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
                <option value="creative">Creative</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Temperature: {temperature.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-saban-muted text-xs mt-1">Controls randomness (0=deterministic, 1=creative)</p>
            </div>
          </div>
        )}

        {activeTab === 'dna' && (
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">AI DNA Rules</label>
              <textarea
                value={dnaRules}
                onChange={(e) => setDnaRules(e.target.value)}
                className="w-full h-64 px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm font-mono placeholder-saban-muted focus:border-saban-emerald transition resize-none"
                placeholder="Enter DNA rules for AI behavior injection...
Example:
- Always be helpful
- Ask for clarification when needed
- Maintain context from previous messages"
              />
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {metrics ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-saban-dark/50 p-3 rounded">
                    <p className="text-saban-muted text-xs">Total Messages</p>
                    <p className="text-white text-xl font-bold">{metrics.totalMessages}</p>
                  </div>
                  <div className="bg-saban-dark/50 p-3 rounded">
                    <p className="text-saban-muted text-xs">Delivered</p>
                    <p className="text-saban-emerald text-xl font-bold">{metrics.deliveredMessages}</p>
                  </div>
                  <div className="bg-saban-dark/50 p-3 rounded">
                    <p className="text-saban-muted text-xs">Avg Response</p>
                    <p className="text-white text-xl font-bold">{metrics.responseTime}ms</p>
                  </div>
                  <div className="bg-saban-dark/50 p-3 rounded">
                    <p className="text-saban-muted text-xs">Automation Rate</p>
                    <p className="text-saban-blue text-xl font-bold">{metrics.automationRate}%</p>
                  </div>
                </div>

                {metrics.peakHourActivity && metrics.peakHourActivity.length > 0 && (
                  <div className="bg-saban-dark/30 p-3 rounded">
                    <p className="text-white text-sm font-medium mb-3">Activity by Hour</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={metrics.peakHourActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" />
                        <XAxis dataKey="hour" stroke="#94A3B8" />
                        <YAxis stroke="#94A3B8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #94A3B8' }} />
                        <Line type="monotone" dataKey="count" stroke="#00A884" dot={{ fill: '#00A884' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <p className="text-saban-muted text-sm">No metrics available yet</p>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {activeTab !== 'metrics' && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="w-full px-4 py-2 bg-saban-emerald text-saban-dark font-medium rounded-lg hover:bg-saban-emerald/90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};
