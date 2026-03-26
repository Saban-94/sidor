'use client';

import React, { useState, useEffect } from 'react';
import { InfrastructureConfig } from '@/types';
import { database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

export const Infrastructure: React.FC = () => {
  const [config, setConfig] = useState<InfrastructureConfig>({
    rtdbUrl: 'https://saban-os-default-rtdb.firebaseio.com',
    callbackUrls: ['https://webhook.example.com/callback'],
    messageThrottle: 100,
    heartbeatInterval: 30000,
    enableMonitoring: true,
    logLevel: 'info',
  });

  const [newCallbackUrl, setNewCallbackUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<{
    connected: boolean;
    latency: number;
    lastHeartbeat: number;
  }>({
    connected: true,
    latency: 12,
    lastHeartbeat: Date.now(),
  });

  useEffect(() => {
    loadConfig();
    monitorConnection();
  }, []);

  const loadConfig = async () => {
    try {
      const configRef = ref(database, 'infrastructure-config');
      const snapshot = await get(configRef);
      if (snapshot.exists()) {
        setConfig(snapshot.val() as InfrastructureConfig);
      }
    } catch (error) {
      console.error('[v0] Error loading infrastructure config:', error);
    }
  };

  const monitorConnection = () => {
    const interval = setInterval(() => {
      setConnectionHealth({
        connected: Math.random() > 0.1,
        latency: Math.random() * 50 + 5,
        lastHeartbeat: Date.now(),
      });
    }, config.heartbeatInterval);

    return () => clearInterval(interval);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const configRef = ref(database, 'infrastructure-config');
      await set(configRef, config);
      console.log('[v0] Infrastructure config saved');
    } catch (error) {
      console.error('[v0] Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCallbackUrl = () => {
    if (newCallbackUrl.trim()) {
      setConfig({
        ...config,
        callbackUrls: [...config.callbackUrls, newCallbackUrl],
      });
      setNewCallbackUrl('');
    }
  };

  const handleRemoveCallbackUrl = (index: number) => {
    setConfig({
      ...config,
      callbackUrls: config.callbackUrls.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="h-full flex flex-col bg-saban-slate rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white mb-2">Infrastructure Controls</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionHealth.connected ? 'bg-saban-emerald' : 'bg-red-500'}`} />
          <span className="text-saban-muted text-sm">
            {connectionHealth.connected ? 'Connected' : 'Disconnected'} • Latency: {connectionHealth.latency.toFixed(1)}ms
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Network Configuration */}
        <section>
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <span className="text-saban-emerald">⚙</span> Network Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-saban-muted text-sm mb-2">RTDB URL</label>
              <input
                type="text"
                value={config.rtdbUrl}
                onChange={(e) => setConfig({ ...config, rtdbUrl: e.target.value })}
                className="w-full px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm focus:border-saban-emerald transition font-mono"
              />
            </div>

            <div>
              <label className="block text-saban-muted text-sm mb-2">
                Message Throttle (ms): {config.messageThrottle}
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={config.messageThrottle}
                onChange={(e) =>
                  setConfig({ ...config, messageThrottle: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-saban-muted text-sm mb-2">
                Heartbeat Interval (ms): {config.heartbeatInterval}
              </label>
              <input
                type="range"
                min="5000"
                max="60000"
                step="5000"
                value={config.heartbeatInterval}
                onChange={(e) =>
                  setConfig({ ...config, heartbeatInterval: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-saban-muted text-sm mb-2">Log Level</label>
              <select
                value={config.logLevel}
                onChange={(e) =>
                  setConfig({ ...config, logLevel: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm focus:border-saban-emerald transition"
              >
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>
        </section>

        {/* Callback URLs */}
        <section>
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <span className="text-saban-blue">🔗</span> Callback URLs
          </h3>
          <div className="space-y-2">
            {config.callbackUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...config.callbackUrls];
                    newUrls[index] = e.target.value;
                    setConfig({ ...config, callbackUrls: newUrls });
                  }}
                  className="flex-1 px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm focus:border-saban-emerald transition font-mono"
                />
                <button
                  onClick={() => handleRemoveCallbackUrl(index)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded border border-red-500/30 transition"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Add new callback URL */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newCallbackUrl}
                onChange={(e) => setNewCallbackUrl(e.target.value)}
                placeholder="https://webhook.example.com/callback"
                className="flex-1 px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm placeholder-saban-muted focus:border-saban-emerald transition font-mono"
              />
              <button
                onClick={handleAddCallbackUrl}
                className="px-3 py-2 bg-saban-emerald/20 text-saban-emerald hover:bg-saban-emerald/30 rounded border border-saban-emerald/30 transition"
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* Monitoring */}
        <section>
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <span className="text-yellow-500">📊</span> Monitoring
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableMonitoring}
              onChange={(e) =>
                setConfig({ ...config, enableMonitoring: e.target.checked })
              }
              className="w-4 h-4 accent-saban-emerald"
            />
            <span className="text-white">Enable Real-time Monitoring</span>
          </label>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-saban-emerald text-saban-dark font-medium rounded-lg hover:bg-saban-emerald/90 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={loadConfig}
          className="flex-1 px-4 py-2 bg-saban-slate border border-white/20 text-white font-medium rounded-lg hover:border-white/40 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
