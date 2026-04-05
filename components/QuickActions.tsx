import React from 'react';

const QUICK_QUERIES = [
  { label: 'הזמנת חומרי בניין', icon: '🏗️', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { label: 'הצבת מכולה 8 קוב', icon: '♻️', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { label: 'ייעוץ טכני ומוצרים', icon: '🎓', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { label: 'צריך עזרה מנציג', icon: '👤', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
];

interface QuickActionsProps {
  onActionClick: (label: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 w-full max-w-md mx-auto">
      {QUICK_QUERIES.map((query) => (
        <button
          key={query.label}
          onClick={() => onActionClick(query.label)}
          className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all active:scale-95 hover:bg-opacity-20 ${query.color}`}
        >
          <span className="text-xl">{query.icon}</span>
          <span className="text-sm font-medium leading-tight">{query.label}</span>
        </button>
      ))}
    </div>
  );
};
