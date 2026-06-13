import React, { useState, useEffect } from 'react';
import { fetchGoogleContacts } from '../utils/googleWorkspace';
import { User, Phone, Mail, Search } from 'lucide-react';

interface GoogleContactsProps {
  oauthToken: string | null;
  workspaceEnabled: boolean;
}

export const GoogleContacts: React.FC<GoogleContactsProps> = ({ oauthToken, workspaceEnabled }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchGoogleContacts(oauthToken || 'simulated')
      .then((data) => setContacts(data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [oauthToken, workspaceEnabled]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400 font-bold">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Google Contacts (People)</h2>
            <p className="text-xs text-zinc-405 font-mono">Synced Workspace connections & phone logs</p>
          </div>
        </div>

        {/* Search contacts bar */}
        <div className="flex items-center space-x-2 bg-[#161616] border border-zinc-850 px-3 py-1.5 rounded-xl w-full md:w-64">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono bg-transparent text-white focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-xs text-zinc-500 animate-pulse">
          Fetching Google Contacts connections...
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-805 rounded-xl">
          <p className="text-xs text-zinc-500 font-mono">No contacts found in Workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <div
              key={contact.id}
              className="p-4 border border-zinc-850 bg-[#161616]/40 hover:bg-[#1a1a1a]/55 hover:border-amber-900/45 rounded-xl flex flex-col justify-between space-y-3 transition-all"
            >
              <div className="flex items-start space-x-3 text-left">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-amber-955/20 border border-amber-900/40 text-amber-400 flex items-center justify-center font-bold font-serif italic">
                  {contact.name.charAt(0)}
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-semibold text-zinc-150 truncate">{contact.name}</h4>
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-zinc-500 mt-0.5">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-850/70 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-zinc-650" />
                  <span>{contact.phone || 'N/A'}</span>
                </div>
                <span className="text-[9px] bg-amber-955/20 text-amber-400 px-2 py-0.5 border border-amber-900/30 rounded">SYNCED</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
