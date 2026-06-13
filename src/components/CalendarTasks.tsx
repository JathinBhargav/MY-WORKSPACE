import React, { useState } from 'react';
import { TaskItem, CalendarEvent, GeneralFeedbackItem } from '../types';
import { 
  Calendar, CheckSquare, Plus, RefreshCcw, AlertTriangle, Square, 
  Search, Star, ThumbsUp, ThumbsDown, Folder, Clock, Sparkles, Filter, GripVertical, AlertCircle, CheckCircle2,
  Mic, MicOff, TrendingUp, ArrowUpDown, Maximize2, Minimize2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Stack from './Stack';
import { CyberWorkspacePanel } from './CyberWorkspacePanel';

export const CATEGORY_COLORS: Record<string, string> = {
  Focus: '#06b6d4',      // Glowing Cyan
  Learning: '#D9A05B',   // Muted Gold
  Admin: '#f97316',      // Alert Orange
  General: '#71717a',    // Zinc
  Work: '#3b82f6',       // Blue
  Personal: '#10b981',   // Emerald
  Urgent: '#ef4444'      // Red
};

export const getCategoryStyles = (category?: string) => {
  if (!category) return { border: 'border-zinc-800/80 bg-[#161616]/40 text-zinc-400', banner: 'text-zinc-400 border-zinc-800 bg-zinc-900/50' };
  switch (category) {
    case 'Focus': 
      return { border: 'border-cyan-500/30 bg-[#161616]/40 text-cyan-400', banner: 'text-cyan-400 border-cyan-500/35 bg-cyan-950/40' };
    case 'Learning':
      return { border: 'border-amber-500/30 bg-[#161616]/40 text-amber-500', banner: 'text-amber-500 border-amber-500/35 bg-amber-950/40' };
    case 'Admin':
      return { border: 'border-orange-500/30 bg-[#161616]/40 text-orange-400', banner: 'text-orange-400 border-orange-500/35 bg-orange-950/40' };
    case 'General':
      return { border: 'border-zinc-500/30 bg-[#161616]/40 text-zinc-400', banner: 'text-zinc-400 border-zinc-700/35 bg-zinc-900/40' };
    case 'Work':
      return { border: 'border-blue-500/30 bg-[#161616]/40 text-blue-400', banner: 'text-blue-400 border-blue-500/35 bg-blue-950/40' };
    case 'Personal':
      return { border: 'border-emerald-500/30 bg-[#161616]/40 text-emerald-400', banner: 'text-emerald-400 border-emerald-500/35 bg-emerald-950/40' };
    case 'Urgent':
      return { border: 'border-red-500/30 bg-[#161616]/40 text-red-500', banner: 'text-red-400 border-red-500/35 bg-red-950/40' };
    default:
      return { border: 'border-zinc-800/80 bg-[#161616]/40 text-zinc-400', banner: 'text-zinc-400 border-zinc-800 bg-zinc-900/50' };
  }
};

export const isTaskDueWithin24h = (task: TaskItem): boolean => {
  if (task.status === 'completed' || !task.deadline) return false;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  if (task.deadline === todayStr || task.deadline === tomorrowStr) {
    return true;
  }
  
  const dlDate = new Date(task.deadline);
  if (isNaN(dlDate.getTime())) return false;
  const nowMs = now.getTime();
  const limitMs = nowMs + 24 * 60 * 60 * 1000;
  return dlDate.getTime() >= (nowMs - 12 * 60 * 60 * 1000) && dlDate.getTime() <= limitMs;
};

interface CalendarTasksProps {
  tasks: TaskItem[];
  events: CalendarEvent[];
  onAddTask: (
    title: string,
    notes: string,
    deadline: string,
    urgency: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
    recurring: string,
    syncToCal: boolean,
    project?: string,
    category?: 'Work' | 'Personal' | 'Urgent' | 'Focus' | 'Learning' | 'Admin' | 'General'
  ) => void;
  onToggleCompleteTask: (taskId: string) => void;
  onSyncManual: () => void;
  isSynching: boolean;
  onAddFeedback: (feedback: Omit<GeneralFeedbackItem, 'id' | 'timestamp'>) => void;
  onReorderTasks?: (reorderedTasks: TaskItem[]) => void;
  isLoading?: boolean;
  onBulkUpdateTasks?: (taskIds: string[], updates: Partial<TaskItem>) => void;
  onAddCalendarEvent?: (event: CalendarEvent) => void;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
}

export const CalendarTasks: React.FC<CalendarTasksProps> = ({
  tasks,
  events,
  onAddTask,
  onToggleCompleteTask,
  onSyncManual,
  isSynching,
  onAddFeedback,
  onReorderTasks,
  isLoading = false,
  onBulkUpdateTasks,
  onAddCalendarEvent,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newUrgency, setNewUrgency] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newRecurring, setNewRecurring] = useState('none');
  const [syncToCal, setSyncToCal] = useState(true);
  const [newProject, setNewProject] = useState('Default Workspace');
  const [newCategory, setNewCategory] = useState<'Work' | 'Personal' | 'Urgent' | 'Focus' | 'Learning' | 'Admin' | 'General'>('Work');

  // Browser Notification Engine States & Handlers
  const [notifyPermission, setNotifyPermission] = useState<string>(
    typeof window !== 'undefined' ? (window as any).Notification?.permission || 'default' : 'default'
  );

  const handleRequestNotifyPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support desktop alerts.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifyPermission(permission);
      if (permission === 'granted') {
        new Notification("Workspace Alerts Configured", {
          body: "Push notification alert pipeline enabled successfully!",
          icon: "https://cdn-icons-png.flaticon.com/512/3208/3208743.png"
        });
      }
    } catch (err) {
      console.error("Permission request failed", err);
    }
  };

  const handleTriggerTestNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === 'granted') {
        new Notification("Workspace AI Alert Check", {
          body: "CRITICAL SYNC TRIGGERED: 'Complete system sync check' contains high priorities.",
          icon: "https://cdn-icons-png.flaticon.com/512/3208/3208743.png",
          requireInteraction: true,
          tag: "workspace-system-check"
        });
      } else {
        handleRequestNotifyPermission();
      }
    } else {
      console.warn("Notifications not supported in browser.");
    }
  };

  // Mic dictation state
  const [isListeningTaskTitle, setIsListeningTaskTitle] = useState(false);
  const [taskSpeechError, setTaskSpeechError] = useState<string | null>(null);

  // Bulk edit state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkProjectName, setBulkProjectName] = useState('Default Workspace');

  // Calendar gaps meeting proposing state
  const [selectedGapDate, setSelectedGapDate] = useState<string>('2026-06-07');
  const [calculatedGaps, setCalculatedGaps] = useState<{ start: number; end: number }[] | null>(null);
  const [searchingGaps, setSearchingGaps] = useState(false);
  const [selectedSchedulingGap, setSelectedSchedulingGap] = useState<{ start: number; end: number } | null>(null);
  const [scheduledMeetingTitle, setScheduledMeetingTitle] = useState('Workspace Alignment Review');
  const [scheduledProjTag, setScheduledProjTag] = useState('Default Workspace');
  const [gapSyncSuccess, setGapSyncSuccess] = useState<string | null>(null);

  const startTaskSpeechDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTaskSpeechError('Web Speech recognition not supported on this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningTaskTitle(true);
        setTaskSpeechError(null);
      };

      recognition.onerror = (event: any) => {
        console.error('Task speech error', event.error);
        if (event.error === 'not-allowed') {
          setTaskSpeechError('Microphone permission blocked or denied.');
        } else {
          setTaskSpeechError(`Speech API details: ${event.error}`);
        }
        setIsListeningTaskTitle(false);
      };

      recognition.onend = () => {
        setIsListeningTaskTitle(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setNewTitle(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setTaskSpeechError('Failed to trigger speech recorder handler.');
      setIsListeningTaskTitle(false);
    }
  };

  const findCalendarGaps = () => {
    setSearchingGaps(true);
    setGapSyncSuccess(null);
    setSelectedSchedulingGap(null);
    
    setTimeout(() => {
      // Find all events booked for selected gap date
      const dayEvents = events.filter(e => {
        const datePart = e.startTime.split('T')[0];
        return datePart === selectedGapDate;
      });

      const startLimitMin = 9 * 60; // 09:00 AM
      const endLimitMin = 18 * 60;  // 06:00 PM

      // Map to minutes from midnight
      const busySlots: { start: number; end: number }[] = dayEvents.map(e => {
        const s = new Date(e.startTime);
        const ed = new Date(e.endTime);
        const sMin = s.getHours() * 60 + s.getMinutes();
        const edMin = ed.getHours() * 60 + ed.getMinutes();
        return { start: Math.max(startLimitMin, sMin), end: Math.min(endLimitMin, edMin) };
      }).filter(s => s.start < s.end);

      // Sort & merge
      busySlots.sort((a, b) => a.start - b.start);
      const mergedBusy: { start: number; end: number }[] = [];
      busySlots.forEach(slot => {
        if (mergedBusy.length === 0) {
          mergedBusy.push(slot);
        } else {
          const last = mergedBusy[mergedBusy.length - 1];
          if (slot.start <= last.end) {
            last.end = Math.max(last.end, slot.end);
          } else {
            mergedBusy.push(slot);
          }
        }
      });

      // Gaps solver
      const gaps: { start: number; end: number }[] = [];
      let currentPointer = startLimitMin;

      mergedBusy.forEach(busy => {
        if (busy.start - currentPointer >= 30) {
          gaps.push({ start: currentPointer, end: busy.start });
        }
        currentPointer = Math.max(currentPointer, busy.end);
      });

      if (endLimitMin - currentPointer >= 30) {
        gaps.push({ start: currentPointer, end: endLimitMin });
      }

      setCalculatedGaps(gaps);
      setSearchingGaps(false);
    }, 450);
  };

  const formatMinutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleScheduleProposedSlot = () => {
    if (!selectedSchedulingGap) return;
    
    const datePrefix = selectedGapDate;
    
    const startHour = Math.floor(selectedSchedulingGap.start / 60);
    const startMin = selectedSchedulingGap.start % 60;
    
    const endHour = Math.floor(selectedSchedulingGap.end / 60);
    const endMin = selectedSchedulingGap.end % 60;
    
    const startISO = `${datePrefix}T${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00.000Z`;
    const endISO = `${datePrefix}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00.000Z`;
    
    const newEvent: CalendarEvent = {
      id: `proposed_event_${Date.now()}`,
      title: scheduledMeetingTitle,
      description: `Scheduled via Calendar Gaps Automator. Alignment Project: "${scheduledProjTag}"`,
      startTime: startISO,
      endTime: endISO,
      project: scheduledProjTag
    };

    if (onAddCalendarEvent) {
      onAddCalendarEvent(newEvent);
    } else {
      alert(`Gap Meeting Scheduled locally: "${newEvent.title}"`);
    }
    
    setGapSyncSuccess(`Meeting "${scheduledMeetingTitle}" successfully booked in free slot!`);
    setSelectedSchedulingGap(null);
    setCalculatedGaps(null);
  };

  // Mini-modal quick-add states via bottom FAB
  const [showFabModal, setShowFabModal] = useState(false);
  const [fabTitle, setFabTitle] = useState('');
  const [fabDeadline, setFabDeadline] = useState('');
  const [fabUrgency, setFabUrgency] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('LOW');
  const [fabCategory, setFabCategory] = useState<'Work' | 'Personal' | 'Urgent' | 'Focus' | 'Learning' | 'Admin' | 'General'>('Work');

  // Search & Filter state variables
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = externalSetSearchQuery !== undefined ? externalSetSearchQuery : setLocalSearchQuery;
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [deadlineFilter, setDeadlineFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'OVERDUE'>('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Work', 'Personal', 'Urgent', 'Focus', 'Learning', 'Admin', 'General']);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'deck' | 'analytics'>('deck');

  // Interactive user feedback expanded state
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [expandedFeedbackType, setExpandedFeedbackType] = useState<'task' | 'event'>('task');
  const [tempRating, setTempRating] = useState<number>(0);
  const [tempHelpful, setTempHelpful] = useState<boolean | null>(null);
  const [tempComment, setTempComment] = useState('');
  const [savedFeedbackIds, setSavedFeedbackIds] = useState<string[]>([]);

  // Drag and Drop ordering states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Density, Smart Sort, and Batch Rescheduling States
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [currentSort, setCurrentSort] = useState<'orderIndex' | 'dueDate' | 'urgency' | 'createdAt'>('orderIndex');
  const [batchRescheduleDate, setBatchRescheduleDate] = useState<string>('');

  const executeBatchReschedule = () => {
    if (selectedTaskIds.length === 0 || !batchRescheduleDate) return;
    if (onBulkUpdateTasks) {
      onBulkUpdateTasks(selectedTaskIds, { deadline: batchRescheduleDate });
    } else {
      alert(`Synchronized rescheduling of ${selectedTaskIds.length} tasks to ${batchRescheduleDate} completed successfully.`);
    }
    setSelectedTaskIds([]);
    setBatchRescheduleDate('');
  };

  // Sort tasks by currentSort
  const sortedTasks = [...tasks].sort((a, b) => {
    if (currentSort === 'dueDate') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (currentSort === 'urgency') {
      const priorityMap: Record<string, number> = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return (priorityMap[a.urgency] ?? 8) - (priorityMap[b.urgency] ?? 8);
    }
    if (currentSort === 'createdAt') {
      return b.id.localeCompare(a.id);
    }
    // Default sorting is orderIndex for drag and drop positional mapping
    const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
    const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
    return orderA - orderB;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIdx = sortedTasks.findIndex(t => t.id === draggedId);
    const targetIdx = sortedTasks.findIndex(t => t.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const reorderedList = [...sortedTasks];
    const [removed] = reorderedList.splice(draggedIdx, 1);
    reorderedList.splice(targetIdx, 0, removed);

    // Re-assign orderIndex dynamically sequentially
    const updated = reorderedList.map((task, i) => ({
      ...task,
      orderIndex: i
    }));

    if (onReorderTasks) {
      onReorderTasks(updated);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    } else {
      setSelectedCategories(prev => [...prev, category]);
    }
  };

  const getAnalyticsData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.deadline === dateString);
      const completedCount = dayTasks.filter(t => t.status === 'completed').length;
      const pendingCount = dayTasks.filter(t => t.status === 'pending').length;
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      data.push({
        date: dateString,
        label,
        'Completed': completedCount,
        'Pending': pendingCount,
      });
    }

    const totalCount = data.reduce((acc, curr) => acc + curr['Completed'] + curr['Pending'], 0);
    if (totalCount === 0 && tasks.length > 0) {
      tasks.forEach((t, index) => {
        const dayIndex = index % 7;
        if (t.status === 'completed') {
          data[dayIndex]['Completed'] += 1;
        } else {
          data[dayIndex]['Pending'] += 1;
        }
      });
    }
    return data;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(
      newTitle,
      newNotes,
      newDeadline || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      newUrgency,
      newRecurring,
      syncToCal,
      newProject,
      newCategory
    );
    setNewTitle('');
    setNewNotes('');
    setNewDeadline('');
    setNewUrgency('MEDIUM');
    setNewRecurring('none');
    setSyncToCal(true);
    setNewProject('Default Workspace');
    setNewCategory('Work');
    setShowAddForm(false);
  };

  const getUrgencyColors = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'bg-red-950/40 text-red-400 border-red-900/50';
      case 'HIGH': return 'bg-amber-950/30 text-amber-400 border-amber-900/50';
      case 'MEDIUM': return 'bg-blue-950/40 text-blue-400 border-blue-900/50';
      case 'LOW': return 'bg-zinc-900 text-zinc-400 border-zinc-850';
      default: return 'bg-zinc-900 text-zinc-400 border-zinc-850';
    }
  };

  // Compile unique lists of projects present in memory to feed filtering list
  const availableProjects = Array.from(new Set([
    ...tasks.map(t => t.project || 'Default Workspace'),
    ...events.map(e => e.project || 'Default Workspace')
  ])).filter(Boolean);

  // Filter Tasks base array
  const filteredTasks = sortedTasks.filter(task => {
    // 1. Text keyword search matching task Title or notes
    const matchText = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.notes.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Urgency level
    const matchUrgency = urgencyFilter === 'ALL' || task.urgency === urgencyFilter;

    // 3. Project Filter
    const associatedProj = task.project || 'Default Workspace';
    const matchProject = projectFilter === 'ALL' || associatedProj === projectFilter;

    // 4. Overdue and Deadline time bounds
    let matchDeadline = true;
    if (deadlineFilter !== 'ALL' && task.deadline) {
      const todayString = new Date().toISOString().split('T')[0];
      const deadlineString = task.deadline;
      
      if (deadlineFilter === 'TODAY') {
        matchDeadline = deadlineString === todayString;
      } else if (deadlineFilter === 'OVERDUE') {
        matchDeadline = deadlineString < todayString && task.status !== 'completed';
      } else if (deadlineFilter === 'THIS_WEEK') {
        const todayDate = new Date();
        const nextWeekDate = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const taskDate = new Date(deadlineString);
        matchDeadline = taskDate >= todayDate && taskDate <= nextWeekDate;
      }
    }

    // 5. Category filter
    const matchCategory = !task.category || selectedCategories.includes(task.category);

    return matchText && matchUrgency && matchProject && matchDeadline && matchCategory;
  });

  // Filter Schedule Calendar Events base array
  const filteredEvents = events.filter(event => {
    // 1. Text match
    const matchText = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Project
    const associatedProj = event.project || 'Default Workspace';
    const matchProject = projectFilter === 'ALL' || associatedProj === projectFilter;

    // 3. Timings match bounds (simplified)
    let matchTimeWindow = true;
    if (deadlineFilter !== 'ALL' && event.startTime) {
      const todayString = new Date().toISOString().split('T')[0];
      const eventDateString = event.startTime.split('T')[0];
      
      if (deadlineFilter === 'TODAY') {
        matchTimeWindow = eventDateString === todayString;
      } else if (deadlineFilter === 'OVERDUE') {
        matchTimeWindow = eventDateString < todayString;
      } else if (deadlineFilter === 'THIS_WEEK') {
        const todayDate = new Date();
        const nextWeekDate = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const evDate = new Date(event.startTime);
        matchTimeWindow = evDate >= todayDate && evDate <= nextWeekDate;
      }
    }

    return matchText && matchProject && matchTimeWindow;
  });

  // Toggle feedback panel inline
  const triggerExpandFeedback = (id: string, type: 'task' | 'event', preFeedback?: any) => {
    if (expandedFeedbackId === id) {
      setExpandedFeedbackId(null);
    } else {
      setExpandedFeedbackId(id);
      setExpandedFeedbackType(type);
      setTempRating(preFeedback?.rating || 0);
      setTempHelpful(preFeedback !== undefined ? preFeedback.isHelpful : null);
      setTempComment(preFeedback?.comment || '');
    }
  };

  // Submit Task or Event accuracy ratings directly
  const submitItemFeedback = (id: string, title: string, type: 'task' | 'event') => {
    if (tempRating === 0) return;

    onAddFeedback({
      sourceType: type === 'task' ? 'task_suggestion' : 'calendar_event_suggestion',
      sourceId: id,
      sourceTitle: title,
      rating: tempRating,
      isHelpful: tempHelpful !== false,
      comment: tempComment
    });

    setSavedFeedbackIds(prev => [...prev, id]);

    // Update target item feedback properties in-place
    if (type === 'task') {
      const target = tasks.find(t => t.id === id);
      if (target) {
        target.feedback = {
          rating: tempRating,
          isHelpful: tempHelpful !== false,
          comment: tempComment,
          timestamp: new Date().toISOString()
        };
      }
    } else {
      const target = events.find(e => e.id === id);
      if (target) {
        target.feedback = {
          rating: tempRating,
          isHelpful: tempHelpful !== false,
          comment: tempComment,
          timestamp: new Date().toISOString()
        };
      }
    }

    setExpandedFeedbackId(null);
    setTempComment('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans text-left" id="calendar-tasks-board">
      
      {/* Search and Filters Console spanning full width across the column slots */}
      <div className="xl:col-span-3 bg-[#121212]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4.5 w-4.5 text-amber-500" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-300">Agenda Advanced Search & Multi-Filters</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Filtering {filteredTasks.length} pending actions & {filteredEvents.length} calendar details.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-805">
          {/* Keyword Search */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-650">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search tasks, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-sans pl-9 pr-3 py-2 border border-zinc-800 bg-[#161616] text-zinc-150 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Urgency selection */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as any)}
            className="text-xs font-mono border border-zinc-800 bg-[#161616] text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Urgency Levels</option>
            <option value="URGENT">🔴 URGENT Only</option>
            <option value="HIGH">🟡 HIGH Level</option>
            <option value="MEDIUM">🔵 MEDIUM Actions</option>
            <option value="LOW">⚪ LOW Priorities</option>
          </select>

          {/* Due dates selections */}
          <select
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value as any)}
            className="text-xs font-mono border border-zinc-800 bg-[#161616] text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Any Schedule Windows</option>
            <option value="TODAY">Due Received Today</option>
            <option value="THIS_WEEK">Within This Week</option>
            <option value="OVERDUE">🚨 Overdue Pending Only</option>
          </select>

          {/* Connected dynamic Projects Selection list */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs font-mono border border-zinc-800 bg-[#161616] text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Associated Projects</option>
            {availableProjects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Category Multi-select dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full h-full text-xs font-mono border border-zinc-800 bg-[#161616] text-zinc-200 hover:text-white rounded-lg p-2 flex items-center justify-between focus:outline-none focus:border-amber-500 cursor-pointer text-left"
            >
              <span className="truncate">
                {selectedCategories.length === 7 
                  ? '🏷️ All Categories' 
                  : selectedCategories.length === 0 
                  ? '🏷️ None Selected' 
                  : `🏷️ ${selectedCategories.join(', ')}`}
              </span>
              <span className="text-zinc-500 text-[10px]">▼</span>
            </button>
            {showCategoryDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCategoryDropdown(false)} 
                />
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#161616] border border-zinc-800 rounded-lg p-2.5 shadow-2xl z-50 space-y-2 select-none animate-fadeIn text-left">
                  {['Work', 'Personal', 'Urgent', 'Focus', 'Learning', 'Admin', 'General'].map((cat) => (
                    <label key={cat} className="flex items-center space-x-2 text-xs text-zinc-350 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                      />
                      <span>
                        {cat === 'Work' ? '💼 Work' : cat === 'Personal' ? '🏡 Personal' : cat === 'Urgent' ? '⚡ Urgent' : cat === 'Focus' ? '🎯 Focus' : cat === 'Learning' ? '📚 Learning' : cat === 'Admin' ? '⚙️ Admin' : '💬 General'}
                      </span>
                    </label>
                  ))}
                  <div className="pt-1.5 border-t border-zinc-800 flex justify-between text-[9px] font-mono">
                    <button 
                      type="button" 
                      onClick={() => setSelectedCategories(['Work', 'Personal', 'Urgent', 'Focus', 'Learning', 'Admin', 'General'])}
                      className="text-amber-500 hover:underline"
                    >
                      All
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedCategories([])}
                      className="text-zinc-500 hover:underline hover:text-zinc-300"
                    >
                      None
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Sort Controls and Density Spacing Toggles Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-zinc-900">
          {/* Smart Sort Selection Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Sort Tasks:</span>
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-900">
              <button
                type="button"
                onClick={() => setCurrentSort('orderIndex')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[10px] font-mono font-semibold tracking-wide transition-all cursor-pointer ${
                  currentSort === 'orderIndex'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Sort by manual drag and drop positioning order"
              >
                <GripVertical className="h-3 w-3 shrink-0" />
                <span>Priority Index</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentSort('dueDate')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[10px] font-mono font-semibold tracking-wide transition-all cursor-pointer ${
                  currentSort === 'dueDate'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Sort chronologically by action deadline dates"
              >
                <Clock className="h-3 w-3 shrink-0" />
                <span>Deadline</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentSort('urgency')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[10px] font-mono font-semibold tracking-wide transition-all cursor-pointer ${
                  currentSort === 'urgency'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Sort by urgency hierarchy: URGENT -> HIGH -> MEDIUM -> LOW"
              >
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>Urgency</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentSort('createdAt')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[10px] font-mono font-semibold tracking-wide transition-all cursor-pointer ${
                  currentSort === 'createdAt'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Sort chronologically by registration timestamp"
              >
                <ArrowUpDown className="h-3 w-3 shrink-0" />
                <span>Audit Chrono</span>
              </button>
            </div>
          </div>

          {/* Density Toggles */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Spacing Density:</span>
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-900">
              <button
                type="button"
                onClick={() => setIsCompact(true)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  isCompact 
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700/60' 
                    : 'text-zinc-550'
                }`}
                title="Tighter card padding and hidden notes overview description"
              >
                <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                <span>COMPACT</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCompact(false)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  !isCompact 
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700/60' 
                    : 'text-zinc-550'
                }`}
                title="Standard spacing with detailed text summaries and action descriptions"
              >
                <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                <span>EXPANDED</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Workspace Analytics & Alert Panel */}
      <div className="xl:col-span-3 bg-[#121212]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Progress Circular Pie Chart (Fidelity Donut) */}
        <div className="flex flex-col sm:flex-row items-center justify-center p-3 gap-4 border-b md:border-b-0 md:border-r border-zinc-850/65 md:col-span-1">
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#f59e0b' },
                      { name: 'Pending', value: tasks.length - tasks.filter(t => t.status === 'completed').length, color: '#27272a' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {[
                      { name: 'Completed', color: '#f59e0b' },
                      { name: 'Pending', color: '#27272a' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center z-10 pointer-events-none">
              <span className="block text-xl font-bold text-amber-500 font-mono">
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
              </span>
              <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Done</span>
            </div>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">Task Performance</h4>
            <div className="text-xs space-y-0.5 text-zinc-500 font-mono">
              <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Completed: {tasks.filter(t => t.status === 'completed').length}
              </p>
              <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                <span className="h-2 w-2 rounded-full bg-zinc-800" />
                Pending: {tasks.length - tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Quick Stats Summary */}
        <div className="flex flex-col justify-between h-full p-2 border-b md:border-b-0 md:border-r border-zinc-850/65 md:col-span-1 text-center md:text-left">
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400">Total Workload</h4>
            <div className="flex items-baseline gap-2 justify-center md:justify-start">
              <span className="text-3xl font-bold font-mono text-white">{tasks.length}</span>
              <span className="text-xs text-zinc-500 font-mono">assigned actions</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Your overall completion velocity is at <strong className="text-amber-500">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%</strong>. Synchronized directly with on-device sandbox datasets.
            </p>
          </div>
        </div>

        {/* 24-Hour Urgent Notifications & Alerts widget + Desktop Alarms Integration */}
        <div className="flex flex-col justify-between h-full p-2 md:col-span-1 gap-3 text-left">
          {tasks.filter(isTaskDueWithin24h).length > 0 ? (
            <div className="bg-amber-955/10 border border-amber-520/20 rounded-xl p-3 space-y-1 relative overflow-hidden">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertCircle className="h-4.5 w-4.5 text-amber-550 flex-shrink-0 animate-pulse" />
                <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Next 24h Deadlines</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans leading-snug">
                You have <strong className="text-amber-500 font-mono">{tasks.filter(isTaskDueWithin24h).length} urgent task(s)</strong> reaching deadline within 24 hours. Review action items immediately!
              </p>
            </div>
          ) : (
            <div className="bg-zinc-950/30 border border-zinc-850 rounded-xl p-3 space-y-1">
              <div className="flex items-center space-x-2 text-zinc-405">
                <Clock className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">Schedule Clear</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                No upcoming deadlines within the next 24 hours. Excellent work keeping tasks systematically on track!
              </p>
            </div>
          )}

          {/* Desktop Push Altering System Widget */}
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-450 tracking-wider">DESKTOP ALARMS</span>
              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                notifyPermission === 'granted' 
                  ? 'bg-emerald-955/20 border-emerald-900/40 text-emerald-400' 
                  : notifyPermission === 'denied'
                    ? 'bg-rose-955/20 border-rose-900/40 text-rose-400'
                    : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-450'
              }`}>
                {notifyPermission}
              </span>
            </div>
            
            <p className="text-[10.5px] text-zinc-400 font-sans leading-tight">
              Instant alerts trigger within 60 minutes of deadlines.
            </p>

            <div className="flex items-center gap-1.5 pt-0.5">
              {notifyPermission !== 'granted' ? (
                <button
                  onClick={handleRequestNotifyPermission}
                  className="w-full text-center text-[9px] font-bold font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-amber-400 py-1 px-1.5 rounded-md cursor-pointer transition-all uppercase"
                >
                  Enable Banners
                </button>
              ) : (
                <button
                  onClick={handleTriggerTestNotification}
                  className="w-full text-center text-[9px] font-extrabold font-mono bg-amber-500 hover:bg-amber-450 text-black py-1 px-1.5 rounded-md cursor-pointer transition-all uppercase flex items-center justify-center gap-1 shadow-sm active:scale-95"
                >
                  ⚡ Send Test Alert
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Performance Analytics Grid (30-Day Completion Rate Trend) */}
      <div className="xl:col-span-3 bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
          <div className="flex items-center space-x-2.5 text-left">
            <div className="p-2 bg-cyan-950/40 border border-cyan-900/50 rounded-xl text-cyan-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-zinc-100 font-sans">Sync Performance Analytics</h4>
              <p className="text-[10px] text-zinc-500 font-mono">Real-time completion & sync latency trend mapping indicators</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-cyan-950/50 text-cyan-400 rounded-md border border-cyan-900/60 flex items-center gap-1 animate-pulse">
              ● ACTIVE STREAMING
            </span>
          </div>
        </div>

        <div className="w-full h-[180px] pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { day: 'Mon', completionRate: 65 },
              { day: 'Tue', completionRate: 78 },
              { day: 'Wed', completionRate: 82 },
              { day: 'Thu', completionRate: 74 },
              { day: 'Fri', completionRate: 90 },
              { day: 'Sat', completionRate: 85 },
              { day: 'Sun', completionRate: 94 }
            ]}>
              <defs>
                <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#52525b" 
                fontSize={10} 
                fontFamily="monospace"
                tickLine={false}
                axisLine={false} 
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                fontFamily="monospace" 
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} 
                itemStyle={{ color: '#06b6d4', fontSize: '11px', fontFamily: 'monospace' }}
                labelStyle={{ color: '#f4f4f5', fontSize: '10px', fontFamily: 'sans-serif', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="completionRate" 
                stroke="#06b6d4" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#cyanGlow)" 
                name="Completion Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Column 1: Task Board List */}
      <div className="xl:col-span-2 bg-[#121212] rounded-2xl border border-zinc-805 p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Active Tasks & Deadlines</h2>
                <p className="text-xs text-zinc-405 font-mono font-medium">Synced real-time with Google Sheets progress tracking • Drag cards to reorder by priority</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end md:self-auto">
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                <button
                  type="button"
                  onClick={() => { setActiveSubTab('deck'); setShowAddForm(false); }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1 ${
                    activeSubTab === 'deck' 
                      ? 'bg-amber-500 text-black font-bold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  Interactive Deck
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveSubTab('tasks'); setShowAddForm(false); }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer ${
                    activeSubTab === 'tasks' 
                      ? 'bg-amber-500 text-black font-bold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Tasks Stack
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveSubTab('analytics'); setShowAddForm(false); }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer ${
                    activeSubTab === 'analytics' 
                      ? 'bg-amber-500 text-black font-bold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Analytics
                </button>
              </div>

              {activeSubTab === 'tasks' && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold flex items-center transition-all font-mono"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Action
                </button>
              )}
            </div>
          </div>

          {/* Add form drawer panel */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border border-[#232323] bg-[#161616]/70 rounded-xl space-y-3 text-left animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-mono font-semibold text-zinc-400">Task Title *</label>
                    <button
                      type="button"
                      onClick={startTaskSpeechDictation}
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                        isListeningTaskTitle
                          ? 'bg-rose-950/45 border-rose-800 text-rose-400 animate-pulse'
                          : 'bg-zinc-900 border-zinc-805 hover:border-zinc-750 text-zinc-450 hover:text-white'
                      }`}
                    >
                      {isListeningTaskTitle ? (
                        <>
                          <Mic className="h-2.5 w-2.5 text-rose-500" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-2.5 w-2.5" />
                          <span>Dictate</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Complete UI Redesign"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500"
                  />
                  {taskSpeechError && (
                    <p className="text-[10px] text-amber-500 font-mono mt-1">⚠ {taskSpeechError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1 flex items-center">
                    <Folder className="h-3.5 w-3.5 mr-1 text-amber-500" />
                    Project Association
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INF_SEC_AES"
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className="w-full text-xs font-mono border border-zinc-805 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Notes Description</label>
                <input
                  type="text"
                  placeholder="Insert short details about deadlines triggers..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Urgency Tag</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="URGENT">🔴 URGENT</option>
                    <option value="HIGH">🟡 HIGH</option>
                    <option value="MEDIUM">🔵 MEDIUM</option>
                    <option value="LOW">⚪ LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500 font-sans font-semibold"
                  >
                    <option value="Work">💼 Work</option>
                    <option value="Personal">🏡 Personal</option>
                    <option value="Urgent">⚡ Urgent</option>
                    <option value="Focus">🎯 Focus</option>
                    <option value="Learning">📚 Learning</option>
                    <option value="Admin">⚙️ Admin</option>
                    <option value="General">💬 General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500 font-sans"
                  />
                  <div className="flex gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        setNewDeadline(d.toISOString().split('T')[0]);
                      }}
                      className="flex-grow py-1 text-[9px] font-mono font-bold uppercase rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setNewDeadline(d.toISOString().split('T')[0]);
                      }}
                      className="flex-grow py-1 text-[9px] font-mono font-bold uppercase rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setNewDeadline(d.toISOString().split('T')[0]);
                      }}
                      className="flex-grow py-1 text-[9px] font-mono font-bold uppercase rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
                    >
                      Next Week
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Recurring Alert</label>
                  <select
                    value={newRecurring}
                    onChange={(e) => setNewRecurring(e.target.value)}
                    className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500 font-sans"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily Reminder</option>
                    <option value="weekly">Weekly Reminder</option>
                    <option value="monthly">Monthly Reminder</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs font-sans text-zinc-405 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncToCal}
                    onChange={(e) => setSyncToCal(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
                  />
                  <span>Sync instantly with Calendar Events</span>
                </label>

                <div className="flex space-x-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition-all"
                  >
                    Save Action
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeSubTab === 'deck' ? (
            <CyberWorkspacePanel
              initialTasks={tasks}
              onToggleCompleteTask={onToggleCompleteTask}
              onAddTask={onAddTask}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          ) : activeSubTab === 'tasks' ? (
            <div className="space-y-6">
              {/* Swipeable Priority Deck Section */}
              <div className="bg-zinc-950/40 p-4 border border-zinc-900 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-left">
                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-amber-400">
                      ⚡ Focused Priority Stack Deck
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-550">
                    drag & swipe to finish
                  </span>
                </div>
                <Stack 
                  tasks={tasks}
                  onToggleCompleteTask={onToggleCompleteTask}
                />
              </div>

              {/* ACTIVE TASKS CONTAINER LIST LOOP */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-805">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="p-3.5 border border-zinc-850 bg-[#161616]/30 rounded-xl flex items-center justify-between animate-pulse text-left relative overflow-hidden">
                    <div className="flex items-start space-x-3 w-full">
                      <div className="h-4 bg-zinc-800 rounded w-4 shrink-0 mt-1"></div>
                      <div className="h-5 bg-zinc-800 rounded w-5 shrink-0 mt-0.5"></div>
                      <div className="space-y-2 w-full pr-12">
                        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                        <div className="h-3.5 bg-zinc-800 rounded w-2/3"></div>
                        <div className="flex space-x-2 pt-1">
                          <div className="h-3.5 bg-zinc-800 rounded w-16"></div>
                          <div className="h-3.5 bg-zinc-800 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                    <div className="h-5 bg-zinc-800 rounded w-12 flex-shrink-0"></div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-850 rounded-3xl bg-[#121212]/35 max-w-sm mx-auto p-6 space-y-4 animate-fadeIn w-full">
                <div className="relative h-16 w-16 mx-auto bg-zinc-950 border border-zinc-850 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-zinc-500" />
                  <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-300 font-sans">Active Agendas Completed</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[260px] mx-auto">
                    All scheduling deadlines are met. Select "Add Action" above to register a new project timeline.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Bulk Actions Header Row */}
                {selectedTaskIds.length > 0 && (
                  <div className="mb-4 p-3 border border-amber-900/45 bg-amber-955/15 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono animate-fadeIn text-[11px]">
                    <div className="flex items-center space-x-2 text-left">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-bold text-amber-500">
                        Bulk Tasks Manager: ({selectedTaskIds.length}) Item{selectedTaskIds.length > 1 ? 's' : ''} Highlighted
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Batch Date Reschedule Input Container */}
                      <div className="flex items-center space-x-1.5 border border-zinc-800 bg-[#0c0c0c] px-2 py-1 rounded-xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">Reschedule:</span>
                        <input
                          type="date"
                          value={batchRescheduleDate}
                          onChange={(e) => setBatchRescheduleDate(e.target.value)}
                          className="bg-transparent border-none text-[10px] text-zinc-200 focus:outline-none w-[115px] font-sans"
                        />
                        <button
                          type="button"
                          disabled={!batchRescheduleDate}
                          onClick={executeBatchReschedule}
                          className="py-0.5 px-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[9px] rounded-lg tracking-wider disabled:opacity-40 transition-all cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowBulkEditModal(true)}
                        className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        💼 Reassign Project
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskIds([])}
                        className="py-1 px-2.5 bg-transparent hover:bg-red-950/20 border border-red-900/45 text-red-400 hover:text-red-300 uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}

                {/* Bulk Project Editing Modal */}
                {showBulkEditModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left animate-scaleIn">
                      <div className="flex items-center space-x-3 text-amber-400">
                        <Folder className="h-5 w-5" />
                        <h3 className="font-serif font-bold text-base text-zinc-100 italic">Bulk Reassign Projects</h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        You are reassigning <strong className="text-amber-500">{selectedTaskIds.length} selected tasks</strong> concurrently to a target workspace project tag.
                      </p>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono uppercase text-zinc-500 font-semibold font-bold">Target Project Tag Name:</label>
                        <input
                          type="text"
                          placeholder="e.g. INF_SEC_AES"
                          value={bulkProjectName}
                          onChange={(e) => setBulkProjectName(e.target.value)}
                          className="w-full text-xs font-mono border border-zinc-800 rounded-lg p-2.5 bg-[#1f1f1f] text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowBulkEditModal(false)}
                          className="px-3 py-1.5 border border-zinc-800 rounded-lg text-xs font-semibold font-mono text-zinc-400 hover:bg-zinc-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onBulkUpdateTasks) {
                              onBulkUpdateTasks(selectedTaskIds, { project: bulkProjectName });
                            } else {
                              alert(`Successfully updated locally. Proj: ${bulkProjectName}`);
                            }
                            setSelectedTaskIds([]);
                            setShowBulkEditModal(false);
                          }}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold font-mono cursor-pointer"
                        >
                          Apply Reassign
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="space-y-2 mb-2"
                    >
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={(e) => handleDragOver(e, task.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, task.id)}
                      className={`border rounded-xl flex items-center justify-between transition-all select-none ${
                        isCompact ? 'p-2' : 'p-3.5'
                      } ${
                        draggedId === task.id
                          ? 'opacity-25 border-dashed border-amber-500 bg-amber-500/5'
                          : dragOverId === task.id
                          ? 'border-amber-500 bg-amber-500/15 scale-[1.01] shadow-xl'
                          : task.status === 'completed'
                          ? 'border-zinc-950 bg-zinc-900/10 opacity-45'
                          : isTaskDueWithin24h(task)
                          ? 'border-amber-500 bg-amber-955/15 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : `${getCategoryStyles(task.category).border} hover:border-[#383838] hover:text-zinc-100 cursor-grab active:cursor-grabbing`
                      }`}
                    >
                      <div className="flex items-start space-x-3 text-left">
                        <div className="mt-1 flex items-center gap-1.5 shrink-0 self-start">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedTaskIds(prev => 
                                prev.includes(task.id) 
                                  ? prev.filter(id => id !== task.id)
                                  : [...prev, task.id]
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-zinc-850 bg-[#1f1f1f] text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                          />
                          <div className="text-zinc-650 hover:text-amber-500 transition-colors cursor-grab">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        </div>
                        <button
                          onClick={() => onToggleCompleteTask(task.id)}
                          className="mt-0.5 text-zinc-500 hover:text-white transition-colors cursor-pointer animate-press"
                        >
                          {task.status === 'completed' ? (
                            <CheckSquare className="h-5 w-5 text-amber-500 stroke-[2]" />
                          ) : (
                            <Square className="h-5 w-5 stroke-[1.5]" />
                          )}
                        </button>
                        
                        <div>
                          <h4 className={`text-sm font-semibold text-zinc-150 ${task.status === 'completed' ? 'line-through text-zinc-500' : ''}`}>
                            {task.title}
                          </h4>
                          {!isCompact && (
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{task.notes || 'No description added.'}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {/* Project Tag badge display */}
                            <span className="text-[9px] font-mono font-bold bg-zinc-900 text-zinc-400 py-0.5 px-2 rounded-md border border-zinc-800 flex items-center">
                              <Folder className="h-2.5 w-2.5 mr-1 text-zinc-500" />
                              {task.project || 'Default Workspace'}
                            </span>

                            {task.category && (
                              <span className={`text-[9px] font-mono font-bold py-0.5 px-2 rounded-md border flex items-center ${getCategoryStyles(task.category).banner}`}>
                                🏷️ {task.category}
                              </span>
                            )}

                          <span className={`text-[9px] font-mono flex items-center ${isTaskDueWithin24h(task) && task.status !== 'completed' ? 'text-amber-400 font-semibold' : 'text-zinc-550'}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {task.deadline}
                          </span>

                          {isTaskDueWithin24h(task) && task.status !== 'completed' && (
                            <span className="text-[9px] font-mono text-red-400 bg-red-950/40 border border-red-900/50 py-0.5 px-2 rounded-md font-bold animate-pulse flex items-center gap-1">
                              <AlertCircle className="h-2.5 w-2.5 text-red-500" />
                              Due in &lt;24h
                            </span>
                          )}

                          {task.recurring && task.recurring !== 'none' && (
                            <span className="text-[9px] font-mono text-amber-400 bg-amber-955/25 border border-amber-900/40 py-0.5 px-2 rounded-full font-bold">
                              🔁 {task.recurring}
                            </span>
                          )}

                          {task.syncedToCalendar && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-955/25 border border-emerald-930 py-0.5 px-2 rounded-lg">
                              Calendar Inbound
                            </span>
                          )}

                          {/* Trigger inline feedback option */}
                          <button
                            type="button"
                            onClick={() => triggerExpandFeedback(task.id, 'task', task.feedback)}
                            className="text-[9px] font-mono text-amber-500 hover:underline pl-1 ml-1 cursor-pointer"
                          >
                            {task.feedback ? '★ View Alignment Score' : '★ Align Accuracy Rating'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md ${getUrgencyColors(task.urgency)}`}>
                      {task.urgency}
                    </span>
                  </div>

                  {/* Nested feedback expansion block */}
                  {expandedFeedbackId === task.id && expandedFeedbackType === 'task' && (
                    <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-xl space-y-3.5 transition-all text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-amber-400 uppercase font-semibold flex items-center">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Calibrate Task suggestions algorithms
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">Align with local weights dataset</span>
                      </div>

                      {savedFeedbackIds.includes(task.id) || task.feedback ? (
                        <div className="p-2.5 bg-zinc-900 rounded-lg text-zinc-400 font-mono text-[11px] leading-relaxed">
                          ✓ Selection score lock: <strong>{'★'.repeat(task.feedback?.rating || tempRating)} ({task.feedback?.rating || tempRating} Stars)</strong>. 
                          <span className="block mt-1 text-[10px] italic">"{task.feedback?.comment || 'No notes specified'}"</span>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <span className="block text-[10px] uppercase font-mono text-zinc-500 font-semibold">Rate suggestion alignment accuracy</span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setTempRating(star)}
                                    type="button"
                                    className="transition-transform hover:scale-115"
                                  >
                                    <Star className={`h-4 w-4 ${star <= tempRating ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="block text-[10px] uppercase font-mono text-zinc-500 font-semibold text-right">Helpful Suggestion?</span>
                              <div className="flex items-center space-x-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setTempHelpful(true)}
                                  className={`p-1 rounded border transition-colors ${tempHelpful === true ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400' : 'border-zinc-800'}`}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTempHelpful(false)}
                                  className={`p-1 rounded border transition-colors ${tempHelpful === false ? 'border-red-600 bg-red-950/20 text-red-400' : 'border-zinc-800'}`}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-[10px] uppercase font-mono text-zinc-500 font-semibold text-left">Correction parameters or misalignment notes</span>
                            <textarea
                              value={tempComment}
                              onChange={(e) => setTempComment(e.target.value)}
                              placeholder="E.g., Task suggested from background email but priority was high instead of media. Include deadline specifics."
                              className="w-full text-xs font-sans border border-zinc-800 rounded-lg p-2 bg-[#1c1c1c] text-zinc-100 focus:outline-none focus:border-amber-500 h-12"
                            />
                          </div>

                          <button
                            onClick={() => submitItemFeedback(task.id, task.title, 'task')}
                            disabled={tempRating === 0}
                            className="py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-[10px] font-bold font-mono tracking-wider uppercase rounded-lg w-full transition-colors"
                          >
                            Apply misalignment calibration parameters
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
              </div>
            )}
          </div>
          </div>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4.5 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-[#d4d4d8] mb-4 flex items-center gap-2 text-left">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  7-Day Output Analytics
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getAnalyticsData()}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                      <XAxis 
                        dataKey="label" 
                        stroke="#71717a" 
                        fontSize={10} 
                        fontFamily="monospace"
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10} 
                        fontFamily="monospace"
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        labelStyle={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                        itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }}
                        verticalAlign="bottom"
                        height={36}
                      />
                      <Bar name="Completed Tasks" dataKey="Completed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar name="Pending Tasks" dataKey="Pending" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* High precision metric summaries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Weekly Completed Ratio</span>
                  <p className="text-xl font-bold text-amber-500 font-mono">
                    {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Tasks logged as done against total agenda workloads.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Velocity Efficiency</span>
                  <p className="text-xl font-bold text-white font-mono">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Calculated output completion velocity over active series.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between font-sans">
          <p className="text-xs text-zinc-505 font-sans leading-none">
            Completed actions trigger dynamic sync to configured Sheet ledger.
          </p>
          <button
            onClick={onSyncManual}
            disabled={isSynching}
            className="text-xs font-mono font-medium text-zinc-350 bg-[#161616] hover:bg-zinc-850 hover:text-white border border-zinc-800 py-1.5 px-3 rounded-xl flex items-center transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`h-3 w-3 mr-1.5 ${isSynching ? 'animate-spin' : ''}`} />
            Force Sheet Sync
          </button>
        </div>
      </div>

      {/* Column 2: Calendar Schedule */}
      <div className="bg-[#121212] border border-zinc-805 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6 text-left">
            <div className="p-2.5 bg-amber-950/35 border border-amber-900/50 rounded-xl text-amber-400 font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Calendar Agenda</h2>
              <p className="text-xs text-zinc-405 font-mono">Synced events timeline</p>
            </div>
          </div>

          {/* Calendar Gaps Automator Widget */}
          <div className="mb-6 bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono tracking-wider text-amber-400 flex items-center gap-1.5 uppercase">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Calendar Gaps Automator
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Interactive Gap Planner</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Scan overlapping timings from Google Calendar and propose conflict-free alignment reviews.
            </p>
            
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedGapDate}
                onChange={(e) => setSelectedGapDate(e.target.value)}
                className="flex-1 text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={findCalendarGaps}
                disabled={searchingGaps}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg text-xs font-mono cursor-pointer shrink-0"
              >
                {searchingGaps ? 'Scanning...' : 'Find Gaps'}
              </button>
            </div>

            {gapSyncSuccess && (
              <p className="text-[11px] font-mono text-emerald-400 bg-emerald-950/20 py-1.5 px-2.5 rounded border border-emerald-900/35 leading-relaxed">
                ✓ {gapSyncSuccess}
              </p>
            )}

            {calculatedGaps !== null && (
              <div className="space-y-2 pt-1 border-t border-zinc-900 animate-fadeIn font-mono">
                <span className="block text-[10px] text-zinc-400 font-bold uppercase">Overlapping gaps / Free slots ({calculatedGaps.length}):</span>
                {calculatedGaps.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 font-mono bg-zinc-900/40 py-1.5 px-2 rounded-lg text-center">
                    ⚠ No conflict-free slots found in working hours (09:00 - 18:00) on this day.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {calculatedGaps.map((gap, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedSchedulingGap(gap);
                          setGapSyncSuccess(null);
                        }}
                        className={`text-[9px] font-mono py-1.5 px-2 border rounded-lg text-left transition-all cursor-pointer ${
                          selectedSchedulingGap?.start === gap.start
                            ? 'bg-amber-500 border-amber-600 text-black font-bold'
                            : 'bg-[#181818] hover:bg-zinc-900 border-zinc-805 text-zinc-300'
                        }`}
                      >
                        ⏱ {formatMinutesToTime(gap.start)} - {formatMinutesToTime(gap.end)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSchedulingGap && (
              <div className="p-3 bg-zinc-900/80 border border-zinc-805 rounded-xl space-y-2 animate-fadeIn font-mono">
                <div className="flex items-center justify-between text-[10.5px] font-mono font-bold text-amber-400">
                  <span>Schedule in Chosen Slot:</span>
                  <span>{formatMinutesToTime(selectedSchedulingGap.start)} - {formatMinutesToTime(selectedSchedulingGap.end)}</span>
                </div>
                
                <input
                  type="text"
                  placeholder="Meeting Title"
                  value={scheduledMeetingTitle}
                  onChange={(e) => setScheduledMeetingTitle(e.target.value)}
                  className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500 font-sans"
                />

                <input
                  type="text"
                  placeholder="Associated Project-Tag Name"
                  value={scheduledProjTag}
                  onChange={(e) => setScheduledProjTag(e.target.value)}
                  className="w-full text-zinc-100 text-xs font-mono border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] focus:outline-none focus:border-amber-500 font-mono"
                />

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSchedulingGap(null)}
                    className="px-2.5 py-1 text-[9px] font-mono border border-zinc-805 rounded text-zinc-400 hover:bg-zinc-850 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleScheduleProposedSlot}
                    className="px-3 py-1 text-[9px] font-mono bg-amber-500 text-black font-bold rounded hover:bg-amber-400 cursor-pointer"
                  >
                    Propose Slot & Schedule
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-805">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="p-3.5 border border-zinc-855 rounded-xl bg-[#161616]/40 animate-pulse flex items-start space-x-3 text-left relative overflow-hidden">
                    <div className="bg-zinc-900 border border-zinc-805 rounded-lg p-2 text-center flex-shrink-0 min-w-[55px] h-14 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                        <div className="h-3.5 bg-zinc-800 rounded w-12"></div>
                      </div>
                      <div className="h-3.5 bg-zinc-800 rounded w-3/4"></div>
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-855">
                        <div className="h-3.5 bg-zinc-800 rounded w-1/5"></div>
                        <div className="h-4 bg-zinc-800 rounded w-14"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16 text-zinc-550 border border-dashed border-zinc-900 rounded-xl">
                <p className="text-xs font-sans">No upcoming schedule matching options.</p>
              </div>
            ) : (
              filteredEvents.map((event, index) => {
                const startTime = new Date(event.startTime);
                const meetTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={`${event.id}_${index}`} className="space-y-2">
                    <div className="p-3.5 border border-zinc-855 rounded-xl bg-[#161616]/40 hover:bg-[#1a1a1a]/40 flex items-start space-x-3 text-left transition-all">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-center flex-shrink-0 min-w-[55px]">
                        <span className="block text-[9px] font-bold font-mono tracking-wider uppercase text-amber-500/85">
                          {startTime.toLocaleDateString([], { month: 'short' })}
                        </span>
                        <span className="block text-base font-semibold leading-none text-zinc-100 font-mono mt-0.5">
                          {startTime.getDate()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="text-sm font-semibold text-white truncate">{event.title}</h4>
                          <span className="text-[8px] font-mono bg-zinc-900 text-zinc-450 border border-zinc-800 px-1.5 py-0.5 rounded flex items-center max-w-[100px] truncate flex-shrink-0">
                            {event.project || 'Default'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 font-sans">{event.description}</p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-zinc-800/80">
                          <span className="text-[10px] font-mono text-zinc-550 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {meetTime}
                          </span>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => triggerExpandFeedback(event.id, 'event', event.feedback)}
                              className="text-[9px] font-mono text-zinc-500 hover:text-amber-500 underline py-0.5 px-2"
                            >
                              {event.feedback ? '★ Verified' : '★ Rate Event'}
                            </button>

                            {event.meetLink && (
                              <a
                                href={event.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 py-0.5 px-2.5 rounded hover:bg-emerald-900/50 font-bold transition-all"
                              >
                                Meet
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable schedule item rating score box */}
                    {expandedFeedbackId === event.id && expandedFeedbackType === 'event' && (
                      <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-xl space-y-3.5 text-xs">
                        <div className="flex justify-between items-center font-mono text-[9px] uppercase tracking-wide">
                          <span className="text-amber-400 font-bold flex items-center">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Calibrate automatic booking suggestions
                          </span>
                          <span className="text-zinc-500">Offline Preference alignment</span>
                        </div>

                        {savedFeedbackIds.includes(event.id) || event.feedback ? (
                          <div className="p-2.5 bg-zinc-900 rounded-lg text-zinc-400 font-mono text-[11px] leading-relaxed">
                            ✓ Score submitted: <strong>{'★'.repeat(event.feedback?.rating || tempRating)} ({event.feedback?.rating || tempRating} Stars)</strong>. 
                            <span className="block mt-1 text-[10px] italic">"{event.feedback?.comment || 'No comment added'}"</span>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center text-xs">
                              <div className="space-y-1">
                                <span className="block text-[10px] uppercase font-mono text-zinc-550 font-medium">Rate meeting scheduling algorithm accuracy</span>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setTempRating(star)}
                                      type="button"
                                      className="transition-transform hover:scale-115"
                                    >
                                      <Star className={`h-4 w-4 ${star <= tempRating ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="block text-[10px] uppercase font-mono text-zinc-550 font-medium text-right">Correct mapping?</span>
                                <div className="flex items-center space-x-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setTempHelpful(true)}
                                    className={`p-1 rounded border transition-colors ${tempHelpful === true ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400' : 'border-zinc-800'}`}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTempHelpful(false)}
                                    className={`p-1 rounded border transition-colors ${tempHelpful === false ? 'border-red-600 bg-red-950/20 text-red-400' : 'border-zinc-800'}`}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="block text-[10px] uppercase font-mono text-zinc-555 font-semibold text-left">Correction comments</span>
                              <textarea
                                value={tempComment}
                                onChange={(e) => setTempComment(e.target.value)}
                                placeholder="E.g. Correct meeting timing parsed but the description missed PM alignment. Sync with LoRA."
                                className="w-full text-xs font-sans border border-zinc-800 rounded-lg p-2 bg-[#1c1c1c] text-zinc-100 focus:outline-none focus:border-amber-500 h-12"
                              />
                            </div>

                            <button
                              onClick={() => submitItemFeedback(event.id, event.title, 'event')}
                              disabled={tempRating === 0}
                              className="py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-[10px] font-bold font-mono tracking-wider uppercase rounded-lg w-full transition-colors"
                            >
                              Validate Calibration
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-955/20 border border-amber-900/30 rounded-xl flex items-start space-x-2.5 text-left">
          <AlertTriangle className="h-4 w-4 text-amber-550 mt-0.5 flex-shrink-0" />
          <div className="font-sans">
            <h5 className="text-xs font-semibold text-amber-400">Deadlines Alerts</h5>
            <p className="text-[11px] text-amber-300/80 font-sans leading-relaxed mt-0.5">
              Urgent tasks and scheduled meetings on priority lists are automatically monitored.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setFabTitle('');
          setFabDeadline(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          setFabUrgency('MEDIUM');
          setFabCategory('Work');
          setShowFabModal(true);
        }}
        className="fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-black p-3.5 rounded-full shadow-lg hover:shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all scroll-smooth cursor-pointer flex items-center justify-center border border-amber-600/50"
        title="Add Event Task"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* FAB Modal (Mini simplified form modal) */}
      {showFabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#121212]/95 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden text-left space-y-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-505 font-mono">
                <CheckSquare className="h-5 w-5 text-amber-505" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Quick Task Creation</h3>
              </div>
              <button
                onClick={() => setShowFabModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-sans">
              Populate active action milestones to instantly sync with calendars.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!fabTitle.trim()) return;
              onAddTask(
                fabTitle,
                'Quick added via float action button.',
                fabDeadline,
                fabUrgency,
                'none',
                true,
                'Default Workspace',
                fabCategory
              );
              setShowFabModal(false);
            }} className="space-y-4">
              
              {/* Title input */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Task Heading & Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Complete AWS credentials cycle"
                  value={fabTitle}
                  onChange={(e) => setFabTitle(e.target.value)}
                  className="w-full text-xs font-sans bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 placeholder-zinc-650"
                  autoFocus
                />
              </div>

              {/* Deadline input */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  required
                  value={fabDeadline}
                  onChange={(e) => setFabDeadline(e.target.value)}
                  className="w-full text-xs font-mono bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setFabDeadline(d.toISOString().split('T')[0]);
                    }}
                    className="flex-grow py-1 text-[9px] font-mono font-bold uppercase rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setFabDeadline(d.toISOString().split('T')[0]);
                    }}
                    className="flex-grow py-1 text-[9px] font-mono font-bold uppercase rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setFabDeadline(d.toISOString().split('T')[0]);
                    }}
                    className="flex-grow py-1 text-[9px] font-mono font-bold uppercase rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    Category Tag
                  </label>
                  <select
                    value={fabCategory}
                    onChange={(e) => setFabCategory(e.target.value as any)}
                    className="w-full text-xs font-mono bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-zinc-200"
                  >
                    <option value="Work">💼 Work</option>
                    <option value="Personal">🏡 Personal</option>
                    <option value="Urgent">⚡ Urgent</option>
                    <option value="Focus">🎯 Focus</option>
                    <option value="Learning">📚 Learning</option>
                    <option value="Admin">⚙️ Admin</option>
                    <option value="General">💬 General</option>
                  </select>
                </div>

                {/* Urgency Selection */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={fabUrgency}
                    onChange={(e) => setFabUrgency(e.target.value as any)}
                    className="w-full text-xs font-mono bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-zinc-200"
                  >
                    <option value="LOW">🟢 LOW Priority</option>
                    <option value="MEDIUM">🔵 MEDIUM Priority</option>
                    <option value="HIGH">⚡ HIGH Priority</option>
                    <option value="URGENT">🔴 URGENT Priority</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFabModal(false)}
                  className="flex-1 text-xs font-mono font-bold tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded-lg py-2.5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!fabTitle.trim()}
                  className="flex-1 text-xs font-mono font-bold tracking-wider uppercase text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-40 rounded-lg py-2.5 transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer"
                >
                  Create Task
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
