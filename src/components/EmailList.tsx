import React, { useState } from 'react';
import { EmailItem, GeneralFeedbackItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { 
  Mail, Sparkles, CheckCircle, Clock, ShieldCheck, Archive, Calendar, 
  CheckSquare, AlertCircle, Search, Star, ThumbsUp, ThumbsDown, 
  Filter, SlidersHorizontal, RefreshCcw, Info, MessageSquareCode 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmailListProps {
  emails: EmailItem[];
  onSummarize: (emailId: string) => Promise<void>;
  onArchive: (emailId: string) => void;
  onBulkArchive?: (emailIds: string[]) => void;
  onBulkDelete?: (emailIds: string[]) => void;
  onAutoSync: (email: EmailItem) => void;
  loadingEmailId: string | null;
  isEncrypted: boolean;
  onAddFeedback: (feedback: Omit<GeneralFeedbackItem, 'id' | 'timestamp'>) => void;
  isLoading?: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  onSummarize,
  onArchive,
  onBulkArchive,
  onBulkDelete,
  onAutoSync,
  loadingEmailId,
  isEncrypted,
  onAddFeedback,
  isLoading = false
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkModalAction, setBulkModalAction] = useState<'archive' | 'delete'>('archive');

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [folderFilter, setFolderFilter] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'PAST_WEEK'>('ALL');

  // Local feedback collection states for active email selection
  const [tempRating, setTempRating] = useState<number>(0);
  const [tempHelpful, setTempHelpful] = useState<boolean | null>(null);
  const [tempComment, setTempComment] = useState('');
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<string | null>(null);

  // Extract hour-of-day for high-urgency emails
  const getEmailReceivedHour = (email: EmailItem): number => {
    const bodyLower = email.body.toLowerCase();
    if (bodyLower.includes('2 pm')) return 14;
    if (bodyLower.includes('10:00 am') || bodyLower.includes('10 am')) return 10;
    if (bodyLower.includes('11:00 am') || bodyLower.includes('11/ am') || bodyLower.includes('11 am')) return 11;
    if (bodyLower.includes('9 am') || bodyLower.includes('09:00')) return 9;
    if (bodyLower.includes('3 pm') || bodyLower.includes('15:00')) return 15;
    
    const hash = email.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return 8 + (hash % 11);
  };

  const highUrgencyMails = emails.filter(e => e.urgency === 'URGENT' || e.urgency === 'HIGH');
  
  const slotLabels = [
    { label: '08:00-10:00', startHour: 8, endHour: 10, count: 0, priority: 'Morning Rush' },
    { label: '10:00-12:00', startHour: 10, endHour: 12, count: 0, priority: 'Sync Core' },
    { label: '12:00-14:00', startHour: 12, endHour: 14, count: 0, priority: 'Midday Peak' },
    { label: '14:00-16:00', startHour: 14, endHour: 16, count: 0, priority: 'Afternoon Ops' },
    { label: '16:00-18:00', startHour: 16, endHour: 18, count: 0, priority: 'Review Cycle' },
    { label: '18:00-20:00', startHour: 18, endHour: 20, count: 0, priority: 'After Hours' }
  ];

  highUrgencyMails.forEach(mail => {
    const hr = getEmailReceivedHour(mail);
    slotLabels.forEach(slot => {
      if (hr >= slot.startHour && hr < slot.endHour) {
        slot.count++;
      }
    });
  });

  const peakSlot = [...slotLabels].sort((a, b) => b.count - a.count)[0];

  // Filter & Search computation logs
  const filteredEmails = emails.filter((email) => {
    // 1. Full-text search matching subject, body sender, or AI summary keyword
    const matchQuery = 
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.summary && email.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Urgency Level Tag filter
    const matchUrgency = urgencyFilter === 'ALL' || email.urgency === urgencyFilter;

    // 3. Folder state: Active vs. Offline Archives
    const matchFolder = 
      folderFilter === 'ALL' ||
      (folderFilter === 'ARCHIVED' && email.isArchived) ||
      (folderFilter === 'ACTIVE' && !email.isArchived);

    // 4. Date ranges
    let matchDate = true;
    if (dateFilter !== 'ALL') {
      const emailDate = email.date.toLowerCase();
      if (dateFilter === 'TODAY') matchDate = emailDate.includes('today');
      else if (dateFilter === 'YESTERDAY') matchDate = emailDate.includes('yesterday');
      else if (dateFilter === 'PAST_WEEK') matchDate = emailDate.includes('days ago') || emailDate.includes('yesterday');
    }

    return matchQuery && matchUrgency && matchFolder && matchDate;
  });

  const getUrgencyBadge = (urgency?: string) => {
    const val = urgency?.toUpperCase() || 'LOW';
    switch (val) {
      case 'URGENT':
        return (
          <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border rounded-md font-bold bg-rose-500/10 text-rose-400 border-rose-500/25 flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.06)]">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            🚨 Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border rounded-md font-bold bg-amber-500/10 text-amber-400 border-amber-500/25 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            ⚡ High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border rounded-md font-bold bg-blue-500/10 text-blue-405 border-blue-500/25 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            🔵 Medium
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border rounded-md font-semibold bg-zinc-900 text-zinc-405 border-zinc-850 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
            🟢 Low
          </span>
        );
    }
  };

  // Submit on-device quality ratings directly into App list
  const handleSubmitFeedback = (email: EmailItem) => {
    if (tempRating === 0) return;
    
    onAddFeedback({
      sourceType: 'email_summary',
      sourceId: email.id,
      sourceTitle: email.subject,
      rating: tempRating,
      isHelpful: tempHelpful !== false, // Default true if not explicitly false
      comment: tempComment
    });

    // Mark current session as submitted
    setSubmittedFeedbackId(email.id);
    
    // Assign locally so the UI updates current state instantly
    email.feedback = {
      rating: tempRating,
      isHelpful: tempHelpful !== false,
      comment: tempComment,
      timestamp: new Date().toISOString()
    };

    // Reset draft fields
    setTempComment('');
  };

  // Change selected email with safe local reset
  const handleSelectEmail = (email: EmailItem) => {
    setSelectedEmail(email);
    setTempRating(email.feedback?.rating || 0);
    setTempHelpful(email.feedback !== undefined ? email.feedback.isHelpful : null);
    setTempComment(email.feedback?.comment || '');
    setSubmittedFeedbackId(email.feedback ? email.id : null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans" id="email-action-center">
      
      {/* Left Column: Inbox List with Advanced Search and Filtering Rails */}
      <div className="bg-[#121212] rounded-2xl border border-zinc-800/80 p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500 font-mono">Parser Intake center</h2>
              <h1 className="text-lg font-serif italic text-white tracking-wide font-medium mt-0.5">Inbox Feed Filters</h1>
            </div>
          </div>
          <span className="text-xs font-semibold font-mono text-zinc-400 bg-zinc-900 border border-zinc-855 px-2.5 py-1 rounded-full text-center h-fit">
            {filteredEmails.length} Displayed
          </span>
        </div>

        {/* TIME-OF-DAY COGNITIVE HIGH-URGENCY MAIL TRAFFIC HEATMAP */}
        <div className="bg-[#121212]/80 border border-zinc-850 rounded-xl p-4 space-y-4 text-left shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform translate-x-5 -translate-y-5">
            <Clock className="w-56 h-56 text-amber-500" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-zinc-900/40">
            <div className="space-y-1">
              <span className="text-[9px] font-bold font-mono tracking-widest text-[#f59e0b] bg-amber-955/20 border border-amber-900/40 px-2 py-0.5 rounded uppercase flex items-center gap-1 w-fit">
                <span className="h-1 w-1 rounded-full bg-[#f59e0b] animate-pulse" />
                Real-Time Density Sensor
              </span>
              <h2 className="text-xs font-semibold text-zinc-100 font-mono uppercase tracking-wider">
                High-Urgency Traffic Heatmap
              </h2>
            </div>
            
            <div className="text-left sm:text-right shrink-0 bg-zinc-950 px-3 py-1.5 border border-zinc-900 rounded-lg font-mono text-[10px]">
              <span className="block text-[8px] text-zinc-500 uppercase font-bold">Busiest Slot Peak:</span>
              <span className="font-bold text-amber-400">
                ⏱ {peakSlot?.label} ({peakSlot?.count || 0} criticals)
              </span>
            </div>
          </div>

          {/* Interactive Core */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Intensity Recharts Bar Plot */}
            <div className="md:col-span-12 xl:col-span-7 bg-[#161616]/70 border border-zinc-900 p-3 rounded-xl h-40 flex flex-col justify-between">
              <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                INFLOW DENSITY SPECTRUM
              </span>
              <div className="flex-1 min-h-[90px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slotLabels} margin={{ top: 5, right: 5, left: -32, bottom: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#71717a', fontSize: 8, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 8, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121212', borderColor: '#27272a', borderRadius: 8 }}
                      labelStyle={{ color: '#f4f4f5', fontSize: 9, fontFamily: 'monospace' }}
                      itemStyle={{ color: '#fbbf24', fontSize: 9 }}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {slotLabels.map((entry, index) => {
                        const count = entry.count;
                        let fillHex = '#27272a'; 
                        if (count === 1) fillHex = '#d97706'; 
                        if (count >= 2) fillHex = '#e11d48'; 
                        return <Cell key={`cell-${index}`} fill={fillHex} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Density Grid Blocks representing activity slot */}
            <div className="md:col-span-12 xl:col-span-5 bg-[#161616]/70 border border-zinc-900 p-3 rounded-xl flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  BENTO MATRIX
                </span>
                <div className="flex items-center space-x-2 text-[7.5px] font-mono text-zinc-500">
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-sm bg-zinc-800" /> Low</span>
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-sm bg-amber-600" /> Mid</span>
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-sm bg-rose-500" /> Hot</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5">
                {slotLabels.map((slot, i) => (
                  <div 
                    key={i} 
                    className={`p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all font-mono min-h-[46px] relative ${
                      slot.count >= 2
                        ? 'bg-rose-955/15 border-rose-900 text-rose-300'
                        : slot.count === 1
                        ? 'bg-amber-955/15 border-amber-900 text-amber-300'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                    }`}
                  >
                    <div>
                      <span className="block text-[8px] font-bold truncate leading-tight">{slot.label}</span>
                      <span className="block text-[7px] opacity-70 truncate leading-none">{slot.priority}</span>
                    </div>
                    <span className="absolute bottom-1 right-1.5 text-[9px] font-bold font-mono">
                      {slot.count > 0 ? `▲${slot.count}` : '0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER CONSOLES */}
        <div className="bg-[#161616]/65 border border-zinc-805 rounded-xl p-4 space-y-3">
          {/* Keyword Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search sender, subject, summary, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 bg-[#1e1e1e] text-zinc-150 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          {/* Urgency Toggle Filter Chips Controls */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-zinc-850">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mr-1">Urgency Toggles:</span>
            {[
              { id: 'ALL', label: 'All Feed', colorClass: 'border-zinc-800 text-zinc-400 hover:border-zinc-700 bg-zinc-950/20', activeClass: 'bg-zinc-200 text-zinc-950 font-extrabold border-zinc-200 shadow-md' },
              { id: 'URGENT', label: '🚨 Urgent', colorClass: 'border-rose-950/40 text-rose-400 hover:bg-rose-950/15 bg-zinc-950/20', activeClass: 'bg-rose-500 text-white font-extrabold border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' },
              { id: 'HIGH', label: '⚡ High', colorClass: 'border-amber-950/40 text-amber-400 hover:bg-amber-950/15 bg-zinc-950/20', activeClass: 'bg-amber-500 text-black font-extrabold border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' },
              { id: 'MEDIUM', label: '🔵 Medium', colorClass: 'border-blue-950/40 text-blue-400 hover:bg-blue-950/15 bg-zinc-950/20', activeClass: 'bg-blue-500 text-white font-extrabold border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
              { id: 'LOW', label: '🟢 Low', colorClass: 'border-emerald-950/40 text-emerald-400 hover:bg-emerald-950/15 bg-zinc-950/20', activeClass: 'bg-emerald-500 text-black font-extrabold border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' }
            ].map((chip) => {
              const isActive = urgencyFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setUrgencyFilter(chip.id as any)}
                  className={`text-[9px] font-mono uppercase tracking-wide font-bold px-2 py-1 border rounded-md transition-all duration-250 cursor-pointer ${
                    isActive ? chip.activeClass : chip.colorClass
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Filtering selectors row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            
            {/* Category / Urgency Selector */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-1 text-left">Urgency Urg.</label>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as any)}
                className="w-full text-xs border border-zinc-805 rounded-lg p-2 bg-[#1e1e1e] text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="ALL">All Categories</option>
                <option value="URGENT">🔴 URGENT Only</option>
                <option value="HIGH">🟡 HIGH level</option>
                <option value="MEDIUM">🔵 MEDIUM priorities</option>
                <option value="LOW">⚪ LOW urgencies</option>
              </select>
            </div>

            {/* Folder / Archive Profile Selector */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-1 text-left">Archive Profile</label>
              <select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value as any)}
                className="w-full text-xs border border-zinc-805 rounded-lg p-2 bg-[#1e1e1e] text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="ALL">All Envelopes</option>
                <option value="ACTIVE">⚡ Active Inbox</option>
                <option value="ARCHIVED">📂 Offline Archs</option>
              </select>
            </div>

            {/* Date timeline filter */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-1 text-left">Time Windows</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full text-xs border border-[#1e1e1e] rounded-lg p-2 bg-[#1e1e1e] text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="ALL">Any dates</option>
                <option value="TODAY">Received Today</option>
                <option value="YESTERDAY">Received Yesterday</option>
                <option value="PAST_WEEK">Past 7 Days</option>
              </select>
            </div>

          </div>
        </div>

        {/* Bulk Action Toolbar */}
        <div className="flex items-center justify-between bg-[#161616]/70 border border-zinc-900 px-4 py-2.5 rounded-xl text-left gap-3 flex-wrap">
          <label className="flex items-center space-x-2 text-xs text-zinc-300 font-mono cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filteredEmails.length > 0 && selectedEmailIds.length === filteredEmails.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedEmailIds(filteredEmails.map(email => email.id));
                } else {
                  setSelectedEmailIds([]);
                }
              }}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-850 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
            />
            <span className="font-bold uppercase text-[10px] tracking-wide text-zinc-400">
              {selectedEmailIds.length > 0 ? `${selectedEmailIds.length} Selected` : 'Select All Listed'}
            </span>
          </label>

          {selectedEmailIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBulkModalAction('archive');
                  setShowBulkModal(true);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-bold uppercase rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Archive className="h-3 w-3" /> Archive
              </button>
              <button
                onClick={() => {
                  setBulkModalAction('delete');
                  setShowBulkModal(true);
                }}
                className="px-2.5 py-1 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/30 text-rose-400 text-[10px] font-mono font-bold uppercase rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedEmailIds([])}
                className="px-2.5 py-1 border border-zinc-800 text-zinc-400 text-[10px] font-mono font-bold rounded-lg hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* FEED LIST LOOP */}
        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-805">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="p-4 rounded-xl border border-zinc-850 bg-[#161616]/40 animate-pulse text-left relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 w-full pr-6">
                      <div className="h-3.5 bg-zinc-800 rounded w-1/3"></div>
                      <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                      <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                    </div>
                    <div className="h-5 bg-zinc-800 rounded w-12 flex-shrink-0 animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/80">
                    <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                    <div className="h-7 bg-zinc-800 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-850 rounded-3xl bg-[#121212]/35 max-w-sm mx-auto p-6 space-y-4 animate-fadeIn w-full">
              <div className="relative h-16 w-16 mx-auto bg-zinc-950 border border-zinc-855 rounded-2xl flex items-center justify-center">
                <div className="absolute inset-2 bg-amber-500/5 rounded-xl border border-amber-500/10 animate-ping opacity-60" style={{ animationDuration: '4s' }} />
                <Mail className="h-6 w-6 text-amber-550" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-[#121212]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-300 font-sans">Mailing Feed Is Clear</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[260px] mx-auto">
                  No automated emails match your active filters. Handshake triggers will automatically list new arrivals.
                </p>
              </div>
              {(urgencyFilter !== 'ALL' || folderFilter !== 'ALL' || dateFilter !== 'ALL' || searchQuery !== '') && (
                <button 
                  onClick={() => { setSearchQuery(''); setUrgencyFilter('ALL'); setFolderFilter('ALL'); setDateFilter('ALL'); }}
                  className="px-3 py-1 bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95"
                >
                  Clear Active Filters
                </button>
              )}
            </div>
          ) : (
            filteredEmails.map((email, index) => {
              const isSelected = selectedEmailIds.includes(email.id);
              return (
                <div
                  key={`${email.id}_${index}`}
                  onClick={() => handleSelectEmail(email)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden flex items-start gap-3.5 ${
                    selectedEmail?.id === email.id
                      ? 'border-amber-500 bg-amber-955/10 shadow-lg shadow-amber-950/10'
                      : 'border-zinc-850 bg-[#161616]/40 hover:border-zinc-700'
                  }`}
                >
                  {/* Urgency Highlight Left Border Stripe */}
                  {email.urgency && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      email.urgency === 'URGENT' ? 'bg-rose-500' :
                      email.urgency === 'HIGH' ? 'bg-amber-500' :
                      email.urgency === 'MEDIUM' ? 'bg-blue-500' : 'bg-zinc-600'
                    }`} />
                  )}

                  {/* Multiselect Checkbox */}
                  <div className="flex-shrink-0 pt-0.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedEmailIds(prev => prev.filter(id => id !== email.id));
                        } else {
                          setSelectedEmailIds(prev => [...prev, email.id]);
                        }
                      }}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pl-1.5">
                    {/* Visual marker if email is offline archived */}
                    {email.isArchived && (
                      <div className="absolute top-0 right-0 py-0.5 px-2 bg-zinc-800 text-[8px] font-mono font-bold text-zinc-400 rounded-bl-lg uppercase">
                        Archived Offline
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-1 pr-6 min-w-0 flex-1">
                        <p className="text-xs font-mono font-medium text-amber-500/90 truncate">{email.from}</p>
                        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-1">{email.subject}</h3>
                        <p className="text-xs text-zinc-405 line-clamp-1 font-sans">{email.body}</p>
                      </div>
                      {email.urgency && (
                        <div className="flex-shrink-0 z-10">
                          {getUrgencyBadge(email.urgency)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/80">
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {email.date}
                      </span>
                      
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        {!email.summary ? (
                          <button
                            onClick={() => onSummarize(email.id)}
                            disabled={loadingEmailId !== null}
                            className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-semibold flex items-center transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            AI Summarize
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {email.feedback && (
                              <span className="text-[10px] font-mono bg-[#221000] border border-amber-900/40 text-amber-400 py-0.5 px-2 rounded-md font-bold">
                                ★ {email.feedback.rating}
                              </span>
                            )}
                            <span className="text-xs text-emerald-400 flex items-center font-medium bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              {isEncrypted ? 'Encrypted' : 'Summarized'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Summarized Details Panel with Integrated RLHF Ratings */}
      <div className="bg-[#121212] border border-zinc-800/80 p-6 rounded-2xl shadow-2xl flex flex-col justify-between min-h-[500px]">
        {selectedEmail ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedEmail.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5 text-left h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div>
                    <span className="text-xs font-mono text-amber-500">{selectedEmail.from}</span>
                    <h3 className="text-lg font-serif italic text-white font-medium tracking-wide mt-1">{selectedEmail.subject}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        onArchive(selectedEmail.id);
                        setSelectedEmail(null);
                      }}
                      disabled={selectedEmail.isArchived}
                      className="p-1.5 border border-zinc-800 text-zinc-400 bg-zinc-905 rounded-lg hover:border-zinc-70s hover:text-white disabled:opacity-40"
                      title={selectedEmail.isArchived ? "Already Archived Offline" : "Archive Summary Offline"}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-850">
                  {/* Email content brief */}
                  <div className="p-3 bg-[#181818] rounded-xl border border-zinc-800/60">
                    <p className="text-[10px] font-mono font-medium text-amber-500/80 uppercase mb-1">Snippet</p>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{selectedEmail.body}</p>
                  </div>

                  {selectedEmail.summary ? (
                    <div className="space-y-4">
                      {/* AI Summary */}
                      <div className="bg-[#161616]/65 border border-zinc-850 rounded-xl p-4 space-y-3 shadow-md">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono flex items-center">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-2 shrink-0" />
                          AI Brief Keynote
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          {selectedEmail.summary}
                        </p>
                      </div>

                      {/* Takeaways List */}
                      {selectedEmail.keyTakeaways && selectedEmail.keyTakeaways.length > 0 && (
                        <div className="bg-[#161616]/65 border border-zinc-850 rounded-xl p-4 space-y-3 shadow-md">
                          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center">
                            <Sparkles className="h-3.5 w-3.5 text-zinc-500 mr-2 shrink-0" />
                            Key Deliverables
                          </p>
                          <ul className="space-y-2">
                            {selectedEmail.keyTakeaways.map((takeaway, i) => (
                              <li key={i} className="flex items-start text-xs text-zinc-350 bg-[#121212]/85 border border-zinc-900/50 p-3 rounded-lg shadow-inner">
                                <span className="w-5 h-5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-md font-mono text-[9px] mr-2.5 flex-shrink-0 font-bold flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <span className="font-sans leading-relaxed">{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Event Details Extraction Indicator */}
                      {selectedEmail.eventDetails && (
                        <div className="bg-[#161616]/65 border border-zinc-850 rounded-xl p-4 space-y-3 shadow-md">
                          <div className="flex items-center space-x-2 text-amber-400">
                            <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Calendar Booking Formulated</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs pt-2.5 border-t border-zinc-900">
                            <div className="font-sans text-zinc-300">
                              <strong className="block text-[9px] uppercase font-mono text-zinc-500 font-semibold mb-0.5">Event Title</strong>
                              {selectedEmail.eventDetails.title}
                            </div>
                            <div className="font-sans text-zinc-300">
                              <strong className="block text-[9px] uppercase font-mono text-zinc-500 font-semibold mb-0.5">Timeline</strong>
                              {selectedEmail.eventDetails.date} {selectedEmail.eventDetails.time || ''}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Meet Meeting Invitation Identifier */}
                      {selectedEmail.meetingLink && (
                        <div className="p-2.5 bg-emerald-955/20 border border-emerald-900/40 rounded-xl flex items-center justify-between text-xs text-emerald-400">
                          <span className="font-semibold flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1.5" />
                            Scheduled Google Meet invitation detected
                          </span>
                          <a
                            href={selectedEmail.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Meet Link
                          </a>
                        </div>
                      )}

                      {/* RATING WIDGET ZONE */}
                      <div className="border-t border-zinc-800/80 pt-4 mt-5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquareCode className="h-4.5 w-4.5 text-amber-400" />
                            <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider">AI Quality Inspector & Alignment</h4>
                          </div>
                          
                          {submittedFeedbackId === selectedEmail.id || selectedEmail.feedback ? (
                            <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-mono py-0.5 px-2 rounded-full font-semibold">
                              ✓ Output Calibrated
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-950/20 text-amber-500 font-mono py-0.5 px-2 rounded">
                              Feed Alignment Active
                            </span>
                          )}
                        </div>

                        {submittedFeedbackId === selectedEmail.id || selectedEmail.feedback ? (
                          <div className="p-3 bg-zinc-900/50 rounded-xl space-y-1 px-3 border border-zinc-805">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-zinc-400">Your logged accuracy score:</span>
                              <span className="font-bold text-amber-400">
                                {'★'.repeat(selectedEmail.feedback?.rating || tempRating)} ({selectedEmail.feedback?.rating || tempRating}/5)
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 italic">
                              "{selectedEmail.feedback?.comment || 'No alignment comment provided.'}"
                            </p>
                          </div>
                        ) : (
                          <div className="bg-[#151515] p-4.5 rounded-xl border border-zinc-805 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                              {/* Left side: Star picker */}
                              <div className="space-y-1">
                                <span className="block text-[10px] font-mono text-zinc-505 uppercase">Rate accuracy index</span>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setTempRating(star)}
                                      type="button"
                                      className="transition-transform hover:scale-115 focus:outline-none"
                                    >
                                      <Star 
                                        className={`h-4.5 w-4.5 ${
                                          star <= tempRating 
                                            ? 'text-amber-500 fill-amber-500' 
                                            : 'text-zinc-650'
                                        }`} 
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Right side: Helpfulness toggles */}
                              <div className="space-y-1 text-right sm:text-left">
                                <span className="block text-[10px] font-mono text-zinc-505 uppercase">Found output helpful?</span>
                                <div className="flex items-center space-x-1.5 justify-end sm:justify-start">
                                  <button
                                    onClick={() => setTempHelpful(true)}
                                    type="button"
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      tempHelpful === true 
                                        ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400' 
                                        : 'border-zinc-800 hover:text-zinc-200'
                                    }`}
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setTempHelpful(false)}
                                    type="button"
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      tempHelpful === false 
                                        ? 'border-red-600 bg-red-950/20 text-red-400' 
                                        : 'border-zinc-800 hover:text-zinc-200'
                                    }`}
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Comment / Align textbox */}
                            <div className="space-y-1">
                              <span className="block text-[10px] font-mono text-zinc-505 uppercase text-left">Correction / Alignments notes</span>
                              <textarea
                                value={tempComment}
                                onChange={(e) => setTempComment(e.target.value)}
                                placeholder="E.g., Event date parsed incorrect. Add deadline reminder specifically. Send to LoRA weights dataset."
                                className="w-full text-[11px] border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-150 focus:outline-none focus:border-amber-500 h-14 resize-none"
                              />
                            </div>

                            <button
                              onClick={() => handleSubmitFeedback(selectedEmail)}
                              disabled={tempRating === 0}
                              type="button"
                              className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-45 text-black rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all shadow-sm"
                            >
                              Sync Feedback to RLHF align
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500 space-y-3">
                      <Sparkles className="h-8 w-8 mx-auto text-zinc-650" />
                      <p className="text-xs font-mono">Click AI Summarize in your inbox to analyze this alert</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedEmail.summary && !selectedEmail.isArchived && (
                <div className="pt-4 border-t border-zinc-800/85 flex items-center space-x-3 mt-4">
                  <button
                    onClick={() => onAutoSync(selectedEmail)}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center justify-center transition-all font-mono tracking-wide shadow-md shadow-amber-500/10"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Automate Sync to Workspace
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-16">
            <Mail className="h-10 w-10 text-zinc-600 stroke-[1.2] mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No Email Selected</h3>
            <p className="text-xs text-zinc-500 max-w-[280px] text-center mt-1">
              Select an incoming notification from the inbox view to explore detailed insights and trigger sync events.
            </p>
          </div>
        )}
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#161616] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-left">
              <div className={`p-2.5 rounded-xl border ${
                bulkModalAction === 'delete' 
                  ? 'bg-rose-955 border-rose-900 text-rose-400' 
                  : 'bg-amber-955 border-amber-900 text-amber-400'
              }`}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-zinc-200">
                  Confirm Bulk Action
                </h3>
                <p className="text-xs text-zinc-400">
                  Local dataset verification required
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900 text-left space-y-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Are you absolutely sure you want to <strong className={bulkModalAction === 'delete' ? 'text-rose-400' : 'text-amber-400'}>{bulkModalAction}</strong> the following collection of elements?
              </p>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className={`text-2xl font-bold font-mono ${
                  bulkModalAction === 'delete' ? 'text-rose-400' : 'text-amber-500'
                }`}>
                  {selectedEmailIds.length}
                </span>
                <span className="text-[10px] uppercase font-mono text-zinc-500">
                  emails to be affected
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-2 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-mono font-bold border border-zinc-850 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bulkModalAction === 'archive') {
                    if (onBulkArchive) {
                      onBulkArchive(selectedEmailIds);
                    }
                  } else {
                    if (onBulkDelete) {
                      onBulkDelete(selectedEmailIds);
                    }
                  }
                  setSelectedEmailIds([]);
                  setShowBulkModal(false);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold text-black border cursor-pointer ${
                  bulkModalAction === 'delete'
                    ? 'bg-rose-500 hover:bg-rose-400 border-rose-500'
                    : 'bg-amber-500 hover:bg-amber-400 border-amber-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
