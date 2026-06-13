// src/components/CyberWorkspacePanel.tsx
import React, { useState } from 'react';
import { TaskItem, UrgencyLevel } from '../types';
import { CyberControlHeader } from './CyberControlHeader';
import { CyberTaskCard } from './CyberTaskCard';
import { suggestCategory, CategoryType } from '../utils/categoryMatcher';
import { Sparkles, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CyberWorkspacePanelProps {
  initialTasks: TaskItem[];
  onToggleCompleteTask: (taskId: string) => void;
  onAddTask: (
    title: string,
    notes: string,
    deadline: string,
    urgency: UrgencyLevel,
    recurring: string,
    syncToCal: boolean,
    project?: string,
    category?: 'Work' | 'Personal' | 'Urgent' | 'Focus' | 'Learning' | 'Admin' | 'General' | 'Engineering' | 'Academic' | 'Gaming'
  ) => void;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
}

const SEVERITY_WEIGHTS: Record<UrgencyLevel, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

export const CyberWorkspacePanel: React.FC<CyberWorkspacePanelProps> = ({ 
  initialTasks,
  onToggleCompleteTask,
  onAddTask,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = externalSetSearchQuery !== undefined ? externalSetSearchQuery : setLocalSearchQuery;
  const [sortBy, setSortBy] = useState<'date' | 'urgency'>('date');

  // Task creation states with real-time suggestion preview
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newUrgency, setNewUrgency] = useState<UrgencyLevel>('MEDIUM');
  const [newProject, setNewProject] = useState('Default Workspace');
  const [showAddForm, setShowAddForm] = useState(false);

  // Auto category matches in real-time as user types
  const predictedCategory = suggestCategory(newTitle);

  // Sorting configurations
  const sortedTasks = [...initialTasks].sort((a, b) => {
    if (sortBy === 'date') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else {
      return SEVERITY_WEIGHTS[b.urgency] - SEVERITY_WEIGHTS[a.urgency];
    }
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Pass the predicted category directly to the core tasks workspace!
    onAddTask(
      newTitle,
      newNotes,
      newDeadline || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      newUrgency,
      'none',
      true,
      newProject,
      predictedCategory as any
    );

    // Reset fields
    setNewTitle('');
    setNewNotes('');
    setNewDeadline('');
    setNewUrgency('MEDIUM');
    setNewProject('Default Workspace');
    setShowAddForm(false);
  };

  const getCategoryStyles = (tag: string) => {
    switch (tag) {
      case 'Engineering': return 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400';
      case 'Academic': return 'bg-indigo-950/40 border-indigo-500/40 text-indigo-400';
      case 'Gaming': return 'bg-fuchsia-950/40 border-fuchsia-500/40 text-fuchsia-400';
      case 'Work': return 'bg-blue-950/40 border-blue-500/40 text-blue-400';
      case 'Personal': return 'bg-teal-950/40 border-teal-500/40 text-teal-400';
      case 'Urgent': return 'bg-red-950/40 border-red-500/40 text-red-400';
      case 'Focus': return 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400';
      case 'Learning': return 'bg-amber-950/40 border-amber-500/40 text-amber-500';
      case 'Admin': return 'bg-orange-950/40 border-orange-500/40 text-orange-400';
      default: return 'bg-zinc-900 border-zinc-850 text-zinc-500';
    }
  };

  return (
    <div className="w-full space-y-5 text-left" id="cyber-workspace-panel">
      
      {/* Top dashboard summary header & trigger controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl">
        <div className="text-left">
          <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            Glassmorphic Interactive Deck
          </h4>
          <p className="text-[11px] text-zinc-400 leading-normal max-w-xl font-sans">
            Complete high-performance cockpit loaded. Features the Ghost Filter opacity engine and custom Glow Matrix urgency states. Try searching for terms like "bug" or "notes".
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 hover:scale-[1.02] text-black font-extrabold rounded-lg text-xs font-mono transition-all duration-200 shadow-lg cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? 'Deactivate Deployer' : 'Express Task Deployer'}
        </button>
      </div>

      {/* Embedded on-the-fly category matches creation form overlay */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateTask}
            className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-4 text-left overflow-hidden bg-zinc-950/90 backdrop-blur-md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 font-sans">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide">Task Subject Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., prismodb client fix or math syllabus review..."
                  className="w-full text-xs p-2.5 bg-zinc-900 border border-zinc-805 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
                
                {/* On-The-Fly Regex Category Predictor Banner */}
                {newTitle.trim() && (
                  <div className="flex items-center gap-2 mt-2 p-1 px-2.5 bg-zinc-900/50 border border-zinc-900 rounded-md w-fit">
                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 font-bold">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" /> Pattern Match Predictor:
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono border border-zinc-800 ${getCategoryStyles(predictedCategory)}`}>
                      {predictedCategory}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide">Active Project Scope</label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="Default Workspace"
                  className="w-full text-xs font-mono p-2.5 bg-zinc-900 border border-zinc-805 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide">Takeaway Content / Notes</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Specify brief action guidelines..."
                  className="w-full text-xs p-2.5 bg-zinc-900 border border-zinc-805 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide">Timeline Target Date</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 bg-zinc-900 border border-zinc-805 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide">Urgency Level Matrix</label>
                <select
                  value={newUrgency}
                  onChange={(e) => setNewUrgency(e.target.value as UrgencyLevel)}
                  className="w-full text-xs font-mono p-2.5 bg-zinc-900 border border-zinc-805 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="LOW">LOW PRIORITY</option>
                  <option value="MEDIUM">MEDIUM PRIORITY</option>
                  <option value="HIGH">HIGH PRIORITY</option>
                  <option value="URGENT">🔴 URGENT PRIORITY</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-900">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                Deploy Sync Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Integrated Unified Control Header with Search & Sorting */}
      <CyberControlHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Cyber Task Deck Display Output Layout with Ghost Filtering Opacity */}
      <div className="grid grid-cols-1 gap-3.5">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map((task) => {
            // GHOST FILTER CORE MAPPING LOGIC
            const cleanQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = 
              task.title.toLowerCase().includes(cleanQuery) || 
              (task.notes && task.notes.toLowerCase().includes(cleanQuery)) ||
              (task.project || '').toLowerCase().includes(cleanQuery) ||
              (task.category || '').toLowerCase().includes(cleanQuery);
            
            // If there's a search term and this card DOES NOT match, flag it as a ghost record (opacity 10%)
            const isGhost = cleanQuery.length > 0 && !matchesSearch;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <CyberTaskCard
                  task={task}
                  isGhost={isGhost}
                  onToggleComplete={onToggleCompleteTask}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sortedTasks.length === 0 && (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
            <p className="text-xs text-zinc-500 font-mono font-bold uppercase tracking-wider">No active workspace records found.</p>
          </div>
        )}
      </div>

    </div>
  );
};
