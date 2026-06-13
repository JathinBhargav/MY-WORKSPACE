import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Terminal, 
  Settings, 
  Mail, 
  Plus, 
  Check, 
  Calendar, 
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Sliders,
  LogOut,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskItem, EmailItem, CalendarEvent } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  emails: EmailItem[];
  calendarEvents: CalendarEvent[];
  onActionTrigger: (actionId: string, payload?: any) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  tasks = [],
  emails = [],
  calendarEvents = [],
  onActionTrigger
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close command palette on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Timeout is used to ensure input focus is called after mount cycles complete
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose]);

  // Handle resetting selected option when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  // Build high-productivity static and dynamic items
  const staticActions = [
    {
      id: 'fetch_gmail',
      title: 'Fetch Unread Gmail Inbox',
      subtitle: 'Triggers incoming webhooks and extracts action takeaways using Gemini SDK',
      category: 'ACTIONS',
      icon: <Mail className="h-4 w-4 text-amber-400" />
    },
    {
      id: 'trigger_sync',
      title: 'Run Double Sync Reconciliation',
      subtitle: 'Compares sheets, tasks, and schedules with Google Server states in real-time',
      category: 'ACTIONS',
      icon: <Clock className="h-4 w-4 text-cyan-400" />
    },
    {
      id: 'generate_pdf',
      title: 'Compile Dynamic Executive Recap PDF',
      subtitle: 'Extracts local summaries and generates clean A4 prints for clients',
      category: 'ACTIONS',
      icon: <Terminal className="h-4 w-4 text-emerald-400" />
    },
    {
      id: 'toggle_slack',
      title: 'Access Slack Webhook Configuration',
      subtitle: 'Tune notifications and target channel security parameters',
      category: 'ACTIONS',
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />
    },
    {
      id: 'new_task_modal',
      title: 'Add New Specialized Task',
      subtitle: 'Create work items with recurring intervals and assigned focus metrics',
      category: 'ACTIONS',
      icon: <Plus className="h-4 w-4 text-purple-400" />
    },
    {
      id: 'toggle_compact_mode',
      title: 'Toggle Dense Spacing Layout',
      subtitle: 'Minimizes card bounds and hides verbose descriptions',
      category: 'ACTIONS',
      icon: <Sliders className="h-4 w-4 text-zinc-400" />
    }
  ];

  // Dynamically filter tasks, emails and events by title or subject description
  const filteredTasks = search
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase()))
        .slice(0, 4)
        .map(t => ({
          id: `task_${t.id}`,
          title: t.title,
          subtitle: `[${t.urgency} Priority] ${t.notes || 'No description provided'}`,
          category: 'TASKS',
          icon: <Check className={`h-4 w-4 ${t.status === 'completed' ? 'text-emerald-500' : 'text-zinc-500'}`} />,
          payload: t
        }))
    : [];

  const filteredEmails = search
    ? emails.filter(e => e.subject.toLowerCase().includes(search.toLowerCase()) || e.body.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 3)
        .map(e => ({
          id: `email_${e.id}`,
          title: e.subject,
          subtitle: `From: ${e.from}`,
          category: 'MAILS',
          icon: <Mail className="h-4 w-4 text-amber-500/80" />,
          payload: e
        }))
    : [];

  const filteredEvents = search
    ? calendarEvents.filter(ev => ev.title.toLowerCase().includes(search.toLowerCase()) || (ev.description || '').toLowerCase().includes(search.toLowerCase()))
        .slice(0, 3)
        .map(ev => ({
          id: `event_${ev.id}`,
          title: ev.title,
          subtitle: `Starts: ${new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          category: 'EVENTS',
          icon: <Calendar className="h-4 w-4 text-cyan-400/80" />,
          payload: ev
        }))
    : [];

  // Combine lists
  const filteredStatic = search
    ? staticActions.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.subtitle.toLowerCase().includes(search.toLowerCase()))
    : staticActions;

  const combinedItems = [
    ...filteredStatic,
    ...filteredTasks,
    ...filteredEmails,
    ...filteredEvents
  ];

  // Handle navigate using arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % combinedItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + combinedItems.length) % combinedItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedItems[selectedIndex]) {
        handleSelectItem(combinedItems[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: any) => {
    onActionTrigger(item.id, item.payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-zinc-950/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.15 }}
        ref={containerRef}
        className="w-full max-w-2xl bg-[#0c0c0c] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]"
      >
        {/* Search Input Container */}
        <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-zinc-850 bg-zinc-950/40">
          <Search className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, Gmail payloads, system actions... (CMD+K to close)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none text-zinc-200 text-xs focus:outline-none placeholder-zinc-550 font-mono"
          />
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest select-none flex-shrink-0">
            <span>ESC</span>
          </div>
        </div>

        {/* Results Stream */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {combinedItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 text-zinc-700 mx-auto mb-2 animate-bounce" />
              <p className="text-[11px] font-mono text-zinc-500">No active records or operations matched "{search}"</p>
            </div>
          ) : (
            <div>
              {/* Group items by category */}
              {Array.from(new Set(combinedItems.map(item => item.category))).map(cat => {
                const catItems = combinedItems.filter(item => item.category === cat);
                return (
                  <div key={cat} className="space-y-0.5 mb-2.5">
                    <div className="text-[9px] font-mono uppercase font-bold text-zinc-650 tracking-wider px-3 py-1 selection:bg-transparent">
                      {cat}
                    </div>
                    {catItems.map((item) => {
                      const overallIndex = combinedItems.indexOf(item);
                      const isSelected = overallIndex === selectedIndex;
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(overallIndex)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                            isSelected 
                              ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' 
                              : 'bg-transparent border border-transparent text-zinc-350 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 text-left min-w-0">
                            <div className={`p-1.5 rounded-lg border flex-shrink-0 ${
                              isSelected 
                                ? 'bg-amber-955/30 border-amber-500/30 text-amber-400' 
                                : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                            }`}>
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-mono font-semibold tracking-wide truncate">{item.title}</p>
                              <p className="text-[9px] text-zinc-500 truncate leading-relaxed mt-0.5">{item.subtitle}</p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="flex items-center space-x-1 text-[9px] font-mono font-bold text-amber-500 animate-fadeIn">
                              <span>EXECUTE</span>
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Technical Audit footer */}
        <div className="p-3 border-t border-zinc-850 bg-zinc-950/40 flex items-center justify-between text-[10px] font-mono text-zinc-550 select-none">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>CLI HUB ACTIVE</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Arrow keys navigation</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-bold">↵ ENTER</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
