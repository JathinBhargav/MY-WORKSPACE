import React, { useState } from 'react';
import { KeepNote } from '../types';
import { StickyNote, Sparkles, Plus, Clock, FilePlus, ChevronRight, CheckCircle2, Search, Mic, Trash2, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeepNotesProps {
  notes: KeepNote[];
  onAddNote: (title: string, content: string) => Promise<void>;
  onGenerateForm: () => Promise<void>;
  formUrl: string | null;
  isExtracting: boolean;
  isGeneratingForm: boolean;
  onToggleSyncNote?: (noteId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onAddTimingsManual?: (noteId: string, timings: string[]) => void;
}

export const KeepNotes: React.FC<KeepNotesProps> = ({
  notes,
  onAddNote,
  onGenerateForm,
  formUrl,
  isExtracting,
  isGeneratingForm,
  onToggleSyncNote,
  onDeleteNote,
  onAddTimingsManual
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Local state fallbacks in case parent updates aren't available
  const [localNotes, setLocalNotes] = useState<KeepNote[]>([]);

  const activeNotes = notes && notes.length > 0 ? notes : localNotes;

  const handleToggleSync = (noteId: string) => {
    if (onToggleSyncNote) {
      onToggleSyncNote(noteId);
    } else {
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, syncedToCalendar: !n.syncedToCalendar } : n));
    }
  };

  const handleDelete = (noteId: string) => {
    if (onDeleteNote) {
      onDeleteNote(noteId);
    } else {
      setLocalNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

  const handleSimulateTime = (noteId: string) => {
    if (onAddTimingsManual) {
      onAddTimingsManual(noteId, ['15:30']);
    } else {
      // Simulate locally if no prop is provided
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, timings: ['15:30'] } : n));
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Web Speech Recognition API is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission dynamic lock blocked or denied.');
        } else {
          setSpeechError(`Speech recognition details: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setNewContent(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setSpeechError('Failed to initialize speech recognition.');
      setIsListening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await onAddNote(newTitle, newContent);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const filteredNotes = activeNotes.filter(note => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const titleMatch = (note.title || '').toLowerCase().includes(query);
    const contentMatch = (note.content || '').toLowerCase().includes(query);
    return titleMatch || contentMatch;
  });

  // Segregate notes into 3 Kanban Columns/Lanes:
  // Lane 1: Drafts & Memos (No extracted times)
  const drafts = filteredNotes.filter(note => !note.timings || note.timings.length === 0);
  
  // Lane 2: Ready for Sync (Has times, but syncedToCalendar is falsy)
  const pendingSync = filteredNotes.filter(note => note.timings && note.timings.length > 0 && !note.syncedToCalendar);
  
  // Lane 3: Synchronized (syncedToCalendar is true)
  const synchronized = filteredNotes.filter(note => note.syncedToCalendar);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="keep-notes-section">
      {/* Column 1: Keep Notes Kanban Board Grid */}
      <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-zinc-800/85 p-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400">
                <StickyNote className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Keep Kanban Board</h2>
                <p className="text-xs text-zinc-405 font-mono">Dynamic lanes managed by AI timeline extraction</p>
              </div>
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold flex items-center transition-all font-mono cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Note
            </button>
          </div>

          {/* Real-time search query input */}
          <div className="relative text-left">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search Kanban notes by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-zinc-800 focus:border-amber-500/80 bg-[#161616]/60 rounded-xl text-zinc-200 focus:outline-none transition-colors"
            />
          </div>

          {/* New note forms */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="p-4 border border-zinc-800/80 bg-[#161616]/75 rounded-xl space-y-3 text-left animate-fadeIn">
              <div>
                <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="E.g., Team Sync Timings"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-semibold text-zinc-400">Content (include times, e.g. 'Daily meet at 10:00 AM')</label>
                  <button
                    type="button"
                    onClick={startSpeechRecognition}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold transition-all ${
                      isListening
                        ? 'bg-red-950/40 border-red-800 text-red-400 animate-pulse'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Mic className="h-3 w-3 text-red-500 animate-bounce" />
                        <span>Listening...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-3 w-3" />
                        <span>Dictate</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="E.g., Let's review the final milestones on Friday at 4 PM."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500"
                />
                {speechError && (
                  <p className="text-[10px] text-amber-500 font-mono mt-1 text-left">
                    ⚠ {speechError}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isExtracting ? 'Extracting...' : 'Save Note'}
                </button>
              </div>
            </form>
          )}

          {/* Kanban Board columns wrapper */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Lane 1: Memos & Drafts */}
            <div className="flex flex-col space-y-3">
              <div className="p-2 border border-zinc-850 bg-zinc-950/40 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                  💡 Draft Memos
                </span>
                <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono font-bold select-none">
                  {drafts.length}
                </span>
              </div>
              <div className="bg-[#151515] hover:bg-zinc-950/20 rounded-2xl border border-zinc-900 p-2 min-h-[300px] max-h-[360px] overflow-y-auto space-y-2.5 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {drafts.length === 0 ? (
                    <div className="text-center py-12 text-zinc-600 text-[10px] font-mono leading-relaxed">
                      Empty Lane
                    </div>
                  ) : (
                    drafts.map((note) => (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 border border-zinc-850/65 bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/85 rounded-xl text-left flex flex-col justify-between gap-2.5 transition-all relative group"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-zinc-150 line-clamp-1">{note.title || 'Untitled Note'}</h4>
                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mt-1 line-clamp-3">{note.content}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSimulateTime(note.id)}
                            className="text-[9px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 py-1 px-1.5 border border-amber-900/40 rounded-lg flex items-center gap-1 cursor-pointer select-none"
                            title="Simulate adding scheduling times"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Simulate Time</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-zinc-550 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Lane 2: Ready for Sync */}
            <div className="flex flex-col space-y-3 font-mono">
              <div className="p-2 border border-amber-900/35 bg-amber-955/10 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                  ⏳ Ready for Sync
                </span>
                <span className="text-[10px] bg-amber-955/20 border border-amber-900/40 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold select-none">
                  {pendingSync.length}
                </span>
              </div>
              <div className="bg-[#151515] hover:bg-zinc-950/20 rounded-2xl border border-zinc-900 p-2 min-h-[300px] max-h-[360px] overflow-y-auto space-y-2.5 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {pendingSync.length === 0 ? (
                    <div className="text-center py-12 text-zinc-650 text-[10px] font-mono leading-relaxed">
                      No events pending
                    </div>
                  ) : (
                    pendingSync.map((note) => (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 border border-amber-950/30 bg-amber-955/5 hover:bg-[#1a1a1a]/85 rounded-xl text-left flex flex-col justify-between gap-2.5 transition-all relative group"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-amber-250 line-clamp-1">{note.title || 'Untitled Note'}</h4>
                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mt-1 line-clamp-2">{note.content}</p>
                          
                          <div className="mt-2 flex flex-wrap gap-1">
                            {note.timings?.map((time, idx) => (
                              <span key={idx} className="text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 py-0.5 px-1.5 rounded-md flex items-center gap-0.5">
                                <Clock className="h-2 w-2" />
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSync(note.id)}
                            className="text-[9px] font-mono bg-amber-500 hover:bg-amber-400 text-black font-bold py-1 px-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none"
                            title="Sync scheduled slot directly to Calendar"
                          >
                            <Check className="h-2.5 w-2.5" />
                            <span>Sync Cal</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-zinc-550 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Lane 3: Synchronized */}
            <div className="flex flex-col space-y-3">
              <div className="p-2 border border-emerald-900/35 bg-emerald-955/15 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                  ✅ Synced List
                </span>
                <span className="text-[10px] bg-emerald-955/35 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold select-none">
                  {synchronized.length}
                </span>
              </div>
              <div className="bg-[#151515] hover:bg-zinc-950/20 rounded-2xl border border-zinc-900 p-2 min-h-[300px] max-h-[360px] overflow-y-auto space-y-2.5 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {synchronized.length === 0 ? (
                    <div className="text-center py-12 text-zinc-650 text-[10px] font-mono leading-relaxed">
                      None synchronized
                    </div>
                  ) : (
                    synchronized.map((note) => (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 border border-emerald-950/30 bg-emerald-955/5 hover:bg-[#1a1a1a]/85 rounded-xl text-left flex flex-col justify-between gap-2.5 transition-all relative group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-emerald-200 line-clamp-1">{note.title || 'Untitled Note'}</h4>
                            <span className="text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/25">
                              Calendar
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mt-1 line-clamp-2">{note.content}</p>
                          
                          <div className="mt-2 flex flex-wrap gap-1">
                            {note.timings?.map((time, idx) => (
                              <span key={idx} className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 py-0.5 px-1.5 rounded-md flex items-center gap-0.5">
                                <Clock className="h-2 w-2" />
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSync(note.id)}
                            className="text-[9px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white py-1 px-1.5 border border-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer select-none"
                            title="Pull back note from Calendar synced state"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            <span>Unsync</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-zinc-550 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        <p className="text-[11px] text-zinc-555 font-mono text-left mt-4 pt-4 border-t border-zinc-800/80">
          * AI monitors Google Keep notes and maps timing markers directly onto the Kanban process view, aligning calendar synchronizers.
        </p>
      </div>

      {/* Column 2: Feedback Form Maker */}
      <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between text-left">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">AI Feedback Forms</h2>
              <p className="text-xs text-zinc-405 font-mono">Performance evaluation portal</p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Instantly generate an official Google Form containing evaluation parameters about what the AI in the app summarized. Users can fill it out to submit performance feedback.
          </p>

          <div className="bg-[#161616]/60 p-4 rounded-xl border border-zinc-800/70 space-y-2 text-xs">
            <h4 className="font-semibold text-zinc-300">Configured Questions:</h4>
            <ul className="space-y-1.5 text-zinc-400 list-disc list-inside">
              <li>Mailing summaries quality (1-5 scale)</li>
              <li>Timings extraction correctness</li>
              <li>Workspace sync reliability</li>
              <li>General remarks and comments</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {formUrl ? (
            <div className="p-3 bg-emerald-955/20 border border-emerald-900/30 rounded-xl space-y-2.5">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">Google Feedback Form Ready!</span>
              </div>
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold block transition-colors font-mono"
              >
                Access Forms Live
              </a>
            </div>
          ) : (
            <button
              onClick={onGenerateForm}
              disabled={isGeneratingForm}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center justify-center transition-all font-mono disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 mr-2 text-black" />
              {isGeneratingForm ? 'Creating Form...' : 'Generate AI Review Form'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
