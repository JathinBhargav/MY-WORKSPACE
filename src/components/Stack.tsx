import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimationControls } from 'motion/react';
import { TaskItem } from '../types';
import { AlertCircle, Calendar, Folder, Check, ArrowRight } from 'lucide-react';

interface StackProps {
  tasks: TaskItem[];
  onToggleCompleteTask: (taskId: string) => void;
  onTriggerLog?: (title: string, code: number, desc: string, type: string) => void;
}

// Low-profile high-fidelity sound effect using Web Audio API
const playPopSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Low quiet punchy pop
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (err) {
    console.warn("Failed to play audio pop:", err);
  }
};

const Stack: React.FC<StackProps> = ({ tasks, onToggleCompleteTask, onTriggerLog }) => {
  // We only show pending high/urgent priority tasks in this deck
  const activeTasks = tasks.filter(t => t.status === 'pending' && (t.urgency === 'URGENT' || t.urgency === 'HIGH'));
  const [topIndex, setTopIndex] = useState(0);

  // If there are tasks, let's keep track of our target
  const currentTask = activeTasks[topIndex];

  // Motion values for the top card drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transformations for dynamic rotation and opacity as you slide
  const rotate = useTransform(x, [-180, 180], [-12, 12]);
  const opacity = useTransform(x, [-180, -120, 0, 120, 180], [0.4, 0.85, 1, 0.85, 0.4]);
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95]);

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = 130;
    
    if (Math.abs(info.offset.x) > threshold) {
      // Completed / Swipe Dismissed!
      const dismissedTask = currentTask;
      if (dismissedTask) {
        // Play Pop!
        playPopSound();
        
        if (onTriggerLog) {
          onTriggerLog(
            "Task Swiped to Completion", 
            202, 
            `Dismissed "${dismissedTask.title}" via interactive fluid card gesture stack. Sync pipeline starting...`, 
            "success"
          );
        }
        
        // Trigger completion callback
        onToggleCompleteTask(dismissedTask.id);
        
        // Advance deck
        setTopIndex(prev => prev + 1);
      }
    }
    
    // Reset motion value positions
    x.set(0);
    y.set(0);
  };

  if (!currentTask || topIndex >= activeTasks.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/25 border border-dashed border-zinc-850 rounded-2xl text-center h-[280px]">
        <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
          <Check className="h-5 w-5 text-amber-500" />
        </div>
        <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-widest mb-1">Queue Handled</h4>
        <p className="text-[11px] text-zinc-500 max-w-[240px]">
          All active high priority items swiped. Your workspace focuses cleanly. No pending blockers remain in cache list.
        </p>
      </div>
    );
  }

  // Preview the next task card in the background for visual stacking depth
  const nextTask = activeTasks[topIndex + 1];

  return (
    <div className="relative w-full h-[280px] flex items-center justify-center select-none overflow-visible py-4 bg-zinc-950/20 rounded-2xl border border-zinc-900">
      
      {/* Background card preview (depth effect) */}
      {nextTask && (
        <div 
          className="absolute w-[92%] sm:w-[86%] h-[200px] bg-zinc-900 pb-4 pt-5 px-5 border border-zinc-800/65 rounded-2xl flex flex-col justify-between text-left pointer-events-none opacity-40 shadow-md"
          style={{
            transform: 'translateY(12px) scale(0.94) rotate(-1.5deg)',
            zIndex: 10,
            transition: 'transform 0.3s'
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700/50">
                UPCOMING ACTION
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            </div>
            <h5 className="text-xs font-semibold text-zinc-450 truncate line-clamp-1">
              {nextTask.title}
            </h5>
            <p className="text-[10px] text-zinc-500 line-clamp-2 truncate">
              {nextTask.notes || 'No description added.'}
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-850 pt-2 shrink-0">
            <span className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {nextTask.project || 'Default'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {nextTask.deadline}
            </span>
          </div>
        </div>
      )}

      {/* Main active top draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -220, right: 220 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ x, y, rotate, opacity, scale, zIndex: 20 }}
        whileDrag={{ cursor: 'grabbing', scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        className="absolute w-[94%] sm:w-[88%] h-[200px] bg-[#161616] border-2 border-amber-500/70 hover:border-amber-500 bg-[#1c1c1c] active:border-amber-400 rounded-3xl p-5 shadow-2xl flex flex-col justify-between text-left cursor-grab transition-colors"
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-amber-950/40 text-amber-400 rounded-md border border-amber-900/50 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 animate-pulse" />
              {currentTask.urgency} STATUS ASSIGNED
            </span>
            <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-0.5 select-none animate-pulse">
              Drag Right or Left to Complete
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide font-sans leading-tight">
              {currentTask.title}
            </h4>
            <p className="text-xs text-zinc-450 mt-1 line-clamp-2 select-none h-8 overflow-hidden text-ellipsis">
              {currentTask.notes || 'No description parameters defined in core sheet logs.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-zinc-850/60 pt-2.5 shrink-0 select-none">
          <span className="flex items-center gap-1.5 font-bold">
            <Folder className="h-3 w-3 text-amber-500" />
            {currentTask.project || 'Default Workspace'}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
            <Calendar className="h-3 w-3" />
            {currentTask.deadline}
          </span>
        </div>

        {/* Dynamic backdrop swipe guidance tags based on direction */}
        <motion.div 
          style={{ 
            opacity: useTransform(x, [0, 80], [0, 1]),
            rotate: 15
          }}
          className="absolute top-4 right-4 bg-emerald-500/90 text-black border border-emerald-400 font-mono text-[9px] font-bold py-1 px-2.5 rounded-md pointer-events-none uppercase tracking-wider"
        >
          COMPLETE
        </motion.div>
        
        <motion.div 
          style={{ 
            opacity: useTransform(x, [-80, 0], [1, 0]),
            rotate: -15
          }}
          className="absolute top-4 left-4 bg-emerald-500/90 text-black border border-emerald-400 font-mono text-[9px] font-bold py-1 px-2.5 rounded-md pointer-events-none uppercase tracking-wider"
        >
          COMPLETE
        </motion.div>
      </motion.div>
      
      {/* Visual background deck shadow base lines */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[85%] h-1 bg-zinc-950 border border-zinc-900 rounded-b-lg opacity-40 z-5" />
    </div>
  );
};

export default Stack;
