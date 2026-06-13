import { useEffect } from 'react';

interface ShortcutConfig {
  onTriggerSearch: () => void;
  onSwitchTab: (tabId: 'overview' | 'inbox' | 'schedule' | 'keep' | 'assets' | 'contacts' | 'chat' | 'security') => void;
}

export function useKeyboardShortcuts({ onTriggerSearch, onSwitchTab }: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Trigger search palette (CMD+K or CTRL+K)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onTriggerSearch();
      }

      // Tab switching via Alt/Option + Numbers
      if (event.altKey) {
        const keyMap: Record<string, 'overview' | 'inbox' | 'schedule' | 'keep' | 'assets' | 'contacts' | 'chat' | 'security'> = {
          '1': 'overview',
          '2': 'inbox',
          '3': 'schedule',
          '4': 'keep',
          '5': 'assets',
          '6': 'contacts',
          '7': 'chat',
          '8': 'security'
        };

        if (event.key in keyMap) {
          event.preventDefault();
          onSwitchTab(keyMap[event.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriggerSearch, onSwitchTab]);
}
