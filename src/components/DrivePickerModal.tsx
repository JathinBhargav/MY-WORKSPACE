import React, { useState, useEffect } from 'react';
import { listGoogleDriveFiles } from '../utils/googleWorkspace';
import { Search, FileText, CheckCircle2, X } from 'lucide-react';

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  oauthToken: string | null;
  onSelect: (file: { id: string; name: string; mimeType: string }) => void;
}

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  onClose,
  oauthToken,
  onSelect
}) => {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    listGoogleDriveFiles(oauthToken || 'simulated', query)
      .then((data) => {
        setFiles(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, oauthToken, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="font-serif italic text-amber-105 font-medium text-base">Google Picker</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Linked drive assets viewer</p>
          </div>
          <button onClick={onClose} className="p-1 px-2 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-850 flex items-center space-x-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search documents, spreadsheets, slides..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* File connection list */}
        <div className="p-4 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-805 space-y-2">
          {loading ? (
            <div className="text-center py-10 font-mono text-xs text-zinc-500 animate-pulse">
              Connecting Google Drive...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-10 font-mono text-xs text-zinc-500">
              No matching files found or picker sandbox is empty.
            </div>
          ) : (
            files.map((file) => (
              <button
                key={file.id}
                onClick={() => {
                  onSelect(file);
                  onClose();
                }}
                className="w-full p-2.5 bg-[#161616] hover:bg-[#1f1f1f] border border-zinc-850 hover:border-zinc-750 rounded-xl flex items-center justify-between text-left transition-all group animate-slideIn"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-955/20 border border-amber-900/40 text-amber-400 rounded-lg">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate max-w-[280px]">
                    <span className="block text-xs font-semibold text-zinc-300 group-hover:text-amber-300 transition-colors truncate">{file.name}</span>
                    <span className="block text-[9px] text-zinc-500 font-mono uppercase truncate">{file.mimeType.split('.').pop()}</span>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-zinc-650 group-hover:text-amber-400 transition-colors" />
              </button>
            ))
          )}
        </div>

        <div className="p-3 bg-[#0d0d0d] border-t border-zinc-800 text-center">
          <p className="text-[10px] text-zinc-500 font-mono">Powered by Google Workspace Client Drive Integrations</p>
        </div>
      </div>
    </div>
  );
};
