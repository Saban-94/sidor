// שינוי מבנה ה-Sidebar והכפתורים
<nav className="w-20 lg:w-24 bg-slate-950 flex flex-col items-center py-8 gap-8 border-l border-slate-800 z-50">
  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:rotate-90">
    <Cpu className="text-white" size={24} />
  </div>
  
  <div className="flex flex-col gap-8 mt-10">
    {/* כפתור הזרקת חומרים */}
    <button onClick={() => setActiveTab('warehouse')} className={`group relative p-4 rounded-2xl transition-all ${activeTab === 'warehouse' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
      <Truck size={24} />
      <span className="absolute right-20 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">חומרים</span>
    </button>

    {/* כפתור הזרקת מכולות */}
    <button onClick={() => setActiveTab('containers')} className={`group relative p-4 rounded-2xl transition-all ${activeTab === 'containers' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
      <Box size={24} />
      <span className="absolute right-20 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">מכולות</span>
    </button>

    {/* כפתור העברות */}
    <button onClick={() => setActiveTab('all')} className={`group relative p-4 rounded-2xl transition-all ${activeTab === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
      <History size={24} />
      <span className="absolute right-20 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">הכל</span>
    </button>
  </div>
</nav>
