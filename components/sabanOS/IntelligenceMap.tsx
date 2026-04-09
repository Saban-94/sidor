import React, { useCallback } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Background,
  Controls,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

// עיצוב צומת (Node) בסגנון Windows 11 Mica / NotebookLM
const nodeStyle = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  borderRadius: '16px',
  padding: '12px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  color: '#1e293b',
  width: 180,
  fontSize: '13px',
  fontWeight: '600',
  textAlign: 'center' as const,
};

const initialNodes = [
  { 
    id: 'root', 
    data: { label: '🏠 ח. סבן - מרכז פתרונות' }, 
    position: { x: 250, y: 0 }, 
    style: { ...nodeStyle, background: '#10b981', color: '#fff', border: 'none' } 
  },
  { id: '1', data: { label: '💧 מחלקת איטום' }, position: { x: 50, y: 100 }, style: nodeStyle },
  { id: '2', data: { label: '🧱 חומרי בניין' }, position: { x: 450, y: 100 }, style: nodeStyle },
  { id: '3', data: { label: 'סיקה 107' }, position: { x: 0, y: 200 }, style: nodeStyle },
  { id: '4', data: { label: 'מפרט טכני (PDF)' }, position: { x: 100, y: 250 }, style: { ...nodeStyle, width: 120, fontSize: '10px' } },
];

const initialEdges = [
  { 
    id: 'e-root-1', source: 'root', target: '1', 
    animated: true, 
    style: { stroke: '#10b981', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
  },
  { id: 'e-root-2', source: 'root', target: '2', style: { stroke: '#cbd5e1' } },
  { id: 'e-1-3', source: '1', target: '3', style: { stroke: '#10b981' } },
  { id: 'e-3-4', source: '3', target: '4', label: 'לחץ לצפייה', style: { strokeDasharray: '5,5' } },
];

export default function SabanIntelligenceMap() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[500px] bg-[#f8fafc] rounded-[24px] border border-white overflow-hidden shadow-inner relative" dir="ltr">
      {/* כותרת AI בסטייל NotebookLM */}
      <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-100 flex items-center gap-2 shadow-sm">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">AI Mind Map Mode</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls showInteractive={false} className="bg-white border-none shadow-lg rounded-xl" />
      </ReactFlow>
    </div>
  );
}
