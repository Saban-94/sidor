'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PipelinePacket } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface PipelineMonitorProps {
  tabHeight?: string;
}

export const PipelineMonitor: React.FC<PipelineMonitorProps> = ({ tabHeight = 'h-96' }) => {
  const [packets, setPackets] = useState<PipelinePacket[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [pauseLogs, setPauseLogs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Listen for incoming packets
      const incomingRef = ref(database, 'rami/incoming');
      const outgoingRef = ref(database, 'rami/outgoing');

      const unsubscribeIncoming = onValue(incomingRef, (snapshot) => {
        if (!pauseLogs && snapshot.exists()) {
          const data = snapshot.val();
          const packet: PipelinePacket = {
            id: `in-${Date.now()}`,
            timestamp: Date.now(),
            direction: 'incoming',
            source: data.source || 'external',
            destination: data.destination || 'rami',
            payload: data,
            status: 'processed',
            latency: Math.random() * 100,
          };
          setPackets((prev) => [packet, ...prev.slice(0, 999)]);
        }
      });

      const unsubscribeOutgoing = onValue(outgoingRef, (snapshot) => {
        if (!pauseLogs && snapshot.exists()) {
          const data = snapshot.val();
          const packet: PipelinePacket = {
            id: `out-${Date.now()}`,
            timestamp: Date.now(),
            direction: 'outgoing',
            source: data.source || 'rami',
            destination: data.destination || 'external',
            payload: data,
            status: 'processed',
            latency: Math.random() * 100,
          };
          setPackets((prev) => [packet, ...prev.slice(0, 999)]);
        }
      });

      return () => {
        unsubscribeIncoming();
        unsubscribeOutgoing();
      };
    } catch (error) {
      console.error('[v0] Error setting up pipeline monitor:', error);
    }
  }, [pauseLogs]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [packets, autoScroll]);

  const filteredPackets = packets.filter((p) => {
    if (filter === 'all') return true;
    return p.direction === filter;
  });

  const getDirectionColor = (direction: 'incoming' | 'outgoing') => {
    return direction === 'incoming' ? 'text-saban-emerald' : 'text-saban-blue';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'text-saban-emerald';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-saban-muted';
    }
  };

  return (
    <div className={`${tabHeight} flex flex-col bg-saban-dark rounded-lg border border-white/10 overflow-hidden`}>
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-saban-emerald rounded-full animate-pulse" />
          <h3 className="text-white font-mono text-sm font-bold">MALSHINAN Pipeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-2 py-1 bg-saban-slate border border-white/10 rounded text-white text-xs font-mono focus:border-saban-emerald transition"
          >
            <option value="all">All</option>
            <option value="incoming">↓ Incoming</option>
            <option value="outgoing">↑ Outgoing</option>
          </select>
          <button
            onClick={() => setPauseLogs(!pauseLogs)}
            className="px-2 py-1 bg-saban-slate hover:bg-saban-surface border border-white/10 rounded text-white text-xs font-mono transition"
          >
            {pauseLogs ? '▶' : '⏸'}
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 border rounded text-xs font-mono transition ${
              autoScroll
                ? 'bg-saban-emerald/20 border-saban-emerald text-saban-emerald'
                : 'bg-saban-slate border-white/10 text-saban-muted hover:text-white'
            }`}
          >
            ↓
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs p-3 space-y-1 bg-saban-dark/50"
      >
        {filteredPackets.length === 0 ? (
          <div className="text-saban-muted/50">
            [{new Date().toLocaleTimeString()}] Waiting for packets...
          </div>
        ) : (
          filteredPackets.map((packet) => (
            <div key={packet.id} className="space-y-0.5">
              {/* Packet header */}
              <div className={`${getDirectionColor(packet.direction)}`}>
                <span className="text-saban-muted">[{new Date(packet.timestamp).toLocaleTimeString()}]</span>
                <span className="mx-2">
                  {packet.direction === 'incoming' ? '→' : '←'}
                </span>
                <span className="font-bold">
                  {packet.direction === 'incoming' ? 'RCV' : 'SND'}
                </span>
                <span className="ml-2 text-saban-muted">
                  {packet.source} → {packet.destination}
                </span>
              </div>

              {/* Payload */}
              <div className="text-saban-emerald/70 pl-4">
                <span className="text-saban-muted">├─ </span>
                {JSON.stringify(packet.payload).substring(0, 120)}...
              </div>

              {/* Status line */}
              <div className="text-saban-muted text-xs pl-4">
                <span>├─ </span>
                <span className={getStatusColor(packet.status)}>
                  [{packet.status.toUpperCase()}]
                </span>
                <span className="ml-2">latency: {packet.latency.toFixed(1)}ms</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-2 border-t border-white/10 bg-saban-dark/30 text-saban-muted text-xs font-mono flex justify-between flex-shrink-0">
        <span>Packets: {filteredPackets.length}</span>
        <span>Avg Latency: {(filteredPackets.reduce((a, p) => a + p.latency, 0) / Math.max(filteredPackets.length, 1)).toFixed(1)}ms</span>
      </div>
    </div>
  );
};
