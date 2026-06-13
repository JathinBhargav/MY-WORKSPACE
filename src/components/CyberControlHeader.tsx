// src/components/CyberControlHeader.tsx
import React from 'react';
import { Search, Calendar, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: 'date' | 'urgency';
  setSortBy: (value: 'date' | 'urgency') => void;
}

export const CyberControlHeader: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl backdrop-blur-md" id="cyber-control-header">
      
      {/* Search Input Layer with Reactive Amber Focus Glows */}
      <div className="relative w-full md:max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-zinc-505" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search encrypted workspace records..."
          className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 focus:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all text-sm font-sans"
        />
      </div>

      {/* Sorting Control Array Switches */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        <span className="text-[10px] text-zinc-500 tracking-widest font-bold mr-1 font-mono">SORT MATRIX</span>
        
        <button
          onClick={() => setSortBy('date')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
            sortBy === 'date'
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Timeline
        </button>

        <button
          onClick={() => setSortBy('urgency')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
            sortBy === 'urgency'
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Urgency (High → Low)
        </button>
      </div>

    </div>
  );
};
