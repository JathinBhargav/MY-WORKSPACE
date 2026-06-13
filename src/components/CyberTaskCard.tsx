// src/components/CyberTaskCard.tsx
import React from 'react';
import { Clock, CheckSquare, Square, Folder, Sparkles } from 'lucide-react';
import { TaskItem, UrgencyLevel } from '../types';
import { suggestCategory, CategoryType } from '../utils/categoryMatcher';

interface TaskCardProps {
  task: TaskItem;
  isGhost: boolean; // Triggers the particle faded state
  onToggleComplete: (id: string) => void;
}

export const CyberTaskCard: React.FC<TaskCardProps> = ({ task, isGhost, onToggleComplete }) => {
  // Use existing category or suggest one on-the-fly based on titles
  const suggestedTag = (task.category as CategoryType) || suggestCategory(task.title);

  // Helper styles for the automatic category chip
  const getCategoryStyles = (tag: string) => {
    switch (tag) {
      case 'Engineering': return 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.06)]';
      case 'Academic': return 'bg-indigo-950/40 border-indigo-500/40 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.06)]';
      case 'Gaming': return 'bg-fuchsia-950/40 border-fuchsia-500/40 text-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.06)]';
      case 'Work': return 'bg-blue-950/40 border-blue-500/40 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.06)]';
      case 'Personal': return 'bg-teal-950/40 border-teal-500/40 text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.06)]';
      case 'Urgent': return 'bg-red-950/40 border-red-500/40 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.06)]';
      case 'Focus': return 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.06)]';
      case 'Learning': return 'bg-amber-950/40 border-amber-500/40 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.06)]';
      case 'Admin': return 'bg-orange-950/40 border-orange-500/40 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.06)]';
      default: return 'bg-zinc-900 border-zinc-800 text-zinc-500';
    }
  };

  const isCompleted = task.status === 'completed';

  return (
    <div
      id={`cyber-task-${task.id}`}
      className={`relative overflow-hidden bg-[#121214]/65 border border-zinc-900 rounded-xl p-4 transition-all duration-300 backdrop-blur-md ${
        isGhost 
          ? 'opacity-10 scale-[0.98] pointer-events-none filter blur-[0.5px] select-none border-zinc-950/20' 
          : isCompleted 
          ? 'opacity-40 border-zinc-900 hover:border-zinc-850'
          : 'opacity-100 scale-100 hover:border-amber-500/30 hover:bg-[#16161a]/85 hover:shadow-[0_0_20px_rgba(245,158,11,0.04)]'
      }`}
    >
      {/* AMBIENT GLOW MATRIX EDGE GAUGE */}
      {!isGhost && (
        <div className={`absolute left-0 top-0 h-full w-[3px] transition-all duration-300 ${
          isCompleted ? 'bg-zinc-800' :
          task.urgency === 'URGENT' ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' :
          task.urgency === 'HIGH' ? 'bg-orange-500 shadow-[0_0_12px_#f97316]' :
          task.urgency === 'MEDIUM' ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]' :
          'bg-zinc-700 shadow-[0_0_8px_rgba(113,113,122,0.1)]'
        }`} />
      )}

      <div className="flex items-start justify-between gap-3 pl-2.5">
        <div className="flex items-start gap-3.5 text-left flex-1 min-w-0">
          <button
            onClick={() => onToggleComplete(task.id)}
            className="mt-1.5 text-zinc-500 hover:text-amber-500 transition-colors cursor-pointer shrink-0"
            title={isCompleted ? "Mark pending" : "Mark completed"}
          >
            {isCompleted ? (
              <CheckSquare className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <Square className="w-5 h-5 shrink-0" />
            )}
          </button>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-sm font-semibold tracking-wide transition-colors duration-200 select-all pr-1 truncate ${
                isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100 group-hover:text-amber-400'
              }`}>
                {task.title}
              </h3>
              
              {/* Rule Suggested Category Chip Layout */}
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase font-mono ${getCategoryStyles(suggestedTag)}`}>
                {suggestedTag}
              </span>
            </div>

            {task.notes && (
              <p className={`text-xs font-normal leading-relaxed line-clamp-1 max-w-xl select-all ${
                isCompleted ? 'text-zinc-650' : 'text-zinc-400'
              }`}>
                {task.notes}
              </p>
            )}

            <div className="flex items-center gap-3 pt-0.5">
              <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5 font-bold">
                <Folder className="w-3 h-3 text-zinc-650 shrink-0" />
                {task.project || 'Default Workspace'}
              </span>
            </div>
          </div>
        </div>

        {/* Date Metadata Capsule Block */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold font-mono tracking-wider uppercase border border-zinc-900/60 ${
            isCompleted ? 'bg-zinc-950/50 text-zinc-500' :
            task.urgency === 'URGENT' ? 'bg-red-950/55 text-red-400 border-red-500/20' :
            task.urgency === 'HIGH' ? 'bg-orange-950/55 text-orange-400 border-orange-500/20' :
            task.urgency === 'MEDIUM' ? 'bg-blue-950/55 text-blue-400 border-blue-500/20' :
            'bg-zinc-900/50 text-zinc-400'
          }`}>
            {task.urgency}
          </span>

          <div className="flex items-center gap-1 bg-zinc-950/50 hover:bg-zinc-950/80 transition-colors px-2 py-1 rounded border border-zinc-900 font-mono text-[9.5px] font-semibold text-zinc-505">
            <Clock className="w-3 h-3 text-amber-500/60 shrink-0" />
            <span>
              {task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'ASAP'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
