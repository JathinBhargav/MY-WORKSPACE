import React, { useState, useEffect } from 'react';
import { fetchGoogleChatSpaces, sendGoogleChatMessage } from '../utils/googleWorkspace';
import { MessageSquare, Send, Compass, CheckCircle } from 'lucide-react';

interface GoogleChatProps {
  oauthToken: string | null;
  workspaceEnabled: boolean;
}

export const GoogleChat: React.FC<GoogleChatProps> = ({ oauthToken, workspaceEnabled }) => {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatLogs, setChatLogs] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    fetchGoogleChatSpaces(oauthToken || 'simulated')
      .then((data) => {
        setSpaces(data);
        if (data && data.length > 0) {
          setSelectedSpace(data[0].name);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [oauthToken, workspaceEnabled]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !message.trim()) return;

    setSending(true);
    try {
      const spaceObj = spaces.find(s => s.name === selectedSpace);
      const spaceTitle = spaceObj ? spaceObj.displayName : selectedSpace;
      await sendGoogleChatMessage(oauthToken || 'simulated', selectedSpace, message);
      
      setChatLogs(prev => [
        {
          id: `msg_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          spaceName: spaceTitle,
          text: message
        },
        ...prev
      ]);
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed sending Google chat message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="google-chat-integration">
      {/* Messages Composer Card */}
      <div className="md:col-span-2 bg-[#121212] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl text-left flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400 font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Google Chat Spaces</h2>
              <p className="text-xs text-zinc-405 font-mono">Stream and post reminders into Google Chat Rooms</p>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-400 mb-2">Select Active Space / Room</label>
              {loading ? (
                <div className="text-xs text-zinc-500 font-mono animate-pulse">Loading spaces...</div>
              ) : (
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="w-full text-xs font-mono border border-zinc-805 rounded-xl p-3 bg-[#161616] text-amber-100 focus:outline-none focus:border-amber-500"
                >
                  {spaces.map(s => (
                    <option key={s.name} value={s.name}>{s.displayName} ({s.type === 'ROOM' ? 'Space' : 'DM'})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-400 mb-2">Post Content (E.g. Task Recap or Status update)</label>
              <textarea
                required
                rows={3}
                placeholder="Type dynamic AI notification updates or custom messages to post into this workspace room..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs border border-zinc-805 rounded-xl p-3 bg-[#161616] text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !selectedSpace}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs flex items-center justify-center transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 mr-2" />
              {sending ? 'Publishing message...' : 'Send Message to Space'}
            </button>
          </form>
        </div>

        <div className="mt-4 p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl">
          <p className="text-[10px] text-zinc-550 leading-relaxed font-sans">
            Post summaries directly onto spaces to keep devs aligned on release timelines, cryptographic directives, or meeting notes.
          </p>
        </div>
      </div>

      {/* Message Event Log card */}
      <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl text-left flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6 animate-slideIn">
            <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400 font-bold">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-150">Publish Log</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Completed message pipeline events</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-805">
            {chatLogs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-zinc-805 rounded-xl">
                <p className="text-xs text-zinc-500 font-mono">No messages published yet this session.</p>
              </div>
            ) : (
              chatLogs.map((log, index) => (
                <div key={`${log.id}_${index}`} className="p-3 bg-[#161616]/40 border border-zinc-850 rounded-xl space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-amber-400 font-semibold">{log.spaceName}</span>
                    <span className="text-zinc-[400]">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">{log.text}</p>
                  <div className="flex items-center space-x-1 text-[9px] text-emerald-400 font-mono">
                    <CheckCircle className="h-2.5 w-2.5" />
                    <span>Delivered Successfully</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[9px] text-zinc-550 font-mono mt-4 pt-4 border-t border-zinc-850/70">
          Sync logging utilizes secure authentication profiles inside the Google Workspace domain.
        </p>
      </div>
    </div>
  );
};
