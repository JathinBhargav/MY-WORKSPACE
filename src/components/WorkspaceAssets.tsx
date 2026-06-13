import React, { useState } from 'react';
import { WorkspaceSyncState, MeetingSummary } from '../types';
import { FileSpreadsheet, FileText, FileVideo, Video, FolderPlus, Compass, ArrowUpRight, Sparkles, AlertCircle, Plus, Folder } from 'lucide-react';

interface WorkspaceAssetsProps {
  syncState: WorkspaceSyncState;
  meetingSummaries: MeetingSummary[];
  onTriggerMeetingNotes: (title: string, context: string) => Promise<void>;
  isGeneratingMeetNotes: boolean;
  onInitiateWorkspaceFiles: () => Promise<void>;
  isInitializingFiles: boolean;
  workspaceEnabled: boolean;
  onOpenPicker: () => void;
  pickedFile: { id: string; name: string; mimeType: string } | null;
  dbFiles?: any[];
  onSyncDriveFiles?: () => Promise<void>;
  isSyncingDriveFiles?: boolean;
}

export const WorkspaceAssets: React.FC<WorkspaceAssetsProps> = ({
  syncState,
  meetingSummaries,
  onTriggerMeetingNotes,
  isGeneratingMeetNotes,
  onInitiateWorkspaceFiles,
  isInitializingFiles,
  workspaceEnabled,
  onOpenPicker,
  pickedFile,
  dbFiles = [],
  onSyncDriveFiles,
  isSyncingDriveFiles = false
}) => {
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [showMeetForm, setShowMeetForm] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);

  const handleExportPDF = async (sum: MeetingSummary) => {
    setIsExportingPdf(sum.id);
    try {
      const response = await fetch('/api/ai/meeting-summary/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: sum.meetingTitle,
          summaryMarkdown: sum.summaryMarkdown,
          actionItems: sum.actionItems || [],
          date: sum.date
        })
      });

      if (!response.ok) throw new Error('PDF Export failed.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sum.meetingTitle.replace(/\s+/g, '_')}_Summary.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PDF Export] Failed to download document:', err);
    } finally {
      setIsExportingPdf(null);
    }
  };

  const handleSubmitMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;
    await onTriggerMeetingNotes(meetingTitle, meetingNotes);
    setMeetingTitle('');
    setMeetingNotes('');
    setShowMeetForm(false);
  };

  const hasAnyFile = syncState.sheetId || syncState.docId || syncState.slidesId || syncState.formId;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="workspace-sync-assets">
      {/* Column 1 & 2: Active Workspace Documents Dashboard */}
      <div className="xl:col-span-2 bg-[#121212] rounded-2xl border border-zinc-800/80 p-6 shadow-2xl flex flex-col justify-between text-left">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400 font-bold">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Synchronized Google Files</h2>
                <p className="text-xs text-zinc-405 font-mono">Real-time sync triggers from actions and summaries</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {onSyncDriveFiles && (
                <button
                  onClick={onSyncDriveFiles}
                  disabled={isSyncingDriveFiles}
                  className="py-1.5 px-3 bg-[#161616] hover:bg-[#1a1a1a] border border-zinc-850 hover:border-zinc-750 text-zinc-300 rounded-lg text-xs font-semibold flex items-center transition-all font-mono disabled:opacity-50"
                  title="Force refresh index from Google Drive"
                >
                  <Compass className={`h-3.5 w-3.5 mr-1.5 text-amber-500 ${isSyncingDriveFiles ? 'animate-spin' : ''}`} />
                  {isSyncingDriveFiles ? 'Syncing...' : 'Sync Drive'}
                </button>
              )}

              <button
                onClick={onOpenPicker}
                className="py-1.5 px-3 bg-[#161616] hover:bg-[#1a1a1a] border border-zinc-800 hover:border-zinc-70s text-zinc-300 rounded-lg text-xs font-semibold flex items-center transition-all font-mono"
              >
                <Folder className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                Google Picker
              </button>

              {!hasAnyFile && (
                <button
                  onClick={onInitiateWorkspaceFiles}
                  disabled={isInitializingFiles}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold flex items-center transition-all disabled:opacity-50 font-mono"
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-1.5 text-black animate-pulse" />
                  {isInitializingFiles ? 'Mapping...' : 'Initialize Workspace Files'}
                </button>
              )}
            </div>
          </div>

          {pickedFile && (
            <div className="p-4 mb-5 border border-amber-900/40 bg-amber-955/15 rounded-xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 bg-amber-955/30 border border-amber-900/50 rounded-xl text-amber-400 font-bold">
                  <Folder className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-mono tracking-wider font-bold text-amber-450">Selected via Google Picker</span>
                  <h4 className="text-sm font-semibold text-amber-50">{pickedFile.name}</h4>
                  <p className="text-[9px] font-mono text-zinc-550 truncate max-w-xs">{pickedFile.mimeType}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono bg-amber-955/35 border border-amber-950/45 text-amber-400 px-2.5 py-1 rounded font-bold">CONNECTED</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const syncFiles = [...dbFiles];
              
              if (syncState.sheetUrl && !syncFiles.some(f => f.googleUrl === syncState.sheetUrl)) {
                syncFiles.push({
                  id: syncState.sheetId || 'sheet_static',
                  fileName: 'Task Sheets-Tracker',
                  fileType: 'SPREADSHEET',
                  googleUrl: syncState.sheetUrl,
                  description: 'Real-time sheets logger that appends completion timelines, deadlines, and task names as checked off.'
                });
              }
              if (syncState.docUrl && !syncFiles.some(f => f.googleUrl === syncState.docUrl)) {
                syncFiles.push({
                  id: syncState.docId || 'doc_static',
                  fileName: 'Email Tasks Register',
                  fileType: 'DOCUMENT',
                  googleUrl: syncState.docUrl,
                  description: 'Compiles mailing lists components extracted via automation. Generates formal lists sorted by urgency.'
                });
              }
              if (syncState.slidesUrl && !syncFiles.some(f => f.googleUrl === syncState.slidesUrl)) {
                syncFiles.push({
                  id: syncState.slidesId || 'slides_static',
                  fileName: 'Meeting Action Deck',
                  fileType: 'DOCUMENT',
                  googleUrl: syncState.slidesUrl,
                  description: 'Generates modular briefing slides outlining core agenda components, summaries, and ownership lists.'
                });
              }
              if (syncState.formUrl && !syncFiles.some(f => f.googleUrl === syncState.formUrl)) {
                syncFiles.push({
                  id: syncState.formId || 'form_static',
                  fileName: 'AI Review Forms',
                  fileType: 'DOCUMENT',
                  googleUrl: syncState.formUrl,
                  description: 'Custom evaluation questionnaire generated dynamically with a list of tasks checked.'
                });
              }

              if (syncFiles.length === 0) {
                return (
                  <div className="col-span-2 text-center py-10 border border-zinc-800/60 bg-[#161616]/20 rounded-xl">
                    <p className="text-xs text-zinc-500 font-mono">No active synchronized documents mapped yet.</p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Tap Initialize Workspace Files to provision real or simulated registers</p>
                  </div>
                );
              }

              return syncFiles.map((file) => {
                const isFakeOrSimulated = file.googleUrl.includes('fake') || file.googleUrl.includes('simulated') || file.id.startsWith('sim_');
                const safeUrl = isFakeOrSimulated
                  ? (file.fileType === 'SPREADSHEET'
                      ? 'https://docs.google.com/spreadsheets/u/0/'
                      : 'https://docs.google.com/document/u/0/')
                  : file.googleUrl;

                return (
                  <a
                    key={file.id}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden border border-zinc-850 bg-[#161616]/40 hover:bg-[#1a1a1a]/55 hover:border-amber-500/20 p-5 rounded-xl transition-all duration-300 block group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 text-left">
                        <div className={`p-2 rounded-lg border ${
                          file.fileType === 'SPREADSHEET'
                            ? 'bg-emerald-955/30 border-emerald-900/45 text-emerald-400'
                            : 'bg-blue-955/35 border-blue-900/50 text-blue-400'
                        }`}>
                          {file.fileType === 'SPREADSHEET' ? (
                            <FileSpreadsheet className="h-4.5 w-4.5" />
                          ) : (
                            <FileText className="h-4.5 w-4.5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-150 group-hover:text-amber-400 transition-colors">
                            {file.fileName}
                          </h4>
                          <p className="text-[9px] font-mono text-zinc-550 mt-0.5">
                            {file.fileType === 'SPREADSHEET' ? 'Google Sheet Sync Ledger' : 'Google Doc Register'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-1 border border-zinc-850 bg-zinc-900/20 group-hover:border-zinc-750 rounded text-zinc-400 transition-colors">
                        <ArrowUpRight className="h-3.5 w-3.5 group-hover:text-amber-400" />
                      </div>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-3">
                      {file.description || (file.fileType === 'SPREADSHEET' 
                        ? 'Real-time sheets logger that appends completion timelines, deadlines, and task names as checked off by the device controller.' 
                        : 'Compiles mailing lists components extracted via automation. Generates formal lists sorted by urgency and assigns.')}
                    </p>

                    <div className="pt-3 flex items-center justify-between border-t border-zinc-900 mt-4 text-[10px] font-mono text-zinc-500 font-medium">
                      <span className="text-[9px] text-zinc-550 truncate max-w-[120px]">ID: {file.id}</span>
                      <span className={isFakeOrSimulated
                        ? "text-amber-500 bg-amber-955/20 border border-amber-900/40 px-2.5 py-0.5 rounded font-mono font-bold text-[9px]"
                        : "text-emerald-400 bg-emerald-955/20 border border-emerald-900/40 px-2.5 py-0.5 rounded font-mono font-bold text-[9px]"
                      }>
                        {isFakeOrSimulated ? "SIMULATED LOCAL" : "LIVE COUPLING"}
                      </span>
                    </div>
                  </a>
                );
              });
            })()}
          </div>
        </div>

        {!workspaceEnabled && (
          <div className="mt-4 p-3 bg-indigo-955/20 border border-indigo-900/35 rounded-xl flex items-center text-xs text-indigo-400">
            <AlertCircle className="h-4.5 w-4.5 text-indigo-400 mr-2 flex-shrink-0" />
            <span>Workspace APIs are running in <strong className="text-indigo-300">Local Simulated Mode</strong>. Link Google authorization above to write production assets live.</span>
          </div>
        )}
      </div>

      {/* Column 3: Post-Meet Summary Engine */}
      <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between text-left">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400 font-bold">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Meet Synthesizer</h2>
                <p className="text-xs text-zinc-405 font-mono">Generates post-call recaps</p>
              </div>
            </div>

            <button
              onClick={() => setShowMeetForm(!showMeetForm)}
              className="p-1 px-2 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors"
              title="Add simulated meeting recap"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showMeetForm && (
            <form onSubmit={handleSubmitMeet} className="mb-6 p-4 border border-zinc-800 bg-[#161616]/75 rounded-xl space-y-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Meet Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Q3 Launch Alignment"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">Discussion Points / Notes</label>
                <textarea
                  required
                  rows={3}
                  placeholder="E.g., We determined to defer frontend release to June 15th..."
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  className="w-full text-xs border border-zinc-800 rounded-lg p-2 bg-[#1f1f1f] text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMeetForm(false)}
                  className="px-2.5 py-1.5 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingMeetNotes}
                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors"
                >
                  Generate Summary
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-805">
            {meetingSummaries.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-805 rounded-xl">
                <p className="text-xs text-zinc-500">No transcripts parsed. Trigger a Google Meet simulation to test document generation!</p>
              </div>
            ) : (
              meetingSummaries.map((sum, index) => (
                <div key={`${sum.id}_${index}`} className="p-4 border border-zinc-850 rounded-xl bg-[#161616]/45 space-y-3 hover:border-zinc-750 transition-all">
                  <div className="flex items-start justify-between text-left">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-150">{sum.meetingTitle}</h4>
                      <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">{sum.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExportPDF(sum)}
                        disabled={isExportingPdf === sum.id}
                        className="text-[9px] font-bold font-mono px-2 py-0.5 rounded border border-amber-900/40 bg-amber-950/20 hover:bg-amber-550 hover:text-black hover:border-amber-400 transition-all text-amber-450 cursor-pointer disabled:opacity-40"
                      >
                        {isExportingPdf === sum.id ? 'EXPORTS...' : 'PDF EXPORT'}
                      </button>
                      {sum.meetLink && (
                        <span className="text-[9px] font-semibold bg-emerald-955/20 border border-emerald-900/30 text-emerald-400 py-0.5 px-2.5 rounded-full font-mono">
                          Meet Join
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-300 prose max-w-none prose-sm leading-relaxed max-h-[140px] overflow-y-auto p-2.5 bg-[#0d0d0d] border border-zinc-900 rounded-lg scrollbar-thin scrollbar-thumb-zinc-850 select-none">
                    <div className="font-sans font-medium text-zinc-300 whitespace-pre-line">
                      {sum.summaryMarkdown}
                    </div>
                  </div>

                  {sum.actionItems && sum.actionItems.length > 0 && (
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-bold tracking-wider font-mono uppercase text-zinc-550 block">Extracted Action Items:</span>
                      <ul className="space-y-1 pl-2 text-[10px] text-zinc-400 list-disc list-inside font-sans">
                        {sum.actionItems.map((item, idx) => (
                          <li key={idx} className="truncate">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[10px] font-mono text-zinc-550 mt-4 pt-4 border-t border-zinc-850/70 text-left">
          Meet summary outputs are automatically routed to a dedicated Workspace folder.
        </p>
      </div>
    </div>
  );
};
