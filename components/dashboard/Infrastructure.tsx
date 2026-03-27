// הוספת חלק הצגת הלקוחות בתוך Infrastructure.tsx
<div className="mt-8 bg-saban-surface rounded-3xl border border-white/5 p-6">
  <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
    <Database size={16} className="text-saban-emerald" /> 
    Active Sync Status
  </h2>
  <div className="overflow-x-auto">
    <table className="w-full text-right">
      <thead>
        <tr className="text-[10px] uppercase opacity-40 border-b border-white/5">
          <th className="pb-3 px-4">לקוח</th>
          <th className="pb-3 px-4">סטטוס מוח</th>
          <th className="pb-3 px-4">פעולות</th>
        </tr>
      </thead>
      <tbody className="text-xs">
        {syncData.map((c: any) => (
          <tr key={c.phone} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
            <td className="py-4 px-4 font-bold">{c.customer}</td>
            <td className="py-4 px-4">
              {c.brain_memory ? (
                <span className="text-saban-emerald flex items-center gap-1">
                  <Zap size={10} /> Syncing
                </span>
              ) : (
                <span className="text-amber-500 opacity-60 italic">No Memory Data</span>
              )}
            </td>
            <td className="py-4 px-4 text-left">
              <button className="text-[10px] font-black uppercase text-saban-emerald hover:underline">
                Inject Context
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
